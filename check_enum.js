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
  try {
    const res = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'user_role_enum';
    `);
    console.log('user_role_enum values:', res.rows.map(r => r.enumlabel));
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
