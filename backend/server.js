import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
// Increase limit for base64 image uploads (50MB should be enough for most photos)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

console.log('✅ Body parser limits set to 50MB for image uploads');

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Association Coranique API' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
