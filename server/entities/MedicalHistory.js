import { EntitySchema } from 'typeorm';

export const MedicalHistorySchema = new EntitySchema({
  name: 'MedicalHistory',
  tableName: 'medical_history',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    fecha: { type: 'date', nullable: true },
    reason_for_visit: { type: 'text', nullable: true },
    blood_pressure: { type: 'varchar', nullable: true },
    heart_rate: { type: 'varchar', nullable: true },
    physical_findings: { type: 'text', nullable: true },
    diagnostico: { type: 'text', nullable: true },
    tratamiento: { type: 'text', nullable: true },
    archivos_adjuntos: { type: 'jsonb', nullable: true }
  },
  relations: {
    professional: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'professional_id' },
      nullable: true
    },
    patient: {
      target: 'Patient',
      type: 'many-to-one',
      joinColumn: { name: 'patient_id' },
      nullable: false,
      onDelete: 'CASCADE'
    }
  }
});
