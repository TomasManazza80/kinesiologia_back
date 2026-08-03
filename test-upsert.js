import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    const settings = await prisma.siteSettings.upsert({
        where: { id: 1 },
        update: {
            heroTitle: "Prueba de actualización"
        },
        create: {
            id: 1,
            heroTitle: "Prueba de actualización"
        }
    });
    console.log(settings);
}

test().finally(() => prisma.$disconnect());
