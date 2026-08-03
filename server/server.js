import express from 'express';
import cors from 'cors';
import {createServer} from "node:http"
import * as authController from "./controllers/authController.js";
import {authenticateToken} from "./controllers/authController.js";
import * as userController from "./controllers/userController.js";
import publicRoutes from "./routes/publicRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import kinesioRoutes from "./routes/kinesioRoutes.js"; // New Kinesiology routes

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3000;

const app = express();
const router = express.Router();
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.VITE_PUBLIC_URL, process.env.VITE_PUBLIC_URL?.replace(/\/$/, ''), 'https://elcrucecarniceria.netlify.app', 'http://localhost:5173', 'http://localhost:5174', 'https://pauses.netlify.app'] 
    : ['http://localhost:5173', 'http://localhost:5174', 'https://elcrucecarniceria.netlify.app', process.env.VITE_PUBLIC_URL, process.env.VITE_PUBLIC_URL?.replace(/\/$/, ''), 'https://pauses.netlify.app'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(router);

// Servir archivos estáticos de subidas
app.use('/uploads', express.static('public/uploads'));

app.get('/', (req, res) => {
    res.send('Kinesio API Running');
})

// Public API
app.use('/api/public', publicRoutes);
// app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

// Kinesiology API
app.use('/api/kinesio', kinesioRoutes);

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
