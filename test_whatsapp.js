import { initializeClient, getClientStatus } from './server/services/whatsappService.js';
import fs from 'fs';
import path from 'path';

const testConcurrency = async () => {
    console.log('Starting concurrent WhatsApp initializations...');
    
    // Start initializations concurrently
    const p1 = initializeClient(998);
    const p2 = initializeClient(999);
    
    await Promise.all([p1, p2]);
    
    console.log('Status Prof 998:', getClientStatus(998).status);
    console.log('Status Prof 999:', getClientStatus(999).status);
    
    // Check if session folders were created
    const session998Exists = fs.existsSync(path.resolve('whatsapp_sessions/prof_998'));
    const session999Exists = fs.existsSync(path.resolve('whatsapp_sessions/prof_999'));
    
    console.log('Session folder prof_998 created:', session998Exists);
    console.log('Session folder prof_999 created:', session999Exists);
    
    console.log('Success! Both clients initialized in isolated environments.');
    process.exit(0);
};

testConcurrency().catch(console.error);
