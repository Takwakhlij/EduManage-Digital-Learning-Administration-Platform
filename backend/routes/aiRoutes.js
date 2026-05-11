import express from 'express';
import { genererRapportFinancier } from '../controllers/aiReportController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/ai/rapport-financier - Générer rapport IA (Admin uniquement)
router.get('/rapport-financier', protect, admin, genererRapportFinancier);

export default router;
