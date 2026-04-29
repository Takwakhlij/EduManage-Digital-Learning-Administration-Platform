import asyncHandler from 'express-async-handler';
import Stripe from 'stripe';
import Paiement from '../models/paiementModel.js';
import Inscription from '../models/inscriptionModel.js';
import Session from '../models/sessionModel.js';
import { generateReceiptPDF, generateHistoryPDF } from '../utils/receiptGenerator.js';
import User from '../models/userModel.js';
import { sendPushNotification } from './notificationController.js';

// Initialisation de Stripe
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY is missing in .env file');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Recalculer automatiquement le statut de paiement ──────────────────────
const recalculerStatutPaiement = async (inscription, prixSession) => {
    const total = inscription.montantVerseTotal || 0;
    const reste = prixSession - total;

    inscription.resteAPayer = Math.max(0, reste);
    
    if (total <= 0) {
        inscription.statutPaiement = 'Non Payé';
    } else if (reste <= 0 && total > 0) {
        inscription.statutPaiement = 'Payé';
        // ✅ ─── Auto-Approbation ─── Si paiement total, on approuve automatiquement
        if (inscription.statut === 'en_attente') {
            inscription.statut = 'approuvee';
        }
    } else if (total > 0) {
        inscription.statutPaiement = 'Avance';
        // Si avance seulement, l'admin doit approuver manuellement → on ne touche pas au statut
    } else {
        inscription.statutPaiement = 'Non Payé';
    }

    await inscription.save();
    return inscription;
};

// @desc    Enregistrer un versement (paiement en présentiel)
// @route   POST /api/paiements
// @access  Private (Admin)
export const enregistrerPaiement = asyncHandler(async (req, res) => {
    const { inscriptionId, montant, modePaiement, note } = req.body;

    if (!inscriptionId || !montant) {
        res.status(400);
        throw new Error('Veuillez fournir l\'ID de l\'inscription et le montant.');
    }

    if (montant <= 0) {
        res.status(400);
        throw new Error('Le montant doit être supérieur à 0.');
    }

    // 1. Récupérer l'inscription avec sa session
    const inscription = await Inscription.findById(inscriptionId).populate('session', 'montant nomSession');
    if (!inscription) {
        res.status(404);
        throw new Error('Inscription non trouvée.');
    }

    const prixSession = inscription.session?.montant || 0;

    if (prixSession === 0) {
        res.status(400);
        throw new Error('Le montant de la session n\'est pas défini.');
    }

    // 2. Créer le paiement
    const paiement = await Paiement.create({
        inscription: inscriptionId,
        etudiant: inscription.etudiant,
        session: inscription.session._id,
        montant: parseFloat(montant),
        modePaiement: modePaiement || 'Espèces',
        note: note || '',
        enregistrePar: req.user._id
    });

    // 3. Mettre à jour le cumul sur l'inscription
    inscription.montantVerseTotal = (inscription.montantVerseTotal || 0) + parseFloat(montant);
    
    // 4. Recalculer et sauvegarder le statut automatiquement
    const inscriptionMaj = await recalculerStatutPaiement(inscription, prixSession);

    // 5. Générer le Reçu PDF
    try {
        const studentObj = await User.findById(inscription.etudiant);
        const receiptUrl = await generateReceiptPDF(paiement, studentObj, inscription.session, inscriptionMaj);
        paiement.receiptUrl = receiptUrl;
        await paiement.save();
    } catch (pdfErr) {
        console.error('Erreur génération PDF:', pdfErr);
        // On ne bloque pas la réponse si le PDF échoue, mais on log l'erreur
    }

    // 6. Retourner les données enrichies
    const inscriptionFull = await Inscription.findById(inscriptionId)
        .populate('etudiant', 'firstName lastName email profileImage')
        .populate('session', 'nomSession montant duree')
        .populate('classe', 'nomClasse niveau');

    res.status(201).json({
        success: true,
        message: `Versement de ${montant} TND enregistré avec succès.`,
        paiement,
        inscription: inscriptionFull,
        statutPaiement: inscriptionMaj.statutPaiement,
        montantVerseTotal: inscriptionMaj.montantVerseTotal,
        resteAPayer: inscriptionMaj.resteAPayer
    });

    // --- NOTIFICATION PUSH : Confirmation de paiement ---
    try {
        const studentId = inscription.etudiant;
        const sessionName = inscription.session?.nomSession || 'Session';
        
        const notifPayload = {
            title: 'Paiement Enregistré ✅',
            body: `Votre versement de ${montant} TND pour la session "${sessionName}" a bien été enregistré. Merci !`,
            type: 'paiement',
            senderId: req.user._id,
            url: '/paiements'
        };

        // 1. Notifier l'étudiant
        sendPushNotification(studentId, notifPayload).catch(err => console.error(err));

        // 2. Notifier les parents
        const parents = await User.find({ children: studentId, role: 'parent' }).select('_id');
        for (const parent of parents) {
            sendPushNotification(parent._id, notifPayload).catch(err => console.error(err));
        }
    } catch (notifErr) {
        console.error('Erreur notification paiement:', notifErr);
    }
});

