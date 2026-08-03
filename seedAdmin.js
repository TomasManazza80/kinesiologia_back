import prisma from './server/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'admin@admin.com';
  const password = 'password123'; // Secure default, change later

  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    console.log('El usuario administrador ya existe (admin@admin.com).');
    return;
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      salt,
      firstName: 'Admin',
      lastName: 'Principal',
      name: 'Admin Principal',
      role: 'ADMIN',
    },
  });

  console.log('✅ Usuario Administrador creado con éxito!');
  console.log('📧 Email: admin@admin.com');
  console.log('🔑 Contraseña: password123');
}

main()
  .catch(e => {
      console.error('Error creando el admin:', e);
      process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
