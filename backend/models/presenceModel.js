import mongoose from 'mongoose';

const presenceSchema = new mongoose.Schema({
    // La séance (quel créneau récurrent)
    seance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seance',
        required: [true, 'La séance est obligatoire']
    },
    // L'inscription (quel étudiant dans quelle session)
    inscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inscription',
        required: [true, "L'inscription est obligatoire"]
    },
    // La date exacte du cours (ex: 2026-04-06)
    date: {
        type: Date,
        required: [true, 'La date est obligatoire']
    },
    // Statut de présence
    statut: {
        type: String,
        enum: ['Present', 'Absent', 'Retard'],
        default: 'Present'
    },
    // Remarque optionnelle (ex: "Certificat médical apporté")
    remarque: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Index unique : un seul enregistrement par (séance + inscription + date)
// Cela évite de noter deux fois le même élève pour le même cours le même jour
presenceSchema.index({ seance: 1, inscription: 1, date: 1 }, { unique: true });

export default mongoose.model('Presence', presenceSchema);
