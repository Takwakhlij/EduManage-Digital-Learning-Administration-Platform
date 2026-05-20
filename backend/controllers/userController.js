import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Inscription from '../models/inscriptionModel.js';
import { sendPushNotification } from './notificationController.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
// @action  Crée un nouvel utilisateur. Si "parent", crée/lie l'enfant. Hache le mot de passe.
const registerUser = asyncHandler(async (req, res) => {
    // 1. Extraire les données de la requête du Frontend
    const {
        firstName,
        lastName,
        email,
        password,
        role,
        phoneNumber,
        dateOfBirth,
        specialization,
        experience,
        childName, // New field from frontend
    } = req.body;

    // 2. Vérification de base (Validation)
    if (!firstName || !lastName || !email || !password) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    // 3. Vérifier si l'utilisateur existe déjà dans la base de données via son Email
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // 4. Sécurité: Hacher le mot de passe (Hashage unidirectionnel) pour ne pas stocker en clair text
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Parent Logic: Stocker uniquement le nom de l'enfant (sans créer de compte fictif)
    const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || 'student',
        status: 'pending',
        phoneNumber,
        dateOfBirth,
        specialization,
        experience,
        childrenNames: childName || '',
    });

    if (user) {
        // Parent Logic: Créer le compte de l'élève mineur (sans email)
        if (role === 'parent' && childName) {
            const nameParts = childName.trim().split(' ');
            const cFirstName = nameParts[0];
            const cLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : lastName;

            const newChild = await User.create({
                firstName: cFirstName,
                lastName: cLastName,
                password: hashedPassword, // Même password que le parent par défaut
                role: 'student',
                status: 'pending',
                parentId: user._id, // Lien vers le parent
            });

            if (newChild) {
                // Mettre à jour le parent avec l'ID de l'enfant
                user.children = [newChild._id];
                await user.save();
            }
        }
        // If we created a child, populate it for the return
        if (role === 'parent' && user.children.length > 0) {
            await user.populate('children', 'firstName lastName currentLevel status');
        }

        // ✅ Notification Push -> Alerter tous les Admins qu'un nouveau User s'est inscrit
        try {
            const roleLabel = role === 'teacher' ? 'Enseignant' : role === 'parent' ? 'Parent' : 'Étudiant';
            const admins = await User.find({ role: 'admin' }).select('_id');
            console.log(`[DEBUG] Nouveau User: ${user.firstName} (${role}) | Admins à notifier: ${admins.length}`);
            
            if (admins.length > 0) {
                const notifPromises = admins.map(admin => 
                    sendPushNotification(admin._id, {
                        title: 'Nouvelle inscription en attente ! 👤',
                        body: `${user.firstName} ${user.lastName} vient de créer un compte en tant que ${roleLabel}.`,
                        type: 'inscription',
                        senderId: user._id,
                        url: '/admin/membres'
                    })
                );
                await Promise.all(notifPromises);
                console.log(`[DEBUG] Notifications envoyées avec succès.`);
            }
        } catch (error) {
            console.error('[DEBUG ERROR] Erreur lors de l\'envoi des notifications admin:', error.message);
        }

        res.status(201).json({
            _id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            status: user.status,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            children: user.children,
            specialization: user.specialization,
            experience: user.experience,
            childrenNames: user.childrenNames,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            // token: generateToken(user._id), // No auto-login, wait for admin
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
// @action  Vérifie l'email/mot de passe et génère un jeton (Token JWT) de session.
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Chercher l'utilisateur par e-mail
    const user = await User.findOne({ email });

    // 2. Si l'utilisateur existe, comparer le mot de passe (clair) avec le mot de passe haché de la base de données
    if (user && (await bcrypt.compare(password, user.password))) {
        if (user.status !== 'active' && user.role !== 'admin') {
            res.status(401);
            throw new Error('Votre compte est en attente de validation par un administrateur.');
        }

        // Populate children data for parents
        if (user.role === 'parent') {
            await user.populate('children', 'firstName lastName currentLevel status');
        }

        // 4. Générer la réponse de succès avec les données et le fameux Jeton (Token)
        res.json({
            _id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            children: user.children,
            token: generateToken(user._id), // Appel de la fonction pour créer le Token
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user.role === 'parent') {
        await user.populate('children', 'firstName lastName currentLevel status');
    }

    res.status(200).json(user);
});

// Generate JWT (JSON Web Token)
// Une fois l'utilisateur authentifié, on "signe" mathématiquement un jeton qui inclut son ID.
// Le Frontend gardera ce jeton pour prouver son identité lors des requêtes ultérieures.
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Valide pour 30 jours
    });
};

/* --- ADMIN CONTROLLERS --- */

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    // Get all users sorted by creation date (newest first)
    const users = await User.find({})
        .sort({ createdAt: -1 })
        .select('-password')
        .populate('parentId', 'firstName lastName phoneNumber'); // Afficher le nom du parent pour les mineurs

    // For student users, enrich with their latest approved inscription (classe + session)
    const studentIds = users
        .filter(u => u.role === 'student')
        .map(u => u._id);

    let inscriptionMap = {};
    if (studentIds.length > 0) {
        const inscriptions = await Inscription.find({
            etudiant: { $in: studentIds },
            statut: { $in: ['approuvee', 'en_attente'] }  // Include pending inscriptions too
        })
        .sort({ createdAt: -1 })
        .populate('classe', 'nomClasse niveau')
        .populate('session', 'nomSession anneeAcademique');

        // Collect ALL inscriptions per student (not just the most recent)
        for (const insc of inscriptions) {
            const key = insc.etudiant.toString();
            if (!inscriptionMap[key]) {
                inscriptionMap[key] = [];
            }
            inscriptionMap[key].push(insc);
        }
    }

    const enrichedUsers = users.map(u => {
        const plain = u.toObject();
        if (u.role === 'student' && inscriptionMap[u._id.toString()]) {
            const inscs = inscriptionMap[u._id.toString()];
            plain.currentClasses = inscs.map(i => i.classe).filter(Boolean);
            plain.currentSessions = inscs.map(i => i.session).filter(Boolean);
            // Keep single fields for backward compat (most recent)
            plain.currentClasse = plain.currentClasses[0] || null;
            plain.currentSession = plain.currentSessions[0] || null;
        }
        return plain;
    });

    res.json(enrichedUsers);
});

