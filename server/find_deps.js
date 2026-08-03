import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config(); 

async function findDeps() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT
          t.typname AS enum_type,
          c.relname AS table_name,
          a.attname AS column_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_depend d ON d.refobjid = t.oid
      JOIN pg_class c ON c.oid = d.objid
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.objsubid
      WHERE t.typname = 'CurrencyCode'
      GROUP BY t.typname, c.relname, a.attname;
    `);
    console.log(res.rows);
  } finally {
    await client.end();
  }
}
findDeps();
