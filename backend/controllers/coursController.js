import asyncHandler from 'express-async-handler';
import Cours from '../models/coursModel.js';
import Classe from '../models/classeModel.js';
import Inscription from '../models/inscriptionModel.js';
import User from '../models/userModel.js';
import { sendPushNotification } from './notificationController.js';

// @desc    Récupérer les cours (filtrés par professeur connecté ou par matière)
// @route   GET /api/cours
// @access  Private
const getCours = asyncHandler(async (req, res) => {
    let query = {};

    // 1. Appliquer les filtres de base (Session / Classe)
    if (req.query.sessionId) {
        query.session = req.query.sessionId;
    } else if (req.query.classeId) {
        query.session = req.query.classeId;
    }

    // 2. Filtres de sécurité et de rôle
    if (req.user.role === 'teacher') {
        // Si on n'est pas dans une session spécifique, le prof ne voit que ses cours
        if (!query.session) {
            query.professeur = req.user._id;
        }
    } else if (req.user.role === 'student' || req.user.role === 'parent') {
        // Les étudiants/parents ne voient que les cours PUBLIÉS
        query.statut = 'Publié';

        // Si on n'a pas de sessionId, on cherche toutes les sessions de l'étudiant
        if (!query.session) {
            const targetUserId = req.query.studentId || req.user._id;
            const inscriptions = await Inscription.find({
                etudiant: targetUserId,
                statut: 'approuvee'
            }).select('session');

            const sessionIds = inscriptions.map(i => i.session);

            if (sessionIds.length === 0) {
                return res.status(200).json({ success: true, count: 0, data: [] });
            }
            query.session = { $in: sessionIds };
        }
    }

    if (req.query.matiereId) {
        query.matiere = req.query.matiereId;
    }


    const cours = await Cours.find(query)
        .populate('matiere', 'nomMatiere coefficient')
        .populate('professeur', 'firstName lastName email')
        .populate('session', 'nomSession')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: cours.length,
        data: cours,
    });
});

// @desc    Créer un cours (avec fichier optionnel ou lien)
// @route   POST /api/cours
// @access  Private (Teacher/Admin)
const createCours = asyncHandler(async (req, res) => {
    const { titre, description, matiere, statut, classeId, sessionId, chapitreId, typeSupport, lienUrl } = req.body;

    if (!titre) {
        res.status(400);
        throw new Error('Le titre est requis');
    }

    const coursData = {
        titre,
        description,
        statut: statut || 'Brouillon',
        professeur: req.user._id,
    };

    if (matiere) coursData.matiere = matiere;
    if (classeId) coursData.session = classeId; // Backward compat for TeacherDashboard Add Course modal
    if (sessionId) coursData.session = sessionId;
    if (chapitreId) coursData.chapitreRef = chapitreId;

    let materielArray = [];
    if (req.file) {
        let type = 'pdf';
        if (req.file.mimetype.startsWith('video/')) type = 'video';
        else if (req.file.mimetype.startsWith('audio/')) type = 'audio';
        else if (req.file.mimetype.startsWith('image/')) type = 'image';
        
        materielArray.push({
            type,
            url: `/uploads/${req.file.filename}`,
            titre
        });
        coursData.fichier = `/uploads/${req.file.filename}`; // Backwards compat
    } else if (lienUrl) {
        materielArray.push({
            type: typeSupport === 'Vidéo' ? 'video' : typeSupport === 'Audio' ? 'audio' : 'pdf',
            url: lienUrl,
            titre
        });
        coursData.fichier = lienUrl; // Backwards compat
    }

    if (materielArray.length > 0) {
        coursData.materiel = materielArray;
    }

    const cours = await Cours.create(coursData);

    const populated = await Cours.findById(cours._id)
        .populate('matiere', 'nomMatiere coefficient')
        .populate('professeur', 'firstName lastName email')
        .populate('session', 'nomSession');

    // ✅ Notification si le cours est publié
    if (populated.statut === 'Publié' && populated.session) {
        const sessionId = populated.session._id || populated.session;
        
        // On cherche TOUS les étudiants inscrits à cette session (pour être sûr que ça marche pendant vos tests)
        const inscriptions = await Inscription.find({
            session: sessionId
        }).select('etudiant');

        const studentIds = inscriptions.map(i => i.etudiant);
        const nomSupport = populated.matiere?.nomMatiere || populated.session?.nomSession || 'Nouveau Document';
        const nomProf = `${populated.professeur?.firstName || ''} ${populated.professeur?.lastName || ''}`.trim();
        
        console.log(`[DEBUG NOTIF] Envoi à ${studentIds.length} étudiants pour la session ${populated.session?.nomSession}`);

        for (const studentId of studentIds) {
            sendPushNotification(studentId, {
                title: 'Nouveau document disponible ! 📚',
                body: `${nomProf} a partagé : ${populated.titre} (${nomSupport})`,
                type: 'cours',
                senderId: req.user._id,
                url: `/inscriptions`,
                relatedId: sessionId
            });
        }

        // ✅ Notification pour l'Admin (Confirmation de présence de l'enseignant)
        console.log(`[COURS DEBUG] Tentative d'envoi de notification admin pour le cours publié ${populated._id}`);
        const admins = await User.find({ role: 'admin' }).select('_id');
        console.log(`[COURS DEBUG] Nombre d'admins trouvés: ${admins.length}`);
        
        if (admins.length > 0) {
            const adminPromises = admins.map(admin => {
                return sendPushNotification(admin._id, {
                    title: 'Nouveau Support de Cours 📚',
                    body: `L'enseignant ${nomProf} a publié un nouveau support de cours : "${populated.titre}" (Session: ${nomSupport}).`,
                    type: 'systeme',
                    senderId: req.user._id,
                    url: '/admin/cours'
                });
            });
            await Promise.all(adminPromises);
            console.log(`[COURS DEBUG] Notifications envoyées aux admins.`);
        }
    }

    res.status(201).json({
        success: true,
        message: 'Cours créé avec succès',
        data: populated,
    });
});

