import asyncHandler from 'express-async-handler';
import Session from '../models/sessionModel.js';
import Classe from '../models/classeModel.js';
import Inscription from '../models/inscriptionModel.js';

// 1. @desc    Créer une nouvelle session
// @route   POST /api/sessions
// @access  Private (Admin)
export const createSession = asyncHandler(async (req, res) => {
    const { nomSession, classe, enseignants, montant, duree, description, imageCouverture } = req.body;

    // Vérifier que tous les champs sont là (classe et enseignants sont obligatoires)
    if (!nomSession || !classe || !enseignants || !montant || !duree) {
        res.status(400);
        throw new Error("Veuillez remplir tous les champs obligatoires.");
    }

    // Vérifier que enseignants est bien un tableau et n'est pas vide
    if (!Array.isArray(enseignants) || enseignants.length === 0) {
        res.status(400);
        throw new Error("Veuillez affecter au moins un enseignant à cette session.");
    }

    const nouvelleSession = await Session.create({
        nomSession,
        classe,
        enseignants,
        montant,
        duree,
        description,
        imageCouverture,
        coursPublies: [] // Vide au début, le prof ajoutera ses cours plus tard
    });

    res.status(201).json({
        success: true,
        message: "Session créée avec succès",
        session: nouvelleSession
    });
});

// 2. @desc    Récupérer toutes les sessions (Filtré pour Etudiants / Complet pour Admin)
// @route   GET /api/sessions
// @access  Private
export const getAllSessions = asyncHandler(async (req, res) => {
    let query = {};

    // Si l'utilisateur n'est pas admin, il ne voit que ce qui est publié
    if (req.user.role !== 'admin') {
        query.isPublished = true;
    }

    const sessionsRaw = await Session.find(query)
        .populate('classe', 'nomClasse niveau')
        .populate('enseignants', 'firstName lastName email');

    // Ajouter le compte des étudiants pour chaque session + migration "lazy" pour isPublished
    const sessions = await Promise.all(sessionsRaw.map(async (s) => {
        const etudiantsCount = await Inscription.countDocuments({ session: s._id });
        
        // Migration "lazy": si isPublished est undefined, on le traite comme true (selon le schema)
        if (s.isPublished === undefined) {
            s.isPublished = true;
            await s.save();
        }

        return {
            ...s.toObject(),
            etudiantsCount
        };
    }));

    res.status(200).json({
        success: true,
        count: sessions.length,
        sessions
    });
});

// @desc    Récupérer les sessions publiées (Public - sans token)
// @route   GET /api/sessions/published
// @access  Public
export const getPublishedSessions = asyncHandler(async (req, res) => {
    // On récupère les sessions où isPublished est true OU undefined (migration lazy)
    const sessions = await Session.find({ 
        isPublished: { $ne: false } 
    })
        .populate('classe', 'nomClasse niveau')
        .populate('enseignants', 'firstName lastName');

    res.status(200).json({
        success: true,
        count: sessions.length,
        sessions
    });
});

// @desc    Récupérer les sessions de l'enseignant connecté
// @route   GET /api/sessions/teacher
// @access  Private (Teacher)
export const getTeacherSessions = asyncHandler(async (req, res) => {
    const sessionsRaw = await Session.find({ enseignants: req.user._id })
        .populate('classe', 'nomClasse niveau chapitresTemplate');

    // Ajouter le compte des étudiants pour chaque session
    const sessions = await Promise.all(sessionsRaw.map(async (s) => {
        const etudiantsCount = await Inscription.countDocuments({ session: s._id });
        return {
            ...s.toObject(),
            etudiantsCount
        };
    }));

    res.status(200).json({
        success: true,
        count: sessions.length,
        sessions
    });
});

// 3. @desc    Récupérer les détails d'une seule session par son ID
// @route   GET /api/sessions/:id
// @access  Private
export const getSessionById = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id)
        .populate('classe', 'nomClasse niveau chapitresTemplate')
        .populate('enseignants', 'firstName lastName email');

    if (!session) {
        res.status(404);
        throw new Error("Session non trouvée");
    }
    res.status(200).json({
        success: true,
        session
    });
});

