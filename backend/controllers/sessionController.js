import asyncHandler from 'express-async-handler';
import Session from '../models/sessionModel.js';
import Classe from '../models/classeModel.js';
import Inscription from '../models/inscriptionModel.js';
import Matiere from '../models/matiereModel.js';
import { createCertificateRecord } from './certificateController.js';

// 1. @desc    Créer une nouvelle session
// @route   POST /api/sessions
// @access  Private (Admin)
export const createSession = asyncHandler(async (req, res) => {
    const { nomSession, classe, programme, montant, duree, dateDebut, dateFin, description, imageCouverture } = req.body;

    const missing = [];
    if (!nomSession) missing.push('nomSession');
    if (!classe) missing.push('classe');
    if (!programme) missing.push('programme');
    if (montant === undefined || montant === '') missing.push('montant');
    if (!duree) missing.push('duree');

    if (missing.length > 0) {
        res.status(400);
        throw new Error("Champs manquants: " + missing.join(', '));
    }

    if (!Array.isArray(programme) || programme.length === 0) {
        res.status(400);
        throw new Error("Le programme est vide ou invalide.");
    }

    // Extract unique teachers from the programme to keep backward compatibility
    const enseignants = [...new Set(programme.map(p => p.enseignant).filter(Boolean))];

    // Vérification stricte : Bloquer SEULEMENT si TOUTES les infos principales sont identiques
    const sessionsWithSameName = await Session.find({ nomSession });
    
    const isStrictDuplicate = sessionsWithSameName.some(s => {
        const sameClasse = Array.isArray(s.classe) 
            ? s.classe.some(c => c.toString() === classe.toString() || (Array.isArray(classe) && classe.includes(c.toString())))
            : s.classe?.toString() === classe?.toString();

        const sameMontant = s.montant === Number(montant);
        const sameDuree = s.duree === duree;
        
        const d1 = s.dateDebut ? new Date(s.dateDebut).getTime() : null;
        const d2 = dateDebut ? new Date(dateDebut).getTime() : null;
        const sameDateDebut = d1 === d2;

        const f1 = s.dateFin ? new Date(s.dateFin).getTime() : null;
        const f2 = dateFin ? new Date(dateFin).getTime() : null;
        const sameDateFin = f1 === f2;

        return sameClasse && sameMontant && sameDuree && sameDateDebut && sameDateFin;
    });

    if (isStrictDuplicate) {
        res.status(400);
        throw new Error('Une session parfaitement identique (même classe, montants, dates) existe déjà avec ce nom.');
    }

    const nouvelleSession = await Session.create({
        nomSession,
        classe,
        programme,
        enseignants,
        montant,
        duree,
        dateDebut,
        dateFin,
        description,
        imageCouverture,
        coursPublies: [] 
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
        .populate({
            path: 'classe',
            select: 'nomClasse niveau matieres anneeScolaire',
            populate: [
                {
                    path: 'matieres',
                    select: 'nomMatiere'
                }
            ]
        })
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
    // Si Admin, on retourne toutes les sessions pour faciliter les tests sur mobile
    const query = req.user.role === 'admin' ? {} : { enseignants: req.user._id };
    const sessionsRaw = await Session.find(query)
        .populate({
            path: 'classe',
            select: 'nomClasse niveau matieres',
            populate: [
                {
                    path: 'matieres',
                    select: 'nomMatiere programme'
                }
            ]
        })
        .populate({
            path: 'programme.matiere',
            select: 'nomMatiere programme'
        });

    // Ajouter le compte des étudiants pour chaque session + Lazy Migration pour les matières
    const sessions = await Promise.all(sessionsRaw.map(async (s) => {
        let hasUpdated = false;
        
        // Lazy Migration: Si p.matiere est vide, on essaie de le remplir par nom
        for (let p of s.programme) {
            if (!p.matiere) {
                const foundMat = await Matiere.findOne({ nomMatiere: p.nomMatiere });
                if (foundMat) {
                    p.matiere = foundMat._id;
                    hasUpdated = true;
                }
            }
        }
        
        if (hasUpdated) {
            await s.save();
        }

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
        .populate({
            path: 'classe',
            select: 'nomClasse niveau matieres',
            populate: [
                {
                    path: 'matieres',
                    select: 'nomMatiere programme'
                }
            ]
        })
        .populate({
            path: 'programme.matiere',
            select: 'nomMatiere programme'
        })
        .populate('enseignants', 'firstName lastName email');

    if (!session) {
        res.status(404);
        throw new Error('Session non trouvée');
    }

    // Lazy Migration pour cette session spécifique
    let hasUpdated = false;
    for (let p of session.programme) {
        if (!p.matiere) {
            const foundMat = await Matiere.findOne({ nomMatiere: p.nomMatiere });
            if (foundMat) {
                p.matiere = foundMat._id;
                hasUpdated = true;
            }
        }
    }
    if (hasUpdated) {
        await session.save();
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
        // Vérifier un doublon parfait lors de l'update
        const potentialDuplicates = await Session.find({ 
            nomSession: req.body.nomSession || session.nomSession,
            _id: { $ne: session._id }
        });

        const isStrictDuplicate = potentialDuplicates.some(s => {
            const currentClasse = req.body.classe || session.classe;
            const sameClasse = Array.isArray(s.classe) 
                ? s.classe.some(c => c.toString() === currentClasse.toString() || (Array.isArray(currentClasse) && currentClasse.includes(c.toString())))
                : s.classe?.toString() === currentClasse?.toString();

            const sameMontant = s.montant === Number(req.body.montant !== undefined ? req.body.montant : session.montant);
            const sameDuree = s.duree === (req.body.duree || session.duree);
            
            const d1 = s.dateDebut ? new Date(s.dateDebut).getTime() : null;
            const refDateDebut = req.body.dateDebut !== undefined ? req.body.dateDebut : session.dateDebut;
            const d2 = refDateDebut ? new Date(refDateDebut).getTime() : null;
            const sameDateDebut = d1 === d2;

            const f1 = s.dateFin ? new Date(s.dateFin).getTime() : null;
            const refDateFin = req.body.dateFin !== undefined ? req.body.dateFin : session.dateFin;
            const f2 = refDateFin ? new Date(refDateFin).getTime() : null;
            const sameDateFin = f1 === f2;

            return sameClasse && sameMontant && sameDuree && sameDateDebut && sameDateFin;
        });

        if (isStrictDuplicate) {
            res.status(400);
            throw new Error("Une autre session parfaitement identique existe déjà.");
        }

        session.nomSession = req.body.nomSession || session.nomSession;
        session.classe = req.body.classe || session.classe;
        
        if (req.body.programme) {
            session.programme = req.body.programme;
            session.enseignants = [...new Set(req.body.programme.map(p => p.enseignant).filter(Boolean))];
        } else if (req.body.enseignants) {
            session.enseignants = req.body.enseignants;
        }
        session.montant = req.body.montant || session.montant;
        session.duree = req.body.duree || session.duree;
        if (req.body.dateDebut !== undefined) session.dateDebut = req.body.dateDebut;
        if (req.body.dateFin !== undefined) session.dateFin = req.body.dateFin;
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

    // --- GÉNÉRATION AUTOMATIQUE DES CERTIFICATS ---
    // On cherche toutes les inscriptions approuvées pour cette session
    const inscriptions = await Inscription.find({ 
        session: session._id, 
        statut: 'approuvee' 
    });

    let autoIssuedCount = 0;
    for (const ins of inscriptions) {
        // createCertificateRecord vérifie lui-même si c'est payé
        const result = await createCertificateRecord(ins._id, req.user._id);
        if (result.success) autoIssuedCount++;
    }

    res.status(200).json({
        success: true,
        message: `Session terminée. ${autoIssuedCount} certificats émis automatiquement.`,
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