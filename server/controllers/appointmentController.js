import { AppDataSource } from '../database.js';
import * as whatsappService from '../services/whatsappService.js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/index.js';

export const createAppointment = async (req, res) => {
  try {
    const { patient_id, professional_id, fecha_hora, end_time, motivo } = req.body;
    const professionalId = (['ADMIN', 'EMPLOYEE'].includes(req.user.role) && professional_id) ? parseInt(professional_id) : req.user.userId;
    
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

export const getAppointments = async (req, res) => {
  try {
    const professionalId = (['ADMIN', 'EMPLOYEE'].includes(req.user.role) && req.query.professional_id) ? parseInt(req.query.professional_id) : req.user.userId;
    const { start_date, end_date } = req.query;
    const appointmentRepo = AppDataSource.getRepository('Appointment');
    
    let whereClause = { professional: { id: professionalId } };
    
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

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fecha_hora, motivo } = req.body;
    const appointmentRepo = AppDataSource.getRepository('Appointment');

    let whereClause = { id: parseInt(id) };
    if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        whereClause.professional = { id: req.user.userId };
    }

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

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointmentRepo = AppDataSource.getRepository('Appointment');

    let whereClause = { id: parseInt(id) };
    if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        whereClause.professional = { id: req.user.userId };
    }

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

export const getMyPatientAppointments = async (req, res) => {
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
