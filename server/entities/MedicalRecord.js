import { EntitySchema } from 'typeorm';

export const MedicalRecordSchema = new EntitySchema({
  name: 'MedicalRecord',
  tableName: 'medical_records',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    status: { type: 'varchar', default: 'draft' }, // 'draft' or 'signed'
    signature_timestamp: { type: 'timestamptz', nullable: true },
    template_snapshot: { type: 'jsonb', nullable: true },
    record_data: { type: 'jsonb', nullable: true },
    previous_version_id: { type: 'int', nullable: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true }
  },
  relations: {
    patient: {
      target: 'Patient',
      type: 'many-to-one',
      joinColumn: { name: 'patient_id' },
      nullable: false,
      onDelete: 'CASCADE'
    },
    professional: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'professional_id' },
      nullable: false
    },
    template: {
      target: 'RecordTemplate',
      type: 'many-to-one',
      joinColumn: { name: 'template_id' },
      nullable: true
    }
  }
});
