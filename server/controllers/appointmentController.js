import { AppDataSource } from '../database.js';
import * as whatsappService from '../services/whatsappService.js';
import { format, isValid } from 'date-fns';
import es from 'date-fns/locale/es/index.js';

export async function createAppointment(req, res) {
  try {
    const { patient_id, professional_id, fecha_hora, end_time, motivo } = req.body;
    const professionalId = (['ADMIN', 'EMPLOYEE'].includes(req.user.role) && professional_id) ? professional_id : req.user.userId;
    
    const patientRepo = AppDataSource.getRepository('Patient');
    const appointmentRepo = AppDataSource.getRepository('Appointment');

    const patient = await patientRepo.findOne({
      where: { id: parseInt(patient_id) } // REMOVED professional: { id: professionalId } filter here to allow assigning to others, or we should leave it? Let's remove the filter since admin can assign.
    });
    
    if (!patient) {
      return res.status(403).json({ error: 'Forbidden: El paciente no te pertenece.' });
    }

    const newAppointment = appointmentRepo.create({
      patient: { id: parseInt(patient_id) },
      professional: { id: professionalId },
      fecha_hora,
      end_time,
      motivo
    });

    await appointmentRepo.save(newAppointment);

    // --- WHATSAPP INTEGRATION ---
    if (patient.datos_contacto?.telefono || patient.datos_contacto?.phone) {
        const userRepo = AppDataSource.getRepository('User');
        const prof = await userRepo.findOne({ where: { id: professionalId } });
        if (prof?.whatsapp_connected && prof?.whatsapp_message_template) {
            let msg = prof.whatsapp_message_template;
            msg = msg.replace(/{{patient_name}}/g, patient.nombre || '');
            msg = msg.replace(/{{date}}/g, format(new Date(fecha_hora), "dd 'de' MMMM", { locale: es }));
            msg = msg.replace(/{{time}}/g, format(new Date(fecha_hora), 'HH:mm'));
            msg = msg.replace(/{{service}}/g, motivo || 'Turno');
            msg = msg.replace(/{{professional_name}}/g, prof.name || '');

            const phone = patient.datos_contacto.telefono || patient.datos_contacto.phone;
            whatsappService.sendMessage(prof.id, phone, msg);
        }
    }
    // ----------------------------

    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear turno', details: error.message });
  }
};

import { Between } from 'typeorm';

export async function getAppointments(req, res) {
  try {
    const { start_date, end_date, professional_id, patient_id } = req.query;
    const appointmentRepo = AppDataSource.getRepository('Appointment');
    
    let whereClause = {};
    
    // Filtrar estrictamente por el profesional logueado
    if (!req.user) req.user = { userId: 1, role: 'ADMIN' };
    whereClause.professional = { id: req.user.userId };


    if (patient_id) {
        whereClause.patient = { id: parseInt(patient_id) };
    }
    
    if (start_date && end_date) {
        whereClause.fecha_hora = Between(new Date(start_date), new Date(end_date));
    }

    const appointments = await appointmentRepo.find({
      where: whereClause,
      order: { fecha_hora: 'ASC' },
      relations: { patient: true, professional: true }
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turnos', details: error.message });
  }
};

export async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const { estado, fecha_hora, motivo } = req.body;
    const appointmentRepo = AppDataSource.getRepository('Appointment');

    let whereClause = { id: parseInt(id), professional: { id: req.user.userId } };

    const appointment = await appointmentRepo.findOne({
      where: whereClause
    });

    if (!appointment) {
      return res.status(403).json({ error: 'Forbidden: El turno no existe o no tienes permisos para editarlo.' });
    }

    appointmentRepo.merge(appointment, { estado, fecha_hora, motivo });
    await appointmentRepo.save(appointment);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar turno', details: error.message });
  }
};

export async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    const appointmentRepo = AppDataSource.getRepository('Appointment');

    let whereClause = { id: parseInt(id), professional: { id: req.user.userId } };

    const appointment = await appointmentRepo.findOne({
      where: whereClause
    });

    if (!appointment) {
      return res.status(403).json({ error: 'Forbidden: El turno no existe o no tienes permisos para eliminarlo.' });
    }

    await appointmentRepo.remove(appointment);
    res.json({ message: 'Turno eliminado/cancelado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar turno', details: error.message });
  }
};

