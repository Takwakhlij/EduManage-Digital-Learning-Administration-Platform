import mongoose from 'mongoose';

const teacherPresenceSchema = mongoose.Schema(
    {
        enseignant: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        seance: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Seance',
        },
        date: {
            type: Date,
            required: true,
        },
        cahierTexte: {
            type: String,
            required: false,
        },
        statut: {
            type: String,
            required: true,
            enum: ['Present', 'Absent', 'Retard', 'Absent certifie'],
            default: 'Present',
        },
        remarqueAdmin: {
            type: String,
            default: '',
        }
    },
    {
        timestamps: true,
    }
);

// S'assurer qu'un prf ne crée qu'une seule fiche par séance par jour
teacherPresenceSchema.index({ enseignant: 1, seance: 1, date: 1 }, { unique: true });

const TeacherPresence = mongoose.model('TeacherPresence', teacherPresenceSchema);
export default TeacherPresence;
