import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    issueCertificate,
    getMyCertificates,
    getAllCertificates,
    downloadCertificate
} from '../controllers/certificateController.js';

const router = express.Router();

// GET /api/certificates/my — Mes certificats (étudiant connecté)
router.get('/my', protect, getMyCertificates);

// GET /api/certificates — Tous les certificats (admin)
router.get('/', protect, admin, getAllCertificates);

// POST /api/certificates/issue/:inscriptionId — Émettre un certificat (admin)
router.post('/issue/:inscriptionId', protect, admin, issueCertificate);

// GET /api/certificates/:id/download — Télécharger le PDF
router.get('/:id/download', protect, downloadCertificate);

export default router;
