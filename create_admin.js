import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres:password@localhost:5432/kinesiologia'
});

async function run() {
  await client.connect();
  const hashedPassword = await bcrypt.hash('155332332Tomas', 10);
  
  try {
    await client.query(
      'INSERT INTO "user" (id, email, password, role, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
      ['11111111-1111-1111-1111-111111111111', 'tomas.manazza8@gmail.com', hashedPassword, 'ADMIN', 'Tomas Manazza']
    );
    console.log('User created successfully');
  } catch (error) {
    console.error('Error creating user:', error);
  }
  
  await client.end();
}
run();
