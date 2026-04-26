import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, reset } from '../features/auth/authSlice';
import toast from 'react-hot-toast';
import './Auth.css'; // Import Auth Styles

function Register() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        dateOfBirth: '',
        childName: '',
        specialization: '',
        experience: '',
    });

    const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        phoneNumber,
        dateOfBirth,
        childName,
        specialization,
        experience,
    } = formData;

    const [role, setRole] = useState('student');

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError) {
            toast.error(message);
        }

        if (isSuccess) {
            // If registration is successful, user is NOT logged in (no token).
            // Alert user and redirect to login.
            toast.success("Inscription réussie ! Votre compte est en attente de validation par un administrateur. Vous recevrez l'accès une fois validé.");
            navigate('/login');
            dispatch(reset()); // Clear any user state just in case
        }
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        const userData = {
            firstName,
            lastName,
            email,
            password,
            role,
            phoneNumber,
        };

        // Only add specific fields for students
        if (role === 'student') {
            userData.dateOfBirth = dateOfBirth;
        }

        // Add fields for teacher
        if (role === 'teacher') {
            userData.specialization = specialization;
            userData.experience = experience;
        }

        // Add fields for parent
        if (role === 'parent') {
            userData.childName = childName;
        }

        dispatch(register(userData));
    };

    if (isLoading) {
        return <div className="loading-spinner">Inscription en cours</div>;
    }

    return (
        <>
            <div className="register-wrapper">
                <div className="register-container">

                    {/* Header: Logo + Identity */}
                    <div className="auth-logo">
                        <img src="/src/assets/logo.png" alt="Logo Association Coranique" />
                        <div className="association-identity">
                            <h2 className="association-name-ar">الجمعية القرآنية</h2>
                            <h3 className="association-name-fr">Association Coranique</h3>
                            <div className="identity-divider"></div>
                            <p className="association-slogan">Pour l'apprentissage et la mémorisation du Saint Coran</p>
                        </div>
                    </div>

                    {/* Page title */}
                    <h1 className="form-section-title" style={{ textAlign: 'center', marginBottom: '4px' }}>
                        Créer un compte
                    </h1>
                    <p className="form-section-subtitle" style={{ textAlign: 'center', marginBottom: '20px' }}>
                        Rejoignez notre communauté d&apos;apprenants du Saint Coran
                    </p>

                    <div className="divider"></div>

                    {/* Role Selection Dropdown */}
                    <div className="role-select-container">
                        <label htmlFor="role-select" className="role-select-label">
                            Choisissez votre espace
                        </label>
                        <div className="role-select-wrapper">
                            <select
                                id="role-select"
                                className="role-select"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="student">🎓 Espace Étudiant</option>
                                <option value="teacher">👨‍🏫 Espace Enseignant</option>
                                <option value="parent">👨‍👩‍👧 Espace Parent</option>
                            </select>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="auth-form-section">
                        <h2 className="form-section-title">
                            Inscription {role === 'student' ? 'Étudiant' : role === 'teacher' ? 'Enseignant' : 'Parent'}
                        </h2>
                        <p className="form-section-subtitle">
                            Remplissez vos informations pour débuter votre parcours d&apos;apprentissage
                        </p>

                        <form onSubmit={onSubmit} className="auth-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="firstName">Prénom</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="firstName"
                                        name="firstName"
                                        value={firstName}
                                        placeholder="Ahmed"
                                        onChange={onChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lastName">Nom</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="lastName"
                                        name="lastName"
                                        value={lastName}
                                        placeholder="Ben salah"
                                        onChange={onChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Adresse Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    name="email"
                                    value={email}
                                    placeholder="votre.email@exemple.com"
                                    onChange={onChange}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="password">Mot de passe</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        name="password"
                                        value={password}
                                        placeholder="Minimum 6 caractères"
                                        onChange={onChange}
                                        required
                                        minLength="6"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={confirmPassword}
                                        placeholder="Répétez le mot de passe"
                                        onChange={onChange}
                                        required
                                        minLength="6"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="phoneNumber">Numéro de téléphone <small>(optionnel)</small></label>
                                <input
                                    type="tel"
                                    className="form-control"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={phoneNumber}
                                    placeholder="+33 6 12 34 56 78"
                                    onChange={onChange}
                                />
                            </div>

                            {role === 'student' && (
                                <div className="form-group">
                                    <label htmlFor="dateOfBirth">Date de naissance</label>
                                    <input
                                        type="date"
                                        className={`form-control ${!dateOfBirth ? 'empty-date' : 'has-value'}`}
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        value={dateOfBirth}
                                        onChange={onChange}
                                        required
                                    />
                                </div>
                            )}

                            {role === 'parent' && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="childName">
                                            Nom et prénom de l&apos;enfant (pour les mineurs)
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="childName"
                                            name="childName"
                                            value={childName}
                                            placeholder="Ex: Amine Ben Ali"
                                            onChange={onChange}
                                        />
                                    </div>
                                </>
                            )}

                            {role === 'teacher' && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="specialization">Spécialisation</label>
                                        <select
                                            className="form-control"
                                            id="specialization"
                                            name="specialization"
                                            value={specialization}
                                            onChange={onChange}
                                            required
                                        >
                                            <option value="">Choisissez votre spécialité</option>
                                            <option value="tajweed">Tajweed (Tajwid)</option>
                                            <option value="hifz">Mémorisation (Hifz)</option>
                                            <option value="arabic">Langue Arabe</option>
                                            <option value="fiqh">Fiqh (Jurisprudence)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="experience">Années d&apos;expérience</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="experience"
                                            name="experience"
                                            value={experience}
                                            placeholder="Ex: 5"
                                            onChange={onChange}
                                            required
                                            min="0"
                                        />
                                    </div>
                                </>
                            )}

                            <button type="submit" className="btn-primary">
                                Créer mon compte
                            </button>
                        </form>

                        <p className="auth-footer">
                            Vous avez déjà un compte ?{' '}
                            <Link to="/login" className="auth-link">
                                Connectez-vous ici
                            </Link>
                        </p>
                    </div>


                </div>
            </div>
        </>
    );
}

export default Register;
