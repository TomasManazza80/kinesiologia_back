import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

async function testConnection(urlStr) {
  console.log("Testing with URL:", urlStr);
  const client = new Client({
    connectionString: urlStr,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Current time from DB:", res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.error("Connection error details:", err.message);
    await client.end();
    return false;
  }
}

async function run() {
  const success1 = await testConnection(dbUrl);
  if (!success1) {
    const success2 = await testConnection(dbUrl + "?ssl=true");
    if (!success2) {
      await testConnection(dbUrl + "?sslmode=require");
    }
  }
}

run();