// @desc    Récupérer l'historique des paiements d'une inscription
// @route   GET /api/paiements/inscription/:inscriptionId
// @access  Private (Admin)
export const getPaiementsParInscription = asyncHandler(async (req, res) => {
    const inscription = await Inscription.findById(req.params.inscriptionId)
        .populate('session', 'montant nomSession')
        .populate('etudiant', 'firstName lastName');

    if (!inscription) {
        res.status(404);
        throw new Error('Inscription non trouvée.');
    }

    const paiements = await Paiement.find({ inscription: req.params.inscriptionId })
        .populate('enregistrePar', 'firstName lastName')
        .sort({ datePaiement: -1 });

    const prixSession = inscription.session?.montant || 0;
    const totalVerse = paiements.reduce((sum, p) => sum + p.montant, 0);
    const resteAPayer = Math.max(0, prixSession - totalVerse);

    res.status(200).json({
        success: true,
        count: paiements.length,
        paiements,
        resume: {
            prixSession,
            totalVerse,
            resteAPayer,
            pourcentagePaye: prixSession > 0 ? Math.min(100, Math.round((totalVerse / prixSession) * 100)) : 0,
            statutPaiement: inscription.statutPaiement
        }
    });
});

// @desc    Récupérer tous les débiteurs (inscriptions avec reste > 0)
// @route   GET /api/paiements/debiteurs
// @access  Private (Admin)
export const getDebiteurs = asyncHandler(async (req, res) => {
    const debiteurs = await Inscription.find({
        $or: [
            { statutPaiement: 'Non Payé' },
            { statutPaiement: 'Avance' }
        ],
        statut: 'approuvee'
    })
        .populate('etudiant', 'firstName lastName email profileImage')
        .populate('session', 'nomSession montant duree')
        .populate('classe', 'nomClasse niveau')
        .sort({ resteAPayer: -1 });

    const totalReliquat = debiteurs.reduce((sum, ins) => sum + (ins.resteAPayer || 0), 0);

    res.status(200).json({
        success: true,
        count: debiteurs.length,
        totalReliquat,
        debiteurs
    });
});

// @desc    Récupérer le résumé des encaissements (par date)
// @route   GET /api/paiements/caisse
// @access  Private (Admin)
export const getCaisseJour = asyncHandler(async (req, res) => {
    const { date } = req.query;
    
    let dateDebut, dateFin;
    if (date) {
        dateDebut = new Date(date);
        dateDebut.setHours(0, 0, 0, 0);
        dateFin = new Date(date);
        dateFin.setHours(23, 59, 59, 999);
    } else {
        // Par défaut : aujourd'hui
        dateDebut = new Date();
        dateDebut.setHours(0, 0, 0, 0);
        dateFin = new Date();
        dateFin.setHours(23, 59, 59, 999);
    }

    const paiements = await Paiement.find({
        datePaiement: { $gte: dateDebut, $lte: dateFin }
    })
        .populate('etudiant', 'firstName lastName')
        .populate('session', 'nomSession')
        .populate('enregistrePar', 'firstName lastName')
        .sort({ datePaiement: -1 });

    const totalEncaisse = paiements.reduce((sum, p) => sum + p.montant, 0);
    const parMode = {
        Espèces: paiements.filter(p => p.modePaiement === 'Espèces').reduce((s, p) => s + p.montant, 0),
        Chèque: paiements.filter(p => p.modePaiement === 'Chèque').reduce((s, p) => s + p.montant, 0),
        Virement: paiements.filter(p => p.modePaiement === 'Virement').reduce((s, p) => s + p.montant, 0),
    };

    res.status(200).json({
        success: true,
        date: dateDebut.toISOString().split('T')[0],
        count: paiements.length,
        totalEncaisse,
        parMode,
        paiements
    });
});

