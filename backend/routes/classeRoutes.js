import express from 'express';
import {
    createClasse,
    getClasses,
    getClasseById,
    updateClasse,
    deleteClasse
} from '../controllers/classeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes CRUD basiques pour les classes (L'architecture jdida)
router.post('/', protect, admin, createClasse);
router.get('/', protect, getClasses);
router.get('/:id', protect, getClasseById);
router.put('/:id', protect, admin, updateClasse);
router.delete('/:id', protect, admin, deleteClasse);

export default router;