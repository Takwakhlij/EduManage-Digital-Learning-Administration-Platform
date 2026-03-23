import asyncHandler from 'express-async-handler';
import Cours from '../models/coursModel.js';
import Classe from '../models/classeModel.js';
import Inscription from '../models/inscriptionModel.js';

// @desc    Récupérer les cours (filtrés par professeur connecté ou par matière)
// @route   GET /api/cours
// @access  Private
const getCours = asyncHandler(async (req, res) => {
    let query = {};

    if (req.user.role === 'teacher') {
        // L'enseignant ne voit que ses propres cours
        query.professeur = req.user._id;
    } else if (req.user.role === 'student' || req.user.role === 'parent') {
        // Utiliser studentId (fourni par le frontend, ex: parent consultant l'enfant)
        // ou l'ID de l'utilisateur connecté lui-même (étudiant direct)
        const targetUserId = req.query.studentId || req.user._id;

        // ✅ Chercher les sessions où l'étudiant a une inscription APPROUVÉE
        const inscriptions = await Inscription.find({
            etudiant: targetUserId,
            statut: 'approuvee'
        }).select('session');

        const sessionIds = inscriptions.map(i => i.session);

        // Si aucune inscription approuvée, retourner tableau vide
        if (sessionIds.length === 0) {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        query.session = { $in: sessionIds };
        query.statut = 'Publié';
    }

    if (req.query.classeId) {
        query.session = req.query.classeId; // Backward compat
    }
    if (req.query.sessionId) {
        query.session = req.query.sessionId;
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

    // Only the cours owner or admin can update
    if (cours.professeur.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Non autorisé à modifier ce cours');
    }

    cours.titre = req.body.titre || cours.titre;
    cours.description = req.body.description ?? cours.description;
    cours.statut = req.body.statut || cours.statut;
    cours.matiere = req.body.matiere || cours.matiere;

    if (req.file) {
        cours.fichier = `/uploads/${req.file.filename}`;
    }

    const updated = await cours.save();

    const populated = await Cours.findById(updated._id)
        .populate('matiere', 'nomMatiere coefficient')
        .populate('professeur', 'firstName lastName email');

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