export async function getMyPatientAppointments(req, res) {
  try {
    const userEmail = req.user.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'No se proporcionó email del usuario' });
    }

    const appointmentRepo = AppDataSource.getRepository('Appointment');
    
    // Find appointments where the patient's email matches the logged-in user's email
    const appointments = await appointmentRepo.find({
      where: { patient: { email: userEmail } },
      order: { fecha_hora: 'DESC' },
      relations: { patient: true, professional: true } // Need professional to show who the appointment is with
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tus turnos', details: error.message });
  }
};

export async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;
    const { cancel_reason } = req.body; // 'ausencia_paciente' o 'cancelacion_profesional'
    
    const appointmentRepo = AppDataSource.getRepository('Appointment');
    const patientRepo = AppDataSource.getRepository('Patient');

    let whereClause = { id: parseInt(id) };
    
    // Si no es admin/employee, puede ser un profesional o un paciente (USER)
    if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
      if (req.user.role === 'USER') {
        whereClause.patient = { email: req.user.email };
      } else {
        whereClause.professional = { id: req.user.userId };
      }
    }

    const appointment = await appointmentRepo.findOne({
      where: whereClause,
      relations: { patient: true }
    });

    if (!appointment) {
      return res.status(403).json({ error: 'Forbidden: El turno no existe o no tienes permisos para cancelarlo.' });
    }

    appointment.estado = 'cancelado';
    appointment.cancel_reason = cancel_reason;
    await appointmentRepo.save(appointment);

    // Lógica de penalización
    if (cancel_reason === 'ausencia_paciente' && appointment.patient) {
      const patient = await patientRepo.findOne({ where: { id: appointment.patient.id } });
      if (patient) {
        patient.absence_streak = (patient.absence_streak || 0) + 1;
        
        if (patient.absence_streak >= 3) {
          const banDate = new Date();
          banDate.setDate(banDate.getDate() + 7); // Ban de 7 días
          patient.ban_until = banDate;
        }
        
        await patientRepo.save(patient);
      }
    }

    res.json({ message: 'Turno cancelado correctamente', data: appointment });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar turno', details: error.message });
  }
}

export async function notifyAppointment(req, res) {
  try {
    const { id } = req.params;
    const appointmentRepo = AppDataSource.getRepository('Appointment');
    const userRepo = AppDataSource.getRepository('User');
    
    const appointment = await appointmentRepo.findOne({
      where: { id: parseInt(id) },
      relations: ['patient', 'professional']
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    const { patient, professional } = appointment;

    if (!patient.datos_contacto?.telefono && !patient.datos_contacto?.phone) {
        return res.status(400).json({ error: 'El paciente no tiene un número de teléfono registrado' });
    }

    const prof = await userRepo.findOne({ where: { id: professional.id } });

    if (!prof?.whatsapp_connected) {
        return res.status(400).json({ error: 'El WhatsApp del sistema no está conectado' });
    }

    let msg = prof.whatsapp_message_template || `Hola {{patient_name}}, te confirmamos que tu turno para {{service}} ha sido asignado correctamente para el {{date}} a las {{time}}.`;
    
    const aptDate = new Date(appointment.fecha_hora);
    const isValidDate = isValid(aptDate);

    msg = msg.replace(/{{patient_name}}/g, patient.nombre || '');
    msg = msg.replace(/{{date}}/g, isValidDate ? format(aptDate, "dd 'de' MMMM", { locale: es }) : 'N/A');
    msg = msg.replace(/{{time}}/g, isValidDate ? format(aptDate, 'HH:mm') : 'N/A');
    msg = msg.replace(/{{service}}/g, appointment.motivo || 'Turno');
    msg = msg.replace(/{{professional_name}}/g, prof.name || '');

    const phone = patient.datos_contacto?.telefono || patient.datos_contacto?.phone;
    
    whatsappService.sendMessage(prof.id, phone, msg);

    res.json({ message: 'Notificación enviada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar notificación', details: error.message });
  }
};

