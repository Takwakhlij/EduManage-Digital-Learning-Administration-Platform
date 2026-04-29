import mongoose from 'mongoose';

const actualiteSchema = new mongoose.Schema({
    titre: {
        type: String,
        required: [true, 'Le titre de l\'actualité est requis'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'La description est requise']
    },
    image: {
        type: String,
        required: [true, 'Une image est requise pour l\'actualité']
    },
    dateEvenement: {
        type: Date,
        default: null
    },
    dateCreation: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Actualite = mongoose.model('Actualite', actualiteSchema);

export default Actualite;