// @desc    Supprimer un paiement (correction d'erreur)
// @route   DELETE /api/paiements/:id
// @access  Private (Admin)
export const deletePaiement = asyncHandler(async (req, res) => {
    const paiement = await Paiement.findById(req.params.id);
    if (!paiement) {
        res.status(404);
        throw new Error('Paiement non trouvé.');
    }

    const inscription = await Inscription.findById(paiement.inscription).populate('session', 'montant');
    
    await Paiement.deleteOne({ _id: req.params.id });

    if (inscription) {
        inscription.montantVerseTotal = Math.max(0, (inscription.montantVerseTotal || 0) - paiement.montant);
        const prixSession = inscription.session?.montant || 0;
        await recalculerStatutPaiement(inscription, prixSession);
    }

    res.status(200).json({
        success: true,
        message: 'Paiement supprimé. Le statut de l\'inscription a été recalculé.',
        id: req.params.id
    });
});

// @desc    Créer une intention de paiement Stripe (PaymentIntent)
// @route   POST /api/paiements/create-payment-intent
// @access  Private (Student & Admin)
export const createStripePaymentIntent = asyncHandler(async (req, res) => {
    const { inscriptionId, montant } = req.body; // montant est en TND normal (ex: 50.500)

    if (!inscriptionId || !montant || montant <= 0) {
        res.status(400);
        throw new Error('Veuillez fournir un ID d\'inscription valide et un montant supérieur à 0.');
    }

    const inscription = await Inscription.findById(inscriptionId).populate('session', 'montant nomSession');
    if (!inscription) {
        res.status(404);
        throw new Error('Inscription non trouvée.');
    }

    const prixSession = inscription.session?.montant || 0;
    const resteAPayer = Math.max(0, prixSession - (inscription.montantVerseTotal || 0));

    // Si on veut être strict sur le montant max :
    // if (montant > resteAPayer && resteAPayer > 0) { ... }

    if (prixSession === 0) {
         res.status(400);
         throw new Error('Le montant de la session n\'est pas défini, paiement impossible.');
    }

    // Pour la simulation : On traite le montant TND (3 décimales) comme s'il s'agissait d'EUR (2 décimales)
    // pour que l'affichage sur Stripe soit cohérent (ex: 50.500 TND -> 50.50 EUR)
    const amountInCents = Math.round(parseFloat(montant) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'eur',
        metadata: {
            inscriptionId: inscriptionId.toString(),
            etudiantId: inscription.etudiant.toString(),
            sessionId: inscription.session._id.toString(),
            realMontantTND: montant.toString()
        }
    });

    res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret
    });
});

