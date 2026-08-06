import { AppDataSource } from '../database.js';

export const medicalRecordsController = {
  // Templates
  createTemplate: async (req, res) => {
    try {
      const { name, description, fields } = req.body;
      const professionalId = req.user.id;

      const templateRepo = AppDataSource.getRepository('RecordTemplate');
      const newTemplate = templateRepo.create({
        name,
        description,
        fields, // Should be an array of field configuration objects
        professional: { id: professionalId }
      });

      const saved = await templateRepo.save(newTemplate);
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  },

  getTemplates: async (req, res) => {
    try {
      const templateRepo = AppDataSource.getRepository('RecordTemplate');
      const templates = await templateRepo.find({
        where: { isActive: true },
        relations: ['professional'],
        order: { createdAt: 'DESC' }
      });
      // Optionally map out sensitive professional details
      res.json(templates.map(t => ({
        ...t,
        professional_name: t.professional ? `${t.professional.first_name} ${t.professional.last_name}` : 'Unknown'
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
      const professionalId = req.user.id;

      const templateRepo = AppDataSource.getRepository('RecordTemplate');
      const recordRepo = AppDataSource.getRepository('MedicalRecord');

      let templateSnapshot = null;
      let templateRef = null;

      if (template_id) {
        const template = await templateRepo.findOneBy({ id: template_id });
        if (template) {
          templateSnapshot = template.fields; // Snapshotting to guarantee immutability
          templateRef = { id: template_id };
        }
      }

      const newRecord = recordRepo.create({
        patient: { id: patient_id },
        professional: { id: professionalId },
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
        where: { patient: { id: patient_id } },
        relations: ['professional', 'template'],
        order: { createdAt: 'DESC' }
      });

      res.json(records.map(r => ({
        ...r,
        professional_name: r.professional ? `${r.professional.first_name} ${r.professional.last_name}` : 'Unknown',
        template_name: r.template ? r.template.name : 'No Template'
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
      const professionalId = req.user.id;

      const recordRepo = AppDataSource.getRepository('MedicalRecord');
      const existing = await recordRepo.findOne({
        where: { id },
        relations: ['professional', 'patient', 'template']
      });

      if (!existing) {
        return res.status(404).json({ message: 'Record not found' });
      }

      // Check permissions (only professional who created it can edit? Or role-based?)
      // Let's assume professionals can edit for now

      if (existing.status === 'signed') {
        // If it's already signed, we shouldn't overwrite it directly.
        // We should create a new version for true immutability.
        const newVersion = recordRepo.create({
          patient: { id: existing.patient.id },
          professional: { id: professionalId },
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
        // If it's a draft, we can update it in place
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
