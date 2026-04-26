import express from 'express';
const router = express.Router();
import {
    subscribeUser,
    getUserNotifications,
    markAsRead
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/')
    .get(protect, getUserNotifications);

router.post('/subscribe', protect, subscribeUser);

router.put('/:id/read', protect, markAsRead);

export default router;
