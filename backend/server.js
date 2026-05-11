import 'dotenv/config';
import express from 'express'; 

import cors from 'cors';       
import connectDB from './config/db.js'; 
import { errorHandler } from './middleware/errorMiddleware.js'; 
import userRoutes from './routes/userRoutes.js'; 
import classeRoutes from './routes/classeRoutes.js'; 
import matiereRoutes from './routes/matiereRoutes.js'; 
import coursRoutes from './routes/coursRoutes.js'; 
import sessionRoutes from './routes/sessionRoutes.js'; 
import inscriptionRoutes from './routes/inscriptionRoutes.js'; 
import seanceRoutes from './routes/seanceRoutes.js'; 
import presenceRoutes from './routes/presenceRoutes.js'; 
import teacherPresenceRoutes from './routes/teacherPresenceRoutes.js'; 
import paiementRoutes from './routes/paiementRoutes.js'; 
import notificationRoutes from './routes/notificationRoutes.js'; 
import actualiteRoutes from './routes/actualiteRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import startRelanceJob from './jobs/relanceJob.js';

import fs from 'fs';
import path from 'path';

const app = express(); 

// Ensure uploads/receipts directory exists
const receiptsDir = path.join(process.cwd(), 'uploads', 'receipts');
if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
}

// Initialisation des Middleware
app.use(cors()); 
// Middleware pour Stripe Webhook (doit être AVANT express.json())
app.use('/api/paiements/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

console.log('✅ Body parser limits set to 50MB for image uploads');

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Routes de l'API
app.use('/api/users', userRoutes);
app.use('/api/classes', classeRoutes);
app.use('/api/matieres', matiereRoutes);
app.use('/api/cours', coursRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/inscriptions', inscriptionRoutes);
app.use('/api/seances', seanceRoutes);
app.use('/api/presences', presenceRoutes);
app.use('/api/teacher-presences', teacherPresenceRoutes);
app.use('/api/paiements', paiementRoutes); 
app.use('/api/notifications', notificationRoutes); 
app.use('/api/actualites', actualiteRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/ai', aiRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Association Coranique API' });
});

// Error handler
app.use(errorHandler);

// Connect to database and Start Server
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
            // Démarrer le job de relance automatique
            startRelanceJob();
        });
    } catch (error) {
        console.error(`Error starting server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
