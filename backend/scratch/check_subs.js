import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PushSubscription from './backend/models/pushSubscriptionModel.js';
import User from './backend/models/userModel.js';

dotenv.config();

const checkSubscriptions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: 'takwa@example.com' }); // Or whatever email from screenshot
        // In screenshot, user is "takwa khlij". Let's find by name if email unknown.
        const targetUser = await User.findOne({ firstName: 'takwa' }) || await User.findOne({ firstName: 'Takwa' });

        if (!targetUser) {
            console.log('User not found');
            const allSubs = await PushSubscription.find({}).populate('user', 'firstName lastName');
            console.log(`All subscriptions in DB: ${allSubs.length}`);
            allSubs.forEach(s => console.log(`- ${s.user?.firstName} ${s.user?.lastName}: ${s.endpoint.substring(0, 50)}...`));
            process.exit(0);
        }

        console.log(`Checking subscriptions for: ${targetUser.firstName} ${targetUser.lastName} (${targetUser._id})`);

        const subs = await PushSubscription.find({ user: targetUser._id });
        console.log(`Found ${subs.length} subscriptions`);

        subs.forEach(s => {
            console.log(`- Endpoint: ${s.endpoint.substring(0, 50)}...`);
            console.log(`  Keys: ${JSON.stringify(s.keys)}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkSubscriptions();