// @desc    Confirmer l'enregistrement du paiement réussi en BD (Stripe)
// @route   POST /api/paiements/confirm-stripe-payment
// @access  Private (Student & Admin)
export const confirmStripePayment = asyncHandler(async (req, res) => {
    const { inscriptionId, montant, paymentIntentId } = req.body;

    if (!inscriptionId || !montant || !paymentIntentId) {
        res.status(400);
        throw new Error('Données manquantes (inscription, montant ou ID de transaction).');
    }

    const inscription = await Inscription.findById(inscriptionId).populate('session', 'montant nomSession');
    if (!inscription) {
        res.status(404);
        throw new Error('Inscription non trouvée.');
    }

    // Vérification de sécurité auprès de Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
        res.status(400);
        throw new Error('Le paiement Stripe n\'est pas marqué comme réussi.');
    }

    // Vérifier les doublons
    const isAlreadyRecorded = await Paiement.findOne({ note: `Stripe Transaction ID: ${paymentIntentId}` });
    if (isAlreadyRecorded) {
        return res.status(200).json({
           success: true,
           message: "Ce paiement a déjà été enregistré.",
           paiement: isAlreadyRecorded
        });
    }

    // Créer le paiement en base
    const paiement = await Paiement.create({
        inscription: inscriptionId,
        etudiant: inscription.etudiant,
        session: inscription.session._id,
        montant: parseFloat(montant),
        modePaiement: 'Stripe',
        note: `Stripe Transaction ID: ${paymentIntentId}`,
        enregistrePar: req.user._id
    });

    const prixSession = inscription.session?.montant || 0;
    inscription.montantVerseTotal = (inscription.montantVerseTotal || 0) + parseFloat(montant);
    const inscriptionMaj = await recalculerStatutPaiement(inscription, prixSession);

    // Générer le Reçu PDF (Stripe)
    try {
        const studentObj = await User.findById(inscription.etudiant);
        const receiptUrl = await generateReceiptPDF(paiement, studentObj, inscription.session, inscriptionMaj);
        paiement.receiptUrl = receiptUrl;
        await paiement.save();
    } catch (pdfErr) {
        console.error('Erreur génération PDF:', pdfErr);
    }

    res.status(201).json({
        success: true,
        message: 'Paiement en ligne enregistré avec succès.',
        paiement,
        statutPaiement: inscriptionMaj.statutPaiement,
        resteAPayer: inscriptionMaj.resteAPayer,
        montantVerseTotal: inscriptionMaj.montantVerseTotal
    });

    // --- NOTIFICATION PUSH : Confirmation Paiement en ligne ---
    try {
        const studentId = inscription.etudiant;
        const student = await User.findById(studentId).select('firstName lastName');
        const studentName = student ? `${student.firstName} ${student.lastName}` : 'Un étudiant';
        const sessionName = inscription.session?.nomSession || 'Session';
        
        const notifPayload = {
            title: 'Paiement en Ligne Réussi 💳',
            body: `Votre paiement de ${montant} TND pour "${sessionName}" a été validé avec succès.`,
            type: 'paiement',
            senderId: req.user._id,
            url: '/paiements'
        };

        // Notifier Étudiant + Parents
        sendPushNotification(studentId, notifPayload).catch(err => console.error(err));
        const parents = await User.find({ children: studentId, role: 'parent' }).select('_id');
        for (const parent of parents) {
            sendPushNotification(parent._id, notifPayload).catch(err => console.error(err));
        }

        // Notifier les ADMINS
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const admin of admins) {
            sendPushNotification(admin._id, {
                title: 'Nouveau Paiement en Ligne 💸',
                body: `${studentName} vient de payer ${montant} TND en ligne pour la session "${sessionName}".`,
                type: 'paiement',
                senderId: studentId,
                url: '/admin/inscriptions',
                relatedId: inscriptionId
            }).catch(err => console.error(err));
        }
    } catch (notifErr) {
        console.error('Erreur notification paiement Stripe:', notifErr);
    }
});
// @desc    Obtenir l'historique des paiements de l'étudiant connecté
// @route   GET /api/paiements/my
// @access  Private (Student/Parent)
export const getMyPaiements = asyncHandler(async (req, res) => {
    // Si c'est un parent/tuteur, il peut passer un studentId pour voir les paiements de son enfant.
    const studentId = req.query.studentId || req.user._id;

    // Vérification de sécurité simple : l'utilisateur demande ses propres paiements
    // (ou l'admin demande n'importe quoi). 
    // TODO: Ajouter la vérification parent -> enfant si nécessaire.
    if (req.user.role !== 'admin' && String(req.user._id) !== String(studentId)) {
        // Optionnel : vérifier si studentId est dans req.user.children
    }

    const paiements = await Paiement.find({ etudiant: studentId })
        .populate('session', 'nomSession montant')
        .sort('-datePaiement');

    res.json({
        success: true,
        paiements: paiements || []
    });
});
// @desc    Générer un rapport PDF complet des paiements pour une inscription
// @route   GET /api/paiements/report/:inscriptionId
// @access  Private/Admin
export const getPaymentReport = asyncHandler(async (req, res) => {
    const { inscriptionId } = req.params;

    const inscription = await Inscription.findById(inscriptionId)
        .populate('etudiant', 'firstName lastName email')
        .populate('session', 'nomSession montant');

    if (!inscription) {
        res.status(404);
        throw new Error('Inscription non trouvée');
    }

    const paiements = await Paiement.find({ inscription: inscriptionId }).sort({ datePaiement: 1 });

    try {
        const reportUrl = await generateHistoryPDF(
            paiements, 
            inscription.etudiant, 
            inscription.session, 
            inscription
        );

        res.status(200).json({
            success: true,
            reportUrl
        });
    } catch (error) {
        console.error('Erreur génération rapport histoire:', error);
        res.status(500);
        throw new Error('Erreur lors de la génération du rapport PDF');
    }
});
// @desc    Générer un rapport PDF COMPLET de TOUS les paiements d'un étudiant (toutes sessions)
// @route   GET /api/paiements/report/student/:studentId
// @access  Private/Admin
export const getStudentFullReport = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    const student = await User.findById(studentId).select('firstName lastName email');
    if (!student) {
        res.status(404);
        throw new Error('Étudiant non trouvé');
    }

    // Récupérer toutes les inscriptions pour avoir les totaux
    const inscriptions = await Inscription.find({ etudiant: studentId }).populate('session', 'nomSession montant');
    
    // Récupérer tous les paiements
    const paiements = await Paiement.find({ etudiant: studentId })
        .populate('session', 'nomSession')
        .sort({ datePaiement: 1 });

    try {
        const reportUrl = await generateHistoryPDF(
            paiements, 
            student, 
            { nomSession: 'Historique Global' }, // Placeholder pour le nom de session
            { montantVerseTotal: inscriptions.reduce((acc, i) => acc + i.montantVerseTotal, 0),
              resteAPayer: inscriptions.reduce((acc, i) => acc + i.resteAPayer, 0),
              session: { montant: inscriptions.reduce((acc, i) => acc + (i.session?.montant || 0), 0) } 
            }
        );

        res.status(200).json({
            success: true,
            reportUrl
        });
    } catch (error) {
        console.error('Erreur génération rapport global:', error);
        res.status(500);
        throw new Error('Erreur lors de la génération du rapport PDF global');
    }
});

