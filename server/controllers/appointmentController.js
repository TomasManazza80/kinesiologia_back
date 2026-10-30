import { AppDataSource } from '../database.js';
import * as whatsappService from '../services/whatsappService.js';
import { format, isValid } from 'date-fns';
import es from 'date-fns/locale/es/index.js';
import moment from 'moment-timezone';
import { Between } from 'typeorm';

export async function createAppointment(req, res) {
  try {
    const { patient_id, professional_id, fecha_hora, end_time, motivo } = req.body;
    const professionalId = (['ADMIN', 'EMPLOYEE'].includes(req.user.role) && professional_id) ? professional_id : req.user.userId;
    
    let newAppointment = null;
    let patient = null;

    await AppDataSource.transaction(async transactionalEntityManager => {
        const userRepo = transactionalEntityManager.getRepository('User');
        const patientRepo = transactionalEntityManager.getRepository('Patient');
        const appointmentRepo = transactionalEntityManager.getRepository('Appointment');

        const prof = await userRepo.findOne({
            where: { id: professionalId },
            lock: { mode: "pessimistic_write" }
        });
        
        if (!prof) {
             throw new Error("PROFESSIONAL_NOT_FOUND");
        }

        patient = await patientRepo.findOne({
          where: { id: parseInt(patient_id) } 
        });
        
        if (!patient) {
          throw new Error("PATIENT_NOT_FOUND");
        }

        // Parse fecha_hora explicitly in Argentina timezone and save as ISO string to avoid local timezone issues
        const fechaHoraParsed = moment.tz(fecha_hora, 'America/Argentina/Buenos_Aires').toISOString();
        let endTimeParsed = null;
        if (end_time) {
          endTimeParsed = moment.tz(end_time, 'America/Argentina/Buenos_Aires').toISOString();
        }

        // Check for overlapping appointments
        const startOfDay = moment(fechaHoraParsed).startOf('day').toDate();
        const endOfDay = moment(fechaHoraParsed).endOf('day').toDate();

        const dailyAppointments = await appointmentRepo.find({
            where: {
                professional: { id: professionalId },
                fecha_hora: Between(startOfDay, endOfDay)
            }
        });

        const validAppointments = dailyAppointments.filter(app => app.estado !== 'cancelado');

        const newStart = moment(fechaHoraParsed).toDate();
        const newEnd = endTimeParsed ? moment(endTimeParsed).toDate() : moment(fechaHoraParsed).add(30, 'minutes').toDate();

        const isOverlapping = validAppointments.some(app => {
            const appStart = moment(app.fecha_hora).toDate();
            const appEnd = app.end_time ? moment(app.end_time).toDate() : moment(appStart).add(30, 'minutes').toDate();
            return (newStart < appEnd && newEnd > appStart);
        });

        if (isOverlapping) {
            throw new Error("OVERLAPPING_APPOINTMENT");
        }

        newAppointment = appointmentRepo.create({
          patient: { id: parseInt(patient_id) },
          professional: { id: professionalId },
          fecha_hora: fechaHoraParsed,
          end_time: endTimeParsed,
          motivo,
          patient_name: patient.nombre,
          patient_dni: patient.dni,
          patient_phone: patient.datos_contacto?.telefono || patient.datos_contacto?.phone,
          patient_email: patient.email
        });

        await appointmentRepo.save(newAppointment);
    });

    // --- WHATSAPP INTEGRATION ---
    if (patient.datos_contacto?.telefono || patient.datos_contacto?.phone) {
        const userRepo = AppDataSource.getRepository('User');
        const prof = await userRepo.findOne({ where: { id: professionalId } });
        if (prof?.whatsapp_connected) {
            let msg = prof.whatsapp_message_template || "Hola {{patient_name}}, somos del equipo de PAUSES. Te confirmamos tu turno de {{service}} con {{professional_name}} para el día {{date}} a las {{time}} hs.\n\nTe esperamos. En caso de no poder asistir, por favor avisar con al menos 1 hora de anticipación. ¡Muchas gracias!";
            msg = msg.replace(/{{patient_name}}/g, patient.nombre || '');
            const dateObj = moment(fecha_hora).tz('America/Argentina/Buenos_Aires');
            dateObj.locale('es');
            msg = msg.replace(/{{date}}/g, dateObj.format('DD [de] MMMM'));
            msg = msg.replace(/{{time}}/g, dateObj.format('HH:mm'));
            msg = msg.replace(/{{service}}/g, motivo || 'Turno');
            msg = msg.replace(/{{professional_name}}/g, prof.name || '');

            const phone = patient.datos_contacto.telefono || patient.datos_contacto.phone;
            whatsappService.sendMessage(prof.id, phone, msg);
        }
    }
    // ----------------------------

    res.status(201).json(newAppointment);
  } catch (error) {
    if (error.message === "PROFESSIONAL_NOT_FOUND") return res.status(404).json({ error: 'Profesional no encontrado' });
    if (error.message === "PATIENT_NOT_FOUND") return res.status(403).json({ error: 'Forbidden: El paciente no te pertenece.' });
    if (error.message === "OVERLAPPING_APPOINTMENT") return res.status(409).json({ error: 'Ya existe un turno en este horario. Para agendar un turno nuevo, primero debe eliminar o reprogramar el existente.' });

    res.status(500).json({ error: 'Error al crear turno', details: error.message });
  }
};

