import express from 'express';
import {
    enregistrerPaiement,
    getPaiementsParInscription,
    getDebiteurs,
    getCaisseJour,
    deletePaiement,
    createStripePaymentIntent,
    confirmStripePayment,
    handleStripeWebhook,
    getMyPaiements,
    getPaymentReport,
    getStudentFullReport,
    envoyerRelance
} from '../controllers/paiementController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// 📥 Enregistrer un versement (Admin)
router.route('/').post(protect, admin, enregistrerPaiement);

// 📊 Rapport caisse du jour (Admin)
router.route('/caisse').get(protect, admin, getCaisseJour);

// 🔴 Liste des débiteurs (Admin)
router.route('/debiteurs').get(protect, admin, getDebiteurs);

// 📋 Historique des paiements d'une inscription (Admin)
router.route('/inscription/:inscriptionId').get(protect, admin, getPaiementsParInscription);

// 📄 Rapports PDF (Admin)
router.route('/report/:inscriptionId').get(protect, admin, getPaymentReport);
router.route('/report/student/:studentId').get(protect, admin, getStudentFullReport);

// 🔔 Envoyer une relance de paiement (Rappel) à un débiteur (Admin)
router.post('/relance/:inscriptionId', protect, admin, envoyerRelance);

// 🗑️ Supprimer un paiement — correction d'erreur (Admin)
router.route('/:id').delete(protect, admin, deletePaiement);

// --- Stripe Online Payments (Accessible par les étudiants) ---

// 🔗 Créer une intention de paiement
router.route('/create-payment-intent').post(protect, createStripePaymentIntent);

// ✅ Confirmer un paiement Stripe
router.route('/confirm-stripe-payment').post(protect, confirmStripePayment);

// 👤 Mes paiements (Étudiant)
router.route('/my').get(protect, getMyPaiements);

// ⚡ Webhook Stripe (Public - géré par signature)
router.post('/webhook', handleStripeWebhook);

export default router;
