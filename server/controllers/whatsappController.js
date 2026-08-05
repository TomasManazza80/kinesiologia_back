import * as whatsappService from '../services/whatsappService.js';
import { AppDataSource } from '../database.js';

const getTargetProfId = (req) => {
    if (['ADMIN', 'EMPLOYEE'].includes(req.user.role) && req.query.prof_id) {
        return parseInt(req.query.prof_id);
    }
    if (['ADMIN', 'EMPLOYEE'].includes(req.user.role) && req.body.prof_id) {
        return parseInt(req.body.prof_id);
    }
    return req.user.userId;
};

export const getStatus = async (req, res) => {
    try {
        const profId = getTargetProfId(req);
        const statusData = whatsappService.getClientStatus(profId);
        
        // Let's also return their saved template
        const userRepo = AppDataSource.getRepository('User');
        const user = await userRepo.findOne({ where: { id: profId }});
        
        res.json({
            status: statusData.status,
            template: user?.whatsapp_message_template || '',
            profId: profId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting status" });
    }
};

export const startConnection = async (req, res) => {
    try {
        const profId = getTargetProfId(req);
        const result = await whatsappService.initializeClient(profId);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error starting WhatsApp client" });
    }
};

export const getQR = async (req, res) => {
    try {
        const profId = getTargetProfId(req);
        const qrImage = await whatsappService.getQRImage(profId);
        if (!qrImage) {
            return res.status(404).json({ message: "QR not ready or already connected" });
        }
        res.json({ qr: qrImage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error getting QR" });
    }
};

export const disconnect = async (req, res) => {
    try {
        const profId = getTargetProfId(req);
        await whatsappService.disconnectClient(profId);
        res.json({ message: "Disconnected" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error disconnecting" });
    }
};

export const saveTemplate = async (req, res) => {
    try {
        const profId = getTargetProfId(req);
        const { template } = req.body;
        
        const userRepo = AppDataSource.getRepository('User');
        await userRepo.update(profId, { whatsapp_message_template: template });
        
        res.json({ message: "Template saved successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error saving template" });
    }
};
