import express from 'express';
import { getPresenceBySeance, savePresence, getPresenceByInscription, getEtudiantPresenceStats, getAllStudentPresences } from '../controllers/presenceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes Admin
router.get('/admin/all', protect, admin, getAllStudentPresences);

// GET  /api/presences?seanceId=...&date=...        → Récupérer l'appel d'une séance
router.get('/', protect, getPresenceBySeance);

// POST /api/presences                              → Enregistrer tout l'appel
router.post('/', protect, savePresence);

// GET  /api/presences/etudiant/:etudiantId/stats  → Dashboard stats complet d'un étudiant
router.get('/etudiant/:etudiantId/stats', protect, getEtudiantPresenceStats);

// GET  /api/presences/etudiant?inscriptionId=...   → Historique d'un étudiant (par inscription)
router.get('/etudiant', protect, getPresenceByInscription);

export default router;
