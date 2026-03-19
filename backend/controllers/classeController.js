import asyncHandler from 'express-async-handler';
import Classe from '../models/classeModel.js';

// @desc    Créer une nouvelle classe
// @route   POST /api/classes
// @access  Private/Admin
const createClasse = asyncHandler(async (req, res) => {
    const { nomClasse, niveau, chapitresTemplate } = req.body;

    // Validation des champs
    if (!nomClasse || !niveau) {
        res.status(400);
        throw new Error('Veuillez remplir tous les champs requis');
    }

    // Vérifier si la classe existe déjà
    const classeExists = await Classe.findOne({ nomClasse, niveau });

    if (classeExists) {
        res.status(400);
        throw new Error('Cette classe existe déjà');
    }

    // Créer la classe
    const classe = await Classe.create({
        nomClasse,
        niveau,
        chapitresTemplate: chapitresTemplate || []
    });

    if (classe) {
        res.status(201).json({
            success: true,
            message: 'Classe créée avec succès',
            data: classe
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
    // On récupère juste les classes, l'affectation se fait dans "Sessions"
    const classes = await Classe.find({}).sort({ createdAt: -1 });

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
    const classe = await Classe.findById(req.params.id);

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
        if (req.body.chapitresTemplate) {
            classe.chapitresTemplate = req.body.chapitresTemplate;
        }

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

export {
    createClasse,
    getClasses,
    getClasseById,
    updateClasse,
    deleteClasse
};