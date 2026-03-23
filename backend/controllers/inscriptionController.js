import Inscription from '../models/inscriptionModel.js';
import Session from '../models/sessionModel.js';
import User from '../models/userModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Mettre à jour le statut d'une inscription (approuvée / refusée)
// @route   PUT /api/inscriptions/:id/statut
// @access  Private (Admin)
export const updateStatutInscription = asyncHandler(async (req, res) => {
    const { statut } = req.body;

    if (!statut || !['approuvee', 'refusee', 'en_attente'].includes(statut)) {
        res.status(400);
        throw new Error("Statut invalide. Valeurs acceptées : 'approuvee', 'refusee', 'en_attente'.");
    }

    const inscription = await Inscription.findById(req.params.id);

    if (!inscription) {
        res.status(404);
        throw new Error("Inscription non trouvée.");
    }

    inscription.statut = statut;
    await inscription.save();

    const updated = await Inscription.findById(inscription._id)
        .populate('etudiant', 'firstName lastName email profileImage')
        .populate({
            path: 'session',
            select: 'nomSession montant duree',
            populate: { path: 'enseignants', select: 'firstName lastName' }
        })
        .populate('classe', 'nomClasse niveau');

    res.status(200).json({
        success: true,
        message: `Inscription ${statut === 'approuvee' ? 'approuvée' : statut === 'refusee' ? 'refusée' : 'remise en attente'} avec succès.`,
        inscription: updated
    });
});


// @desc    Inscrire un étudiant à une session
// @route   POST /api/inscriptions
// @access  Private (Étudiant / Parent)
export const inscrireEtudiant = asyncHandler(async (req, res) => {
    const { etudiant, session } = req.body; 

    // 1. Validation des champs
    if (!etudiant || !session) {
        res.status(400);
        throw new Error("Veuillez fournir l'étudiant et la session.");
    }

    // 2. Sécurité : Vérifier que l'utilisateur a le droit d'inscrire cet étudiant
    // Un étudiant ne peut inscrire que lui-même, un parent peut inscrire ses enfants
    if (req.user.role === 'student' && req.user._id.toString() !== etudiant) {
        res.status(401);
        throw new Error("Non autorisé : Vous ne pouvez pas inscrire un autre étudiant.");
    }

    if (req.user.role === 'parent') {
        const parent = await User.findById(req.user._id);
        if (!parent.children.includes(etudiant)) {
            res.status(401);
            throw new Error("Non autorisé : Cet étudiant n'est pas enregistré comme votre enfant.");
        }
    }

    // 3. Vérifier que la session existe
    const sessionExiste = await Session.findById(session);
    if (!sessionExiste) {
        res.status(404);
        throw new Error("La session spécifiée n'existe pas.");
    }

    const classe = sessionExiste.classe;

    // 4. Vérifier si l'étudiant est déjà inscrit
    const inscriptionExistante = await Inscription.findOne({ etudiant, session });
    if (inscriptionExistante) {
        res.status(400);
        throw new Error("L'étudiant est déjà inscrit à cette session.");
    }

    // 5. Créer l'inscription
    const nouvelleInscription = await Inscription.create({
        etudiant,
        session,
        classe,
        statut: 'en_attente',
        statutPaiement: 'Non Payé' // Par defaut me loul tkoun Non payé 
    });

    res.status(201).json({ 
        success: true,
        message: "Inscription réussie avec succès", 
        inscription: nouvelleInscription 
    });
});

// @desc    Récupérer les inscriptions d'une session
// @route   GET /api/inscriptions/session/:sessionId
// @access  Private (Admin / Enseignant de la session)
export const getInscriptionsParSession = asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.sessionId);

    if (!session) {
        res.status(404);
        throw new Error("Session non trouvée.");
    }

    // Sécurité : Seul l'admin ou l'un des enseignants de la session peut voir les inscriptions
    const estEnseignantAssigne = session.enseignants.some(
        (id) => id.toString() === req.user._id.toString()
    );

    if (req.user.role !== 'admin' && !estEnseignantAssigne) {
        res.status(401);
        throw new Error("Non autorisé à voir les inscriptions de cette session.");
    }

    const inscriptions = await Inscription.find({ session: req.params.sessionId })
        .populate('etudiant', 'firstName lastName email profileImage')
        .populate('classe', 'nomClasse niveau');

    res.status(200).json({
        success: true,
        count: inscriptions.length,
        inscriptions
    });
});

// @desc    Récupérer les inscriptions de l'étudiant connecté
// @route   GET /api/inscriptions
// @access  Private (Admin)
export const getAllInscriptions = asyncHandler(async (req, res) => {
    // Only Admin can see this global view
    if (req.user.role !== 'admin') {
        res.status(401);
        throw new Error("Non autorisé. Réservé aux administrateurs.");
    }

    const inscriptions = await Inscription.find({})
        .populate('etudiant', 'firstName lastName email profileImage')
        .populate({
            path: 'session',
            select: 'nomSession montant duree',
            populate: {
                path: 'enseignants',
                select: 'firstName lastName'
            }
        })
        .populate('classe', 'nomClasse niveau')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: inscriptions.length,
        inscriptions
    });
});

// @desc    Récupérer les inscriptions de l'étudiant CONNECTÉ (espace privé)
// @route   GET /api/inscriptions/my
// @access  Private (Étudiant)
export const getMyInscriptions = asyncHandler(async (req, res) => {
    // L'étudiant connecté = req.user._id
    const inscriptions = await Inscription.find({ etudiant: req.user._id })
        .populate({
            path: 'session',
            select: 'nomSession duree statut',
            populate: [
                { path: 'enseignants', select: 'firstName lastName' },
                { path: 'classe', select: 'nomClasse niveau chapitresTemplate' }
            ]
        })
        .populate('classe', 'nomClasse niveau chapitresTemplate')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: inscriptions.length,
        inscriptions
    });
});