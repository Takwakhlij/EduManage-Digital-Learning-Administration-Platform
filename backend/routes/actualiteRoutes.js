import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getActualites, createActualite, updateActualite, deleteActualite } from '../controllers/actualiteController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Créer le dossier s'il n'existe pas
const uploadDir = 'uploads/actualites';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        const unique = `actualite-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, unique);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /png|jpg|jpeg|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non supporté. Images uniquement (png, jpg, jpeg, webp).'));
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Routes
router.route('/')
    .get(getActualites)
    .post(protect, admin, upload.single('image'), createActualite);

router.route('/:id')
    .put(protect, admin, upload.single('image'), updateActualite)
    .delete(protect, admin, deleteActualite);

export default router;
