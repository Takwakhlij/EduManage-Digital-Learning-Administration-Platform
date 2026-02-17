import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';

dotenv.config();

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const email = process.argv[2];

        if (!email) {
            console.log('Usage: node makeAdmin.js <email>');
            process.exit(1);
        }

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found`);
            process.exit(1);
        }

        user.role = 'admin';
        user.status = 'active';
        await user.save();

        console.log(`SUCCESS: User ${user.firstName} ${user.lastName} (${email}) is now an ADMIN and ACTIVE.`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

makeAdmin();
