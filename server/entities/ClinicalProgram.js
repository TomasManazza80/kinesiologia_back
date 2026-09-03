import { EntitySchema } from 'typeorm';

export const ClinicalProgramSchema = new EntitySchema({
  name: 'ClinicalProgram',
  tableName: 'clinical_program',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    status: { type: 'varchar', default: 'EN_CURSO' }, // 'EN_CURSO', 'FINALIZADO_MES_1', 'COMPLETO'
    current_month: { type: 'int', default: 1 },
    start_date: { type: 'date', nullable: true },
  },
  relations: {
    patient: {
      target: 'Patient',
      type: 'many-to-one',
      joinColumn: { name: 'patient_id' },
      nullable: false,
      onDelete: 'CASCADE'
    },
    admissionPhase: {
      target: 'AdmissionPhase',
      type: 'one-to-one',
      inverseSide: 'clinicalProgram',
      cascade: true
    },
    contactSessions: {
      target: 'ContactSession',
      type: 'one-to-many',
      inverseSide: 'clinicalProgram',
      cascade: true
    }
  }
});
