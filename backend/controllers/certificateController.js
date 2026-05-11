import asyncHandler from 'express-async-handler';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Certificate from '../models/certificateModel.js';
import Inscription from '../models/inscriptionModel.js';
import Session from '../models/sessionModel.js';
import User from '../models/userModel.js';
import { sendPushNotification } from './notificationController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fonction pour inverser manuellement les chaînes arabes si PDFKit les inverse
 * Note: C'est une solution simple pour l'ordre des mots.
 */
const reverseArabic = (text) => {
    return text.split(' ').reverse().join('  '); // Double espace pour la clarté
};

/**
 * Fonction interne pour créer un record de certificat
 */
export const createCertificateRecord = async (inscriptionId, issuerId = null) => {
    const inscription = await Inscription.findById(inscriptionId)
        .populate('etudiant', 'firstName lastName email')
        .populate({ path: 'session', select: 'nomSession statut montant' });

    if (!inscription) return { error: "Inscription non trouvée." };
    if (inscription.statut !== 'approuvee') return { error: "Inscription non approuvée." };
    if (inscription.session?.statut !== 'Terminée') return { error: "Session non terminée." };
    if (inscription.statutPaiement !== 'Payé') return { error: "Paiement non complet." };

    const existingCert = await Certificate.findOne({ inscription: inscriptionId });
    if (existingCert) return { error: "Certificat déjà existant." };

    const certificate = await Certificate.create({
        etudiant: inscription.etudiant._id,
        session: inscription.session._id,
        inscription: inscription._id,
        delivrePar: issuerId,
        dateEmission: new Date()
    });

    // --- NOTIFICATION PUSH ---
    try {
        const studentId = inscription.etudiant._id;
        const sessionName = inscription.session?.nomSession || 'Session';
        
        const notifPayload = {
            title: 'Nouveau Certificat ! 🎖️',
            body: `Félicitations ! Votre certificat pour la session "${sessionName}" est disponible dans votre espace personnel.`,
            type: 'certificat',
            senderId: issuerId || studentId, // Admin ou Système
            url: '/certificats'
        };

        // 1. Notifier l'étudiant
        sendPushNotification(studentId, notifPayload).catch(err => console.error(err));

        // 2. Notifier les parents
        const parents = await User.find({ children: studentId, role: 'parent' }).select('_id');
        for (const parent of parents) {
            sendPushNotification(parent._id, {
                ...notifPayload,
                body: `Félicitations ! Le certificat de votre enfant pour la session "${sessionName}" est disponible.`
            }).catch(err => console.error(err));
        }
    } catch (notifErr) {
        console.error('Erreur notification certificat:', notifErr);
    }

    return { success: true, certificate };
};

export const issueCertificate = asyncHandler(async (req, res) => {
    const { inscriptionId } = req.params;

    const result = await createCertificateRecord(inscriptionId, req.user._id);

    if (result.error) {
        res.status(400);
        throw new Error(result.error);
    }

    const populatedCert = await Certificate.findById(result.certificate._id)
        .populate('etudiant', 'firstName lastName')
        .populate('session', 'nomSession duree')
        .populate('delivrePar', 'firstName lastName');

    res.status(201).json({
        success: true,
        message: "Certificat émis avec succès.",
        certificate: populatedCert
    });
});

export const getMyCertificates = asyncHandler(async (req, res) => {
    const studentId = req.query.studentId || req.user._id;
    const certificates = await Certificate.find({ etudiant: studentId })
        .populate('session', 'nomSession duree')
        .sort({ dateEmission: -1 });

    res.status(200).json({
        success: true,
        certificates
    });
});

export const getAllCertificates = asyncHandler(async (req, res) => {
    const certificates = await Certificate.find({})
        .populate('etudiant', 'firstName lastName')
        .populate('session', 'nomSession')
        .populate('delivrePar', 'firstName lastName')
        .sort({ dateEmission: -1 });

    res.status(200).json({
        success: true,
        certificates
    });
});

