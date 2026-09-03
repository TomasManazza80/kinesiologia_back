import { EntitySchema } from 'typeorm';

export const ComplementaryStudySchema = new EntitySchema({
  name: 'ComplementaryStudy',
  tableName: 'complementary_study',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    date: { type: 'date', nullable: true },
    study_type: { type: 'varchar' },
    result: { type: 'text', nullable: true },
    file_url: { type: 'varchar', nullable: true },
    status: { type: 'varchar', default: 'APORTADO' } // 'APORTADO', 'SOLICITADO'
  },
  relations: {
    admissionPhase: {
      target: 'AdmissionPhase',
      type: 'many-to-one',
      joinColumn: { name: 'admission_phase_id' },
      nullable: true,
      onDelete: 'CASCADE'
    },
    contactSession: {
      target: 'ContactSession',
      type: 'many-to-one',
      joinColumn: { name: 'contact_session_id' },
      nullable: true,
      onDelete: 'CASCADE'
    }
  }
});
