import mongoose from 'mongoose';
import crypto from 'crypto';

const certificateSchema = new mongoose.Schema({
    // Unique verifiable ID (ex: CERT-2024-A3F7B)
    certificateId: {
        type: String,
        unique: true,
        default: () => {
            const year = new Date().getFullYear();
            const random = crypto.randomBytes(3).toString('hex').toUpperCase();
            return `CERT-${year}-${random}`;
        }
    },
    etudiant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    inscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inscription',
        required: true
    },
    dateEmission: {
        type: Date,
        default: Date.now
    },
    // Who issued the certificate (admin)
    delivrePar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Bloquer les doublons: un seul certificat par inscription
certificateSchema.index({ inscription: 1 }, { unique: true });

export default mongoose.model('Certificate', certificateSchema);
