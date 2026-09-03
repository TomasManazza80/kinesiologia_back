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
import { GroupTransactionSchema } from './entities/GroupTransaction.js';
import { TaskSchema } from './entities/Task.js';
import { AvailabilitySchema } from './entities/Availability.js';
import { SpecialtySchema } from './entities/Specialty.js';
import { RecordTemplateSchema } from './entities/RecordTemplate.js';
import { MedicalRecordSchema } from './entities/MedicalRecord.js';
import { ClinicalProgramSchema } from './entities/ClinicalProgram.js';
import { AdmissionPhaseSchema } from './entities/AdmissionPhase.js';
import { ContactSessionSchema } from './entities/ContactSession.js';
import { ComplementaryStudySchema } from './entities/ComplementaryStudy.js';


export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false,
  synchronize: true, 
  logging: false,
  entities: [
    UserSchema,
    TokenSchema,
    PatientSchema,
    AppointmentSchema,
    MedicalHistorySchema,
    TransactionSchema,
    GroupTransactionSchema,
    TaskSchema,
    AvailabilitySchema,
    SpecialtySchema,
    RecordTemplateSchema,
    MedicalRecordSchema,
    ClinicalProgramSchema,
    AdmissionPhaseSchema,
    ContactSessionSchema,
    ComplementaryStudySchema
  ],
  subscribers: [],
  migrations: [],
});
