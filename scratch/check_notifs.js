import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './backend/models/notificationModel.js';
import User from './backend/models/userModel.js';

dotenv.config();

const checkNotifications = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('No admin found');
            process.exit(1);
        }

        console.log(`Checking notifications for admin: ${admin.firstName} (${admin._id})`);

        const notifs = await Notification.find({ receiver: admin._id }).sort({ createdAt: -1 }).limit(5);
        console.log(`Found ${notifs.length} notifications`);

        notifs.forEach(n => {
            console.log(`- [${n.createdAt}] ${n.title}: ${n.message} (Type: ${n.type})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkNotifications();
