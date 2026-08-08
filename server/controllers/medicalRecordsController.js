import { AppDataSource } from '../database.js';

export const medicalRecordsController = {
  // Templates
  createTemplate: async (req, res) => {
    try {
      const { name, description, fields } = req.body;
      const rawId = req.user?.userId || req.user?.id;
      const professionalId = rawId ? parseInt(rawId) : null;

      if (!professionalId || isNaN(professionalId)) {
        return res.status(400).json({ message: 'Usuario no autenticado o ID de profesional inválido' });
      }

      const userRepo = AppDataSource.getRepository('User');
      const professional = await userRepo.findOneBy({ id: professionalId });

      if (!professional) {
        return res.status(404).json({ message: 'Usuario profesional no encontrado' });
      }

      const templateRepo = AppDataSource.getRepository('RecordTemplate');
      const newTemplate = templateRepo.create({
        name,
        description,
        fields, // Should be an array of field configuration objects
        professional
      });

      const saved = await templateRepo.save(newTemplate);
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
  },

  updateTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, fields } = req.body;
      const templateRepo = AppDataSource.getRepository('RecordTemplate');
      const existing = await templateRepo.findOneBy({ id: parseInt(id) });

      if (!existing) {
        return res.status(404).json({ message: 'Plantilla no encontrada' });
      }

      if (name) existing.name = name;
      if (description !== undefined) existing.description = description;
      if (fields) existing.fields = fields;

      const saved = await templateRepo.save(existing);
      res.json(saved);
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
  },

  getTemplates: async (req, res) => {
    try {
      const templateRepo = AppDataSource.getRepository('RecordTemplate');
      
      const templates = await templateRepo.find({
        where: { isActive: true },
        relations: { professional: true },
        order: { createdAt: 'DESC' }
      });

      res.json(templates.map(t => ({
        ...t,
        professional_name: t.professional ? `${t.professional.first_name || t.professional.name || ''}`.trim() : 'Sistema'
      })));
    } catch (error) {
      console.error('Error getting templates:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  // Records
  createRecord: async (req, res) => {
    try {
      const { patient_id, template_id, record_data, status } = req.body;
      const rawId = req.user?.userId || req.user?.id;
      const professionalId = rawId ? parseInt(rawId) : null;

      if (!professionalId || isNaN(professionalId)) {
        return res.status(400).json({ message: 'Usuario no autenticado' });
      }

      const userRepo = AppDataSource.getRepository('User');
      const professional = await userRepo.findOneBy({ id: professionalId });

      const templateRepo = AppDataSource.getRepository('RecordTemplate');
      const recordRepo = AppDataSource.getRepository('MedicalRecord');

      let templateSnapshot = null;
      let templateRef = null;

      if (template_id) {
        const template = await templateRepo.findOneBy({ id: parseInt(template_id) });
        if (template) {
          templateSnapshot = template.fields; // Snapshotting to guarantee immutability
          templateRef = template;
        }
      }

      const newRecord = recordRepo.create({
        patient: { id: parseInt(patient_id) },
        professional,
        template: templateRef,
        template_snapshot: templateSnapshot,
        record_data,
        status: status || 'draft',
        signature_timestamp: status === 'signed' ? new Date() : null
      });

      const saved = await recordRepo.save(newRecord);
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error creating medical record:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  getPatientRecords: async (req, res) => {
    try {
      const { patient_id } = req.params;
      const recordRepo = AppDataSource.getRepository('MedicalRecord');

      const records = await recordRepo.find({
        where: { patient: { id: parseInt(patient_id) } },
        relations: { professional: true, template: true },
        order: { createdAt: 'DESC' }
      });

      res.json(records.map(r => ({
        ...r,
        professional_name: r.professional ? `${r.professional.first_name || r.professional.name || ''}`.trim() : 'Desconocido',
        template_name: r.template ? r.template.name : 'Sin Plantilla'
      })));
    } catch (error) {
      console.error('Error getting patient records:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  updateRecord: async (req, res) => {
    try {
      const { id } = req.params;
      const { record_data, status } = req.body;
      const rawId = req.user?.userId || req.user?.id;
      const professionalId = rawId ? parseInt(rawId) : null;

      if (!professionalId || isNaN(professionalId)) {
        return res.status(400).json({ message: 'Usuario no autenticado' });
      }

      const userRepo = AppDataSource.getRepository('User');
      const professional = await userRepo.findOneBy({ id: professionalId });

      const recordRepo = AppDataSource.getRepository('MedicalRecord');
      const existing = await recordRepo.findOne({
        where: { id: parseInt(id) },
        relations: { professional: true, patient: true, template: true }
      });

      if (!existing) {
        return res.status(404).json({ message: 'Registro no encontrado' });
      }

      if (existing.status === 'signed') {
        const newVersion = recordRepo.create({
          patient: { id: existing.patient.id },
          professional,
          template: existing.template ? { id: existing.template.id } : null,
          template_snapshot: existing.template_snapshot,
          record_data,
          status: status || 'draft',
          signature_timestamp: status === 'signed' ? new Date() : null,
          previous_version_id: existing.id
        });
        const savedNewVersion = await recordRepo.save(newVersion);
        return res.status(201).json(savedNewVersion);
      } else {
        existing.record_data = record_data;
        if (status) existing.status = status;
        if (status === 'signed') existing.signature_timestamp = new Date();
        
        const saved = await recordRepo.save(existing);
        return res.json(saved);
      }
    } catch (error) {
      console.error('Error updating medical record:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};
