
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
        // Support pour différents types de médias (PDF, Vidéo, Audio)
        materiel: [{
            type: {
                type: String,
                enum: ['pdf', 'video', 'audio', 'image'],
                required: true
            },
            url: {
                type: String,
                required: true
            },
            titre: String
        }],
        statut: {
            type: String,
            enum: ['Publié', 'Brouillon', 'Archivé'],
            default: 'Brouillon',
        },
        matiere: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Matiere',
            // required: true, // Removed requirement to allow session-based docs without specific matiere
        },
        professeur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session',
            required: true,
        },
        // Champ optionnel pour lier à un chapitre du template de la classe
        chapitreRef: {
            type: mongoose.Schema.Types.ObjectId
        },
        fichier: {
            type: String // Fallback pour la compatibilité avec l'ancien code frontend
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Cours', coursSchema);
