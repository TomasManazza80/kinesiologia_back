import { AppDataSource } from '../database.js';
import * as userService from '../services/userService.js';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import moment from 'moment-timezone';
import { Between } from 'typeorm';
import dotenv from 'dotenv';
import * as whatsappService from '../services/whatsappService.js';
dotenv.config();

export const getPublicProfessionals = async (req, res) => {
    try {
        const professionals = await userService.getProfessionals();
        const publicProfessionals = professionals
            .filter(p => p.is_public === true)
            .map(p => ({
                id: p.id,
                name: p.name,
                specialty: p.specialty,
                profile_picture: p.profile_picture,
                session_fee: p.session_fee,
                require_payment: p.require_payment,
            }));
        res.status(200).json({ data: publicProfessionals });
    } catch (error) {
        console.error("Error getting public professionals:", error);
        res.status(500).json({ message: "Error getting professionals" });
    }
};

export const getAvailableSlots = async (req, res) => {
    try {
        const { professional_id, date, service } = req.query; // date should be YYYY-MM-DD
        
        if (!professional_id || !date) {
            return res.status(400).json({ message: "professional_id and date are required" });
        }

        const profId = parseInt(professional_id);
        const requestDate = moment(date, 'YYYY-MM-DD');
        
        if (!requestDate.isValid()) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
        }

        // Determine day of week in Spanish to match Availability schema
        // moment.day() returns 0 (Sunday) to 6 (Saturday)
        const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayOfWeek = daysMap[requestDate.day()];

        const availabilityRepo = AppDataSource.getRepository('Availability');
        const appointmentRepo = AppDataSource.getRepository('Appointment');

        // Fetch regular availability for this professional on this day of week
        // Note: we should also fetch exceptions for this specific date
        const availabilities = await availabilityRepo.find({
            where: [
                { professional: { id: profId }, day_of_week: dayOfWeek, is_exception: false },
                { professional: { id: profId }, exception_date: requestDate.toDate(), is_exception: true }
            ]
        });

        // Check if there's an exception block for this date that means "Not available" 
        // If an exception exists, maybe it overrides the regular schedule.
        // For simplicity, let's assume exceptions with no start/end time mean full day off.
        const exception = availabilities.find(a => a.is_exception);
        if (exception && !exception.start_time) {
            return res.status(200).json({ data: [] }); // Not available all day
        }

        const regularSchedules = availabilities.filter(a => !a.is_exception);

        // Fetch existing appointments for this professional on this date
        const startOfDay = requestDate.startOf('day').toDate();
        const endOfDay = requestDate.endOf('day').toDate();

        const existingAppointments = await appointmentRepo.find({
            where: {
                professional: { id: profId },
                fecha_hora: Between(startOfDay, endOfDay)
                // we should probably exclude 'cancelado' state
            }
        });

        // Filter out cancelled appointments from blocking logic
        // Also filter out 'pendiente_pago' appointments older than 15 mins (auto-expired)
        const validAppointments = existingAppointments.filter(app => {
            if (app.estado === 'cancelado') return false;
            if (app.estado === 'pendiente_pago') {
                const createdAt = moment(app.createdAt);
                if (moment().diff(createdAt, 'minutes') > 15) {
                    return false;
                }
            }
            return true;
        });

        // Generate slots
        let availableSlots = [];

        for (const schedule of regularSchedules) {
            if (!schedule.start_time || !schedule.end_time) continue;
            
            const slotDurationMinutes = schedule.session_duration || 30;
            let currentSlot = moment(`${date} ${schedule.start_time}`, 'YYYY-MM-DD HH:mm');
            const endTime = moment(`${date} ${schedule.end_time}`, 'YYYY-MM-DD HH:mm');

            while (currentSlot.isBefore(endTime)) {
                const slotStart = currentSlot.toDate();
                const slotEnd = moment(currentSlot).add(slotDurationMinutes, 'minutes').toDate();
                
                // Check if this slot overlaps with any existing appointment
                const isOverlapping = validAppointments.some(app => {
                    const appStart = moment(app.fecha_hora).toDate();
                    // Assume appointment lasts 30 mins if end_time is not set
                    const appEnd = app.end_time ? moment(app.end_time).toDate() : moment(appStart).add(30, 'minutes').toDate();
                    
                    return (slotStart < appEnd && slotEnd > appStart);
                });

                if (!isOverlapping) {
                    availableSlots.push(currentSlot.format('HH:mm'));
                }

                currentSlot.add(slotDurationMinutes, 'minutes');
            }
        }

        // Sort slots and remove duplicates if any overlapping schedules exist
        availableSlots = [...new Set(availableSlots)].sort();

        res.status(200).json({ data: availableSlots });
    } catch (error) {
        console.error("Error getting available slots:", error);
        res.status(500).json({ message: "Error calculating availability", details: error.message });
    }
};

