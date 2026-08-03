import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config(); 

async function fixDb() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL
  });

  await client.connect();

  try {
    const tables = ['real_estate_object', 'unit', 'lease', 'expense', 'rent_payment'];
    for (const table of tables) {
      await client.query(`ALTER TABLE "${table}" ALTER COLUMN "currency" DROP DEFAULT;`).catch(e=>console.log(e.message));
      await client.query(`ALTER TABLE "${table}" ALTER COLUMN "currency" TYPE varchar(255) USING "currency"::text;`).catch(e=>console.log(e.message));
      await client.query(`ALTER TABLE "${table}" ALTER COLUMN "currency" SET DEFAULT 'USD';`).catch(e=>console.log(e.message));
    }
    
    await client.query(`ALTER TABLE "user" ALTER COLUMN "currency_code" DROP DEFAULT;`).catch(e=>console.log(e.message));
    await client.query(`ALTER TABLE "user" ALTER COLUMN "currency_code" TYPE varchar(255) USING "currency_code"::text;`).catch(e=>console.log(e.message));
    await client.query(`ALTER TABLE "user" ALTER COLUMN "currency_code" SET DEFAULT 'USD';`).catch(e=>console.log(e.message));
    
    console.log("Dropping enum types...");
    await client.query(`DROP TYPE IF EXISTS "public"."CurrencyCode";`).catch(e => console.log(e.message));
    await client.query(`DROP TYPE IF EXISTS "public"."CurrencyCode_old";`).catch(e => console.log(e.message));

    console.log("Done fixing DB.");
  } finally {
    await client.end();
  }
}

fixDb();
