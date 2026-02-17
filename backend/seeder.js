import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/userModel.js';
import connectDB from './config/db.js';

dotenv.config();

const importData = async () => {
    try {
        await connectDB();

        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@association.com' });

        if (adminExists) {
            console.log('Admin user already exists!');
            process.exit();
        }

        // Create Admin User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const adminUser = new User({
            firstName: 'Super',
            lastName: 'Admin',
            email: 'admin@association.com',
            password: hashedPassword,
            role: 'admin',
            status: 'active',
            phoneNumber: '0000000000',
            ageGroup: '26-35',
            currentLevel: 'advanced',
            interestedProgram: 'islamic-studies'
        });

        await adminUser.save();

        console.log('✅ Admin User Created Successfully!');
        console.log('📧 Email: admin@association.com');
        console.log('🔑 Password: admin123');

        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

importData();
