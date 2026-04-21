
import mongoose from 'mongoose';

const matiereSchema = mongoose.Schema(
    {
        nomMatiere: {
            type: String,
            required: [true, 'Veuillez ajouter un nom de matière'],
            trim: true,
            unique: false, // Changed from true to allow same subject name across different contexts if needed
        },
        classes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Classe',
            required: [true, 'Une matière doit être associée à au moins une classe'],
        }],
        programme: [{
            titre: { type: String, required: true },
            description: { type: String }
        }],
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Matiere', matiereSchema);
