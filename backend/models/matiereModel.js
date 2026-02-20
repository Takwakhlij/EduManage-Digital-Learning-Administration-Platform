
import mongoose from 'mongoose';

const matiereSchema = mongoose.Schema(
    {
        nomMatiere: {
            type: String,
            required: [true, 'Veuillez ajouter un nom de matière'],
            trim: true,
            unique: true,
        },
        coefficient: {
            type: Number,
            default: 1,
        },
        description: {
            type: String,
        },
        classe: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Classe',
            required: [true, 'Une matière doit être associée à une classe'],
        },
        professeurs: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Matiere', matiereSchema);
