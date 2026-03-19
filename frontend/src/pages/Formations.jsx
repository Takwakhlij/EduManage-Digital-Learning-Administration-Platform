import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import {
    GraduationCap, BookOpen, FileText, Award,
    User, Settings, LogOut, Menu, Bell, Info
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { logout, reset as authReset } from '../features/auth/authSlice';
import logo from '../assets/logo.png';
import './StudentDashboard.css';

function Formations({ effectiveUser, parentUser, onSwitchChild }) {
    const { user: authUser } = useSelector((state) => state.auth);
    const user = effectiveUser || authUser;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isDarkMode, toggleTheme } = useTheme();

    const onLogout = () => {
        dispatch(logout());
        dispatch(authReset());
        navigate('/login');
    };

    const navItems = [
        { icon: <BookOpen size={20} />, label: 'Formations', path: '/formations' },
        { icon: <GraduationCap size={20} />, label: 'Mes Classes', path: '/classes' },
        { icon: <FileText size={20} />, label: 'Mes Examens', path: '/examens' },
        { icon: <Award size={20} />, label: 'Mes Certificats', path: '/certificats' },
    ];

    return (
        <div className="dashboard-layout">
            {/* Mobile Overlay */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src={logo} alt="Logo" className="sidebar-logo" />
                    <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>
                    <span className="logo-text">الجمعية القرآنية</span>
                </div>

                <div className="sidebar-profile">
                    <div className="profile-img-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        {user?.profileImage ? (
                            <img src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`} alt="Profile" className="profile-img" />
                        ) : (
                            <div className="profile-img-placeholder">{user?.firstName?.charAt(0)}</div>
                        )}
                    </div>
                    <div className="profile-info">
                        <h3>{user?.firstName} {user?.lastName}</h3>
                        <p className="profile-role">
                            {parentUser ? (
                                <span className="supervisor-info">
                                    <span className="supervisor-label">Supervisé par</span>
                                    <div className="supervisor-badge">
                                        {parentUser.profileImage ? (
                                            <img src={parentUser.profileImage.startsWith('http') ? parentUser.profileImage : `http://localhost:5000${parentUser.profileImage}`} alt={parentUser.firstName} className="supervisor-img" />
                                        ) : (
                                            <span className="supervisor-initial">{parentUser.firstName.charAt(0)}</span>
                                        )}
                                        <span className="supervisor-name">{parentUser.firstName}</span>
                                    </div>
                                </span>
                            ) : 'Compte Étudiant'}
                        </p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item">
                        <span className="nav-icon"><User size={20} /></span>
                        <span className="nav-label">Mon Tableau de Bord</span>
                    </Link>
                    {navItems.map((item, index) => (
                        <Link key={index} to={item.path} className={`nav-item ${window.location.pathname === item.path ? 'active' : ''}`}>
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}
                    <div className="nav-divider"></div>
                    <Link to="/profile" className="nav-item">
                        <span className="nav-icon"><Settings size={20} /></span>
                        <span className="nav-label">Paramètres</span>
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={onLogout} className="btn-logout">
                        <LogOut size={20} />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="content-header">
                    <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>
                    <div className="header-actions">
                        <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title={isDarkMode ? 'Mode Clair' : 'Mode Sombre'}>
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>
                        <button className="icon-btn"><Bell size={20} /></button>
                        <div className="user-badge" onClick={() => navigate('/profile')}>
                            <span>{parentUser ? parentUser.firstName : user?.firstName}</span>
                        </div>
                    </div>
                </header>

                <div className="content-inner">
                    <div className="welcome-banner">
                        <div className="banner-text">
                            <h1>Formations</h1>
                            <p>Découvrez nos programmes de formation approfondis.</p>
                        </div>
                    </div>

                    <div className="sd-no-class">
                        <div className="sd-no-class__icon">📚</div>
                        <h3>Aucune formation disponible</h3>
                        <p>Il n'y a pas encore de formations publiées. Vos formations apparaîtront ici dès qu'elles seront disponibles.</p>
                        <Link to="/classes" className="sd-enroll-link">
                            <GraduationCap size={16} /> Voir mes classes pour s'inscrire
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Formations;