// @desc    Mettre à jour un cours
// @route   PUT /api/cours/:id
// @access  Private (Teacher who owns it / Admin)
const updateCours = asyncHandler(async (req, res) => {
    const cours = await Cours.findById(req.params.id);

    if (!cours) {
        res.status(404);
        throw new Error('Cours non trouvé');
    }

    // Seul le propriétaire ou l'admin peut modifier
    if (cours.professeur.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Non autorisé');
    }

    const wasDraft = cours.statut === 'Brouillon';

    // Mise à jour des champs
    cours.titre = req.body.titre || cours.titre;
    cours.description = req.body.description ?? cours.description;
    cours.statut = req.body.statut || cours.statut;
    cours.matiere = req.body.matiere || cours.matiere;

    if (req.file) {
        cours.fichier = `/uploads/${req.file.filename}`;
    }

    const updated = await cours.save();

    const populated = await Cours.findById(updated._id)
        .populate('matiere', 'nomMatiere')
        .populate('professeur', 'firstName lastName')
        .populate('session', 'nomSession');

    // ✅ Notification si le cours passe en "Publié"
    if (populated.statut === 'Publié' && populated.session) {
        const sessionId = populated.session._id || populated.session;
        
        // On cherche tous les étudiants inscrits (approuvés ou en attente pour les tests)
        const inscriptions = await Inscription.find({ session: sessionId }).select('etudiant');

        const studentIds = inscriptions.map(i => i.etudiant);
        const nomSupport = populated.matiere?.nomMatiere || populated.session?.nomSession || 'Nouveau Document';
        const nomProf = `${populated.professeur?.firstName || ''} ${populated.professeur?.lastName || ''}`.trim();

        for (const studentId of studentIds) {
            sendPushNotification(studentId, {
                title: 'Document mis à jour ! 📚',
                body: `${nomProf} a partagé : ${populated.titre} (${nomSupport})`,
                type: 'cours',
                senderId: req.user._id,
                url: `/inscriptions`,
                relatedId: sessionId
            });
        }

        // ✅ Notification pour l'Admin (Confirmation de présence de l'enseignant)
        console.log(`[COURS DEBUG] Tentative d'envoi de notification admin pour la MAJ du cours ${populated._id}`);
        const admins = await User.find({ role: 'admin' }).select('_id');
        console.log(`[COURS DEBUG] Nombre d'admins trouvés: ${admins.length}`);
        
        if (admins.length > 0) {
            const adminPromises = admins.map(admin => {
                return sendPushNotification(admin._id, {
                    title: 'Cours Mis à Jour 📚',
                    body: `L'enseignant ${nomProf} a mis à jour le support de cours : "${populated.titre}" (Session: ${nomSupport}).`,
                    type: 'systeme',
                    senderId: req.user._id,
                    url: '/admin/cours'
                });
            });
            await Promise.all(adminPromises);
            console.log(`[COURS DEBUG] Notifications envoyées aux admins.`);
        }
    }

    res.status(200).json({
        success: true,
        message: 'Cours mis à jour avec succès',
        data: populated,
    });
});

// @desc    Supprimer un cours
// @route   DELETE /api/cours/:id
// @access  Private (Teacher who owns it / Admin)
const deleteCours = asyncHandler(async (req, res) => {
    const cours = await Cours.findById(req.params.id);

    if (!cours) {
        res.status(404);
        throw new Error('Cours non trouvé');
    }

    if (cours.professeur.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Non autorisé à supprimer ce cours');
    }

    await cours.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Cours supprimé avec succès',
        id: req.params.id,
    });
});

export { getCours, createCours, updateCours, deleteCours };
