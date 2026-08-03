import { AppDataSource } from './server/database.js';

async function createRealtorForAdmin() {
    try {
        await AppDataSource.initialize();
        const userRepository = AppDataSource.getRepository('User');
        const realtorRepository = AppDataSource.getRepository('Realtor');
        
        const email = 'tomas.manazza8@gmail.com';
        let user = await userRepository.findOneBy({ email });
        
        if (user) {
            let realtor = await realtorRepository.findOneBy({ userId: user.id });
            if (!realtor) {
                realtor = realtorRepository.create({
                    userId: user.id,
                    experience: 0,
                    licenseNumber: 'ADMIN-001',
                    specialization: 'Administrador'
                });
                await realtorRepository.save(realtor);
                console.log('Realtor profile created for Admin.');
            } else {
                console.log('Admin already has a Realtor profile.');
            }
        }
    } catch(e) {
        console.error(e);
    } finally {
        await AppDataSource.destroy();
    }
}
createRealtorForAdmin();
