import { EntitySchema } from 'typeorm';

export const PatientSchema = new EntitySchema({
  name: 'Patient',
  tableName: 'patient',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    nombre: { type: 'varchar' },
    dni: { type: 'varchar', nullable: true },
    email: { type: 'varchar', nullable: true },
    datos_contacto: { type: 'jsonb', nullable: true },
    fecha_nacimiento: { type: 'date', nullable: true },
    blood_type: { type: 'varchar', nullable: true },
    gender: { type: 'varchar', nullable: true },
    status: { type: 'varchar', nullable: true }
  },
  relations: {
    professionals: {
      target: 'User',
      type: 'many-to-many',
      inverseSide: 'patients',
      joinTable: {
        name: 'patient_professionals',
        joinColumn: { name: 'patient_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'professional_id', referencedColumnName: 'id' }
      }
    },
    appointments: { target: 'Appointment', type: 'one-to-many', inverseSide: 'patient' },
    medicalHistories: { target: 'MedicalHistory', type: 'one-to-many', inverseSide: 'patient' }
  }
});
