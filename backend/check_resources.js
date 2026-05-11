import mongoose from 'mongoose';
import Session from './models/sessionModel.js';
import dotenv from 'dotenv';
dotenv.config();

const checkResources = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const sessions = await Session.find({});
        console.log('Sessions count:', sessions.length);
        sessions.forEach(s => {
            if (s.coursPublies && s.coursPublies.length > 0) {
                console.log(`Session ${s.nomSession} (${s._id}) has ${s.coursPublies.length} legacy resources.`);
            }
        });
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkResources();
