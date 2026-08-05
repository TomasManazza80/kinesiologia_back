import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import { AppDataSource } from '../database.js';
import { io } from '../server.js';
import fs from 'fs';
import path from 'path';

const clients = new Map();

export const initializeClient = async (profId) => {
    if (clients.has(profId)) {
        return { status: clients.get(profId).status };
    }

    try {
        const sessionPath = path.resolve(`whatsapp_sessions/prof_${profId}`);
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: ['Kinesio App', 'Chrome', '1.0.0']
        });

        clients.set(profId, { instance: sock, status: 'initializing', qr: null });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            const clientData = clients.get(profId);
            if (!clientData) return;

            if (qr) {
                console.log(`[WhatsApp] QR generated for Prof ${profId}`);
                clientData.qr = qr;
                clientData.status = 'qr_ready';
                io.emit(`qr-${profId}`, qr);
                io.emit(`status-${profId}`, 'qr_ready');
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`[WhatsApp] Prof ${profId} connection closed. Reconnect: ${shouldReconnect}`);
                
                if (shouldReconnect) {
                    // Try to reconnect
                    clients.delete(profId);
                    setTimeout(() => initializeClient(profId), 5000);
                } else {
                    // Logged out
                    clients.delete(profId);
                    io.emit(`status-${profId}`, 'disconnected');
                    
                    const userRepo = AppDataSource.getRepository('User');
                    await userRepo.update(profId, { whatsapp_connected: false });
                    
                    // Clean up folder
                    if (fs.existsSync(sessionPath)) {
                        fs.rmSync(sessionPath, { recursive: true, force: true });
                    }
                }
            } else if (connection === 'open') {
                console.log(`[WhatsApp] Prof ${profId} is READY!`);
                clientData.status = 'connected';
                clientData.qr = null;
                
                io.emit(`status-${profId}`, 'connected');
                
                const userRepo = AppDataSource.getRepository('User');
                await userRepo.update(profId, { whatsapp_connected: true });
            }
        });

        return { status: 'initializing' };
    } catch (error) {
        console.error(`[WhatsApp] Error initializing Prof ${profId}:`, error);
        throw error;
    }
};

export const getClientStatus = (profId) => {
    const clientData = clients.get(profId);
    if (!clientData) return { status: 'disconnected' };
    return { status: clientData.status, qr: clientData.qr };
};

export const getQRImage = async (profId) => {
    const clientData = clients.get(profId);
    if (!clientData || !clientData.qr) return null;
    return clientData.qr; // We now return the raw QR string, frontend will render it
};

export const disconnectClient = async (profId) => {
    const clientData = clients.get(profId);
    if (clientData && clientData.instance) {
        try {
            clientData.instance.logout();
        } catch (e) {
            console.log('Error destroying client:', e);
        }
    }
    clients.delete(profId);
    io.emit(`status-${profId}`, 'disconnected');
    
    const userRepo = AppDataSource.getRepository('User');
    await userRepo.update(profId, { whatsapp_connected: false });
    
    const sessionPath = path.resolve(`whatsapp_sessions/prof_${profId}`);
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }
};

export const sendMessage = async (profId, toPhone, message) => {
    const clientData = clients.get(profId);
    if (!clientData || clientData.status !== 'connected' || !clientData.instance) {
        console.log(`[WhatsApp] Cannot send message for Prof ${profId}: Not connected`);
        return false;
    }

    try {
        let formattedPhone = toPhone.replace(/\D/g, ''); 
        
        if (!formattedPhone.startsWith('54') && formattedPhone.length === 10) {
             formattedPhone = '549' + formattedPhone;
        }

        const jid = `${formattedPhone}@s.whatsapp.net`;
        await clientData.instance.sendMessage(jid, { text: message });
        console.log(`[WhatsApp] Message sent to ${jid}`);
        return true;
    } catch (error) {
        console.error(`[WhatsApp] Error sending message:`, error);
        return false;
    }
};
