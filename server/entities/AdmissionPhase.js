import { EntitySchema } from 'typeorm';

export const AdmissionPhaseSchema = new EntitySchema({
  name: 'AdmissionPhase',
  tableName: 'admission_phase',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    birth_place: { type: 'varchar', nullable: true },
    residence: { type: 'varchar', nullable: true },
    occupation: { type: 'varchar', nullable: true },
    other_activities: { type: 'jsonb', nullable: true },
    parents_status: { type: 'jsonb', nullable: true },
    siblings_status: { type: 'jsonb', nullable: true },
    children_count: { type: 'int', nullable: true, default: 0 },
    acquisition_channel: { type: 'varchar', nullable: true },
    medical_history_notes: { type: 'text', nullable: true }, 
    psychological_therapy: { type: 'text', nullable: true },
    psychiatric_medication: { type: 'text', nullable: true },
    alternative_therapies: { type: 'text', nullable: true },
    current_medication: { type: 'text', nullable: true },
    consultation_reasons: { type: 'jsonb', nullable: true }, 
    physical_exam: { type: 'text', nullable: true },
    main_discomfort: { type: 'text', nullable: true },
    step_by_step_plan: { type: 'text', nullable: true },
    next_referral: { type: 'varchar', nullable: true },
  },
  relations: {
    clinicalProgram: {
      target: 'ClinicalProgram',
      type: 'one-to-one',
      joinColumn: { name: 'clinical_program_id' },
      nullable: false,
      onDelete: 'CASCADE'
    },
    complementaryStudies: {
      target: 'ComplementaryStudy',
      type: 'one-to-many',
      inverseSide: 'admissionPhase',
      cascade: true
    }
  }
});
