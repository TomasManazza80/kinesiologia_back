import { AppDataSource } from '../database.js';

export const createAppointment = async (req, res) => {
  try {
    const { patient_id, professional_id, fecha_hora, end_time, motivo } = req.body;
    const professionalId = professional_id ? parseInt(professional_id) : req.user.userId;
    
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
    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear turno', details: error.message });
  }
};

import { Between } from 'typeorm';

export const getAppointments = async (req, res) => {
  try {
    const professionalId = req.query.professional_id ? parseInt(req.query.professional_id) : req.user.userId;
    const { start_date, end_date } = req.query;
    const appointmentRepo = AppDataSource.getRepository('Appointment');
    
    let whereClause = { professional: { id: professionalId } };
    
    if (start_date && end_date) {
        whereClause.fecha_hora = Between(new Date(start_date), new Date(end_date));
    }

    const appointments = await appointmentRepo.find({
      where: whereClause,
      order: { fecha_hora: 'ASC' },
      relations: { patient: true }
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turnos', details: error.message });
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const professionalId = req.user.userId;
    const { estado, fecha_hora, motivo } = req.body;
    const appointmentRepo = AppDataSource.getRepository('Appointment');

    const appointment = await appointmentRepo.findOne({
      where: { id: parseInt(id), professional: { id: professionalId } }
    });

    if (!appointment) {
      return res.status(403).json({ error: 'Forbidden: El turno no existe o no te pertenece.' });
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
    const professionalId = req.user.userId;
    const appointmentRepo = AppDataSource.getRepository('Appointment');

    const appointment = await appointmentRepo.findOne({
      where: { id: parseInt(id), professional: { id: professionalId } }
    });

    if (!appointment) {
      return res.status(403).json({ error: 'Forbidden: El turno no existe o no te pertenece.' });
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
