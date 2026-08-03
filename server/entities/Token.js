import { EntitySchema } from 'typeorm';
import * as enums from './enums.js';

export const TokenSchema = new EntitySchema({
  name: 'Token',
  tableName: 'token',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    type: { type: 'varchar', nullable: true },
    emailToken: { name: 'email_token', type: 'varchar', unique: true, nullable: true },
    valid: { type: 'boolean', default: true },
    expiration: { type: 'timestamp' },
    userId: { name: 'userId', type: 'int' },
  },
  relations: {
    user: { target: 'User', type: 'many-to-one', joinColumn: { name: 'userId' }, inverseSide: 'tokens' },
  }
});
