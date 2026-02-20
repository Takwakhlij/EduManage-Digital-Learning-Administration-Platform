
import asyncHandler from 'express-async-handler';
import Matiere from '../models/matiereModel.js';
import Classe from '../models/classeModel.js';

// @desc    Get all matieres
// @route   GET /api/matieres
// @access  Private
const getMatieres = asyncHandler(async (req, res) => {
    console.log('GET /api/matieres request received');
    try {
        const matieres = await Matiere.find()
            .populate('classe', 'nomClasse')
            .populate('professeurs', 'firstName lastName email');
        console.log(`Found ${matieres.length} matieres`);
        res.status(200).json(matieres);
    } catch (error) {
        console.error('Error in getMatieres:', error);
        throw error;
    }
});

// @desc    Create new matiere
// @route   POST /api/matieres
// @access  Private (Admin only)
const createMatiere = asyncHandler(async (req, res) => {
    if (!req.body.nomMatiere) {
        res.status(400);
        throw new Error('Veuillez ajouter un nom de matière');
    }

    if (!req.body.classe) {
        res.status(400);
        throw new Error('Veuillez sélectionner une classe');
    }

    const matiere = await Matiere.create({
        nomMatiere: req.body.nomMatiere,
        coefficient: req.body.coefficient,
        description: req.body.description,
        classe: req.body.classe,
        professeurs: req.body.professeurs || [],
    });

    // Add matiere to classe
    // Add matiere to classe AND add professors to classe
    await Classe.findByIdAndUpdate(
        req.body.classe,
        {
            $push: { matieres: matiere._id },
            $addToSet: { professeurs: { $each: req.body.professeurs || [] } }
        },
        { new: true }
    );

    // Populate the response
    const populatedMatiere = await Matiere.findById(matiere._id)
        .populate('classe', 'nomClasse')
        .populate('professeurs', 'firstName lastName email');

    res.status(200).json(populatedMatiere);
});

// @desc    Delete matiere
// @route   DELETE /api/matieres/:id
// @access  Private (Admin only)
const deleteMatiere = asyncHandler(async (req, res) => {
    const matiere = await Matiere.findById(req.params.id);

    if (!matiere) {
        res.status(404);
        throw new Error('Matière non trouvée');
    }

    // Remove matiere from classe
    if (matiere.classe) {
        await Classe.findByIdAndUpdate(
            matiere.classe,
            { $pull: { matieres: matiere._id } }
        );
    }

    await matiere.deleteOne();

    res.status(200).json({ id: req.params.id });
});

export { getMatieres, createMatiere, deleteMatiere };
