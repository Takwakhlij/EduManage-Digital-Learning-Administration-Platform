import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
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
        childEmail, // New field from frontend
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let childId = null;
    let childrenIds = [];

    // Parent Logic: Create or Link Child
    if (role === 'parent') {
        if (childEmail) {
            // Case 1: Link existing child by email (e.g. Major child)
            const existingChild = await User.findOne({ email: childEmail });
            if (existingChild) {
                childId = existingChild._id;
                childrenIds.push(childId);
                // Optional: Link parent to child as well
            }
        } else if (childName) {
            // Case 2: Create new child account (e.g. Minor)
            // Generate a placeholder email or username
            const childEmailGenerated = `child.${Date.now()}@temp.com`;
            const childPassword = await bcrypt.hash('123456', salt); // Default password

            // Allow childName to be "First Last" or just "First"
            const nameParts = childName.trim().split(' ');
            const cFirstName = nameParts[0];
            const cLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : lastName; // Default to parent's last name

            const newChild = await User.create({
                firstName: cFirstName,
                lastName: cLastName,
                email: childEmailGenerated,
                password: childPassword,
                role: 'student',
                status: 'pending', // Child pending until parent approved (or approved separately)
            });

            if (newChild) {
                childId = newChild._id;
                childrenIds.push(childId);
            }
        }
    }

    // Create user
    const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || 'student',
        status: 'pending', // Explicitly pending
        phoneNumber,
        dateOfBirth,
        specialization,
        experience,
        children: childrenIds,
        childrenNames: childName || '', // Keep for legacy or display
    });

    if (user) {
        // If we created a child, populate it for the return
        if (role === 'parent' && childrenIds.length > 0) {
            await user.populate('children', 'firstName lastName currentLevel status');
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
const loginUser = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        // Check if role matches (optional - you can remove this if you want users to login regardless of role)
        if (role && user.role !== role) {
            res.status(401);
            throw new Error('Invalid credentials for this role');
        }

        if (user.status !== 'active' && user.role !== 'admin') {
            res.status(401);
            throw new Error('Votre compte est en attente de validation par un administrateur.');
        }

        // Populate children data for parents
        if (user.role === 'parent') {
            await user.populate('children', 'firstName lastName currentLevel status');
        }

        res.json({
            _id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            children: user.children,
            token: generateToken(user._id),
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

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/* --- ADMIN CONTROLLERS --- */

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    // Get all users sorted by creation date (newest first)
    const users = await User.find({}).sort({ createdAt: -1 }).select('-password');
    res.json(users);
});

// @desc    Update user status (validate/reject)
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.status = req.body.status || user.status;
        const updatedUser = await user.save();

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

// @desc    Delete user
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
    updateUserStatus,
    deleteUser,
    updateUser,
    updateUserProfile,
};
