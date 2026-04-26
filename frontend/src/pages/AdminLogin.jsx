import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, reset } from '../features/auth/authSlice';
import logo from '../assets/logo.png';
import toast from 'react-hot-toast';
import './AdminLogin.css';

function AdminLogin() {
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
            toast.error(message);
        }

        if (isSuccess || user) {
            if (user?.role === 'admin') {
                navigate('/admin');
            } else {
                // Si ce n'est pas un admin, rediriger vers login normal
                toast.error('Accès réservé aux administrateurs');
                navigate('/login');
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
            role: 'admin',
        };

        dispatch(login(userData));
    };

    if (isLoading) {
        return <div className="admin-loading-spinner">Vérification des accès...</div>;
    }

    return (
        <>

            <div className="admin-login-wrapper">
                {/* Background Pattern */}
                <div className="admin-bg-pattern"></div>

                <div className="admin-login-container">
                    {/* Logo & Title */}
                    <div className="admin-header">
                        <img src={logo} alt="Logo Association" className="admin-logo" />
                        <h1 className="admin-title">Espace Administrateur</h1>
                        <p className="admin-subtitle">Portail de gestion de l'Association Coranique</p>
                    </div>

                    {/* Security Notice */}
                    <div className="security-notice">
                        <span className="notice-icon">🔒</span>
                        <p>Cet espace est réservé exclusivement aux administrateurs autorisés</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={onSubmit} className="admin-form">
                        <div className="admin-form-group">
                            <label htmlFor="email">
                                Identifiant Administrateur
                            </label>
                            <div className="admin-input-wrapper">
                                <input
                                    type="email"
                                    className="admin-input"
                                    id="email"
                                    name="email"
                                    value={email}
                                    placeholder="admin@association-coranique.com"
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="password">
                                Mot de passe sécurisé
                            </label>
                            <div className="admin-input-wrapper">
                                <input
                                    type="password"
                                    className="admin-input"
                                    id="password"
                                    name="password"
                                    value={password}
                                    placeholder="••••••••••"
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="admin-submit-btn">
                            <span className="btn-icon">🔓</span>
                            Accéder au Tableau de Bord
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="admin-footer">
                        <Link to="/login" className="back-link">
                            ← Retour à la connexion principale
                        </Link>
                    </div>

                    {/* Copyright */}
                    <div className="admin-copyright">
                        <p>© 2026 Association Coranique - Tous droits réservés</p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AdminLogin;
