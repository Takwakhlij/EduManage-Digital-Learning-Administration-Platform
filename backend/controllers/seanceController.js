import asyncHandler from 'express-async-handler';
import Seance from '../models/seanceModel.js';
import Session from '../models/sessionModel.js';

// @desc    Récupérer toutes les séances (pour le calendrier global)
// @route   GET /api/seances
// @access  Private/Admin
export const getAllSeances = asyncHandler(async (req, res) => {
    const seances = await Seance.find({})
        .populate('session', 'nomSession')
        .populate('classe', 'nomClasse niveau')
        .populate('matiere', 'nomMatiere')
        .populate('enseignant', 'firstName lastName email')
        .sort({ jour: 1, heureDebut: 1 });

    res.json(seances);
});

// @desc    Récupérer une séance spécifique par ID
// @route   GET /api/seances/:id
// @access  Private
export const getSeanceById = asyncHandler(async (req, res) => {
    const seance = await Seance.findById(req.params.id)
        .populate('session', 'nomSession')
        .populate('matiere', 'nomMatiere')
        .populate('enseignant', 'firstName lastName email');

    if (seance) {
        res.json(seance);
    } else {
        res.status(404);
        throw new Error('Séance non trouvée');
    }
});

// @desc    Créer une nouvelle séance
// @route   POST /api/seances
// @access  Private/Admin
export const createSeance = asyncHandler(async (req, res) => {
    const { session, classe, matiere, enseignant, jour, heureDebut, heureFin, salle, type, lienReunion } = req.body;

    // Vérifier si la session parente existe
    const sessionExists = await Session.findById(session);
    if (!sessionExists) {
        res.status(404);
        throw new Error('Session non trouvée');
    }

    // --- DÉTECTION DE COLLISION ---
    const query = { jour };
    const existingSeances = await Seance.find(query);

    for (const s of existingSeances) {
        // Chevauchement si : start1 < end2 ET start2 < end1
        if (heureDebut < s.heureFin && s.heureDebut < heureFin) {
            if (classe && s.classe && s.classe.toString() === classe.toString()) {
                res.status(400);
                throw new Error(`La classe a déjà une séance de ${s.heureDebut} à ${s.heureFin}`);
            }
            if (enseignant && s.enseignant && s.enseignant.toString() === enseignant.toString()) {
                res.status(400);
                throw new Error(`L'enseignant est déjà occupé de ${s.heureDebut} à ${s.heureFin}`);
            }
            if (salle && salle !== 'Non assignée' && s.salle === salle) {
                res.status(400);
                throw new Error(`La salle "${salle}" est déjà réservée de ${s.heureDebut} à ${s.heureFin}`);
            }
        }
    }
    // ------------------------------

    const seance = await Seance.create({
        session,
        classe,
        matiere,
        enseignant,
        jour,
        heureDebut,
        heureFin,
        salle,
        type,
        lienReunion
    });

    if (seance) {
        res.status(201).json(seance);
    } else {
        res.status(400);
        throw new Error('Données de la séance invalides');
    }
});

// @desc    Récupérer toutes les séances d'une session spécifique
// @route   GET /api/seances/session/:sessionId
// @access  Private
export const getSeancesBySession = asyncHandler(async (req, res) => {
    const seances = await Seance.find({ session: req.params.sessionId })
        .populate('session', 'nomSession')
        .populate('classe', 'nomClasse niveau')
        .populate('matiere', 'nomMatiere')
        .populate('enseignant', 'firstName lastName nom prenom email')
        .sort({ jour: 1, heureDebut: 1 });

    res.json(seances);
});

// @desc    Récupérer toutes les séances d'un enseignant spécifique
// @route   GET /api/seances/enseignant/:enseignantId
// @access  Private (Teacher/Admin)
export const getSeancesByEnseignant = asyncHandler(async (req, res) => {
    const seances = await Seance.find({ enseignant: req.params.enseignantId })
        .populate({
            path: 'session',
            select: 'nomSession classe',
            populate: { path: 'classe', select: 'nomClasse niveau' }
        })
        .populate('matiere', 'nomMatiere')
        .sort({ jour: 1, heureDebut: 1 });

    res.json(seances);
});

// @desc    Mettre à jour une séance
// @route   PUT /api/seances/:id
// @access  Private/Admin
export const updateSeance = asyncHandler(async (req, res) => {
    const seance = await Seance.findById(req.params.id);

    if (seance) {
        const jour = req.body.jour || seance.jour;
        const heureDebut = req.body.heureDebut || seance.heureDebut;
        const heureFin = req.body.heureFin || seance.heureFin;
        const salle = req.body.salle || seance.salle;
        const enseignant = req.body.enseignant || seance.enseignant;

        // --- DÉTECTION DE COLLISION (Exclure la séance actuelle) ---
        const query = { jour, _id: { $ne: req.params.id } };
        const existingSeances = await Seance.find(query);

        for (const s of existingSeances) {
            if (heureDebut < s.heureFin && s.heureDebut < heureFin) {
                if (seance.classe && s.classe && s.classe.toString() === seance.classe.toString()) {
                    res.status(400);
                    throw new Error(`La classe a déjà une séance de ${s.heureDebut} à ${s.heureFin}`);
                }
                if (enseignant && s.enseignant && s.enseignant.toString() === enseignant.toString()) {
                    res.status(400);
                    throw new Error(`L'enseignant est déjà occupé de ${s.heureDebut} à ${s.heureFin}`);
                }
                if (salle && salle !== 'Non assignée' && s.salle === salle) {
                    res.status(400);
                    throw new Error(`La salle "${salle}" est déjà occupée de ${s.heureDebut} à ${s.heureFin}`);
                }
            }
        }
        // ------------------------------------------------------------

        seance.jour = jour;
        seance.heureDebut = heureDebut;
        seance.heureFin = heureFin;
        seance.salle = salle;
        seance.type = req.body.type || seance.type;
        seance.lienReunion = req.body.lienReunion !== undefined ? req.body.lienReunion : seance.lienReunion;
        
        if (req.body.enseignant) seance.enseignant = req.body.enseignant;
        if (req.body.matiere) seance.matiere = req.body.matiere;

        const updatedSeance = await seance.save();
        res.json(updatedSeance);
    } else {
        res.status(404);
        throw new Error('Séance non trouvée');
    }
});

// @desc    Supprimer une séance
// @route   DELETE /api/seances/:id
// @access  Private/Admin
export const deleteSeance = asyncHandler(async (req, res) => {
    const seance = await Seance.findById(req.params.id);

    if (seance) {
        await seance.deleteOne();
        res.json({ message: 'Séance supprimée avec succès' });
    } else {
        res.status(404);
        throw new Error('Séance non trouvée');
    }
});
