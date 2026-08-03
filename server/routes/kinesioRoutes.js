import express from 'express';
import { authenticateToken } from '../controllers/authController.js';
import * as patientController from '../controllers/patientController.js';
import * as appointmentController from '../controllers/appointmentController.js';
import * as medicalHistoryController from '../controllers/medicalHistoryController.js';
import * as userController from '../controllers/userController.js';
import * as availabilityController from '../controllers/availabilityController.js';
import * as mpAuthController from '../controllers/mpAuthController.js';
import * as transactionController from '../controllers/transactionController.js';

const router = express.Router();

// Profesionales
router.get('/professionals', authenticateToken, userController.getProfessionals);
router.post('/professionals', authenticateToken, userController.adminCreateUser);
router.put('/professionals/:id', authenticateToken, userController.adminUpdateUser);

// Pacientes
router.post('/patients', authenticateToken, patientController.createPatient);
router.get('/patients', authenticateToken, patientController.getPatients);
router.get('/patients/:id', authenticateToken, patientController.getPatientById);
router.put('/patients/:id', authenticateToken, patientController.updatePatient);
router.delete('/patients/:id', authenticateToken, patientController.deletePatient);

// Turnos
router.post('/appointments', authenticateToken, appointmentController.createAppointment);
router.get('/appointments', authenticateToken, appointmentController.getAppointments);
router.get('/my-appointments', authenticateToken, appointmentController.getMyPatientAppointments);
router.put('/appointments/:id', authenticateToken, appointmentController.updateAppointment);
router.delete('/appointments/:id', authenticateToken, appointmentController.deleteAppointment);

// Historial Médico
router.post('/history', authenticateToken, medicalHistoryController.createHistoryEntry);
router.get('/history/patient/:patient_id', authenticateToken, medicalHistoryController.getHistoryByPatient);
router.put('/history/:id', authenticateToken, medicalHistoryController.updateHistoryEntry);

// Disponibilidad
router.get('/availability', authenticateToken, availabilityController.getAvailability);
router.post('/availability', authenticateToken, availabilityController.saveAvailability);

// Finanzas y Balance
router.get('/balance', authenticateToken, transactionController.getBalance);
router.post('/transactions', authenticateToken, transactionController.createTransaction);
router.put('/transactions/:id', authenticateToken, transactionController.updateTransaction);
router.get('/transactions/history', authenticateToken, transactionController.getTransactionHistory);

// MercadoPago OAuth
router.get('/mp-auth-url', authenticateToken, mpAuthController.getAuthUrl);
router.get('/mp-callback', mpAuthController.handleCallback); // This is public as it's a callback from MP

export default router;
