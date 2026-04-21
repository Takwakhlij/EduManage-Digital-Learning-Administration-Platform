
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
            .populate('classes', 'nomClasse');
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

    if (!req.body.classes || (Array.isArray(req.body.classes) && req.body.classes.length === 0)) {
        res.status(400);
        throw new Error('Veuillez sélectionner au moins une classe');
    }

    const matiere = await Matiere.create({
        nomMatiere: req.body.nomMatiere,
        classes: Array.isArray(req.body.classes) ? req.body.classes : [req.body.classes],
        programme: req.body.programme || [],
    });

    // Add matiere to all selected classes
    const classesToUpdate = Array.isArray(req.body.classes) ? req.body.classes : [req.body.classes];
    await Promise.all(classesToUpdate.map(classeId => 
        Classe.findByIdAndUpdate(
            classeId,
            { $push: { matieres: matiere._id } },
            { new: true }
        )
    ));

    // Populate the response
    const populatedMatiere = await Matiere.findById(matiere._id)
        .populate('classes', 'nomClasse');

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

    // Remove matiere from all associated classes
    if (matiere.classes && matiere.classes.length > 0) {
        await Promise.all(matiere.classes.map(classeId =>
            Classe.findByIdAndUpdate(
                classeId,
                { $pull: { matieres: matiere._id } }
            )
        ));
    }

    await matiere.deleteOne();

    res.status(200).json({ id: req.params.id });
});

// @desc    Update matiere
// @route   PUT /api/matieres/:id
// @access  Private (Admin only)
const updateMatiere = asyncHandler(async (req, res) => {
    const { nomMatiere, classes, programme } = req.body;
    const matiere = await Matiere.findById(req.params.id);

    if (!matiere) {
        res.status(404);
        throw new Error('Matière non trouvée');
    }

    // 1. Gérer les changements de classes (Old classes vs New classes)
    const oldClasses = matiere.classes.map(id => id.toString());
    const newClasses = classes ? (Array.isArray(classes) ? classes.map(id => id.toString()) : [classes.toString()]) : oldClasses;

    // Remove from classes that are no longer associated
    const classesToRemove = oldClasses.filter(id => !newClasses.includes(id));
    await Promise.all(classesToRemove.map(classeId =>
        Classe.findByIdAndUpdate(classeId, { $pull: { matieres: matiere._id } })
    ));

    // Add to new classes
    const classesToAdd = newClasses.filter(id => !oldClasses.includes(id));
    await Promise.all(classesToAdd.map(classeId =>
        Classe.findByIdAndUpdate(classeId, { $addToSet: { matieres: matiere._id } })
    ));

    // 2. Update the matiere itself
    matiere.nomMatiere = nomMatiere || matiere.nomMatiere;
    matiere.classes = newClasses;
    if (programme) {
        matiere.programme = programme;
    }

    const updatedMatiere = await matiere.save();

    // 3. Populate and respond
    const populated = await Matiere.findById(updatedMatiere._id)
        .populate('classes', 'nomClasse');

    res.status(200).json(populated);
});

export { getMatieres, createMatiere, deleteMatiere, updateMatiere };
