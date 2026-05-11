import mongoose from 'mongoose';

const inscriptionSchema = new mongoose.Schema({
    etudiant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "L'ID de l'étudiant est obligatoire"]
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: [true, "L'ID de la session est obligatoire"]
    },
    classe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classe',
        required: [true, "L'ID de la classe est obligatoire"]
    },
    statut: {
        type: String,
        enum: ['en_attente', 'approuvee', 'refusee'],
        default: 'en_attente'
    },
    statutPaiement: {
        type: String,
        enum: ['Payé', 'Non Payé', 'Avance'],
        default: 'Non Payé'
    },
    montantVerseTotal: {
        type: Number,
        default: 0
    },
    resteAPayer: {
        type: Number,
        default: null // null = pas encore calculé (session.montant non connu au moment de l'inscription)
    },
    dateInscription: {
        type: Date,
        default: Date.now
    },
    coursTermines: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    itqanScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    souratesMemorisees: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Bloquer les doublons: E-taleb maynajamch y9ayed fi nafs el session marrtin
inscriptionSchema.index({ etudiant: 1, session: 1 }, { unique: true });

export default mongoose.model('Inscription', inscriptionSchema);