import mongoose from 'mongoose';

const classeSchema = new mongoose.Schema({
    nomClasse: {
        type: String,
        required: [true, 'Veuillez ajouter un nom de classe'],
        trim: true,
    },
    niveau: {
        type: String,
        required: [true, 'Veuillez ajouter un niveau (ex: < 6ans, Primaire...)'],
    },
    anneeScolaire: {
        type: String,
        default: '2025/2026' // Valeur par défaut si non spécifié
    },
    matieres: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Matiere'
    }]
}, { timestamps: true });

// Bech net2akdou elli ma famech zouz classes 3andhom nafs l'esm w nafs e-niveau
classeSchema.index({ nomClasse: 1, niveau: 1 }, { unique: true });

export default mongoose.model('Classe', classeSchema);