import { AppDataSource } from './server/database.js';
import bcrypt from 'bcryptjs';

async function createAdmin() {
    try {
        await AppDataSource.initialize();
        const userRepository = AppDataSource.getRepository('User');
        const email = 'tomas.manazza8@gmail.com';
        const password = '123456Tomas';

        let user = await userRepository.findOneBy({ email });
        if (!user) {
            user = {};
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.email = email;
        user.password = hashedPassword;
        user.salt = salt;
        user.role = 'ADMIN';
        user.firstName = 'Tomas';
        user.lastName = 'Manazza';

        await userRepository.save(user);
        console.log('Admin user created/updated successfully!');
    } catch(e) {
        console.error(e);
    } finally {
        await AppDataSource.destroy();
    }
}
createAdmin();
