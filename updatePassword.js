import { AppDataSource } from './server/database.js';
import bcrypt from 'bcryptjs';

async function run() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected.");
        
        const userRepo = AppDataSource.getRepository('User');
        const user = await userRepo.findOne({ where: { email: 'tomas.manazza8@gmail.com' } });
        
        if (user) {
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash('155332332Tomas', salt);
            
            user.password = hashedPassword;
            user.salt = salt;
            user.role = 'ADMIN';
            
            await userRepo.save(user);
            console.log("Password updated successfully.");
        } else {
            console.log("User not found.");
        }
    } catch (err) {
        console.error("Error updating password:", err);
    } finally {
        await AppDataSource.destroy();
        process.exit();
    }
}

run();
