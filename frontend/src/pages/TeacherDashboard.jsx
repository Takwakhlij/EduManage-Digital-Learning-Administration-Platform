import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import './TeacherDashboard.css';
import logo from '../assets/logo.png';

function TeacherDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'teacher') {
            navigate('/');
        }
    }, [user, navigate]);

    // Handle Logout
    const handleLogout = () => {
        if (window.confirm('Voulez-vous vraiment vous déconnecter?')) {
            dispatch(logout());
            navigate('/login');
        }
    };

    // Helper: Get Initials
    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    // Helper: Get Current Date
    const getCurrentDate = () => {
        const date = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    };

    if (!user) return null;

    return (
        <div className="teacher-dashboard">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`teacher-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="teacher-sidebar-header">
                    <img src={logo} alt="Logo Association" className="teacher-sidebar-logo" />
                    <button
                        className="close-sidebar-btn"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        ✕
                    </button>
                </div>

                <nav className="teacher-sidebar-nav">
                    <button className="nav-item active">
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <span>Tableau de bord</span>
                    </button>

                    <button className="nav-item">
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>Mes Classes</span>
                    </button>

                    <button className="nav-item">
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                        <span>Programme</span>
                    </button>

                    <button className="nav-item">
                        <svg className="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>Emploi du temps</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="teacher-main">
                {/* Top Navbar */}
                <nav className="top-navbar">
                    <div className="navbar-left">
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>

                        <div className="search-bar">
                            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input type="text" placeholder="Rechercher..." className="search-input" />
                        </div>
                    </div>

                    <div className="navbar-right">
                        <button className="navbar-icon-btn" title="Notifications">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            <span className="notification-badge">2</span>
                        </button>

                        <div className="navbar-separator"></div>

                        {/* Profile Menu */}
                        <div className="navbar-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div className="navbar-avatar">
                                {getInitials(user.firstName || user.name, user.lastName)}
                            </div>
                            <div className="navbar-profile-info">
                                <span className="navbar-profile-name">{user.name}</span>
                                <span className="navbar-profile-role">Enseignant</span>
                            </div>

                            {showProfileMenu && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-header">
                                        <p className="dropdown-name">{user.name}</p>
                                        <p className="dropdown-role">Enseignant</p>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item" onClick={() => navigate('/profile')}>
                                        👤 Mon Profil
                                    </button>
                                    <button className="dropdown-item">
                                        ⚙️ Paramètres
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item danger" onClick={handleLogout}>
                                        🚪 Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Header */}
                <header className="teacher-header">
                    <h1 className="teacher-header-title">Ahlan wa Sahlan, {user.firstName || 'Enseignant'} 👋</h1>
                    <p className="teacher-header-subtitle">Gérez vos classes et suivez la progression de vos élèves</p>
                    <div className="teacher-header-date">{getCurrentDate()}</div>
                </header>

                {/* Statistics Cards */}
                <div className="teacher-stats">
                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div className="stat-content">
                            <h3>Total Élèves</h3>
                            <p>42</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon green">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                            </svg>
                        </div>
                        <div className="stat-content">
                            <h3>Classes Actives</h3>
                            <p>3</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon purple">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <div className="stat-content">
                            <h3>Cours Aujourd'hui</h3>
                            <p>2</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                        </div>
                        <div className="stat-content">
                            <h3>Progression Moyenne</h3>
                            <p>85%</p>
                        </div>
                    </div>
                </div>

                {/* Content Placeholder for Future Implementation */}
                <div style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '16px',
                    border: '1px solid #f3f4f6',
                    textAlign: 'center',
                    color: '#6b7280'
                }}>
                    <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#111827' }}>Aperçu des Classes</h3>
                    <p>La liste détaillée de vos classes et élèves apparaîtra ici.</p>
                </div>

            </main>
        </div>
    );
}

export default TeacherDashboard;
