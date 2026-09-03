import { AppDataSource } from './server/database.js';
import * as appointmentController from './server/controllers/appointmentController.js';

async function test() {
    await AppDataSource.initialize();
    console.log("DB initialized");
    
    // Find an appointment to test
    const appointmentRepo = AppDataSource.getRepository('Appointment');
    const appointment = await appointmentRepo.findOne({
      relations: ['patient', 'professional'],
      order: { id: 'DESC' }
    });
    
    if (!appointment) {
        console.log("No appointments found");
        process.exit(1);
    }
    
    console.log("Testing with appointment id:", appointment.id);
    
    // Mock req, res
    const req = { params: { id: appointment.id } };
    const res = {
        status: (code) => ({
            json: (data) => console.log(`Response ${code}:`, data)
        }),
        json: (data) => console.log('Response 200:', data)
    };
    
    await appointmentController.notifyAppointment(req, res);
    process.exit(0);
}

test().catch(console.error);
