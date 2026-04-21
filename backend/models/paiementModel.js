import mongoose from 'mongoose';

const paiementSchema = new mongoose.Schema({
    inscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inscription',
        required: [true, "L'ID de l'inscription est obligatoire"]
    },
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
    montant: {
        type: Number,
        required: [true, 'Le montant versé est obligatoire'],
        min: [0.01, 'Le montant doit être supérieur à 0']
    },
    modePaiement: {
        type: String,
        enum: ['Espèces', 'Chèque', 'Virement', 'Stripe'],
        default: 'Espèces'
    },
    datePaiement: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String,
        trim: true,
        maxlength: [200, 'La note ne peut pas dépasser 200 caractères']
    },
    enregistrePar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    receiptUrl: {
        type: String
    }
}, { timestamps: true });

export default mongoose.model('Paiement', paiementSchema);
