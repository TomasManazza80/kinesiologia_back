import express from 'express';
import { getHeroSettings, updateHeroSettings, getPageContent, updatePageContent } from '../controllers/settingsController.js';
import { authenticateToken } from '../controllers/authController.js';

const router = express.Router();

// Public route to get settings
router.get('/hero', getHeroSettings);

// Protected route to update settings (requires auth, could add role check)
router.put('/hero', authenticateToken, updateHeroSettings);
// LiveView Content routes
router.get('/content', getPageContent);
router.put('/content', authenticateToken, updatePageContent);

export default router;
