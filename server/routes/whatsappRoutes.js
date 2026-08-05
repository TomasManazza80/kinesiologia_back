import express from 'express';
import { getStatus, startConnection, getQR, disconnect, saveTemplate } from '../controllers/whatsappController.js';
import { authenticateToken } from '../controllers/authController.js';

const router = express.Router();

router.get('/status', authenticateToken, getStatus);
router.post('/start', authenticateToken, startConnection);
router.get('/qr', authenticateToken, getQR);
router.post('/disconnect', authenticateToken, disconnect);
router.put('/template', authenticateToken, saveTemplate);

export default router;
