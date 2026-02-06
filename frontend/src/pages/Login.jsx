import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, reset } from '../features/auth/authSlice';
import './Auth.css';

function Login() {
    const [activeTab, setActiveTab] = useState('student');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { email, password } = formData;
    const emailInputRef = useRef(null);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError) {
            alert(message);
        }

        if (isSuccess || user) {
            if (user?.role === 'admin') {
                navigate('/admin');
            } else if (user?.role === 'teacher') {
                navigate('/teacher');
            } else {
                navigate('/');
            }
        }

        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    // Auto-focus on email input
    useEffect(() => {
        if (emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, []);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e) => {
        e.preventDefault();

        const userData = {
            email,
            password,
            role: activeTab,
        };

        dispatch(login(userData));
    };

    if (isLoading) {
        return <div className="loading-spinner">Connexion en cours</div>;
    }

    return (
        <>
            <div className="top-border"></div>
            <div className="auth-wrapper">
                <div className="auth-container">
                    {/* Logo & Identity */}
                    <div className="auth-logo">
                        <img src="/src/assets/logo.png" alt="Logo Association Coranique" />
                        <div className="association-identity">
                            <h2 className="association-name-ar">الجمعية القرآنية</h2>
                            <h3 className="association-name-fr">Association Coranique</h3>
                            <div className="identity-divider"></div>
                            <p className="association-slogan">Pour l'apprentissage et la mémorisation du Saint Coran</p>
                        </div>
                    </div>
                    {/* Islamic Quote */}
                    <div className="islamic-quote">
                        وَقُل رَّبِّ زِدْنِي عِلْمًا
                        <small>«Et dis : Ô mon Seigneur, accroît mes connaissances !» — Sourate Taha 20:114</small>
                    </div>

                    {/* Title */}

                    <div className="divider"></div>

                    {/* Role Selection Dropdown */}
                    <div className="role-select-container">
                        <label htmlFor="role-select" className="role-select-label">
                            Choisissez votre espace
                        </label>
                        <div className="select-wrapper">
                            <select
                                id="role-select"
                                className="role-select"
                                value={activeTab}
                                onChange={(e) => setActiveTab(e.target.value)}
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
                            Connexion {activeTab === 'student' ? 'Étudiant' : activeTab === 'teacher' ? 'Enseignant' : activeTab === 'Parent' ? 'Parent' : 'Administrateur'}
                        </h2>
                        <p className="form-section-subtitle">
                            Accédez à vos cours et ressources islamiques
                        </p>

                        <form onSubmit={onSubmit} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="email">Adresse Email</label>
                                <div className="input-wrapper">

                                    <input
                                        ref={emailInputRef}
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
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Mot de passe</label>
                                <div className="input-wrapper">

                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="form-control"
                                        id="password"
                                        name="password"
                                        value={password}
                                        placeholder="Entrez votre mot de passe"
                                        onChange={onChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Connexion...
                                    </>
                                ) : (
                                    'Se connecter'
                                )}
                            </button>
                        </form>

                        <p className="auth-footer">
                            Vous n&apos;avez pas de compte ?{' '}
                            <Link to="/register" className="auth-link">
                                Inscrivez-vous ici
                            </Link>
                        </p>

                        {/* Lien discret admin */}
                        <p className="admin-access-link">
                            <Link to="/admin/login" className="admin-link">
                                🔒 Accès Administrateur
                            </Link>
                        </p>
                    </div>


                </div>
            </div>
        </>
    );
}

export default Login;
