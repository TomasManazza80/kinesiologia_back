import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres:password@localhost:5432/kinesiologia'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT id, email, role FROM "user"');
  console.log('All Users:', res.rows);
  await client.end();
}
run();
