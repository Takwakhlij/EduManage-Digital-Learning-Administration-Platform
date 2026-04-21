import mongoose from 'mongoose';

const seanceSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: [true, 'Une séance doit être rattachée à une session globale (ex: Session Hiver)']
    },
    classe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classe',
        required: [true, 'Une séance doit être rattachée à une classe spécifique']
    },
    matiere: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Matiere',
        required: [false, 'La matière est optionnelle']
    },
    enseignant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [false, 'L\'enseignant est optionnel']
    },
    jour: {
        type: String,
        enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
        required: [true, 'Le jour de la semaine est requis']
    },
    heureDebut: {
        type: String,
        required: [true, 'L\'heure de début est requise (ex: 08:00)'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Le format de l\'heure doit être HH:MM']
    },
    heureFin: {
        type: String,
        required: [true, 'L\'heure de fin est requise (ex: 10:00)'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Le format de l\'heure doit être HH:MM']
    },
    salle: {
        type: String,
        required: false,
        default: 'Non assignée'
    },
    type: {
        type: String,
        enum: ['Présentiel', 'En ligne'],
        default: 'Présentiel'
    },
    lienReunion: {
        type: String,
        required: false // Utile si la séance se déroule en visioconférence
    }
}, { timestamps: true });

export default mongoose.model('Seance', seanceSchema);