export const downloadCertificate = asyncHandler(async (req, res) => {
    const certificate = await Certificate.findById(req.params.id)
        .populate('etudiant', 'firstName lastName')
        .populate('session', 'nomSession duree');

    if (!certificate) {
        res.status(404);
        throw new Error('Certificat non trouvé');
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = certificate.etudiant._id.toString() === req.user._id.toString();

    if (!isOwner && !isAdmin) {
        res.status(401);
        throw new Error('Non autorisé');
    }

    const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 0
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificat-${certificate.certificateId}.pdf`);
    doc.pipe(res);

    const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
    const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'arabtype.ttf');
    const hasFont = fs.existsSync(fontPath);
    const hasLogo = fs.existsSync(logoPath);

    const W = doc.page.width;   // 841.89
    const H = doc.page.height;  // 595.28

    // ── FOND BLANC ──
    doc.rect(0, 0, W, H).fill('#ffffff');

    // ── BORDURE EXTÉRIEURE dorée ──
    doc.rect(18, 18, W - 36, H - 36).lineWidth(3).stroke('#c9a84c');
    // ── BORDURE INTÉRIEURE fine ──
    doc.rect(28, 28, W - 56, H - 56).lineWidth(0.8).stroke('#c9a84c');

    // ── Coins décoratifs ──
    const drawCorner = (x, y, rotate) => {
        doc.save();
        doc.translate(x, y).rotate(rotate);
        doc.lineWidth(4).strokeColor('#c9a84c');
        doc.moveTo(0, 40).lineTo(0, 0).lineTo(40, 0).stroke();
        doc.restore();
    };
    drawCorner(38, 38, 0);
    drawCorner(W - 38, 38, 90);
    drawCorner(W - 38, H - 38, 180);
    drawCorner(38, H - 38, 270);

    // ══════════════════════════════════════════════════════════
    // ── EN-TÊTE : Logo (centré en haut) puis Basmala (dessous) ──
    // ══════════════════════════════════════════════════════════
    const headerY  = 42;
    const logoSize = 75;

    // Logo en haut, centré
    if (hasLogo) {
        doc.image(logoPath, (W / 2) - (logoSize / 2), headerY, { width: logoSize });
    }

    // Basmala centrée en dessous du logo
    const basmala = "بسم الله الرحمن الرحيم";
    const reversedBasmala = basmala.split(' ').reverse().join(' ');
    if (hasFont) {
        doc.font(fontPath)
           .fontSize(34)
           .fillColor('#c9a84c')
           .text(reversedBasmala, 0, headerY + logoSize + 8, { align: 'center', width: W });
    }

    // ── TITRE ──
    let currentY = headerY + logoSize + 55;
    doc.font('Helvetica-Bold')
       .fontSize(32)
       .fillColor('#1a3a2a')
       .text('CERTIFICAT DE RÉUSSITE', 0, currentY, { align: 'center', characterSpacing: 3 });
    currentY += 48;

    // ── Sous-titre ──
    doc.font('Helvetica').fontSize(17).fillColor('#4a6858')
       .text('Ce certificat est fièrement décerné à', 0, currentY, { align: 'center' });
    currentY += 36;

    // ── NOM de l'étudiant ──
    doc.font('Helvetica-Bold').fontSize(38).fillColor('#0d2e1c')
       .text(`${certificate.etudiant?.firstName} ${certificate.etudiant?.lastName}`.toUpperCase(), 0, currentY, { align: 'center' });
    currentY += 56;

    // ── Corps ──
    doc.font('Helvetica').fontSize(15).fillColor('#4a6858')
       .text('Pour avoir complété avec succès la session', 0, currentY, { align: 'center' });
    currentY += 28;

    // ── Nom de session ──
    const sessionName = certificate.session?.nomSession || 'Session Coranique';
    const reversedSession = sessionName.split(' ').reverse().join(' ');
    if (hasFont) {
        doc.font(fontPath).fontSize(28).fillColor('#c9a84c')
           .text(`« ${reversedSession} »`, 0, currentY, { align: 'center' });
        currentY += 42;
    }

    // ══════════════════════════════════════════════════════════
    // ── FOOTER : 3 colonnes au même niveau ──
    // ══════════════════════════════════════════════════════════
    const footerY = H - 105;

    // Ligne séparatrice au-dessus du footer
    doc.moveTo(50, footerY - 10)
       .lineTo(W - 50, footerY - 10)
       .lineWidth(0.8).stroke('#c9a84c');

    // ── Colonne GAUCHE : Jam3ia ──
    const jamiaa = "جمعية نور طيبة";
    const reversedJamiaa = jamiaa.split(' ').reverse().join(' ');
    if (hasFont) {
        doc.font(fontPath).fontSize(22).fillColor('#0d2e1c')
           .text(reversedJamiaa, 50, footerY + 8, { width: 200 });
    } else {
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#0d2e1c')
           .text('Association Nour Tayba', 50, footerY + 8);
    }

    // ── Colonne CENTRE : Durée ──
    if (certificate.session?.duree) {
        doc.font('Helvetica').fontSize(13).fillColor('#4a6858')
           .text('Durée de la formation', 0, footerY + 5, { align: 'center' });
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#0d2e1c')
           .text(`${certificate.session.duree}`, 0, footerY + 22, { align: 'center' });
    }

    // ── Colonne DROITE : Date ──
    const dateStr = new Date(certificate.dateEmission).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    doc.font('Helvetica').fontSize(13).fillColor('#4a6858')
       .text('Date de délivrance', W - 250, footerY + 5, { align: 'right', width: 200 });
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0d2e1c')
       .text(dateStr, W - 250, footerY + 22, { align: 'right', width: 200 });

    // ── ID en bas ──
    doc.font('Helvetica').fontSize(9).fillColor('rgba(100,120,110,0.5)')
       .text(`Vérification ID: ${certificate.certificateId}`, 0, H - 38, { align: 'center' });

    doc.end();
});
