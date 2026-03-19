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

// Connect to database (Connexion à MongoDB)
connectDB();

const app = express(); // Initialiser l'application Express

// Initialisation des Middleware (Filtres globaux appliqués à chaque requête)
app.use(cors()); // Autorise le Frontend React (qui tourne sur un autre port) à faire des requêtes vers cette API
// Increase limit for base64 image uploads (50MB should be enough for most photos)
// Permet au serveur de comprendre les requêtes JSON (ex: POST form data) avec une limite augmentée pour accepter le téléchargement d'images encodées en Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' })); // Permet d'analyser les données de formulaires URL-encoded (extended: false utilise la bibliothèque querystring)

console.log('✅ Body parser limits set to 50MB for image uploads');

// Serve uploaded files statically
// Rendre le dossier "uploads" public pour que le site puisse afficher les images directement (ex: localhost:5000/uploads/image.png)
app.use('/uploads', express.static('uploads'));

// Routes de l'API (Associer une URL de base à un fichier de définition de route complet)
app.use('/api/users', userRoutes);       // Tout ce qui commence par /api/users ira dans userRoutes.js
app.use('/api/classes', classeRoutes);   // Tout ce qui commence par /api/classes ira dans classeRoutes.js
app.use('/api/matieres', matiereRoutes); // Tout ce qui commence par /api/matieres ira dans matiereRoutes.js
app.use('/api/cours', coursRoutes);      // Tout ce qui commence par /api/cours ira dans coursRoutes.js
app.use('/api/sessions', sessionRoutes);   // Tout ce qui commence par /api/sessions ira dans sessionRoutes.js
app.use('/api/inscriptions', inscriptionRoutes); // Tout ce qui commence par /api/inscriptions ira dans inscriptionRoutes.js

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Association Coranique API' });
});

// Error handler (Middleware appliqué à la toute fin pour intercepter et styliser toutes les erreurs générées dans l'application)
app.use(errorHandler);

// Déterminer le port sur lequel le serveur va écouter (Port 5000 par défaut ou celui défini dans .env)
const PORT = process.env.PORT || 5000;

// Lancer le serveur et écouter les requêtes entrantes
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
