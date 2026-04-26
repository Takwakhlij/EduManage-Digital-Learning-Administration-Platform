import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import logo from '../assets/logo.png';
import NotificationCenter from './NotificationCenter';
import '../pages/DashboardAdmin.css'; // Reusing existing styles
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const AdminLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { isDarkMode, toggleTheme } = useTheme();
    const { t, lang, setLang } = useLanguage();

    const handleLogout = () => {
        if (window.confirm('Voulez-vous vraiment vous déconnecter?')) {
            dispatch(logout());
            navigate('/login');
        }
    };

    // Helper: Role Label
    const getRoleLabel = (role) => {
        const roles = {
            student: 'Étudiant',
            parent: 'Parent',
            teacher: 'Enseignant',
            admin: 'Admin'
        };
        return roles[role] || role;
    };

    // Helper: Avatar
    const getAvatar = (userData) => {
        if (!userData) return { initials: '?', color: '#6b7280', hasImage: false };
        const name = typeof userData === 'string' ? userData : userData.name;
        const profileImage = typeof userData === 'object' ? userData.profileImage : null;

        if (profileImage) {
            const imageUrl = profileImage.startsWith('http')
                ? profileImage
                : `http://localhost:5000${profileImage}`;
            return {
                initials: name?.charAt(0).toUpperCase() || '?',
                color: '#6b7280',
                hasImage: true,
                imageUrl: imageUrl
            };
        }

        if (!name) return { initials: '?', color: '#6b7280', hasImage: false };
        const initials = name.charAt(0).toUpperCase();
        const colors = [
            'linear-gradient(135deg, #3b82f6, #2563eb)',
            'linear-gradient(135deg, #ec4899, #db2777)',
            'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            'linear-gradient(135deg, #10b981, #059669)',
            'linear-gradient(135deg, #f59e0b, #f97316)',
        ];
        const colorIndex = name.charCodeAt(0) % colors.length;
        return {
            initials: initials.toUpperCase(),
            color: colors[colorIndex],
            hasImage: false
        };
    };

    if (!user) return null;

    // Check active route for highlighting
    const isActive = (path) => {
        if (path === '/admin' && location.pathname === '/admin') return true;
        if (path !== '/admin' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="admin-dashboard" dir={t.dir}>
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-sidebar-brand">
                        <img src={logo} alt="Logo Noor Tayyiba" className="admin-sidebar-logo" />
                        <div className="sidebar-brand-text">
                            <h2>الجمعية القرآنية</h2>
                            <p>نور طيبة</p>
                        </div>
                    </div>
                    <button
                        className="close-sidebar-btn"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        ✕
                    </button>
                </div>

                <nav className="admin-sidebar-nav">

                    <button
                        className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
                        onClick={() => {
                            navigate('/admin');
                            setIsSidebarOpen(false);
                        }}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <span>Dashboard</span>
                    </button>

                    <button
                        className={`nav-item ${isActive('/admin/classes') ? 'active' : ''}`}
                        onClick={() => {
                            navigate('/admin/classes');
                            setIsSidebarOpen(false);
                        }}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                        </svg>
                        <span>Classes</span>
                    </button>

                    <button
                        className={`nav-item ${isActive('/admin/sessions') ? 'active' : ''}`}
                        onClick={() => {
                            navigate('/admin/sessions');
                            setIsSidebarOpen(false);
                        }}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>Sessions</span>
                    </button>

                    <button
                        className={`nav-item ${isActive('/admin/planning') ? 'active' : ''}`}
                        onClick={() => {
                            navigate('/admin/planning');
                            setIsSidebarOpen(false);
                        }}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        <span>Planning</span>
                    </button>
                    <button
                        className={`nav-item ${isActive('/admin/inscriptions') ? 'active' : ''}`}
                        onClick={() => {
                            navigate('/admin/inscriptions');
                            setIsSidebarOpen(false);
                        }}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span>Inscriptions</span>
                    </button>

                    <button
                        className={`nav-item ${isActive('/admin/presences-enseignants') ? 'active' : ''}`}
                        onClick={() => {
                            navigate('/admin/presences-enseignants');
                            setIsSidebarOpen(false);
                        }}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                        <span>Présences Enseignants</span>
                    </button>

                    <button
                        className={`nav-item ${isActive('/admin/presences-etudiants') ? 'active' : ''}`}
                        onClick={() => {
                            navigate('/admin/presences-etudiants');
                            setIsSidebarOpen(false);
                        }}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>Présences Étudiants</span>
                    </button>

                    <button
                        className={`nav-item ${isActive('/admin/matieres') ? 'active' : ''}`}
                        onClick={() => {
                            navigate('/admin/matieres');
                            setIsSidebarOpen(false);
                        }}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        <span>Matières</span>
                    </button>

                    <button
                        className={`nav-item ${isActive('/admin/membres') ? 'active' : ''}`}
                        onClick={() => {
                            navigate('/admin/membres');
                            setIsSidebarOpen(false);
                        }}
                    >
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>Membres</span>
                    </button>

                    <button className="nav-item">
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        <span>Statistiques</span>
                    </button>

                    <button className="nav-item">
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6M21 12h-6m-6 0H3"></path>
                        </svg>
                        <span>Paramètres</span>
                    </button>

                    <button className="nav-item danger sidebar-logout" onClick={handleLogout}>
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>Déconnexion</span>
                    </button>
                </nav>
            </aside>


            {/* Main Content Area */}
            <main className="admin-main">
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
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="navbar-right">
                        {/* Theme Toggle */}
                        <button
                            className="navbar-icon-btn"
                            title={isDarkMode ? 'Mode Clair' : 'Mode Sombre'}
                            onClick={toggleTheme}
                        >
                            {isDarkMode ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5"></circle>
                                    <line x1="12" y1="1" x2="12" y2="3"></line>
                                    <line x1="12" y1="21" x2="12" y2="23"></line>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                    <line x1="1" y1="12" x2="3" y2="12"></line>
                                    <line x1="21" y1="12" x2="23" y2="12"></line>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                </svg>
                            )}
                        </button>

                        {/* Messages */}
                        <button className="navbar-icon-btn" title="Messages">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0 1.1.9 2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                        </button>

                        {/* Notifications */}
                        <NotificationCenter />

                        <div className="navbar-separator"></div>

                        {/* Admin Profile */}
                        <div className="navbar-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div className="navbar-avatar" style={{ background: getAvatar(user).hasImage ? 'transparent' : getAvatar(user).color }}>
                                {getAvatar(user).hasImage ? (
                                    <img src={getAvatar(user).imageUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    getAvatar(user).initials
                                )}
                            </div>
                            <div className="navbar-profile-info">
                                <span className="navbar-profile-name">{user.firstName} {user.lastName}</span>
                                <span className="navbar-profile-role">Super Admin</span>
                            </div>
                            <svg className={`navbar-chevron ${showProfileMenu ? 'active' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>

                            {/* Dropdown Menu */}
                            {showProfileMenu && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-header">
                                        <p className="dropdown-name">{user.name || 'Super Admin'}</p>
                                        <p className="dropdown-role">{getRoleLabel(user.role)}</p>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item" onClick={() => navigate('/profile')}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        Mon Profil
                                    </button>
                                    <button className="dropdown-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="3"></circle>
                                            <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
                                        </svg>
                                        Paramètres
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item danger" onClick={handleLogout}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                        Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Content Rendered Here */}
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
