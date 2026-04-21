import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    getAllSeances,
    createSeance,
    getSeanceById,
    getSeancesBySession,
    getSeancesByEnseignant,
    updateSeance,
    deleteSeance
} from '../controllers/seanceController.js';

const router = express.Router();

// Route principale : toutes les séances (calendrier global)
router.get('/', protect, admin, getAllSeances);
router.post('/', protect, admin, createSeance);

// Routes de filtres (lecture)
router.get('/session/:sessionId', protect, getSeancesBySession);
router.get('/enseignant/:enseignantId', protect, getSeancesByEnseignant);

// Opérations sur une séance spécifique
router.route('/:id')
    .get(protect, getSeanceById)
    .put(protect, admin, updateSeance)
    .delete(protect, admin, deleteSeance);

export default router;
