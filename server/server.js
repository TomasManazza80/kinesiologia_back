import express from 'express';
import cors from 'cors';
import {createServer} from "node:http"
import { Server } from 'socket.io';
import * as authController from "./controllers/authController.js";
import {authenticateToken} from "./controllers/authController.js";
import * as userController from "./controllers/userController.js";
import publicRoutes from "./routes/publicRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import kinesioRoutes from "./routes/kinesioRoutes.js"; // New Kinesiology routes
import whatsappRoutes from "./routes/whatsappRoutes.js";

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3000;

const app = express();
const router = express.Router();
const defaultOrigins = [
    'https://pauses.info',
    'https://www.pauses.info',
    'https://pauses.netlify.app',
    'https://elcrucecarniceria.netlify.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
];

const envOrigins = [
    process.env.VITE_PUBLIC_URL,
    process.env.VITE_PUBLIC_URL?.replace(/\/$/, ''),
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL?.replace(/\/$/, '')
].filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(origin) || allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith('.pauses.info') || cleanOrigin === 'https://pauses.info') {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(router);

// Servir archivos estáticos de subidas
app.use('/uploads', express.static('public/uploads'));

app.get('/', (req, res) => {
    res.send('Kinesio API Running');
})

// Public API
app.use('/api/public', publicRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

// Kinesiology API
app.use('/api/kinesio', kinesioRoutes);

// WhatsApp API
app.use('/api/whatsapp', whatsappRoutes);

// Auth
router.post('/signup', authController.registerUser);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

// User (Professional)
router.get('/user', authenticateToken, userController.getUser)
router.patch('/user', authenticateToken, userController.updateUser)
router.delete('/user', authenticateToken, userController.deleteUser)

app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('Something broke!');
})

const server = createServer(app);

// Setup Socket.io
export const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("Client connected via Socket.io:", socket.id);
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

import { AppDataSource } from './database.js';

AppDataSource.initialize()
    .then(() => {
        console.log("TypeORM Data Source has been initialized!");
        server.listen(PORT, () => {
            console.log('App listening on port ' + PORT);
        });
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });
