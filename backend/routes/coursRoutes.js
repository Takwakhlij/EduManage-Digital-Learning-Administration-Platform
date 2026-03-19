import express from 'express';
import multer from 'multer';
import path from 'path';
import { getCours, createCours, updateCours, deleteCours } from '../controllers/coursController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer config — store files in /uploads/cours/
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        const unique = `cours-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, unique);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /pdf|mp4|mov|avi|mkv|webm|png|jpg|jpeg|mp3|wav|ogg|m4a/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non supporté. PDF, vidéo ou audio uniquement.'));
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

// Routes
router.get('/', protect, getCours);
router.post('/', protect, upload.single('fichier'), createCours);
router.put('/:id', protect, upload.single('fichier'), updateCours);
router.delete('/:id', protect, deleteCours);

export default router;
