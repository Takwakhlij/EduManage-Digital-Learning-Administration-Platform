import { useSelector } from 'react-redux';
import {
    BookOpen,
    GraduationCap,
    FileText,
    Award,
    User,
    Settings,
    LogOut,
    Menu,
    X,
    Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import './StudentDashboard.css';
import logo from '../assets/logo.png';

function StudentDashboard({ effectiveUser, parentUser, onSwitchChild, successMessage }) {
    const { user: authUser } = useSelector((state) => state.auth);
    // Use effectiveUser if provided (Parent view), otherwise fall back to logged-in user (Student view)
    const user = effectiveUser || authUser;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        if (successMessage) {
            setNotification(successMessage);
            const timer = setTimeout(() => {
                setNotification('');
                // Clear state without reloading
                navigate(window.location.pathname, { replace: true, state: {} });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, navigate]);

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
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
            {/* Notification Toast */}
            {notification && (
                <div className="notification-toast" style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 10000,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span style={{ fontWeight: '500' }}>{notification}</span>
                    </div>
                </div>
            )}
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src={logo} alt="Logo" className="sidebar-logo" />
                    <button
                        className="close-sidebar-btn"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        ✕
                    </button>
                    <span className="logo-text">الجمعية القرآنية</span>
                </div>

                <div className="sidebar-profile">
                    <div className="profile-img-container">
                        {user?.profileImage ? (
                            <img
                                src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`}
                                alt="Profile"
                                className="profile-img"
                            />
                        ) : (
                            <div className="profile-img-placeholder">
                                {user?.firstName?.charAt(0)}
                            </div>
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
                                            <img
                                                src={parentUser.profileImage.startsWith('http') ? parentUser.profileImage : `http://localhost:5000${parentUser.profileImage}`}
                                                alt={parentUser.firstName}
                                                className="supervisor-img"
                                            />
                                        ) : (
                                            <span className="supervisor-initial">{parentUser.firstName.charAt(0)}</span>
                                        )}
                                        <span className="supervisor-name">{parentUser.firstName}</span>
                                    </div>
                                </span>
                            ) : 'Compte Étudiant'}
                        </p>
                    </div>

                    {/* Child Switcher for Parents */}
                    {parentUser && parentUser.children && parentUser.children.length > 1 && (
                        <div className="child-switcher">
                            <label>Voir le profil de :</label>
                            <select
                                value={user._id}
                                onChange={(e) => {
                                    const selectedId = e.target.value;
                                    const child = parentUser.children.find(c => c._id === selectedId);
                                    if (child && onSwitchChild) onSwitchChild(child);
                                }}
                                className="child-select"
                            >
                                {parentUser.children.map(child => (
                                    <option key={child._id} value={child._id}>
                                        {child.firstName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item, index) => (
                        <Link key={index} to={item.path} className="nav-item">
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
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>

                    <div className="header-actions">
                        <button className="icon-btn"><Bell size={20} /></button>
                        <div className="user-badge" onClick={() => navigate('/profile')}>
                            <div className="badge-img-container">
                                {((parentUser || user)?.profileImage) ? (
                                    <img
                                        src={(parentUser || user).profileImage.startsWith('http')
                                            ? (parentUser || user).profileImage
                                            : `http://localhost:5000${(parentUser || user).profileImage}`}
                                        alt="User"
                                        className="badge-img"
                                    />
                                ) : (
                                    <div className="badge-placeholder">
                                        {(parentUser || user)?.firstName?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <span>{parentUser ? parentUser.firstName : user?.firstName}</span>
                        </div>
                    </div>
                </header>

                {user.status !== 'active' ? (
                    <div className="content-inner centered-message">
                        <div className="empty-dashboard">
                            <h2>Compte en attente</h2>
                            <p>Le compte de {user.firstName} est en attente de validation par l&apos;administration.</p>
                            <p>Vous ne pouvez pas accéder à ses données pour le moment.</p>
                        </div>
                    </div>
                ) : (
                    <div className="content-inner">
                        <div className="welcome-banner">
                            <div className="banner-text">
                                <h1>السلام عليكم، {user?.firstName}!</h1>
                                <p>
                                    {parentUser
                                        ? `Suivi de l'apprentissage de ${user.firstName}`
                                        : "Bienvenue dans votre espace d'apprentissage du Saint Coran."}
                                </p>
                                <div className="islamic-quote">
                                    خَیۡرُكُمۡ مَنۡ تَعَلَّمَ ٱلۡقُرۡءَانَ وَعَلَّمَهُ
                                    <small>«Le meilleur d&apos;entre vous est celui qui apprend le Coran et l&apos;enseigne»</small>
                                </div>
                            </div>
                            <div className="banner-img">
                                <img src="/quran-reading.svg" alt="Reading Quran" />
                            </div>
                        </div>

                        <div className="stats-section">
                            <div className="stat-card">
                                <div className="stat-icon purple"><BookOpen /></div>
                                <div className="stat-body">
                                    <h3>Total Formations</h3>
                                    <p>0</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon green"><GraduationCap /></div>
                                <div className="stat-body">
                                    <h3>Mes Classes</h3>
                                    <p>0</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon gold"><Award /></div>
                                <div className="stat-body">
                                    <h3>Certificats</h3>
                                    <p>0</p>
                                </div>
                            </div>
                        </div>

                        <section className="dashboard-sections">
                            <div className="section-card">
                                <h2>Formations Récents</h2>
                                <div className="empty-state">
                                    <p>Vous n&apos;êtes inscrit à aucune formation pour le moment.</p>
                                    <button className="btn-primary-outline">Explorer les formations</button>
                                </div>
                            </div>

                            <div className="section-card">
                                <h2>Prochains Examens</h2>
                                <div className="empty-state">
                                    <p>Aucun examen prévu prochainement.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </main >
        </div >
    );
}

export default StudentDashboard;