// @desc    Gérer les événements Stripe Webhook (Sécurité Soutenance)
// @route   POST /api/paiements/webhook
// @access  Public (Stripe Signature)
export const handleStripeWebhook = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // req.body est un Buffer car on a configuré express.raw dans server.js
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gestion de l'événement de succès de paiement
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { inscriptionId, realMontantTND } = paymentIntent.metadata;
        const finalAmount = realMontantTND ? parseFloat(realMontantTND) : (paymentIntent.amount / 100);

        console.log(`⚡ Webhook: Paiement réussi de ${finalAmount} TND pour l'inscription ${inscriptionId}`);

        // 1. Récupérer l'inscription
        const inscription = await Inscription.findById(inscriptionId).populate('session', 'montant');
        if (!inscription) {
            console.error('❌ Inscription non trouvée lors du Webhook');
            return res.status(200).json({ received: true }); // On répond 200 pour éviter que Stripe ne renvoie l'erreur en boucle
        }

        // 2. Éviter les doublons (si confirmé déjà par le frontend)
        const isAlreadyRecorded = await Paiement.findOne({ note: `Stripe Transaction ID: ${paymentIntent.id}` });
        if (isAlreadyRecorded) {
            console.log('ℹ️ Paiement déjà enregistré via le Frontend. Webhook ignoré.');
            return res.json({ received: true });
        }

        // 3. Créer l'enregistrement de paiement
        const paiement = await Paiement.create({
            inscription: inscriptionId,
            etudiant: inscription.etudiant,
            session: inscription.session._id,
            montant: finalAmount,
            modePaiement: 'Stripe',
            note: `Stripe Transaction ID: ${paymentIntent.id}`,
            // Pas de user ID ici car c'est un appel serveur à serveur
        });

        // 4. Update Inscription (cumul et statut)
        const prixSession = inscription.session?.montant || 0;
        inscription.montantVerseTotal = (inscription.montantVerseTotal || 0) + finalAmount;
        const inscriptionMaj = await recalculerStatutPaiement(inscription, prixSession);

        // 5. Générer le Reçu PDF
        try {
            const studentObj = await User.findById(inscription.etudiant);
            const receiptUrl = await generateReceiptPDF(paiement, studentObj, inscription.session, inscriptionMaj);
            paiement.receiptUrl = receiptUrl;
            await paiement.save();
        } catch (pdfErr) {
            console.error('⚠️ Erreur PDF Webhook:', pdfErr);
        }

        // --- NOTIFICATION PUSH via Webhook ---
        try {
            const studentId = inscription.etudiant;
            const student = await User.findById(studentId).select('firstName lastName');
            const studentName = student ? `${student.firstName} ${student.lastName}` : 'Un étudiant';
            const sessionName = inscription.session?.nomSession || 'Session';
            
            const notifPayload = {
                title: 'Paiement Confirmé ✅',
                body: `Votre paiement Stripe de ${finalAmount} TND pour "${sessionName}" a été confirmé.`,
                type: 'paiement',
                url: '/paiements'
            };
            
            // Notifier Étudiant + Parents
            sendPushNotification(studentId, notifPayload).catch(err => console.error(err));
            const parents = await User.find({ children: studentId, role: 'parent' }).select('_id');
            for (const parent of parents) {
                sendPushNotification(parent._id, notifPayload).catch(err => console.error(err));
            }

            // Notifier les ADMINS
            const admins = await User.find({ role: 'admin' }).select('_id');
            for (const admin of admins) {
                sendPushNotification(admin._id, {
                    title: 'Paiement en Ligne (Stripe) 💳',
                    body: `${studentName} a payé ${finalAmount} TND en ligne pour "${sessionName}".`,
                    type: 'paiement',
                    senderId: studentId,
                    url: '/admin/inscriptions',
                    relatedId: inscriptionId
                }).catch(err => console.error(err));
            }
        } catch (notifErr) {
            console.error('Erreur notification Webhook:', notifErr);
        }
    }

    res.json({ received: true });
});
