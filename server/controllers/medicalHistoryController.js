import { AppDataSource } from '../database.js';

export const createHistoryEntry = async (req, res) => {
  try {
    const { patient_id, fecha, diagnostico, tratamiento, evolucion, archivos_adjuntos } = req.body;
    const professionalId = req.user.userId;
    
    const patientRepo = AppDataSource.getRepository('Patient');
    const historyRepo = AppDataSource.getRepository('MedicalHistory');

    const patient = await patientRepo.findOne({
      where: { id: parseInt(patient_id), professional: { id: professionalId } }
    });

    if (!patient) {
      return res.status(403).json({ error: 'Forbidden: El paciente no te pertenece.' });
    }

    const newEntry = historyRepo.create({
      patient: { id: parseInt(patient_id) },
      professional: { id: professionalId },
      fecha: fecha || new Date(),
      diagnostico,
      tratamiento,
      evolucion,
      archivos_adjuntos
    });

    await historyRepo.save(newEntry);
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear registro médico', details: error.message });
  }
};

export const getHistoryByPatient = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const professionalId = req.user.userId;
    
    const patientRepo = AppDataSource.getRepository('Patient');
    const historyRepo = AppDataSource.getRepository('MedicalHistory');

    const patient = await patientRepo.findOne({
      where: { id: parseInt(patient_id), professional: { id: professionalId } }
    });

    if (!patient) {
      return res.status(403).json({ error: 'Forbidden: El paciente no te pertenece.' });
    }

    const history = await historyRepo.find({
      where: { patient: { id: parseInt(patient_id) }, professional: { id: professionalId } },
      order: { fecha: 'DESC' }
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial', details: error.message });
  }
};

export const updateHistoryEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const professionalId = req.user.userId;
    const updateData = req.body;
    const historyRepo = AppDataSource.getRepository('MedicalHistory');

    const entry = await historyRepo.findOne({
      where: { id: parseInt(id), professional: { id: professionalId } }
    });

    if (!entry) {
      return res.status(403).json({ error: 'Forbidden: Registro no encontrado o no te pertenece.' });
    }

    historyRepo.merge(entry, updateData);
    await historyRepo.save(entry);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar registro médico', details: error.message });
  }
};
