import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
dotenv.config();

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await ds.initialize();
  
  console.log("Altering column fecha_hora...");
  await ds.query(`ALTER TABLE "appointment" ALTER COLUMN "fecha_hora" TYPE timestamptz USING "fecha_hora" AT TIME ZONE 'America/Argentina/Buenos_Aires';`);
  
  console.log("Altering column end_time...");
  await ds.query(`ALTER TABLE "appointment" ALTER COLUMN "end_time" TYPE timestamptz USING "end_time" AT TIME ZONE 'America/Argentina/Buenos_Aires';`);
  
  console.log("Done.");
  await ds.destroy();
}

run().catch(console.error);
