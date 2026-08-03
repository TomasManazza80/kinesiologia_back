import { EntitySchema } from 'typeorm';

export const TaskSchema = new EntitySchema({
  name: 'Task',
  tableName: 'task',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    title: { type: 'varchar' },
    due_date: { type: 'varchar', nullable: true }, // 'Tomorrow', 'Friday', 'Today'
    due_time: { type: 'varchar', nullable: true }, // '2:00 PM'
    is_high_priority: { type: 'boolean', default: false },
    status: { type: 'varchar', default: 'pending' } // 'pending' or 'completed'
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
