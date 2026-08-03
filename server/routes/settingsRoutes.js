import express from 'express';
import { getHeroSettings, updateHeroSettings } from '../controllers/settingsController.js';
import { authenticateToken } from '../controllers/authController.js';

const router = express.Router();

// Public route to get settings
router.get('/hero', getHeroSettings);

// Protected route to update settings (requires auth, could add role check)
router.put('/hero', authenticateToken, updateHeroSettings);

export default router;
