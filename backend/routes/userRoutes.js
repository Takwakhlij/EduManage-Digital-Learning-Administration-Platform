import express from 'express';
import {
    registerUser,
    loginUser,
    getMe,
    getUsers,
    createUserAdmin,
    deactivateSelfAccount,
    updateUserStatus,
    deleteUser,
    updateUser,
    updateUserProfile
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Routes Publiques (Accessibles sans être connecté)
router.post('/register', registerUser); // Créer un nouveau compte
router.post('/login', loginUser);       // Se connecter et obtenir un Token JWT

// Routes Protégées (Nécessitent un Token JWT valide, vérifié par le middleware "protect")
router.get('/me', protect, getMe); // Récupérer les informations de profil de l'utilisateur connecté
router.put('/profile', protect, upload.single('profileImage'), updateUserProfile); // Mettre à jour le profil (avec image)
router.put('/deactivate', protect, deactivateSelfAccount); // Désactiver son propre compte

// Routes Administrateur (Nécessitent un Token JWT ET le rôle "admin", vérifiés par "protect" et "admin")
router.post('/', protect, admin, createUserAdmin);
router.get('/', protect, admin, getUsers);
router.put('/:id/status', protect, admin, updateUserStatus);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

export default router;
