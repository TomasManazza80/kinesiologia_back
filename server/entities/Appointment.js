import { EntitySchema } from 'typeorm';

export const AppointmentSchema = new EntitySchema({
  name: 'Appointment',
  tableName: 'appointment',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    fecha_hora: { type: 'timestamp' },
    end_time: { type: 'timestamp', nullable: true },
    type: { type: 'varchar', nullable: true },
    estado: { type: 'varchar', default: 'pendiente' }, // pendiente, pendiente_pago, confirmado, cancelado
    motivo: { type: 'varchar', nullable: true },
    mp_preference_id: { type: 'varchar', nullable: true },
    payment_id: { type: 'varchar', nullable: true },
  },
  relations: {
    professional: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'professional_id' },
      nullable: false
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