// @desc    Create new user (Admin specific)
// @route   POST /api/users
// @access  Private/Admin
const createUserAdmin = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role, status, phoneNumber } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (force status from request or default to active)
    const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        status: status || 'active', // Default to active since created by admin
        phoneNumber,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            status: user.status,
            phoneNumber: user.phoneNumber,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    } else {
        res.status(400);
        throw new Error('Données utilisateur invalides');
    }
});


// @desc    Update user status (validate/reject)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        const previousStatus = user.status;
        user.status = req.body.status || user.status;
        const updatedUser = await user.save();

        // ✅ Si c'est un élève mineur et qu'on l'active, on active aussi son parent automatiquement
        if (updatedUser.role === 'student' && updatedUser.parentId && updatedUser.status === 'active') {
            await User.findByIdAndUpdate(updatedUser.parentId, { status: 'active' });
            console.log(`[DEBUG] Parent ${updatedUser.parentId} activé automatiquement pour l'élève ${updatedUser._id}`);
        }

        // Envoi d'une notification à l'utilisateur si son statut a changé
        if (previousStatus !== updatedUser.status) {
            let notifTitle = '';
            let notifBody = '';
            
            if (updatedUser.status === 'active') {
                notifTitle = 'Compte validé ! 🎉';
                notifBody = 'Votre compte a été approuvé par l\'administration. Vous avez maintenant accès à la plateforme.';
            } else if (updatedUser.status === 'inactive' || updatedUser.status === 'rejected') {
                notifTitle = 'Mise à jour de votre compte ⚠️';
                notifBody = 'Votre compte a été désactivé ou refusé par l\'administration. Veuillez nous contacter pour plus d\'informations.';
            }

            if (notifTitle) {
                // 1. Notification Push / In-App
                try {
                    await sendPushNotification(updatedUser._id, {
                        title: notifTitle,
                        body: notifBody,
                        type: 'systeme',
                        senderId: req.user._id,
                        url: '/dashboard'
                    });
                } catch (err) {
                    console.error('Erreur notification validation:', err);
                }

                // 2. Notification E-mail (via Nodemailer)
                try {
                    await sendEmail({
                        email: updatedUser.email,
                        subject: notifTitle,
                        message: `Bonjour ${updatedUser.firstName},\n\n${notifBody}\n\nCordialement,\nL'équipe de l'Association Coranique`
                    });
                    console.log(`E-mail de statut envoyé à ${updatedUser.email}`);
                } catch (err) {
                    console.error('Erreur envoi email de validation:', err);
                }
            }
        }

        // Return full object to preserve all fields in frontend
        res.json({
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status,
            phoneNumber: updatedUser.phoneNumber,
            ageGroup: updatedUser.ageGroup,
            dateOfBirth: updatedUser.dateOfBirth,
            currentLevel: updatedUser.currentLevel,
            interestedProgram: updatedUser.interestedProgram,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Deactivate own account (Soft Delete)
// @route   PUT /api/users/deactivate
// @access  Private
const deactivateSelfAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('Utilisateur non trouvé');
    }

    user.status = 'inactive';
    await user.save();

    res.json({ message: 'Compte désactivé avec succès' });
});

// @desc    Update user details (Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        user.status = req.body.status || user.status;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status,
            phoneNumber: updatedUser.phoneNumber,
            ageGroup: updatedUser.ageGroup,
            dateOfBirth: updatedUser.dateOfBirth,
            currentLevel: updatedUser.currentLevel,
            interestedProgram: updatedUser.interestedProgram,

            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update self profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.email = req.body.email || user.email;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

        // Handle file upload from Multer
        if (req.file) {
            // Store relative path to the uploaded file
            user.profileImage = `/uploads/profiles/${req.file.filename}`;
        } else if (req.body.profileImage === 'null') {
            // Check if client requested to remove image
            user.profileImage = '';
        }

        // Specialized fields
        if (user.role === 'student') {
            user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
        }

        if (user.role === 'teacher') {
            user.specialization = req.body.specialization || user.specialization;
            user.experience = req.body.experience || user.experience;
        }

        if (user.role === 'parent') {
            user.childrenNames = req.body.childrenNames || user.childrenNames;
        }

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status,
            phoneNumber: updatedUser.phoneNumber,
            profileImage: updatedUser.profileImage,
            ageGroup: updatedUser.ageGroup,
            dateOfBirth: updatedUser.dateOfBirth,
            currentLevel: updatedUser.currentLevel,
            interestedProgram: updatedUser.interestedProgram,
            specialization: updatedUser.specialization,
            specialization: updatedUser.specialization,
            experience: updatedUser.experience,
            childrenNames: updatedUser.childrenNames,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

export {
    registerUser,
    loginUser,
    getMe,
    getUsers,
    createUserAdmin,
    deactivateSelfAccount,
    updateUserStatus,
    deleteUser,
    updateUser,
    updateUserProfile,
};
