import { EntitySchema } from 'typeorm';
import * as enums from './enums.js';

export const UserSchema = new EntitySchema({
  name: 'User',
  tableName: 'user',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    email: { type: 'varchar', unique: true, nullable: true },
    name: { type: 'varchar', nullable: true },
    password: { type: 'varchar', nullable: true },
    role: { type: 'enum', enum: enums.UserRole, default: 'USER', nullable: true },
    specialty: { type: 'varchar', nullable: true }, // Added for Kinesiologist
    session_fee: { type: 'numeric', nullable: true, default: 0 },
    require_payment: { type: 'boolean', default: false, nullable: true },
    mp_access_token: { type: 'varchar', nullable: true },
    mp_refresh_token: { type: 'varchar', nullable: true },
    mp_user_id: { type: 'varchar', nullable: true },
    profile_picture: { type: 'varchar', nullable: true },
    is_public: { type: 'boolean', default: false, nullable: true },
  },
  relations: {
    patients: { target: 'Patient', type: 'one-to-many', inverseSide: 'professional' },
    appointments: { target: 'Appointment', type: 'one-to-many', inverseSide: 'professional' },
    medicalHistories: { target: 'MedicalHistory', type: 'one-to-many', inverseSide: 'professional' }
  }
});
