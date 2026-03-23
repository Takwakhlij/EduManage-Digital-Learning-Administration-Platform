import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, reset } from '../features/auth/authSlice';
import { useTheme } from '../context/ThemeContext';
import './Auth.css';

function Login() {
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
    const { isDarkMode, toggleTheme } = useTheme();

    useEffect(() => {
        if (isError) {
            alert(message);
        }

        if (isSuccess || user) {
            if (user?.role === 'admin') {
                navigate('/admin');
            } else if (user?.role === 'teacher') {
                navigate('/teacher');
            } else if (user?.role === 'student') {
                navigate('/');
            } else {
                navigate('/'); // Default for parent
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
        dispatch(login({ email, password }));
    };


    if (isLoading) {
        return <div className="loading-spinner">Connexion en cours…</div>;
    }

    return (
        <>
            {/* Theme Toggle */}
            <button
                className="login-theme-toggle"
                onClick={toggleTheme}
                title={isDarkMode ? 'Mode Clair' : 'Mode Sombre'}
            >
                {isDarkMode ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                )}
            </button>

            <div className="auth-wrapper">
                <div className="auth-container">

                    {/* ── LEFT PANEL ── */}
                    <div className="auth-panel-left">
                        <div className="panel-decoration" />
                        <div className="panel-decoration-inner" />

                        {/* Logo & Identity */}
                        <div className="auth-logo">
                            <img src="/src/assets/logo.png" alt="Logo Association Coranique" />
                            <div className="association-identity">
                                <h2 className="association-name-ar">الجمعية القرآنية</h2>
                                <h3 className="association-name-fr">Association Coranique</h3>
                                <div className="identity-divider" />
                                <p className="association-slogan">
                                    Pour l'apprentissage et la mémorisation du Saint Coran
                                </p>
                            </div>
                        </div>

                        {/* Islamic Quote */}
                        <div className="islamic-quote">
                            وَقُل رَّبِّ زِدْنِي عِلْمًا
                            <small>
                                «Et dis : Ô mon Seigneur, accroît mes connaissances !»<br />
                                — Sourate Taha 20:114
                            </small>
                        </div>
                    </div>

                    {/* ── RIGHT PANEL ── */}
                    <div className="auth-panel-right">
                        <h2 className="form-section-title">
                            Connexion
                        </h2>
                        <p className="form-section-subtitle">
                            Accédez à vos cours et ressources islamiques
                        </p>


                        {/* Form */}
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
                                        type={showPassword ? 'text' : 'password'}
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
                                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                    >
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <span className="spinner" />
                                        Connexion…
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
                        
                      
                    </div>

                </div>
            </div>
        </>
    );
}

export default Login;