export const createPublicAppointment = async (req, res) => {
    try {
        const { professional_id, date, time, service, patient_name, patient_phone, patient_email } = req.body;
        
        if (!professional_id || !date || !time || !service || !patient_name || !patient_phone) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const profId = parseInt(professional_id);
        const fechaHora = moment(`${date} ${time}`, 'YYYY-MM-DD HH:mm').toDate();
        
        const patientRepo = AppDataSource.getRepository('Patient');
        const appointmentRepo = AppDataSource.getRepository('Appointment');
        const availabilityRepo = AppDataSource.getRepository('Availability');
        const userRepo = AppDataSource.getRepository('User');

        const prof = await userRepo.findOne({ where: { id: profId } });
        if (!prof) {
            return res.status(404).json({ message: "Professional not found" });
        }

        // Determinar duración de la sesión según disponibilidad
        const requestDate = moment(date, 'YYYY-MM-DD');
        const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayOfWeek = daysMap[requestDate.day()];
        
        const availabilities = await availabilityRepo.find({
            where: { professional: { id: profId }, day_of_week: dayOfWeek, is_exception: false }
        });

        let duration = 30; // Default fallback
        for (const a of availabilities) {
            if (time >= a.start_time && time < a.end_time) {
                duration = a.session_duration || 30;
                break;
            }
        }
        const endTime = moment(fechaHora).add(duration, 'minutes').toDate();

        // Check if patient exists by phone and name for this professional
        let patient = await patientRepo.findOne({
            where: {
                nombre: patient_name,
                professionals: { id: profId }
            }
        });

        if (!patient) {
            patient = patientRepo.create({
                nombre: patient_name,
                email: patient_email,
                datos_contacto: { telefono: patient_phone, email: patient_email },
                professionals: [{ id: profId }],
                status: 'activo'
            });
            patient = await patientRepo.save(patient);
        }

        if (prof.require_payment && prof.session_fee > 0 && !prof.mp_access_token) {
            return res.status(400).json({ message: "El profesional requiere pago pero no tiene configurado su token de MercadoPago. No se puede reservar." });
        }

        // Double check if slot is still free to prevent double booking
        const overlapping = await appointmentRepo.find({
            where: {
                professional: { id: profId },
                fecha_hora: Between(
                    moment(fechaHora).subtract(1, 'minutes').toDate(), 
                    moment(endTime).subtract(1, 'minutes').toDate()
                )
            }
        });

        const validOverlapping = overlapping.filter(app => {
            if (app.estado === 'cancelado') return false;
            if (app.estado === 'pendiente_pago') {
                const createdAt = moment(app.createdAt);
                if (moment().diff(createdAt, 'minutes') > 15) {
                    return false;
                }
            }
            return true;
        });
        if (validOverlapping.length > 0) {
            return res.status(409).json({ message: "El turno ya no se encuentra disponible." });
        }

        const newAppointment = appointmentRepo.create({
            patient: { id: patient.id },
            professional: { id: profId },
            fecha_hora: fechaHora,
            end_time: endTime,
            motivo: service,
            estado: (prof.require_payment && prof.session_fee > 0 && prof.mp_access_token) ? 'pendiente_pago' : 'pendiente'
        });

        await appointmentRepo.save(newAppointment);

        // --- WHATSAPP INTEGRATION ---
        if (patient_phone) {
            if (prof?.whatsapp_connected && prof?.whatsapp_message_template) {
                let msg = prof.whatsapp_message_template;
                msg = msg.replace(/{{patient_name}}/g, patient.nombre || '');
                const dateObj = moment(fechaHora);
                dateObj.locale('es');
                msg = msg.replace(/{{date}}/g, dateObj.format('DD [de] MMMM'));
                msg = msg.replace(/{{time}}/g, dateObj.format('HH:mm'));
                msg = msg.replace(/{{service}}/g, service || 'Turno');
                msg = msg.replace(/{{professional_name}}/g, prof.name || '');

                whatsappService.sendMessage(prof.id, patient_phone, msg);
            }
        }
        // ----------------------------

        // MercadoPago Integration
        if (prof.require_payment && prof.session_fee > 0 && prof.mp_access_token) {
            try {
                const client = new MercadoPagoConfig({ accessToken: prof.mp_access_token });
                const preference = new Preference(client);

                const backendUrl = process.env.PUBLIC_BACKEND_URL || 'https://tu-ngrok-url.ngrok-free.app';
                const frontendUrl = process.env.VITE_PUBLIC_URL || 'http://localhost:5173';

                const prefData = await preference.create({
                    body: {
                        items: [
                            {
                                id: newAppointment.id.toString(),
                                title: `Turno con ${prof.name} - ${service}`,
                                quantity: 1,
                                unit_price: Number(prof.session_fee),
                                currency_id: 'ARS'
                            }
                        ],
                        back_urls: {
                            success: `${frontendUrl}/reservar?success=true`,
                            failure: `${frontendUrl}/reservar?success=false`,
                            pending: `${frontendUrl}/reservar?success=pending`
                        },
                        auto_return: 'approved',
                        notification_url: `${backendUrl}/api/public/webhook/mercadopago?prof_id=${prof.id}`,
                        external_reference: newAppointment.id.toString(),
                    }
                });

                newAppointment.mp_preference_id = prefData.id;
                await appointmentRepo.save(newAppointment);

                return res.status(201).json({ 
                    message: "Turno reservado, pendiente de pago", 
                    data: newAppointment, 
                    init_point: prefData.init_point 
                });
            } catch (mpError) {
                console.error("MercadoPago Error:", mpError);
                // Si falla MP, dejamos el turno como pendiente sin pago, o lo cancelamos.
                // En este caso lo dejamos como pendiente para que puedan arreglarlo en persona.
                newAppointment.estado = 'pendiente';
                await appointmentRepo.save(newAppointment);
                return res.status(201).json({ message: "Turno reservado (Hubo un error con el pago online)", data: newAppointment });
            }
        }

        res.status(201).json({ message: "Turno reservado exitosamente", data: newAppointment });
    } catch (error) {
        console.error("Error creating public appointment:", error);
        res.status(500).json({ message: "Error al crear turno", details: error.message });
    }
};

