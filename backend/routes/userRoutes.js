import express from 'express';
import {
    registerUser,
    loginUser,
    getMe,
    getUsers,
    updateUserStatus,
    deleteUser,
    updateUser,
    updateUserProfile
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('profileImage'), updateUserProfile);

// Admin Routes
router.get('/', protect, admin, getUsers);
router.put('/:id/status', protect, admin, updateUserStatus);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

export default router;
