import express from 'express';
import {
    createClasse,
    getClasses,
    getClasseById,
    updateClasse,
    deleteClasse,
    addProfesseurToClasse,
    removeProfesseurFromClasse,
} from '../controllers/classeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes CRUD pour les classes
router.post('/', protect, admin, createClasse);
router.get('/', protect, getClasses);
router.get('/:id', protect, getClasseById);
router.put('/:id', protect, admin, updateClasse);
router.delete('/:id', protect, admin, deleteClasse);

// Gestion des professeurs dans une classe
router.put('/:id/professeurs', protect, admin, addProfesseurToClasse);
router.delete('/:id/professeurs/:profId', protect, admin, removeProfesseurFromClasse);

export default router;
