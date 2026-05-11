import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null si c'est une notification système automatique
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['cours', 'paiement', 'absence', 'retard', 'inscription', 'systeme', 'planning', 'actualite', 'certificat', 'autre'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    url: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index TTL pour supprimer les notifications après 24 heures (86400 secondes)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
