import 'reflect-metadata';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

import { AppDataSource } from './server/database.js';
import bcrypt from 'bcryptjs';

const runSeed = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Conectado a la base de datos.");

        const userRepository = AppDataSource.getRepository('User');
        const patientRepository = AppDataSource.getRepository('Patient');
        const appointmentRepository = AppDataSource.getRepository('Appointment');
        const medicalHistoryRepository = AppDataSource.getRepository('MedicalHistory');
        const transactionRepository = AppDataSource.getRepository('Transaction');

        // 1. Profesionales Ficticios
        console.log("Insertando profesionales...");
        const passwordHash = await bcrypt.hash('123456', 10);
        
        let prof1 = await userRepository.findOneBy({ email: 'dr.perez@demokinesiologia.com' });
        if (!prof1) {
            prof1 = userRepository.create({
                name: 'Dr. Roberto Pérez (Demo)',
                email: 'dr.perez@demokinesiologia.com',
                password: passwordHash,
                role: 'ADMIN', // Darles admin temporal para que se vea todo
                specialty: ['Traumatología', 'Deportología'],
                session_fee: 15000,
                is_public: true
            });
            await userRepository.save(prof1);
        }

        let prof2 = await userRepository.findOneBy({ email: 'lic.gomez@demokinesiologia.com' });
        if (!prof2) {
            prof2 = userRepository.create({
                name: 'Lic. María Gómez (Demo)',
                email: 'lic.gomez@demokinesiologia.com',
                password: passwordHash,
                role: 'ADMIN',
                specialty: ['Rehabilitación Neurológica', 'RPG'],
                session_fee: 12000,
                is_public: true
            });
            await userRepository.save(prof2);
        }
        
        console.log("Profesionales insertados.");

        // 2. Pacientes Ficticios
        console.log("Insertando pacientes...");
        const patientData = [
            { nombre: 'Juan Carlos Martínez', dni: '12345678', email: 'juan.martinez@ejemplo.com', gender: 'Masculino', blood_type: 'O+', fecha_nacimiento: '1980-05-15' },
            { nombre: 'Laura Fernández', dni: '23456789', email: 'laura.fernandez@ejemplo.com', gender: 'Femenino', blood_type: 'A+', fecha_nacimiento: '1992-08-20' },
            { nombre: 'Martín Rodríguez', dni: '34567890', email: 'martin.r@ejemplo.com', gender: 'Masculino', blood_type: 'B-', fecha_nacimiento: '1975-11-02' },
            { nombre: 'Sofía Castro', dni: '45678901', email: 'sofia.castro@ejemplo.com', gender: 'Femenino', blood_type: 'O-', fecha_nacimiento: '2001-02-10' },
            { nombre: 'Carlos Sánchez', dni: '56789012', email: 'carlos.sanchez@ejemplo.com', gender: 'Masculino', blood_type: 'AB+', fecha_nacimiento: '1965-12-25' },
            { nombre: 'Ana López', dni: '67890123', email: 'ana.lopez@ejemplo.com', gender: 'Femenino', blood_type: 'A-', fecha_nacimiento: '1988-07-07' },
            { nombre: 'Pedro González', dni: '78901234', email: 'pedro.gonzalez@ejemplo.com', gender: 'Masculino', blood_type: 'O+', fecha_nacimiento: '1995-04-30' },
            { nombre: 'Lucía Díaz', dni: '89012345', email: 'lucia.diaz@ejemplo.com', gender: 'Femenino', blood_type: 'B+', fecha_nacimiento: '1982-09-12' },
            { nombre: 'Diego Romero', dni: '90123456', email: 'diego.romero@ejemplo.com', gender: 'Masculino', blood_type: 'A+', fecha_nacimiento: '1970-03-22' },
            { nombre: 'Florencia Herrera', dni: '01234567', email: 'flor.herrera@ejemplo.com', gender: 'Femenino', blood_type: 'O+', fecha_nacimiento: '1990-01-18' }
        ];

        let savedPatients = [];
        for (const data of patientData) {
            let patient = await patientRepository.findOneBy({ dni: data.dni });
            if (!patient) {
                patient = patientRepository.create({
                    ...data,
                    datos_contacto: { telefono: `+54 9 11 ${Math.floor(10000000 + Math.random() * 90000000)}`, direccion: 'Av. Siempre Viva 123' },
                    status: 'Activo'
                });
                patient.professionals = [Math.random() > 0.5 ? prof1 : prof2];
                patient = await patientRepository.save(patient);
            }
            savedPatients.push(patient);
        }
        console.log("Pacientes insertados.");

        // 3. Turnos (Appointments)
        console.log("Insertando turnos y transacciones/historias clínicas...");
        const statuses = ['pendiente', 'confirmado', 'cancelado', 'asistio'];
        
        for (let i = 0; i < 40; i++) {
            const randomPatient = savedPatients[Math.floor(Math.random() * savedPatients.length)];
            const randomProf = Math.random() > 0.5 ? prof1 : prof2;
            
            const daysOffset = Math.floor(Math.random() * 45) - 30; 
            const appointmentDate = new Date();
            appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
            appointmentDate.setHours(9 + Math.floor(Math.random() * 9), 0, 0, 0);

            let estado = statuses[Math.floor(Math.random() * statuses.length)];
            if (daysOffset < 0 && estado === 'pendiente') {
                estado = 'confirmado'; 
            }
            if (daysOffset >= 0 && estado === 'asistio') {
                estado = 'confirmado';
            }

            const appointment = appointmentRepository.create({
                patient: randomPatient,
                professional: randomProf,
                fecha_hora: appointmentDate,
                end_time: new Date(appointmentDate.getTime() + 60 * 60 * 1000), 
                estado: estado,
                type: 'consulta',
                motivo: 'Rehabilitación o dolor general'
            });
            await appointmentRepository.save(appointment);

            if (daysOffset < 0 && estado !== 'cancelado') {
                const history = medicalHistoryRepository.create({
                    patient: randomPatient,
                    professional: randomProf,
                    fecha: appointmentDate,
                    reason_for_visit: 'Control de rutina y seguimiento de molestias',
                    diagnostico: 'Contractura muscular y dolor agudo en zona lumbar',
                    tratamiento: 'Aplicación de TENS, masoterapia descontracturante y ejercicios de elongación',
                    physical_findings: 'Tensión palpable en trapecio y zona lumbar. Rango de movimiento ligeramente limitado.'
                });
                await medicalHistoryRepository.save(history);
                
                const amount = randomProf.session_fee || 12000;
                const transaction = transactionRepository.create({
                    title: `Consulta - ${randomPatient.nombre}`,
                    subtitle: `Atendido por ${randomProf.name}`,
                    amount: amount,
                    type: 'income',
                    category: 'Consulta',
                    payment_method: ['efectivo', 'transferencia', 'debito'][Math.floor(Math.random() * 3)],
                    date: appointmentDate,
                    professional: randomProf
                });
                await transactionRepository.save(transaction);
            }
        }

        console.log("Insertando egresos/gastos ficticios...");
        for (let i = 0; i < 15; i++) {
            const randomProf = Math.random() > 0.5 ? prof1 : prof2;
            const daysOffset = Math.floor(Math.random() * 30) - 30; 
            const date = new Date();
            date.setDate(date.getDate() + daysOffset);

            const expenses = [
                { title: 'Compra de Insumos', amount: 25000, category: 'Insumos' },
                { title: 'Pago de Alquiler', amount: 150000, category: 'Servicios' },
                { title: 'Mantenimiento Equipos', amount: 40000, category: 'Mantenimiento' },
                { title: 'Publicidad Redes Sociales', amount: 15000, category: 'Marketing' },
                { title: 'Servicio de Internet', amount: 12000, category: 'Servicios' }
            ];

            const randomExpense = expenses[Math.floor(Math.random() * expenses.length)];

            const transaction = transactionRepository.create({
                title: randomExpense.title,
                subtitle: 'Gasto operativo',
                amount: randomExpense.amount,
                type: 'expense',
                category: randomExpense.category,
                payment_method: 'transferencia',
                date: date,
                professional: randomProf
            });
            await transactionRepository.save(transaction);
        }

        console.log("¡Carga de datos de demostración finalizada con éxito!");
        process.exit(0);

    } catch (error) {
        console.error("Error al poblar datos:", error);
        process.exit(1);
    }
};

runSeed();
