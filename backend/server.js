import express from 'express'; // Framework minimaliste pour créer le serveur et gérer les requêtes HTTP
import dotenv from 'dotenv';   // Pour charger les variables d'environnement depuis le fichier .env
import cors from 'cors';       // Middleware pour autoriser les requêtes cross-origin (ex: Frontend sur port 5173, Backend sur 5000)
import connectDB from './config/db.js'; // Fonction pour se connecter à la base de données MongoDB
import { errorHandler } from './middleware/errorMiddleware.js'; // Gestionnaire centralisé des erreurs
import userRoutes from './routes/userRoutes.js'; // Routes liées aux utilisateurs (inscription, connexion, etc.)
import classeRoutes from './routes/classeRoutes.js'; // Routes liées aux classes
import matiereRoutes from './routes/matiereRoutes.js'; // Routes liées aux matières
import coursRoutes from './routes/coursRoutes.js'; // Routes liées aux cours
import sessionRoutes from './routes/sessionRoutes.js'; // Routes liées aux sessions
import inscriptionRoutes from './routes/inscriptionRoutes.js'; // Routes liées aux inscriptions

// Charger les variables d'environnement (ex: process.env.PORT, process.env.MONGO_URI)
dotenv.config();

const app = express(); // Initialiser l'application Express

// Initialisation des Middleware (Filtres globaux appliqués à chaque requête)
app.use(cors()); // Autorise le Frontend React (qui tourne sur un autre port) à faire des requêtes vers cette API
// Increase limit for base64 image uploads (50MB should be enough for most photos)
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
        });
    } catch (error) {
        console.error(`Error starting server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
