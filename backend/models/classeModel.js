import mongoose from 'mongoose';

const classeSchema = mongoose.Schema(
    {
        nomClasse: {
            type: String,
            required: [true, 'Veuillez ajouter un nom de classe'],
            trim: true,
        },
        niveau: {
            type: String,
            required: [true, 'Veuillez ajouter un niveau'],
            enum: ['Débutant', 'Intermédiaire', 'Avancé'],
        },
        anneeScolaire: {
            type: String,
            required: [true, 'Veuillez ajouter une année scolaire'],
            match: [/^\d{4}-\d{4}$/, 'Format invalide. Utilisez YYYY-YYYY (ex: 2025-2026)'],
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        professeurs: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        matieres: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Matiere',
        }],
    },
    {
        timestamps: true,
    }
);

// Index pour éviter les doublons
classeSchema.index({ nomClasse: 1, anneeScolaire: 1 }, { unique: true });

export default mongoose.model('Classe', classeSchema);
