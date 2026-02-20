import asyncHandler from 'express-async-handler';
import Classe from '../models/classeModel.js';

// @desc    Créer une nouvelle classe
// @route   POST /api/classes
// @access  Private/Admin
const createClasse = asyncHandler(async (req, res) => {
    const { nomClasse, niveau, anneeScolaire } = req.body;

    // Validation des champs
    if (!nomClasse || !niveau || !anneeScolaire) {
        res.status(400);
        throw new Error('Veuillez remplir tous les champs requis');
    }

    // Vérifier si la classe existe déjà pour cette année
    const classeExists = await Classe.findOne({ nomClasse, anneeScolaire });

    if (classeExists) {
        res.status(400);
        throw new Error('Cette classe existe déjà pour cette année scolaire');
    }

    // Créer la classe
    const classe = await Classe.create({
        nomClasse,
        niveau,
        anneeScolaire,
        professeurs: req.body.professeurs,
        matieres: req.body.matieres,
        admin: req.user._id, // Admin qui crée la classe
    });

    if (classe) {
        res.status(201).json({
            success: true,
            message: 'Classe créée avec succès',
            data: {
                _id: classe._id,
                nomClasse: classe.nomClasse,
                niveau: classe.niveau,
                anneeScolaire: classe.anneeScolaire,
                admin: classe.admin,
                createdAt: classe.createdAt,
                updatedAt: classe.updatedAt,
            },
        });
    } else {
        res.status(400);
        throw new Error('Données de classe invalides');
    }
});

// @desc    Récupérer toutes les classes
// @route   GET /api/classes
// @access  Private
const getClasses = asyncHandler(async (req, res) => {
    const classes = await Classe.find({})
        .populate('admin', 'firstName lastName email')
        .populate('professeurs', 'firstName lastName email specialization')
        .populate('matieres', 'nomMatiere coefficient')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: classes.length,
        data: classes,
    });
});

// @desc    Récupérer une classe par ID
// @route   GET /api/classes/:id
// @access  Private
const getClasseById = asyncHandler(async (req, res) => {
    const classe = await Classe.findById(req.params.id)
        .populate('admin', 'firstName lastName email')
        .populate('professeurs', 'firstName lastName email specialization')
        .populate('matieres', 'nomMatiere coefficient');

    if (classe) {
        res.json({
            success: true,
            data: classe,
        });
    } else {
        res.status(404);
        throw new Error('Classe non trouvée');
    }
});

// @desc    Modifier une classe
// @route   PUT /api/classes/:id
// @access  Private/Admin
const updateClasse = asyncHandler(async (req, res) => {
    const classe = await Classe.findById(req.params.id);

    if (classe) {
        classe.nomClasse = req.body.nomClasse || classe.nomClasse;
        classe.niveau = req.body.niveau || classe.niveau;
        classe.anneeScolaire = req.body.anneeScolaire || classe.anneeScolaire;
        classe.professeurs = req.body.professeurs || classe.professeurs;
        classe.matieres = req.body.matieres || classe.matieres;

        const updatedClasse = await classe.save();

        res.json({
            success: true,
            message: 'Classe modifiée avec succès',
            data: updatedClasse,
        });
    } else {
        res.status(404);
        throw new Error('Classe non trouvée');
    }
});

// @desc    Supprimer une classe
// @route   DELETE /api/classes/:id
// @access  Private/Admin
const deleteClasse = asyncHandler(async (req, res) => {
    const classe = await Classe.findById(req.params.id);

    if (classe) {
        await classe.deleteOne();
        res.json({
            success: true,
            message: 'Classe supprimée avec succès',
        });
    } else {
        res.status(404);
        throw new Error('Classe non trouvée');
    }
});

// @desc    Ajouter un professeur à une classe
// @route   PUT /api/classes/:id/professeurs
// @access  Private/Admin
const addProfesseurToClasse = asyncHandler(async (req, res) => {
    const { professeurId } = req.body;
    const classe = await Classe.findById(req.params.id);

    if (!classe) {
        res.status(404);
        throw new Error('Classe non trouvée');
    }

    // Vérifier si le professeur est déjà dans la classe
    if (classe.professeurs.includes(professeurId)) {
        res.status(400);
        throw new Error('Ce professeur est déjà assigné à cette classe');
    }

    classe.professeurs.push(professeurId);
    await classe.save();

    const updatedClasse = await Classe.findById(req.params.id)
        .populate('professeurs', 'firstName lastName email specialization');

    res.json({
        success: true,
        message: 'Professeur ajouté avec succès',
        data: updatedClasse,
    });
});

// @desc    Retirer un professeur d'une classe
// @route   DELETE /api/classes/:id/professeurs/:profId
// @access  Private/Admin
const removeProfesseurFromClasse = asyncHandler(async (req, res) => {
    const classe = await Classe.findById(req.params.id);

    if (!classe) {
        res.status(404);
        throw new Error('Classe non trouvée');
    }

    classe.professeurs = classe.professeurs.filter(
        (prof) => prof.toString() !== req.params.profId
    );

    await classe.save();

    res.json({
        success: true,
        message: 'Professeur retiré avec succès',
        data: classe,
    });
});

export {
    createClasse,
    getClasses,
    getClasseById,
    updateClasse,
    deleteClasse,
    addProfesseurToClasse,
    removeProfesseurFromClasse,
};
