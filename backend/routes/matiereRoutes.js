
import express from 'express';
import { getMatieres, createMatiere, deleteMatiere } from '../controllers/matiereController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getMatieres).post(protect, createMatiere);
router.route('/:id').delete(protect, deleteMatiere);

export default router;
