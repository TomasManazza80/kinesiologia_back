import { DataSource } from 'typeorm';
import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { UserSchema } from './entities/User.js';
import { TokenSchema } from './entities/Token.js';
import { PatientSchema } from './entities/Patient.js';
import { AppointmentSchema } from './entities/Appointment.js';
import { MedicalHistorySchema } from './entities/MedicalHistory.js';
import { TransactionSchema } from './entities/Transaction.js';
import { TaskSchema } from './entities/Task.js';
import { AvailabilitySchema } from './entities/Availability.js';
import { SpecialtySchema } from './entities/Specialty.js';
import { RecordTemplateSchema } from './entities/RecordTemplate.js';
import { MedicalRecordSchema } from './entities/MedicalRecord.js';


export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  synchronize: true, 
  logging: false,
  entities: [
    UserSchema,
    TokenSchema,
    PatientSchema,
    AppointmentSchema,
    MedicalHistorySchema,
    TransactionSchema,
    TaskSchema,
    AvailabilitySchema,
    SpecialtySchema,
    RecordTemplateSchema,
    MedicalRecordSchema
  ],
  subscribers: [],
  migrations: [],
});
