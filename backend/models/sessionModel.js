import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    nomSession: {
        type: String,
        required: [true, 'Veuillez ajouter un nom pour la session (ex: Session Hiver)'],
        trim: true
    },
    classe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classe',
        required: [true, 'La session doit être liée à une classe (le Template)']
    },
    enseignants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    montant: {
        type: Number,
        required: [true, 'Le montant est obligatoire']
    },
    duree: {
        type: String,
        required: [true, 'La durée est obligatoire (ex: 3 mois)']
    },
    description: {
        type: String,
        required: [false, 'Une description courte de la session']
    },
    imageCouverture: {
        type: String,
        required: [false, 'Chemin vers l\'image de la session']
    },
    // HEDHA EL CONTENU:  l'Enseignant yhabet les fichiers mte3ou (PDF, Video...)
    coursPublies: [{
        titreCours: { type: String, required: true }, // ex: "Support PDF Chapitre 1"
        typeFichier: { 
            type: String, 
            enum: ['PDF', 'Video', 'Audio', 'Image'], 
            required: true 
        },
        urlFichier: { type: String, required: true }, // Lien mta3 el fichier
        datePublication: { type: Date, default: Date.now }
    }],
    statut: {
        type: String,
        enum: ['En cours', 'Terminée'],
        default: 'En cours'
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default mongoose.model('Session', sessionSchema);