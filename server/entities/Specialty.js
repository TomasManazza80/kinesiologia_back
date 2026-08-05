import { EntitySchema } from 'typeorm';

export const SpecialtySchema = new EntitySchema({
  name: 'Specialty',
  tableName: 'specialties',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    name: { type: 'varchar', unique: true, nullable: false }
  }
});
