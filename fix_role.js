import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function run() {
  await client.connect();
  console.log('Connected to fix enum issues.');
  try {
    // 1. Change role column to text temporarily to avoid enum constraints
    await client.query('ALTER TABLE "user" ALTER COLUMN "role" TYPE VARCHAR(255) USING role::text;');
    console.log('Changed role column to VARCHAR.');

    // 2. Update the existing values to match new UPPERCASE enum
    let res = await client.query("UPDATE \"user\" SET role = 'ADMIN' WHERE role = 'admin';");
    console.log(`Updated ${res.rowCount} rows to ADMIN.`);
    
    res = await client.query("UPDATE \"user\" SET role = 'TENANT' WHERE role = 'inquilino';");
    console.log(`Updated ${res.rowCount} rows to TENANT.`);

    res = await client.query("UPDATE \"user\" SET role = 'REALTOR' WHERE role = 'realtor';");
    console.log(`Updated ${res.rowCount} rows to REALTOR.`);

    // 3. Drop the old enum types to let TypeORM recreate them
    await client.query('DROP TYPE IF EXISTS user_role_enum CASCADE;');
    console.log('Dropped old user_role_enum.');

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
