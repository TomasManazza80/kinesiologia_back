import { AppDataSource } from '../database.js';

export const createPatient = async (req, res) => {
  try {
    const { nombre, dni, datos_contacto, fecha_nacimiento } = req.body;
    const professionalId = req.user.userId; 

    const patientRepo = AppDataSource.getRepository('Patient');
    const newPatient = patientRepo.create({
      nombre,
      dni,
      datos_contacto,
      fecha_nacimiento,
      professional: { id: professionalId }
    });

    await patientRepo.save(newPatient);
    res.status(201).json(newPatient);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear paciente', details: error.message });
  }
};

export const getPatients = async (req, res) => {
  try {
    const professionalId = req.user.userId;
    const patientRepo = AppDataSource.getRepository('Patient');
    
    const patients = await patientRepo.find({
      where: { professional: { id: professionalId } }
    });

    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pacientes', details: error.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const professionalId = req.user.userId;
    const patientRepo = AppDataSource.getRepository('Patient');

    const patient = await patientRepo.findOne({
      where: { id: parseInt(id), professional: { id: professionalId } }
    });

    if (!patient) {
      return res.status(403).json({ error: 'Forbidden: El paciente no existe o no te pertenece.' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener paciente', details: error.message });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const professionalId = req.user.userId;
    const updateData = req.body;
    const patientRepo = AppDataSource.getRepository('Patient');

    const patient = await patientRepo.findOne({
      where: { id: parseInt(id), professional: { id: professionalId } }
    });

    if (!patient) {
      return res.status(403).json({ error: 'Forbidden: El paciente no existe o no te pertenece.' });
    }

    patientRepo.merge(patient, updateData);
    await patientRepo.save(patient);
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar paciente', details: error.message });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const professionalId = req.user.userId;
    const patientRepo = AppDataSource.getRepository('Patient');

    const patient = await patientRepo.findOne({
      where: { id: parseInt(id), professional: { id: professionalId } }
    });

    if (!patient) {
      return res.status(403).json({ error: 'Forbidden: El paciente no existe o no te pertenece.' });
    }

    await patientRepo.remove(patient);
    res.json({ message: 'Paciente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar paciente', details: error.message });
  }
};
