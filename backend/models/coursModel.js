
import mongoose from 'mongoose';

const coursSchema = mongoose.Schema(
    {
        titre: {
            type: String,
            required: [true, 'Veuillez ajouter un titre'],
            trim: true,
        },
        description: {
            type: String,
        },
        datePublication: {
            type: Date,
            default: Date.now,
        },
        fichier: {
            type: String, // URL or path to file
        },
        statut: {
            type: String,
            enum: ['Publié', 'Brouillon', 'Archivé'],
            default: 'Brouillon',
        },
        matiere: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Matiere',
            required: true,
        },
        professeur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Cours', coursSchema);
