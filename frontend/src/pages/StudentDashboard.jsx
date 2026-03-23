import { useSelector, useDispatch } from 'react-redux';
import { BookOpen, GraduationCap, FileText, Award, User, Settings, LogOut, Menu, X, Bell, Users, Clock, Calendar, ChevronRight, UserPlus, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import './StudentDashboard.css';
import logo from '../assets/logo.png';
import quranImg from '../assets/quran-hifz.png';
import libraryImg from '../assets/library-study.png';
import patternImg from '../assets/islamic-pattern.jpg';

function StudentDashboard({ effectiveUser, parentUser, onSwitchChild, successMessage }) {
    const { user: authUser } = useSelector((state) => state.auth);
    // Use effectiveUser if provided (Parent view), otherwise fall back to logged-in user (Student view)
    const user = effectiveUser || authUser;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState('');
    // 🔒 Inscriptions privées: ne contient QUE les inscriptions de cet étudiant
    const [myInscriptions, setMyInscriptions] = useState([]);
    const [inscriptionsLoading, setInscriptionsLoading] = useState(true);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isDarkMode, toggleTheme } = useTheme();
    const { t, lang, setLang } = useLanguage();

    useEffect(() => {
        if (successMessage) {
            setNotification(successMessage);
            const timer = setTimeout(() => {
                setNotification('');
                navigate(window.location.pathname, { replace: true, state: {} });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage, navigate]);

    const fetchRef = useRef(false);

    useEffect(() => {
        // 🔒 Fetch UNIQUEMENT les sessions de l'étudiant connecté via la route sécurisée
        if (authUser?.token && !fetchRef.current) {
            fetchRef.current = true;
            
            const fetchData = async () => {
                const config = { headers: { Authorization: `Bearer ${authUser.token}` } };
                
                try {
                    setInscriptionsLoading(true);
                    const response = await axios.get('/api/inscriptions/my', config);
                    if (response.data.success) {
                        setMyInscriptions(response.data.inscriptions);
                    }
                } catch (error) {
                    console.error('Erreur inscriptions :', error);
                } finally {
                    setInscriptionsLoading(false);
                }

            };
            fetchData();
        }
    }, [authUser?.token]);



    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/login');
    };

    const navItems = [
        { icon: <BookOpen size={20} />, label: t.formations, path: '/formations' },
        { icon: <GraduationCap size={20} />, label: t.myClasses, path: '/inscriptions' },
        { icon: <FileText size={20} />, label: t.myExams, path: '/examens' },
        { icon: <Award size={20} />, label: t.myCertificates, path: '/certificats' },
    ];

    const getClasseImage = (nom) => {
        if (!nom) return quranImg;
        const lowNom = nom.toLowerCase();

        // Catégorie Coran / Hifz
        const hifzKeywords = ['hifz', 'coran', 'mémorisation', 'memorisation', 'tajwid', 'tajweed', 'fajr', 'فجر', 'نور', 'بشائر'];
        if (hifzKeywords.some(keyword => lowNom.includes(keyword))) {
            return quranImg;
        }

        // Catégorie Arabe / Langue / Etudes / Tests
        const studyKeywords = ['arabe', 'langue', 'lettres', 'lm', 'étude', 'etude', 'matière', 'matiere', 'test', 'classe', 'براعم'];
        if (studyKeywords.some(keyword => lowNom.includes(keyword))) {
            return libraryImg;
        }

        // Par défaut
        return libraryImg;
    };

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
                    <button
                        className="close-sidebar-btn"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        ✕
                    </button>
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
                    <Link to="/" className="nav-item back-home-nav">
                        <span className="nav-icon"><ArrowLeft size={20} /></span>
                        <span className="nav-label">Retour à l'accueil</span>
                    </Link>

                    <div className="nav-divider" style={{ margin: '10px 0', opacity: 0.3 }}></div>

                    <Link to="/dashboard" className={`nav-item ${window.location.pathname === '/' || window.location.pathname === '/dashboard' ? 'active' : ''}`}>
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
                        <span>Déconnexion
                            
                        </span>
                    </button>
                </div>            </aside>

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
                        <button
                            className="icon-btn theme-toggle-btn"
                            onClick={toggleTheme}
                            title={isDarkMode ? 'Mode Clair' : 'Mode Sombre'}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-color)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>
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
                                {/* Tasbih ornament row */}
                                <div className="tasbih-row" style={{ margin: '15px 0' }}>
                                    {Array.from({ length: 15 }).map((_, i) => (
                                        <span key={i} className="tasbih-bead"></span>
                                    ))}
                                </div>
                                <div className="islamic-quote">
                                    ﴿&nbsp;خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ&nbsp;﴾
                                    <small>«Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne» — Bukhari</small>
                                </div>
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="stats-section">
                            <div className="stat-card">
                                <div className="stat-icon green"><GraduationCap /></div>
                                <div className="stat-body">
                                    <h3>Mes Sessions</h3>
                                    <p>{myInscriptions.filter(i => i.statut === 'approuvee').length}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon purple"><Clock /></div>
                                <div className="stat-body">
                                    <h3>En attente</h3>
                                    <p>{myInscriptions.filter(i => i.statut === 'en_attente').length}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon gold"><Award /></div>
                                <div className="stat-body">
                                    <h3>Certificats</h3>
                                    <p>0</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon blue"><Calendar /></div>
                                <div className="stat-body">
                                    <h3>Prochains Examens</h3>
                                    <p>0</p>
                                </div>
                            </div>
                        </div>

                        {/* ===== ENROLLED SESSIONS SECTION ===== */}
                        <section className="sd-classes-section">
                            <div className="sd-section-header">
                                <h2 className="sd-section-title">
                                    <GraduationCap size={22} style={{ color: 'var(--primary-color)' }} />
                                    Mes Sessions Inscrites
                                </h2>
                                <Link to="/inscriptions" className="sd-see-all">
                                    Voir tout <ChevronRight size={16} />
                                </Link>
                            </div>

                            {inscriptionsLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <p>Chargement de vos sessions...</p>
                                </div>
                            ) : !myInscriptions || myInscriptions.length === 0 ? (
                                <div className="sd-no-class">
                                    <div className="sd-no-class__icon">🎓</div>
                                    <h3>Aucune session inscrite</h3>
                                    <p>Vous n'êtes encore inscrit à aucune session. Découvrez nos programmes disponibles !</p>
                                    <Link to="/formations" className="sd-enroll-link">
                                        <GraduationCap size={16} /> Voir les sessions disponibles
                                    </Link>
                                </div>
                            ) : (
                                <div className="sd-classes-grid">
                                    {myInscriptions.map(inscription => {
                                        const session = inscription.session;
                                        return (
                                            <div 
                                                key={inscription._id} 
                                                className={`sd-class-card ${inscription.statut === 'en_attente' ? 'pending' : ''}`}
                                            >
                                                <div
                                                    className="sd-class-card__header has-image"
                                                    style={{
                                                        background: `url("${quranImg}")`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center'
                                                    }}
                                                >
                                                    <div className="sd-class-card__image-overlay"></div>
                                                    
                                                    {inscription.statut === 'en_attente' && (
                                                        <div className="sd-pending-badge">En cours de validation</div>
                                                    )}

                                                    <div className="sd-class-card__title-row">
                                                        <h3 className="sd-class-card__name">{session?.nomSession || 'Session'}</h3>
                                                        <span className="sd-class-card__niveau">
                                                            {session?.classe?.niveau || 'Tous'}
                                                        </span>
                                                    </div>
                                                    <div className="sd-class-card__meta">
                                                        {session?.duree && <span><Clock size={13} /> {session.duree}</span>}
                                                        <span style={{
                                                            fontSize: '12px',
                                                            color: inscription.statutPaiement === 'Payé' ? '#34d399' : '#fbbf24'
                                                        }}>
                                                            💳 {inscription.statutPaiement}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>



                        {/* Upcoming Exams Section */}
                        <section className="dashboard-sections" style={{ marginTop: '24px' }}>
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
