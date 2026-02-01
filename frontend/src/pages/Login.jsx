import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, reset } from '../features/auth/authSlice';
import './Auth.css'; // Import Auth Styles

function Login() {
    const [activeTab, setActiveTab] = useState('student');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { email, password } = formData;

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
            } else {
                navigate('/');
            }
        }

        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch]);

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
                    {/* Logo */}
                    <div className="auth-logo">
                        <img src="/quran-logo.png" alt="Logo Association Coranique" />
                        <div className="logo-text">الجمعية القرآنية</div>
                    </div>
                    {/* Islamic Quote */}
                    <div className="islamic-quote">
                        وَقُل رَّبِّ زِدْنِي عِلْمًا
                        <small>«Et dis : Ô mon Seigneur, accroît mes connaissances !» — Sourate Taha 20:114</small>
                    </div>

                    {/* Title */}
                    <h1 className="auth-title"> Bienvenue </h1>
                    <p className="auth-subtitle">Connectez-vous à votre espace d&apos;apprentissage</p>

                    <div className="divider"></div>

                    {/* Role Tabs */}
                    <div className="role-tabs">
                        <button
                            className={`role-tab ${activeTab === 'student' ? 'active' : ''}`}
                            onClick={() => setActiveTab('student')}
                        >
                            Étudiant
                        </button>
                        <button
                            className={`role-tab ${activeTab === 'teacher' ? 'active' : ''}`}
                            onClick={() => setActiveTab('teacher')}
                        >
                            Enseignant
                        </button>
                        <button
                            className={`role-tab ${activeTab === 'Parent' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Parent')}
                        >
                            Parent
                        </button>
                        <button
                            className={`role-tab ${activeTab === 'admin' ? 'active' : ''}`}
                            onClick={() => setActiveTab('admin')}
                        >
                            Admin
                        </button>
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
                                <label htmlFor="email"> Adresse Email</label>
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

                            <div className="form-group">
                                <label htmlFor="password"> Mot de passe</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="password"
                                    name="password"
                                    value={password}
                                    placeholder="Entrez votre mot de passe"
                                    onChange={onChange}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-primary">
                                Se connecter
                            </button>
                        </form>

                        <p className="auth-footer">
                            Vous n&apos;avez pas de compte ?{' '}
                            <Link to="/register" className="auth-link">
                                Inscrivez-vous ici
                            </Link>
                        </p>
                    </div>


                </div>
            </div>
        </>
    );
}

export default Login;