export async function getAppointments(req, res) {
  try {
    const { start_date, end_date, professional_id, patient_id } = req.query;
    const appointmentRepo = AppDataSource.getRepository('Appointment');
    const userRepo = AppDataSource.getRepository('User');
    
    let whereClause = {};
    
    if (!req.user) req.user = { userId: 1, role: 'ADMIN' };
    
    const currentUser = await userRepo.findOne({ where: { id: req.user.userId } });
    const isProfessional = currentUser?.is_public === true || 
                           (Array.isArray(currentUser?.specialty) && currentUser.specialty.length > 0) || 
                           !['ADMIN'].includes(req.user.role);

    if (isProfessional) {
      // Professionals can ONLY see their own appointments to ensure patient privacy
      whereClause.professional = { id: req.user.userId };
    } else {
      if (professional_id && professional_id !== 'all') {
        whereClause.professional = { id: parseInt(professional_id) };
      }
    }

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
    const userRepo = AppDataSource.getRepository('User');

    let whereClause = { id: parseInt(id) };
    const currentUser = await userRepo.findOne({ where: { id: req.user?.userId } });
    const isProfessional = currentUser?.is_public === true || 
                           (Array.isArray(currentUser?.specialty) && currentUser.specialty.length > 0) || 
                           !['ADMIN'].includes(req.user?.role);

    if (isProfessional) {
      whereClause.professional = { id: req.user.userId };
    }

    const appointment = await appointmentRepo.findOne({
      where: whereClause
    });

    if (!appointment) {
      return res.status(403).json({ error: 'Forbidden: El turno no existe o no tienes permisos para editarlo.' });
    }

    let updateData = { estado, motivo };
    
    if (fecha_hora) {
      updateData.fecha_hora = moment.tz(fecha_hora, 'America/Argentina/Buenos_Aires').toISOString();
    }

    appointmentRepo.merge(appointment, updateData);
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
    const userRepo = AppDataSource.getRepository('User');

    let whereClause = { id: parseInt(id) };
    const currentUser = await userRepo.findOne({ where: { id: req.user?.userId } });
    const isProfessional = currentUser?.is_public === true || 
                           (Array.isArray(currentUser?.specialty) && currentUser.specialty.length > 0) || 
                           !['ADMIN'].includes(req.user?.role);

    if (isProfessional) {
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

export async function getMyPatientAppointments(req, res) {
  try {
    const userEmail = req.user.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'No se proporcionó email del usuario' });
    }

    const appointmentRepo = AppDataSource.getRepository('Appointment');
    
    // Find appointments where the patient's email matches the logged-in user's email OR patient_email matches
    const appointments = await appointmentRepo.find({
      where: [
        { patient: { email: userEmail } },
        { patient_email: userEmail }
      ],
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
    const userRepo = AppDataSource.getRepository('User');

    let appointment = null;
    const currentUser = await userRepo.findOne({ where: { id: req.user?.userId } });
    const isProfessional = currentUser?.is_public === true || 
                           (Array.isArray(currentUser?.specialty) && currentUser.specialty.length > 0) || 
                           !['ADMIN'].includes(req.user?.role);
    
    if (isProfessional) {
      appointment = await appointmentRepo.findOne({
        where: { id: parseInt(id), professional: { id: req.user.userId } },
        relations: { patient: true }
      });
    } else if (req.user.role === 'USER') {
      appointment = await appointmentRepo.findOne({
        where: [
          { id: parseInt(id), patient: { email: req.user.email } },
          { id: parseInt(id), patient_email: req.user.email }
        ],
        relations: { patient: true }
      });
    } else {
      appointment = await appointmentRepo.findOne({
        where: { id: parseInt(id) },
        relations: { patient: true }
      });
    }

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
      relations: { patient: true, professional: true }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    let { patient, professional } = appointment;

    if (!professional) {
      return res.status(400).json({ error: 'El turno no tiene un profesional asignado' });
    }

    let datosContacto = patient?.datos_contacto;
    if (typeof datosContacto === 'string') {
      try {
        datosContacto = JSON.parse(datosContacto);
      } catch (e) {
        datosContacto = {};
      }
    }

    const phone = datosContacto?.telefono || datosContacto?.phone || appointment.patient_phone;
    if (!phone) {
      return res.status(400).json({ error: 'El paciente no tiene un número de teléfono registrado' });
    }

    const patientName = patient?.nombre || appointment.patient_name || 'Paciente';

    const prof = await userRepo.findOne({ where: { id: professional.id } });

    if (!prof?.whatsapp_connected) {
        return res.status(400).json({ error: 'El WhatsApp del sistema no está conectado' });
    }

    let msg = prof.whatsapp_message_template || `Hola {{patient_name}}, te confirmamos que tu turno para {{service}} ha sido asignado correctamente para el {{date}} a las {{time}}.`;
    
    const aptDate = new Date(appointment.fecha_hora);
    const isValidDate = isValid(aptDate);

    msg = msg.replace(/{{patient_name}}/g, patientName);
    msg = msg.replace(/{{date}}/g, isValidDate ? format(aptDate, "dd 'de' MMMM", { locale: es }) : 'N/A');
    msg = msg.replace(/{{time}}/g, isValidDate ? format(aptDate, 'HH:mm') : 'N/A');
    msg = msg.replace(/{{service}}/g, appointment.motivo || 'Turno');
    msg = msg.replace(/{{professional_name}}/g, prof.name || '');
    
    whatsappService.sendMessage(prof.id, phone, msg);

    res.json({ message: 'Notificación enviada correctamente' });
  } catch (error) {
    console.error('Error in notifyAppointment:', error);
    res.status(500).json({ error: 'Error al enviar notificación', details: String(error), stack: error.stack });
  }
};

export async function getUnreadAppointments(req, res) {
  try {
    const appointmentRepo = AppDataSource.getRepository('Appointment');
    const appointments = await appointmentRepo.find({
      where: {
        professional: { id: req.user.userId },
        is_read: false
      },
      order: { createdAt: 'DESC' },
      relations: { patient: true }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turnos no leídos', details: error.message });
  }
}

export async function markAppointmentsAsRead(req, res) {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Se requiere un arreglo de IDs' });
    }
    const appointmentRepo = AppDataSource.getRepository('Appointment');
    
    // Solo actualizamos los turnos que pertenecen a este profesional
    await AppDataSource.createQueryBuilder()
      .update('Appointment')
      .set({ is_read: true })
      .where("id IN (:...ids)", { ids })
      .andWhere("professional_id = :profId", { profId: req.user.userId })
      .execute();

    res.json({ message: 'Turnos marcados como leídos' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar turnos', details: error.message });
  }
}
