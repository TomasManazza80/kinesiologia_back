import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  const client = await pool.connect();
  try {
    const queries = [
      `ALTER TABLE IF EXISTS "user" ALTER COLUMN currency_code DROP DEFAULT`,
      `ALTER TABLE IF EXISTS real_estate_object ALTER COLUMN currency DROP DEFAULT`,
      `ALTER TABLE IF EXISTS unit ALTER COLUMN currency DROP DEFAULT`,
      `ALTER TABLE IF EXISTS lease ALTER COLUMN currency DROP DEFAULT`,
      `ALTER TABLE IF EXISTS expense ALTER COLUMN currency DROP DEFAULT`,
      `ALTER TABLE IF EXISTS rent_payment ALTER COLUMN currency DROP DEFAULT`,
      
      `ALTER TABLE IF EXISTS "user" ALTER COLUMN currency_code TYPE character varying USING currency_code::text`,
      `ALTER TABLE IF EXISTS real_estate_object ALTER COLUMN currency TYPE character varying USING currency::text`,
      `ALTER TABLE IF EXISTS unit ALTER COLUMN currency TYPE character varying USING currency::text`,
      `ALTER TABLE IF EXISTS lease ALTER COLUMN currency TYPE character varying USING currency::text`,
      `ALTER TABLE IF EXISTS expense ALTER COLUMN currency TYPE character varying USING currency::text`,
      `ALTER TABLE IF EXISTS rent_payment ALTER COLUMN currency TYPE character varying USING currency::text`,
      
      `DROP TYPE IF EXISTS "CurrencyCode"`
    ];

    for (let q of queries) {
      await client.query(q).catch(e => console.log('Query failed (maybe table does not exist):', q, e.message));
    }
    console.log("Database fixed!");
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}
fix();
