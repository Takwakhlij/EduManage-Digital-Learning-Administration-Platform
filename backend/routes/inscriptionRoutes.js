import express from 'express';
import {
    inscrireEtudiant,
    getInscriptionsParSession,
    getAllInscriptions,
    getMyInscriptions,
    updateStatutInscription,
    deleteInscription,
    toggleCoursTermine
} from '../controllers/inscriptionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route pour l'inscription (POST = Étudiant/Parent) et la liste globale (GET = Admin)
router.route('/')
    .post(protect, inscrireEtudiant)
    .get(protect, admin, getAllInscriptions);

// 🔒 Route privée: l'étudiant connecté voit UNIQUEMENT ses propres inscriptions
router.route('/my')
    .get(protect, getMyInscriptions);

// 🔐 Route Admin: approuver ou refuser une inscription
router.route('/:id/statut')
    .put(protect, admin, updateStatutInscription);

// 📖 Route Étudiant: marquer un cours comme terminé
router.route('/:id/toggle-cours')
    .put(protect, toggleCoursTermine);

// 🔐 Route Admin: supprimer totalement une inscription
router.route('/:id')
    .delete(protect, admin, deleteInscription);

// Route pour voir les inscriptions d'une session (Admin ou Enseignant)
router.route('/session/:sessionId')
    .get(protect, getInscriptionsParSession);

export default router;
