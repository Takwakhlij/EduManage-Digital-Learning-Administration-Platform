import express from 'express';
import { saveTeacherPresence, getTeacherPresenceBySeance, getAllTeacherPresences, getGlobalSessionsPresence } from '../controllers/teacherPresenceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/all')
    .get(protect, admin, getAllTeacherPresences);

router.route('/global')
    .get(protect, admin, getGlobalSessionsPresence);

router.route('/')
    .post(protect, saveTeacherPresence)
    .get(protect, getTeacherPresenceBySeance);

export default router;
