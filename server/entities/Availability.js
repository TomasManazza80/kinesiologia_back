import { EntitySchema } from 'typeorm';

export const AvailabilitySchema = new EntitySchema({
  name: 'Availability',
  tableName: 'availability',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    day_of_week: { type: 'varchar', nullable: true }, // 'Lunes', 'Martes', etc. Nullable for exceptions
    start_time: { type: 'varchar', nullable: true }, // '09:00 AM'
    end_time: { type: 'varchar', nullable: true }, // '01:00 PM'
    is_exception: { type: 'boolean', default: false },
    exception_date: { type: 'date', nullable: true },
    exception_title: { type: 'varchar', nullable: true }, // '25 Dic 2023 - Navidad'
    session_duration: { type: 'int', default: 30 }
  },
  relations: {
    professional: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'professional_id' },
      nullable: false
    }
  }
});
