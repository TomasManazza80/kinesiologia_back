import { AppDataSource } from '../database.js';

export const createPatient = async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo un administrador puede crear un paciente.' });
    }

    const { nombre, dni, datos_contacto, fecha_nacimiento, professionalIds, is_pauses, gender, blood_type, status } = req.body;
    const professionalId = req.user.userId;

    const patientRepo = AppDataSource.getRepository('Patient');
    const isPausesBool = is_pauses === true || is_pauses === 'true' || is_pauses === 'pauses';
    
    let assignedProfessionals = [];
    if (Array.isArray(professionalIds) && professionalIds.length > 0) {
      const validIds = Array.from(new Set(professionalIds.map(id => parseInt(id)).filter(id => !isNaN(id))));
      if (validIds.length > 0) {
        assignedProfessionals = validIds.map(id => ({ id }));
      }
    }
    if (assignedProfessionals.length === 0) {
      assignedProfessionals = [{ id: professionalId }];
    }

    const newPatient = patientRepo.create({
      nombre,
      dni,
      datos_contacto,
      fecha_nacimiento,
      gender,
      blood_type,
      status,
      is_pauses: isPausesBool,
      admissionData: { ...(req.body.admissionData || {}), is_pauses: isPausesBool },
      professionals: assignedProfessionals
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
    const isAdmin = req.user.role === 'ADMIN';
    const patientRepo = AppDataSource.getRepository('Patient');

    let query = patientRepo.createQueryBuilder('patient')
      .leftJoinAndSelect('patient.professionals', 'allProfessionals')
      .leftJoin('patient.professionals', 'filterProf')
      .where(
        '(:isAdmin = true OR patient.is_pauses = true OR patient."admissionData"->>\'is_pauses\' = \'true\' OR patient."admissionData"->>\'is_pauses\' = \'pauses\' OR filterProf.id = :professionalId)',
        { professionalId, isAdmin }
      );

    const patients = await query
      .orderBy('patient.createdAt', 'DESC')
      .getMany();

    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pacientes', details: error.message });
  }
};

export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const professionalId = req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';
    const patientRepo = AppDataSource.getRepository('Patient');

    let query = patientRepo.createQueryBuilder('patient')
      .leftJoinAndSelect('patient.professionals', 'allProfessionals')
      .leftJoin('patient.professionals', 'filterProf')
      .where('patient.id = :id', { id: parseInt(id) })
      .andWhere(
        '(:isAdmin = true OR patient.is_pauses = true OR patient."admissionData"->>\'is_pauses\' = \'true\' OR patient."admissionData"->>\'is_pauses\' = \'pauses\' OR filterProf.id = :professionalId)',
        { professionalId, isAdmin }
      );

    const patient = await query.getOne();

    if (!patient) {
      return res.status(403).json({ error: 'Forbidden: El paciente no existe o no tienes permisos para acceder a él.' });
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
    const isAdmin = req.user.role === 'ADMIN';
    const updateData = req.body;
    const patientRepo = AppDataSource.getRepository('Patient');

    let query = patientRepo.createQueryBuilder('patient')
      .leftJoinAndSelect('patient.professionals', 'allProfessionals')
      .leftJoin('patient.professionals', 'filterProf')
      .where('patient.id = :id', { id: parseInt(id) })
      .andWhere(
        '(:isAdmin = true OR patient.is_pauses = true OR patient."admissionData"->>\'is_pauses\' = \'true\' OR patient."admissionData"->>\'is_pauses\' = \'pauses\' OR filterProf.id = :professionalId)',
        { professionalId, isAdmin }
      );

    const patient = await query.getOne();

    if (!patient) {
      return res.status(403).json({ error: 'Forbidden: El paciente no existe o no tienes permisos para editarlo.' });
    }

    const { professionalIds, ...restData } = updateData;
    if ('is_pauses' in restData) {
      const isPausesBool = restData.is_pauses === true || restData.is_pauses === 'true' || restData.is_pauses === 'pauses';
      restData.is_pauses = isPausesBool;
      restData.admissionData = {
        ...(patient.admissionData || {}),
        ...(restData.admissionData || {}),
        is_pauses: isPausesBool
      };
    }
    patientRepo.merge(patient, restData);
    
    if (Array.isArray(professionalIds)) {
      const validIds = Array.from(new Set(professionalIds.map(id => parseInt(id)).filter(id => !isNaN(id))));
      patient.professionals = validIds.map(id => ({ id }));
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
    const isAdmin = req.user.role === 'ADMIN';
    const patientRepo = AppDataSource.getRepository('Patient');

    let query = patientRepo.createQueryBuilder('patient')
      .leftJoin('patient.professionals', 'filterProf')
      .where('patient.id = :id', { id: parseInt(id) })
      .andWhere(
        '(:isAdmin = true OR patient.is_pauses = true OR patient."admissionData"->>\'is_pauses\' = \'true\' OR patient."admissionData"->>\'is_pauses\' = \'pauses\' OR filterProf.id = :professionalId)',
        { professionalId, isAdmin }
      );

    const patient = await query.getOne();

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
    const isAdmin = req.user.role === 'ADMIN';
    const patientRepo = AppDataSource.getRepository('Patient');

    let query = patientRepo.createQueryBuilder('patient')
      .leftJoinAndSelect('patient.professionals', 'allProfessionals')
      .leftJoin('patient.professionals', 'filterProf')
      .where('patient.id = :id', { id: parseInt(id) })
      .andWhere(
        '(:isAdmin = true OR patient.is_pauses = true OR patient."admissionData"->>\'is_pauses\' = \'true\' OR patient."admissionData"->>\'is_pauses\' = \'pauses\' OR filterProf.id = :professionalId)',
        { professionalId, isAdmin }
      );

    const patient = await query.getOne();

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
