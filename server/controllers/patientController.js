import { AppDataSource } from '../database.js';

export const createPatient = async (req, res) => {
  try {
    const { nombre, dni, datos_contacto, fecha_nacimiento, professionalIds } = req.body;
    const professionalId = req.user.userId;

    const patientRepo = AppDataSource.getRepository('Patient');
    const newPatient = patientRepo.create({
      nombre,
      dni,
      datos_contacto,
      fecha_nacimiento,
      professionals: (req.user.role === 'ADMIN' && professionalIds && professionalIds.length > 0) ? professionalIds.map(id => ({ id })) : [{ id: professionalId }]
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
    
    let whereClause = {};
    if (req.user.role !== 'ADMIN') {
        whereClause = { professionals: { id: professionalId } };
    }

    const patients = await patientRepo.find({
      where: whereClause,
      relations: { professionals: true },
      order: { createdAt: 'DESC' }
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

    let whereClause = { id: parseInt(id) };
    if (req.user.role !== 'ADMIN') {
        whereClause.professionals = { id: professionalId };
    }

    const patient = await patientRepo.findOne({
      where: whereClause,
      relations: { professionals: true }
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

    let whereClause = { id: parseInt(id) };
    if (req.user.role !== 'ADMIN') {
        whereClause.professionals = { id: professionalId };
    }

    const patient = await patientRepo.findOne({
      where: whereClause,
      relations: { professionals: true }
    });

    if (!patient) {
      return res.status(403).json({ error: 'Forbidden: El paciente no existe o no tienes permisos para editarlo.' });
    }

    const { professionalIds, ...restData } = updateData;
    patientRepo.merge(patient, restData);
    
    if (req.user.role === 'ADMIN' && professionalIds && Array.isArray(professionalIds)) {
        patient.professionals = professionalIds.map(id => ({ id }));
    }
    
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

    let whereClause = { id: parseInt(id) };
    if (req.user.role !== 'ADMIN') {
        whereClause.professionals = { id: professionalId };
    }

    const patient = await patientRepo.findOne({
      where: whereClause
    });

    if (!patient) {
      return res.status(403).json({ error: 'Forbidden: El paciente no existe o no tienes permisos para eliminarlo.' });
    }

    await patientRepo.remove(patient);
    res.json({ message: 'Paciente eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar paciente', details: error.message });
  }
};

export const sharePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetProfessionalIds } = req.body;
    const professionalId = req.user.userId;
    const patientRepo = AppDataSource.getRepository('Patient');

    let whereClause = { id: parseInt(id) };
    if (req.user.role !== 'ADMIN') {
        whereClause.professionals = { id: professionalId };
    }

    const patient = await patientRepo.findOne({
      where: whereClause,
      relations: { professionals: true }
    });

    if (!patient) {
      return res.status(403).json({ error: 'El paciente no existe o no tienes acceso a él.' });
    }

    const idsToAdd = Array.isArray(targetProfessionalIds) ? targetProfessionalIds : [targetProfessionalIds];
    const currentProfIds = new Set((patient.professionals || []).map(p => p.id));

    idsToAdd.forEach(pId => {
        if (pId && !isNaN(parseInt(pId))) {
            currentProfIds.add(parseInt(pId));
        }
    });

    patient.professionals = Array.from(currentProfIds).map(pId => ({ id: pId }));

    await patientRepo.save(patient);

    const updatedPatient = await patientRepo.findOne({
      where: { id: parseInt(id) },
      relations: { professionals: true }
    });

    res.json({ message: 'Paciente e historial médico compartidos correctamente', patient: updatedPatient });
  } catch (error) {
    console.error("Error al compartir paciente:", error);
    res.status(500).json({ error: 'Error al compartir paciente', details: error.message });
  }
};
