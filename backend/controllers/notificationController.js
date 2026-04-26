import asyncHandler from 'express-async-handler';
import webpush from 'web-push';
import PushSubscription from '../models/pushSubscriptionModel.js';
import Notification from '../models/notificationModel.js';

// Configuration web-push avec les clés du .env
webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// @desc    Enregistrer un abonnement Push
// @route   POST /api/notifications/subscribe
// @access  Private
const subscribeUser = asyncHandler(async (req, res) => {
    const subscription = req.body;

    // On vérifie si cet abonnement existe déjà pour cet utilisateur sur cet appareil (endpoint unique)
    const existingSubscription = await PushSubscription.findOne({
        endpoint: subscription.endpoint
    });

    if (existingSubscription) {
        existingSubscription.user = req.user._id;
        existingSubscription.keys = subscription.keys;
        await existingSubscription.save();
    } else {
        await PushSubscription.create({
            user: req.user._id,
            ...subscription
        });
    }

    res.status(201).json({ message: 'Abonnement enregistré avec succès' });
});

// @desc    Récupérer les notifications de l'utilisateur connecté
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ receiver: req.user._id })
        .sort({ createdAt: -1 })
        .populate('sender', 'firstName lastName name');

    res.json(notifications);
});

// @desc    Marquer une notification comme lue
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (notification) {
        if (notification.receiver.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Non autorisé');
        }
        notification.isRead = true;
        await notification.save();
        res.json({ message: 'Notification marquée comme lue' });
    } else {
        res.status(404);
        throw new Error('Notification non trouvée');
    }
});

// Fonction utilitaire (interne) pour envoyer une notification Push
const sendPushNotification = async (userId, payload) => {
    try {
        // 1. Enregistrer dans l'historique (Modèle Notification)
        const notif = await Notification.create({
            receiver: userId,
            type: payload.type || 'autre',
            title: payload.title,
            message: payload.body,
            sender: payload.senderId || null
        });
        console.log(`[NOTIF] Historique créé pour l'utilisateur ${userId}: ${payload.title}`);

        // 2. Récupérer tous les appareils (tickets) de cet utilisateur
        const subscriptions = await PushSubscription.find({ user: userId });
        console.log(`[NOTIF] ${subscriptions.length} abonnements Push trouvés pour ${userId}`);

        // 3. Envoyer le message à chaque appareil
        const notificationsPromises = subscriptions.map(sub => {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: {
                    auth: sub.keys.auth,
                    p256dh: sub.keys.p256dh
                }
            };

            return webpush.sendNotification(pushConfig, JSON.stringify(payload))
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // L'abonnement a expiré ou est invalide, on le supprime
                        return PushSubscription.deleteOne({ _id: sub._id });
                    }
                    console.error('Erreur envoi push:', err);
                });
        });

        await Promise.all(notificationsPromises);
    } catch (error) {
        console.error('Erreur globale sendPushNotification:', error);
    }
};

export {
    subscribeUser,
    getUserNotifications,
    markAsRead,
    sendPushNotification
};
