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
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import './StudentDashboard.css';

function StudentDashboard() {
    const { user } = useSelector((state) => state.auth);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const dispatch = useDispatch();

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
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <img src="/quran-logo.png" alt="Logo" className="sidebar-logo" />
                    <span className="logo-text">الجمعية القرآنية</span>
                </div>

                <div className="sidebar-profile">
                    <div className="profile-img-container">
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt="Profile" className="profile-img" />
                        ) : (
                            <div className="profile-img-placeholder">
                                {user?.firstName?.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="profile-info">
                        <h3>{user?.firstName} {user?.lastName}</h3>
                        <p className="profile-role">Compte Étudiant</p>
                    </div>
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
                        className="toggle-sidebar"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <div className="header-actions">
                        <button className="icon-btn"><Bell size={20} /></button>
                        <div className="user-badge" onClick={() => navigate('/profile')}>
                            <span>{user?.firstName}</span>
                        </div>
                    </div>
                </header>

                <div className="content-inner">
                    <div className="welcome-banner">
                        <div className="banner-text">
                            <h1>السلام عليكم، {user?.firstName}!</h1>
                            <p>Bienvenue dans votre espace d&apos;apprentissage du Saint Coran.</p>
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
            </main>
        </div>
    );
}

export default StudentDashboard;