// 4. @desc    Ajouter un cours (PDF/Vidéo) à la session
// @route   PUT /api/sessions/:id/cours
// @access  Private (Enseignant)
export const ajouterCoursSession = asyncHandler(async (req, res) => {
    const { titreCours, typeFichier, urlFichier } = req.body;

    if (!titreCours || !typeFichier || !urlFichier) {
        res.status(400);
        throw new Error("Veuillez fournir le titre, le type et le lien du fichier.");
    }

    const session = await Session.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error("Session non trouvée");
    }

    // Sécurité: Vérifier que c'est bien l'un des enseignants de cette session qui fait la modification ou un admin
    const estEnseignantAssigne = session.enseignants.some(
        (id) => id.toString() === req.user._id.toString()
    );

    if (!estEnseignantAssigne && req.user.role !== 'admin') {
        res.status(401);
        throw new Error("Non autorisé : Vous n'êtes pas l'un des enseignants assignés à cette session");
    }

    // On ajoute le nouveau fichier (PDF/Video) dans le tableau "coursPublies"
    session.coursPublies.push({
        titreCours,
        typeFichier,
        urlFichier
    });

    await session.save(); // On sauvegarde la modification

    res.status(200).json({
        success: true,
        message: "Cours ajouté avec succès",
        session
    });
});

// 5. @desc    Modifier une session existante
// @route   PUT /api/sessions/:id
// @access  Private (Admin)
export const updateSession = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id);

    if (session) {
        session.nomSession = req.body.nomSession || session.nomSession;
        session.classe = req.body.classe || session.classe;
        session.enseignants = req.body.enseignants || session.enseignants;
        session.montant = req.body.montant || session.montant;
        session.duree = req.body.duree || session.duree;
        session.description = req.body.description || session.description;
        session.imageCouverture = req.body.imageCouverture || session.imageCouverture;
        session.statut = req.body.statut || session.statut;

        if (req.body.isPublished !== undefined) {
            session.isPublished = req.body.isPublished;
        }

        const updatedSession = await session.save();

        res.json({
            success: true,
            message: 'Session modifiée avec succès',
            session: updatedSession.toObject(),
        });
    } else {
        res.status(404);
        throw new Error('Session non trouvée');
    }
});

// 7. @desc    Marquer une session comme terminée
// @route   PUT /api/sessions/:id/complete
// @access  Private (Enseignant / Admin)
export const completeSession = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error("Session non trouvée");
    }

    // Sécurité: Seul l'un des enseignants de la session ou un admin peut la clôturer
    const estEnseignantAssigne = session.enseignants.some(
        (id) => id.toString() === req.user._id.toString()
    );

    if (!estEnseignantAssigne && req.user.role !== 'admin') {
        res.status(401);
        throw new Error("Non autorisé : Vous ne pouvez pas clôturer cette session");
    }

    session.statut = 'Terminée';
    await session.save();

    res.status(200).json({
        success: true,
        message: "Session marquée comme terminée",
        session: session.toObject()
    });
});

// 8. @desc    Activer/Désactiver la publication d'une session
// @route   PUT /api/sessions/:id/toggle-publish
// @access  Private (Admin)
export const togglePublishSession = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id);

    if (!session) {
        res.status(404);
        throw new Error("Session non trouvée");
    }

    // Correct logic: if it's explicitly true, make it false. Otherwise (false or undefined), make it true.
    session.isPublished = session.isPublished === true ? false : true;
    await session.save();

    // Re-fetch with population to satisfy frontend state
    const updatedSession = await Session.findById(req.params.id)
        .populate('classe', 'nomClasse niveau')
        .populate('enseignants', 'firstName lastName email');

    // Count students to match the format expected by getAllSessions
    const etudiantsCount = await Inscription.countDocuments({ session: updatedSession._id });

    res.status(200).json({
        success: true,
        message: updatedSession.isPublished ? "Session publiée" : "Session masquée",
        session: {
            ...updatedSession.toObject(),
            etudiantsCount
        }
    });
});

// 6. @desc    Supprimer une session
// @route   DELETE /api/sessions/:id
// @access  Private (Admin)
export const deleteSession = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id);

    if (session) {
        await session.deleteOne();
        res.json({
            success: true,
            message: 'Session supprimée avec succès',
        });
    } else {
        res.status(404);
        throw new Error('Session non trouvée');
    }
});