import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, reset } from '../features/auth/authSlice';
import './Auth.css'; // Import Auth Styles

function Register() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        ageGroup: '',
        currentLevel: '',
        interestedProgram: '',
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
        ageGroup,
        currentLevel,
        interestedProgram,
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
            alert(message);
        }

        if (isSuccess) {
            // If registration is successful, user is NOT logged in (no token).
            // Alert user and redirect to login.
            alert("Inscription réussie ! Votre compte est en attente de validation par un administrateur. Vous recevrez l'accès une fois validé.");
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
            alert('Les mots de passe ne correspondent pas');
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
            userData.ageGroup = ageGroup;
            userData.currentLevel = currentLevel;
            userData.interestedProgram = interestedProgram;
        }

        // Add fields for teacher
        if (role === 'teacher') {
            userData.specialization = specialization;
            userData.experience = experience;
        }

        dispatch(register(userData));
    };

    if (isLoading) {
        return <div className="loading-spinner">Inscription en cours</div>;
    }

    return (
        <>
            <div className="top-border"></div>
            <div className="auth-wrapper">
                <div className="auth-container register-container">
                    {/* Logo */}
                    <div className="auth-logo">
                        <img src="/quran-logo.png" alt="Logo Association Coranique" />
                        <div className="logo-text">الجمعية القرآنية</div>
                    </div>
                    {/* Islamic Quote */}
                    <div className="islamic-quote">
                        خَیۡرُكُمۡ مَنۡ تَعَلَّمَ ٱلۡقُرۡءَانَ وَعَلَّمَهُ
                        <small>«Le meilleur d&apos;entre vous est celui qui apprend le Coran et l&apos;enseigne» — Hadith du Prophète ﷺ</small>
                    </div>
                    {/* Title */}
                    <h1 className="auth-title">انضم إلى مجتمعنا</h1>
                    <p className="auth-subtitle">Rejoignez notre communauté d&apos;apprenants du Saint Coran</p>

                    <div className="divider"></div>

                    {/* Role Tabs */}
                    <div className="role-tabs">
                        <button
                            className={`role-tab ${role === 'student' ? 'active' : ''}`}
                            onClick={() => setRole('student')}
                        >
                            Étudiant
                        </button>
                        <button
                            className={`role-tab ${role === 'teacher' ? 'active' : ''}`}
                            onClick={() => setRole('teacher')}
                        >
                            Enseignant
                        </button>
                        <button
                            className={`role-tab ${role === 'parent' ? 'active' : ''}`}
                            onClick={() => setRole('parent')}
                        >
                            Parent
                        </button>
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
                                        placeholder="Mohamed"
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
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="ageGroup">Tranche d&apos;âge</label>
                                            <select
                                                className="form-control"
                                                id="ageGroup"
                                                name="ageGroup"
                                                value={ageGroup}
                                                onChange={onChange}
                                                required
                                            >
                                                <option value="">Sélectionnez votre âge</option>
                                                <option value="under-18">Moins de 18 ans</option>
                                                <option value="18-25">18 - 25 ans</option>
                                                <option value="26-35">26 - 35 ans</option>
                                                <option value="36-50">36 - 50 ans</option>
                                                <option value="over-50">Plus de 50 ans</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="currentLevel">Niveau actuel</label>
                                            <select
                                                className="form-control"
                                                id="currentLevel"
                                                name="currentLevel"
                                                value={currentLevel}
                                                onChange={onChange}
                                                required
                                            >
                                                <option value="">Sélectionnez votre niveau</option>
                                                <option value="beginner">Débutant</option>
                                                <option value="intermediate">Intermédiaire</option>
                                                <option value="advanced">Avancé</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="interestedProgram">Programme d&apos;intérêt</label>
                                        <select
                                            className="form-control"
                                            id="interestedProgram"
                                            name="interestedProgram"
                                            value={interestedProgram}
                                            onChange={onChange}
                                            required
                                        >
                                            <option value="">Choisissez un programme</option>
                                            <option value="quran-memorization">Mémorisation du Coran (Hifz)</option>
                                            <option value="tajweed">Tajweed et Récitation</option>
                                            <option value="arabic-language">Langue Arabe</option>
                                            <option value="islamic-studies">Sciences Islamiques</option>
                                        </select>
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
