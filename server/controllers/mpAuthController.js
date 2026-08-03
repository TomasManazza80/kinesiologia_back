import { AppDataSource } from '../database.js';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

export const getAuthUrl = async (req, res) => {
    try {
        const professionalId = req.user.userId;
        const clientId = process.env.MP_CLIENT_ID;
        const backendUrl = process.env.PUBLIC_BACKEND_URL || 'http://localhost:10000';
        const redirectUri = `${backendUrl}/api/kinesio/mp-callback`;

        if (!clientId) {
            return res.status(500).json({ error: "Falta configurar MP_CLIENT_ID en el backend." });
        }

        const url = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${professionalId}&redirect_uri=${redirectUri}`;

        res.json({ url });
    } catch (error) {
        console.error("Error al generar auth URL:", error);
        res.status(500).json({ error: "Error al generar URL de MercadoPago" });
    }
};

export const handleCallback = async (req, res) => {
    try {
        const { code, state } = req.query; // state is professionalId
        const clientId = process.env.MP_CLIENT_ID;
        const clientSecret = process.env.MP_CLIENT_SECRET;
        const backendUrl = process.env.PUBLIC_BACKEND_URL || 'http://localhost:10000';
        const redirectUri = `${backendUrl}/api/kinesio/mp-callback`;

        if (!code || !state) {
            return res.status(400).send("Faltan parámetros de MercadoPago.");
        }

        const tokenResponse = await axios.post('https://api.mercadopago.com/oauth/token', {
            client_secret: clientSecret,
            client_id: clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const { access_token, refresh_token, user_id } = tokenResponse.data;

        const userRepo = AppDataSource.getRepository('User');
        const professional = await userRepo.findOne({ where: { id: parseInt(state) } });
        
        if (professional) {
            professional.mp_access_token = access_token;
            professional.mp_refresh_token = refresh_token;
            professional.mp_user_id = user_id.toString();
            await userRepo.save(professional);
        }

        // Redirect back to frontend success page
        const frontendUrl = process.env.VITE_PUBLIC_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/admin?mp_success=true`);

    } catch (error) {
        console.error("Error en MercadoPago OAuth callback:", error?.response?.data || error);
        const frontendUrl = process.env.VITE_PUBLIC_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/admin?mp_error=true`);
    }
};
