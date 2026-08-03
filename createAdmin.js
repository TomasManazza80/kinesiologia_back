import { AppDataSource } from './server/database.js';
import * as userService from './server/services/userService.js';

async function run() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected.");
        
        const adminData = {
            email: 'tomas.manazza8@gmail.com',
            password: '123456',
            firstName: 'Tomas',
            lastName: 'Manazza',
            role: 'ADMIN'
        };
        
        const newAdmin = await userService.createUser(adminData);
        console.log("Admin user created successfully:");
        console.log(newAdmin);
        
    } catch (err) {
        console.error("Error creating admin user:", err);
    } finally {
        await AppDataSource.destroy();
        process.exit();
    }
}

run();
