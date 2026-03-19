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
    // HEDHA EL TEMPLATE: L'Admin y7ot just les titres mta3 les chapitres
    chapitresTemplate: [{
        titre: { type: String, required: true },
        description: { type: String }
    }]
}, { timestamps: true });

// Bech net2akdou elli ma famech zouz classes 3andhom nafs l'esm w nafs e-niveau
classeSchema.index({ nomClasse: 1, niveau: 1 }, { unique: true });

export default mongoose.model('Classe', classeSchema);