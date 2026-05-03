import asyncHandler from 'express-async-handler';
import Actualite from '../models/actualiteModel.js';
import User from '../models/userModel.js';
import { sendPushNotification } from './notificationController.js';
import fs from 'fs';
import path from 'path';

// @desc    Récupérer toutes les actualités
// @route   GET /api/actualites
// @access  Public
export const getActualites = asyncHandler(async (req, res) => {
    const actualites = await Actualite.find().sort({ dateCreation: -1 });
    res.status(200).json({ success: true, count: actualites.length, data: actualites });
});

// @desc    Créer une nouvelle actualité
// @route   POST /api/actualites
// @access  Private (Admin)
export const createActualite = asyncHandler(async (req, res) => {
    const { titre, description } = req.body;

    if (!titre || !description) {
        res.status(400);
        throw new Error('Le titre et la description sont requis');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('Une image est requise');
    }

    const imagePath = `/uploads/actualites/${req.file.filename}`;

    const actualite = await Actualite.create({
        titre,
        description,
        image: imagePath,
        dateEvenement: req.body.dateEvenement || null
    });

    // ── Répondre immédiatement ──
    res.status(201).json({ success: true, data: actualite });

    // ── Envoyer une notification push à TOUS les utilisateurs (async, sans bloquer) ──
    try {
        const users = await User.find({
            role: { $in: ['student', 'parent', 'teacher'] },
            status: 'active'
        }).select('_id');

        console.log(`[ACTUALITE] Envoi de notifications push à ${users.length} utilisateur(s)...`);

        const notifPromises = users.map(user =>
            sendPushNotification(user._id, {
                title: `📢 Nouvelle annonce : ${titre}`,
                body: description.length > 100 ? description.substring(0, 97) + '...' : description,
                type: 'actualite',
                senderId: req.user._id,
                url: '/'
            }).catch(err => console.error(`[ACTUALITE] Erreur push pour ${user._id}:`, err.message))
        );

        await Promise.all(notifPromises);
        console.log(`[ACTUALITE] Notifications envoyées avec succès.`);
    } catch (err) {
        console.error('[ACTUALITE] Erreur lors de l\'envoi des notifications:', err.message);
    }
});

// @desc    Mettre à jour une actualité
// @route   PUT /api/actualites/:id
// @access  Private (Admin)
export const updateActualite = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { titre, description } = req.body;

    let actualite = await Actualite.findById(id);

    if (!actualite) {
        res.status(404);
        throw new Error('Actualité non trouvée');
    }

    // Préparer les nouvelles données
    const updatedData = {};
    if (titre) updatedData.titre = titre;
    if (description) updatedData.description = description;
    if (req.body.dateEvenement !== undefined) {
        updatedData.dateEvenement = req.body.dateEvenement || null;
    }

    // S'il y a une nouvelle image, on supprime l'ancienne (optionnel mais propre) et on met la nouvelle
    if (req.file) {
        // Optionnel : supprimer l'ancienne image du disque
        if (actualite.image) {
            const oldPath = path.join(process.cwd(), actualite.image);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
        updatedData.image = `/uploads/actualites/${req.file.filename}`;
    }

    actualite = await Actualite.findByIdAndUpdate(id, updatedData, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: actualite });
});

// @desc    Supprimer une actualité
// @route   DELETE /api/actualites/:id
// @access  Private (Admin)
export const deleteActualite = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const actualite = await Actualite.findById(id);

    if (!actualite) {
        res.status(404);
        throw new Error('Actualité non trouvée');
    }

    // Supprimer l'image du disque
    if (actualite.image) {
        const imagePath = path.join(process.cwd(), actualite.image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    await actualite.deleteOne();

    res.status(200).json({ success: true, message: 'Actualité supprimée' });
});
