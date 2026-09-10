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

  const res = await ds.query(`SELECT id, fecha_hora, end_time FROM appointment ORDER BY id DESC LIMIT 5;`);
  console.log("Last 5 appointments:");
  console.table(res);

  await ds.destroy();
}

run().catch(console.error);
