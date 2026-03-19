import express from 'express';
import {
    createSession,
    getAllSessions,
    getSessionById,
    ajouterCoursSession,
    updateSession,
    deleteSession,
    getTeacherSessions,
    completeSession,
    togglePublishSession,
    getPublishedSessions
} from '../controllers/sessionController.js';

import { protect, admin, teacher } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// Route publique pour la landing page (SANS protect)
router.get('/published', getPublishedSessions);

// Route pour l'enseignant pour voir ses propres sessions (DOIT ETRE AVANT /:id)
router.route('/teacher')
    .get(protect, teacher, getTeacherSessions);

// Route bech l'Admin yasna3 session w bech njibou les sessions lkol
router.route('/')
    .post(protect, admin, createSession)
    .get(protect, getAllSessions);

router.route('/:id/complete')
    .put(protect, teacher, completeSession);

router.route('/:id/toggle-publish')
    .put(protect, admin, togglePublishSession);

// Route bech njibou détail mta3 session wa7da w modifierha w nfas5ouha
router.route('/:id')
    .get(protect, getSessionById)
    .put(protect, admin, updateSession)
    .delete(protect, admin, deleteSession);

// Route bech l'Enseignant yzid les cours (PDF/Video..)
router.route('/:id/cours')
    .put(protect, ajouterCoursSession);

export default router;