import { EntitySchema } from 'typeorm';

export const RecordTemplateSchema = new EntitySchema({
  name: 'RecordTemplate',
  tableName: 'record_templates',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    name: { type: 'varchar' },
    description: { type: 'text', nullable: true },
    fields: { type: 'jsonb' },
    isActive: { name: 'is_active', type: 'boolean', default: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true }
  },
  relations: {
    professional: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'professional_id' },
      nullable: true
    }
  }
});
