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

        // 1. Encontrar o crear al usuario tomas.manazza8@gmail.com
        let tomas = await userRepository.findOneBy({ email: 'tomas.manazza8@gmail.com' });
        
        if (!tomas) {
            console.log("Usuario tomas.manazza8@gmail.com no encontrado. Creándolo...");
            const passwordHash = await bcrypt.hash('123456', 10);
            tomas = userRepository.create({
                name: 'Tomás Manazza',
                email: 'tomas.manazza8@gmail.com',
                password: passwordHash,
                role: 'ADMIN',
                specialty: ['Kinesiología General'],
                session_fee: 15000,
                is_public: true
            });
            await userRepository.save(tomas);
        } else {
            console.log("Usuario encontrado. Actualizando a rol ADMIN...");
            tomas.role = 'ADMIN';
            // ensure session_fee is set
            tomas.session_fee = tomas.session_fee || 15000;
            await userRepository.save(tomas);
        }

        // 2. Pacientes Ficticios para Tomás
        console.log("Insertando pacientes para Tomás...");
        const patientData = [
            { nombre: 'Ezequiel Gómez', dni: '11223344', email: 'ezequiel@ejemplo.com', gender: 'Masculino', blood_type: 'O+', fecha_nacimiento: '1985-05-15' },
            { nombre: 'Camila Rossi', dni: '22334455', email: 'camila@ejemplo.com', gender: 'Femenino', blood_type: 'A+', fecha_nacimiento: '1990-08-20' },
            { nombre: 'Julián Álvarez', dni: '33445566', email: 'julian@ejemplo.com', gender: 'Masculino', blood_type: 'B-', fecha_nacimiento: '1979-11-02' },
            { nombre: 'Valentina Silva', dni: '44556677', email: 'valentina@ejemplo.com', gender: 'Femenino', blood_type: 'O-', fecha_nacimiento: '2000-02-10' },
            { nombre: 'Mariano Perea', dni: '55667788', email: 'mariano@ejemplo.com', gender: 'Masculino', blood_type: 'AB+', fecha_nacimiento: '1968-12-25' }
        ];

        let savedPatients = [];
        for (const data of patientData) {
            let patient = await patientRepository.findOneBy({ dni: data.dni });
            if (!patient) {
                patient = patientRepository.create({
                    ...data,
                    datos_contacto: { telefono: `+54 9 11 ${Math.floor(10000000 + Math.random() * 90000000)}`, direccion: 'Av. Siempre Viva 456' },
                    status: 'Activo'
                });
                patient.professionals = [tomas]; // Relacionar a Tomás
                patient = await patientRepository.save(patient);
            } else {
                // Ensure Tomas is in the professionals list
                const patientWithRels = await patientRepository.findOne({ where: { id: patient.id }, relations: ['professionals'] });
                if (!patientWithRels.professionals.some(p => p.id === tomas.id)) {
                    patientWithRels.professionals.push(tomas);
                    patient = await patientRepository.save(patientWithRels);
                }
            }
            savedPatients.push(patient);
        }
        console.log("Pacientes insertados y/o asignados a Tomás.");

        // 3. Turnos (Appointments)
        console.log("Insertando turnos y transacciones/historias clínicas para Tomás...");
        const statuses = ['pendiente', 'confirmado', 'cancelado', 'asistio'];
        
        for (let i = 0; i < 20; i++) {
            const randomPatient = savedPatients[Math.floor(Math.random() * savedPatients.length)];
            
            // Random date between -30 days and +15 days
            const daysOffset = Math.floor(Math.random() * 45) - 30; 
            const appointmentDate = new Date();
            appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
            appointmentDate.setHours(9 + Math.floor(Math.random() * 9), 0, 0, 0); // Entre las 9 y las 18

            let estado = statuses[Math.floor(Math.random() * statuses.length)];
            // Si es en el pasado y no está cancelado, ponerlo como asistió o confirmado
            if (daysOffset < 0 && estado === 'pendiente') {
                estado = 'confirmado'; 
            }
            // Si es en el futuro, no puede haber asistido
            if (daysOffset >= 0 && estado === 'asistio') {
                estado = 'confirmado';
            }

            const appointment = appointmentRepository.create({
                patient: randomPatient,
                professional: tomas,
                fecha_hora: appointmentDate,
                end_time: new Date(appointmentDate.getTime() + 60 * 60 * 1000), // 1 hora de duración
                estado: estado,
                type: 'consulta',
                motivo: 'Evaluación general'
            });
            await appointmentRepository.save(appointment);

            // 4. Historias Clínicas (solo si es pasado y no cancelado)
            if (daysOffset < 0 && estado !== 'cancelado') {
                const history = medicalHistoryRepository.create({
                    patient: randomPatient,
                    professional: tomas,
                    fecha: appointmentDate,
                    reason_for_visit: 'Control y ejercicios de fuerza',
                    diagnostico: 'Tendinitis rotuliana',
                    tratamiento: 'Ejercicios isométricos y terapia manual',
                    physical_findings: 'Inflamación leve en la zona rotuliana. Dolor a la palpación.'
                });
                await medicalHistoryRepository.save(history);
                
                // 5. Transacciones (Ingresos de turnos pasados)
                const amount = tomas.session_fee || 15000;
                const transaction = transactionRepository.create({
                    title: `Consulta - ${randomPatient.nombre}`,
                    subtitle: `Atendido por ${tomas.name}`,
                    amount: amount,
                    type: 'income',
                    category: 'Consulta',
                    payment_method: ['efectivo', 'transferencia', 'debito'][Math.floor(Math.random() * 3)],
                    date: appointmentDate,
                    professional: tomas
                });
                await transactionRepository.save(transaction);
            }
        }

        // Transacciones Independientes (Egresos y otros) específicos de Tomás
        console.log("Insertando egresos/gastos ficticios para Tomás...");
        for (let i = 0; i < 8; i++) {
            const daysOffset = Math.floor(Math.random() * 30) - 30; // Gastos de los últimos 30 días
            const date = new Date();
            date.setDate(date.getDate() + daysOffset);

            const expenses = [
                { title: 'Compra de Insumos (Cintas, Crema)', amount: 35000, category: 'Insumos' },
                { title: 'Pago de Alquiler Consultorio', amount: 150000, category: 'Servicios' },
                { title: 'Suscripción Software', amount: 10000, category: 'Suscripciones' }
            ];

            const randomExpense = expenses[Math.floor(Math.random() * expenses.length)];

            const transaction = transactionRepository.create({
                title: randomExpense.title,
                subtitle: 'Gasto operativo de Tomás',
                amount: randomExpense.amount,
                type: 'expense',
                category: randomExpense.category,
                payment_method: 'transferencia',
                date: date,
                professional: tomas
            });
            await transactionRepository.save(transaction);
        }

        console.log("¡Carga de datos para Tomás finalizada con éxito!");
        process.exit(0);

    } catch (error) {
        console.error("Error al poblar datos:", error);
        process.exit(1);
    }
};

runSeed();
