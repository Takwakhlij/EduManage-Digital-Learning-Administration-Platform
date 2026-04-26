import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './backend/models/notificationModel.js';

dotenv.config();

const checkNotifications = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connecté à MongoDB');

        const lastNotifs = await Notification.find().sort({ createdAt: -1 }).limit(5);
        console.log('--- 5 dernières notifications ---');
        lastNotifs.forEach(n => {
            console.log(`[${n.createdAt.toISOString()}] Pour: ${n.receiver} | Titre: ${n.title}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Erreur:', error);
    }
};

checkNotifications();
