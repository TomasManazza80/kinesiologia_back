import { EntitySchema } from 'typeorm';

export const ContactSessionSchema = new EntitySchema({
  name: 'ContactSession',
  tableName: 'contact_session',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    contact_number: { type: 'int' }, 
    month_number: { type: 'int' }, 
    date: { type: 'date', nullable: true },
    tracking_notes: { type: 'text', nullable: true },
    patient_suggestions: { type: 'text', nullable: true },
    team_observations: { type: 'text', nullable: true },
    next_referral: { type: 'varchar', nullable: true },
  },
  relations: {
    clinicalProgram: {
      target: 'ClinicalProgram',
      type: 'many-to-one',
      joinColumn: { name: 'clinical_program_id' },
      nullable: false,
      onDelete: 'CASCADE'
    },
    professional: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'professional_id' },
      nullable: false
    },
    complementaryStudies: {
      target: 'ComplementaryStudy',
      type: 'one-to-many',
      inverseSide: 'contactSession',
      cascade: true
    }
  }
});
