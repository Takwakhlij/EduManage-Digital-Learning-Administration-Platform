import express from 'express';
const router = express.Router();
import {
    getUserNotifications,
    markAsRead,
    savePushToken,
    subscribeUser
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/')
    .get(protect, getUserNotifications);

router.post('/subscribe', protect, subscribeUser);

router.put('/:id/read', protect, markAsRead);

router.post('/save-token', protect, savePushToken);

export default router;
