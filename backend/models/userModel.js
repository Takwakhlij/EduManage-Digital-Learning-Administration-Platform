import mongoose from 'mongoose';

const userSchema = mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'Please add a first name'],
        },
        lastName: {
            type: String,
            required: [true, 'Please add a last name'],
        },
        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            // On enlève le required ici pour gérer les mineurs sans email
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
        },
        role: {
            type: String,
            // Limite les rôles possibles pour éviter les erreurs
            enum: ['student', 'teacher', 'parent', 'admin'],
            default: 'student',
        },
        status: {
            type: String,
            enum: ['pending', 'active', 'rejected', 'inactive'],
            default: 'pending',
        },
        phoneNumber: {
            type: String,
        },
        profileImage: {
            type: String,
            default: '',
        },
        specialization: {
            type: String,
        },
        experience: {
            type: Number,
        },
        childrenNames: {
            type: String, // Comma separated names or free text
        },
        children: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],


        dateOfBirth: {
            type: Date,
        },
        expoPushToken: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('User', userSchema);