export const handleMercadoPagoWebhook = async (req, res) => {
    // Acknowledge receipt quickly to prevent MP retries
    res.status(200).send('OK');

    try {
        const { query, body } = req;
        const topic = query.topic || body.topic || body.type;
        const profId = query.prof_id;
        
        let paymentId;
        if (topic === 'payment') {
            paymentId = query.id || body.data?.id;
        }

        if (paymentId && profId) {
            const userRepo = AppDataSource.getRepository('User');
            const appointmentRepo = AppDataSource.getRepository('Appointment');
            
            const prof = await userRepo.findOne({ where: { id: parseInt(profId) } });
            if (!prof || !prof.mp_access_token) return;

            const client = new MercadoPagoConfig({ accessToken: prof.mp_access_token });
            const paymentClient = new Payment(client);
            
            const paymentInfo = await paymentClient.get({ id: paymentId });
            
            if (paymentInfo && paymentInfo.external_reference) {
                const appointmentId = parseInt(paymentInfo.external_reference);
                const appointment = await appointmentRepo.findOne({ where: { id: appointmentId } });
                
                if (appointment) {
                    if (paymentInfo.status === 'approved') {
                        if (appointment.estado !== 'confirmado') {
                            appointment.estado = 'confirmado';
                            appointment.payment_id = paymentId.toString();
                            await appointmentRepo.save(appointment);

                            // Create an automatic transaction
                            const transactionRepo = AppDataSource.getRepository('Transaction');
                            const newTransaction = transactionRepo.create({
                                title: `Reserva - ${appointment.motivo || 'Turno'}`,
                                subtitle: appointment.patient ? appointment.patient.nombre : 'Pago Online',
                                amount: Number(paymentInfo.transaction_amount) || Number(prof.session_fee),
                                type: 'income',
                                category: 'MP_PAYMENT',
                                professional: { id: prof.id }
                            });
                            await transactionRepo.save(newTransaction);
                        }
                    } else if (paymentInfo.status === 'rejected' || paymentInfo.status === 'cancelled') {
                        // Optional: free up the slot if payment fails completely
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error in webhook:", error);
    }
};
