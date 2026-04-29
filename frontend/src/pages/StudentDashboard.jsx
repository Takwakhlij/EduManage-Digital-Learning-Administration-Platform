import { useSelector, useDispatch } from 'react-redux';
import { subscribeToPush } from '../features/notifications/notificationSlice';
import { BookOpen, GraduationCap, FileText, Award, User, Settings, LogOut, Menu, Bell, Users, Clock, Calendar, ChevronRight, ArrowLeft, TrendingUp, Hourglass, X, CheckCircle, XCircle, AlertCircle, BookMarked, CreditCard } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import './StudentDashboard.css';
import NotificationCenter from '../components/NotificationCenter';
import logo from '../assets/logo.png';
import quranImg from '../assets/quran-hifz.png';
import libraryImg from '../assets/library-study.png';

/* ─── SessionDetailModal ─────────────────────────────────── */
function SessionDetailModal({ inscription, presenceData, onClose, onToggleCours }) {
    const session = inscription?.session;
    const [seances, setSeances] = useState([]);
    const [loadingSeances, setLoadingSeances] = useState(true);
    const { user: authUser } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!session?._id) return;
        const fetchSeances = async () => {
            try {
                setLoadingSeances(true);
                const config = { headers: { Authorization: `Bearer ${authUser.token}` } };
                const res = await axios.get(`/api/seances/session/${session._id}`, config);
                setSeances(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Erreur séances :', err);
                setSeances([]);
            } finally {
                setLoadingSeances(false);
            }
        };
        fetchSeances();
    }, [session?._id, authUser?.token]);

    // Find attendance per session from presenceData
    const sessionPresence = presenceData?.find(ps => ps.sessionId === session?._id);
    const taux = sessionPresence?.taux ?? 0;
    const getTauxColor = (t) => t >= 80 ? '#10b981' : t >= 60 ? '#f59e0b' : '#ef4444';
    const getTauxLabel = (t) => t >= 80 ? 'EXCELLENT' : t >= 60 ? 'PASSABLE' : 'INSUFFISANT';
    const color = getTauxColor(taux);

    // Group seances by day
    const dayOrder = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
    const seancesByDay = seances.reduce((acc, s) => {
        const day = s.jour || 'Autre';
        if (!acc[day]) acc[day] = [];
        acc[day].push(s);
        return acc;
    }, {});
    const sortedDays = Object.keys(seancesByDay).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

    // Programme / matières
    const programme = session?.programme || [];
    const cours = session?.coursPublies || [];

    const radius = 36;
    const circ = 2 * Math.PI * radius;
    const dash = (taux / 100) * circ;

    return (
        <div className="sdm-overlay" onClick={onClose}>
            <div className="sdm-panel" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sdm-header">
                    <div className="sdm-header-left">
                        <div className="sdm-badge">
                            {inscription.statut === 'approuvee' ? 'EN COURS' : 'EN ATTENTE'}
                        </div>
                        <h2 className="sdm-title">{session?.nomSession || 'Session'}</h2>
                        <p className="sdm-subtitle">
                            <Calendar size={14} /> {session?.duree || '—'}
                            {session?.classe?.[0]?.nomClasse && (
                                <span> · {session.classe[0].nomClasse}</span>
                            )}
                        </p>
                    </div>
                    <button className="sdm-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="sdm-body">



                    {/* ── Programme / Cours ── */}
                    {programme.length > 0 && (
                        <div className="sdm-section">
                            <h3 className="sdm-section-title"><BookMarked size={16}/> Programme</h3>
                            <div className="sdm-programme-list">
                                {programme.map((p, i) => (
                                    <div key={i} className="sdm-programme-item">
                                        <span className="sdm-programme-dot"/>
                                        <span>{p.nomMatiere}</span>
                                        {p.enseignant && (
                                            <span className="sdm-enseignant">
                                                · {p.enseignant.firstName} {p.enseignant.lastName}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Séances par jour ── */}
                    <div className="sdm-section">
                        <h3 className="sdm-section-title"><Calendar size={16}/> Jours et Horaires des Séances</h3>
                        {loadingSeances ? (
                            <div className="sdm-loading-seances">Chargement des séances...</div>
                        ) : seances.length === 0 ? (
                            <div className="sdm-empty-seances">
                                <AlertCircle size={20}/> Aucune séance planifiée pour le moment.
                            </div>
                        ) : (
                            <div className="sdm-days-list">
                                {sortedDays.map(day => (
                                    <div key={day} className="sdm-day-group">
                                        <div className="sdm-day-label">{day}</div>
                                        <div className="sdm-day-seances">
                                            {seancesByDay[day].map(seance => (
                                                <div key={seance._id} className="sdm-seance-chip">
                                                    <Clock size={12}/>
                                                    <span className="sdm-seance-time">{seance.heureDebut} — {seance.heureFin}</span>
                                                    {seance.matiere?.nomMatiere && (
                                                        <span className="sdm-seance-matiere">{seance.matiere.nomMatiere}</span>
                                                    )}
                                                    {seance.salle && seance.salle !== 'Non assignée' && (
                                                        <span className="sdm-seance-salle">Salle: {seance.salle}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Cours publiés ── */}
                    {cours.length > 0 && (
                        <div className="sdm-section">
                            <h3 className="sdm-section-title"><FileText size={16}/> Cours Publiés ({cours.length})</h3>
                            <div className="sdm-cours-list">
                                {cours.map((c, i) => {
                                    const isDone = inscription.coursTermines?.includes(c._id);
                                    return (
                                        <div key={i} className="sdm-cours-row">
                                            <a href={c.urlFichier} target="_blank" rel="noreferrer" className="sdm-cours-item">
                                                <span className={`sdm-cours-type sdm-type-${c.typeFichier?.toLowerCase()}`}>
                                                    {c.typeFichier}
                                                </span>
                                                <span className="sdm-cours-title">{c.titreCours}</span>
                                                <ChevronRight size={14} className="sdm-cours-arrow"/>
                                            </a>
                                            <button 
                                                className={`sdm-cours-check ${isDone ? 'checked' : ''}`} 
                                                onClick={() => onToggleCours(inscription._id, c._id)}
                                                title={isDone ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
                                            >
                                                {isDone ? <CheckCircle size={20} fill="currentColor" color="white" /> : <div className="sdm-check-circle-outline" />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="sdm-footer">
                    <Link to="/presence" className="sdm-btn-presence">
                        <TrendingUp size={16}/> Voir mon historique de présence
                    </Link>
                    <Link to="/planning" className="sdm-btn-planning">
                        <Calendar size={16}/> Mon emploi du temps
                    </Link>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Dashboard ─────────────────────────────────────── */
function StudentDashboard({ effectiveUser, parentUser, onSwitchChild, successMessage }) {
    const { user: authUser } = useSelector((state) => state.auth);
    const user = effectiveUser || authUser;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState('');
    const [myInscriptions, setMyInscriptions] = useState([]);
    const [inscriptionsLoading, setInscriptionsLoading] = useState(true);
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [parSession, setParSession] = useState([]);
    const [selectedInscription, setSelectedInscription] = useState(null);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isDarkMode, toggleTheme } = useTheme();
    const { t, lang, setLang } = useLanguage();
    const [notifBannerDismissed, setNotifBannerDismissed] = useState(false);
    const [notifPermission, setNotifPermission] = useState(
        ('Notification' in window) ? Notification.permission : 'denied'
    );
    const [isSubscribing, setIsSubscribing] = useState(false);

    const handleActivateNotifs = async () => {
        setIsSubscribing(true);
        try {
            await dispatch(subscribeToPush()).unwrap();
            setNotifPermission('granted');
        } catch (err) {
            console.error('Erreur activation notifications:', err);
            setNotifPermission(Notification.permission);
        } finally {
            setIsSubscribing(false);
        }
    };

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
        if (authUser?.token && !fetchRef.current) {
            fetchRef.current = true;
            fetchData();
        }
    }, [authUser?.token]);

    const fetchData = async () => {
        if (!authUser?.token) return;
        const config = { headers: { Authorization: `Bearer ${authUser.token}` } };
        try {
            setInscriptionsLoading(true);
            const response = await axios.get('/api/inscriptions/my', config);
            if (response.data.success) {
                setMyInscriptions(response.data.inscriptions);
            }
            const statsRes = await axios.get(`/api/presences/etudiant/${user._id}/stats`, config);
            if (statsRes.data.success) {
                setAttendanceStats(statsRes.data.stats);
                setParSession(statsRes.data.parSession || []);
            }
        } catch (error) {
            console.error('Erreur données:', error);
        } finally {
            setInscriptionsLoading(false);
        }
    };

    const handleToggleCours = async (inscriptionId, coursId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${authUser.token}` } };
            const res = await axios.put(`/api/inscriptions/${inscriptionId}/toggle-cours`, { coursId }, config);
            if (res.data.success) {
                // Update local state immediately for snappy UI
                setMyInscriptions(prev => prev.map(ins => {
                    if (ins._id === inscriptionId) {
                        return { ...ins, coursTermines: res.data.coursTermines };
                    }
                    return ins;
                }));
                // Also update selected inscription if modal is open
                if (selectedInscription && selectedInscription._id === inscriptionId) {
                    setSelectedInscription(prev => ({ ...prev, coursTermines: res.data.coursTermines }));
                }
            }
        } catch (err) {
            console.error('Erreur toggle cours:', err);
        }
    };

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/login');
    };

    const navItems = [
        { icon: <BookOpen size={20} />, label: t.formations, path: '/formations' },
        { icon: <GraduationCap size={20} />, label: t.myClasses, path: '/inscriptions' },
        { icon: <Calendar size={20} />, label: 'Emploi du Temps', path: '/planning' },
        {icon: <TrendingUp size={20} />, label: 'Mes Absences', path: '/presence' },
        { icon: <CreditCard size={20} />, label: 'Mes Paiements', path: '/paiements' },
        { icon: <FileText size={20} />, label: t.myExams, path: '/examens' },
        { icon: <Award size={20} />, label: t.myCertificates, path: '/certificats' },
    ];

    const getCardImage = (nom) => {
        if (!nom) return quranImg;
        const low = nom.toLowerCase();
        if (['hifz','coran','mémorisation','memorisation','tajwid','tajweed','فجر','نور','بشائر'].some(k => low.includes(k))) return quranImg;
        return libraryImg;
    };

    // ── Attendance gauge helpers ──
    const taux = attendanceStats?.tauxAssiduité ?? 0;
    const getTauxColor = (t) => t >= 80 ? '#10b981' : t >= 60 ? '#f59e0b' : '#ef4444';
    const getTauxLabel = (t) => t >= 80 ? 'EXCELLENT' : t >= 60 ? 'PASSABLE' : 'INSUFFISANT';
    const tauxColor = getTauxColor(taux);
    const radius = 52;
    const circ = 2 * Math.PI * radius;
    const dash = (taux / 100) * circ;

    return (
        <div className="dashboard-layout">
            {/* Toast */}
            {notification && (
                <div className="notification-toast" style={{ position:'fixed', top:'20px', right:'20px', background:'#10b981', color:'white', padding:'16px 24px', borderRadius:'8px', zIndex:10000, boxShadow:'0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                        <CheckCircle size={20}/>
                        <span style={{ fontWeight:'500' }}>{notification}</span>
                    </div>
                </div>
            )}

            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

            {/* ── Session Detail Modal ── */}
            {selectedInscription && (
                <SessionDetailModal
                    inscription={selectedInscription}
                    presenceData={parSession}
                    onClose={() => setSelectedInscription(null)}
                    onToggleCours={handleToggleCours}
                />
            )}

            {/* ── Sidebar ── */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>
                </div>
                <div className="sidebar-profile">
                    <div className="profile-img-container">
                        {user?.profileImage ? (
                            <img
                                src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`}
                                alt="Profile" className="profile-img"
                            />
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
                                            <img src={parentUser.profileImage.startsWith('http') ? parentUser.profileImage : `http://localhost:5000${parentUser.profileImage}`} alt={parentUser.firstName} className="supervisor-img"/>
                                        ) : (
                                            <span className="supervisor-initial">{parentUser.firstName.charAt(0)}</span>
                                        )}
                                        <span className="supervisor-name">{parentUser.firstName}</span>
                                    </div>
                                </span>
                            ) : 'Compte Étudiant'}
                        </p>
                    </div>
                    {parentUser?.children?.length > 1 && (
                        <div className="child-switcher">
                            <label>Voir le profil de :</label>
                            <select value={user._id} onChange={e => { const child = parentUser.children.find(c => c._id === e.target.value); if (child && onSwitchChild) onSwitchChild(child); }} className="child-select">
                                {parentUser.children.map(child => <option key={child._id} value={child._id}>{child.firstName}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <Link to="/" className="nav-item back-home-nav">
                        <span className="nav-icon"><ArrowLeft size={20}/></span>
                        <span className="nav-label">Retour à l'accueil</span>
                    </Link>
                    <div className="nav-divider" style={{ margin:'10px 0', opacity:0.3 }}/>
                    <Link to="/dashboard" className={`nav-item ${window.location.pathname === '/dashboard' ? 'active' : ''}`}>
                        <span className="nav-icon"><User size={20}/></span>
                        <span className="nav-label">Mon Tableau de Bord</span>
                    </Link>
                    {navItems.map((item, i) => (
                        <Link key={i} to={item.path} className={`nav-item ${window.location.pathname === item.path ? 'active' : ''}`}>
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}
                    <div className="nav-divider"/>
                    <Link to="/profile" className="nav-item">
                        <span className="nav-icon"><Settings size={20}/></span>
                        <span className="nav-label">Paramètres</span>
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={onLogout} className="btn-logout">
                        <LogOut size={20}/><span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="main-content">
                <header className="content-header">
                    <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}><Menu size={24}/></button>
                    <div className="header-actions">
                        <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title={isDarkMode ? 'Mode Clair' : 'Mode Sombre'}
                            style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'36px', height:'36px', borderRadius:'50%', border:'none', background:'transparent', color:'var(--text-color)', cursor:'pointer', transition:'all 0.2s ease' }}>
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>
                        <NotificationCenter />
                        <div className="user-badge" onClick={() => navigate('/profile')}>
                            <div className="badge-img-container">
                                {((parentUser || user)?.profileImage) ? (
                                    <img src={(parentUser || user).profileImage.startsWith('http') ? (parentUser || user).profileImage : `http://localhost:5000${(parentUser || user).profileImage}`} alt="User" className="badge-img"/>
                                ) : (
                                    <div className="badge-placeholder">{(parentUser || user)?.firstName?.charAt(0)}</div>
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
                        </div>
                    </div>
                ) : (
                    <div className="content-inner">

                        {/* ── Greeting ── */}
                        <div className="sd-greeting">
                            <h1 className="sd-greeting-title">As-salamou alaykoum, {user?.firstName}.</h1>
                            <p className="sd-greeting-sub">Votre voyage spirituel continue aujourd'hui. Voici votre progression.</p>
                        </div>

                        {/* ── Notification Activation Banner ── */}
                        {notifPermission !== 'granted' && !notifBannerDismissed && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))',
                                border: '1px solid rgba(16,185,129,0.3)',
                                borderRadius: '12px', padding: '14px 18px', marginBottom: '20px',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                                <div style={{ fontSize: '24px', flexShrink: 0 }}>🔔</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#10b981', fontSize: '14px', marginBottom: '2px' }}>
                                        Activez vos notifications push
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                                        Recevez immédiatement les alertes d'inscription, paiement et cours directement sur votre navigateur.
                                    </div>
                                </div>
                                <button onClick={handleActivateNotifs} disabled={isSubscribing} style={{
                                    background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px',
                                    padding: '8px 16px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                    whiteSpace: 'nowrap', flexShrink: 0
                                }}>
                                    {isSubscribing ? 'Activation...' : 'Activer'}
                                </button>
                                <button onClick={() => setNotifBannerDismissed(true)} style={{
                                    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer', padding: '4px', flexShrink: 0
                                }}>
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* ── Top Row: Ayat + Suivi de Présence ── */}
                        <div className="sd-top-row">
                            {/* Ayat du Jour */}
                            <div className="sd-ayat-card">
                                <div className="sd-ayat-label">★ AYAT DU JOUR</div>
                                <div className="sd-ayat-arabic">وَقُل رَّبِّ زِدْنِي عِلْمًا</div>
                                <p className="sd-ayat-translation">"Et dis : Ô mon Seigneur, accrois mes connaissances."</p>
                                <div className="sd-ayat-ref">— Sourate Ta-Ha, 114</div>
                            </div>

                            {/* Suivi de Présence */}
                            <div className="hero-presence-card" onClick={() => navigate('/presence')} style={{ cursor:'pointer' }}>
                                <div className="hero-presence-left">
                                    <div className="hero-presence-label">VOTRE PERFORMANCE GLOBALE</div>
                                    <h2 className="hero-presence-title">Suivi de Présence</h2>
                                    <p className="hero-presence-desc">
                                        Continuez ainsi ! Votre régularité est la clé de votre réussite académique et spirituelle.
                                    </p>
                                    <div className="hero-presence-stats">
                                        <div className="hp-stat-item">
                                            <span className="hp-stat-value">{attendanceStats?.presents ?? 0}</span>
                                            <span className="hp-stat-label">Présences</span>
                                        </div>
                                        <div className="hp-stat-item divider"/>
                                        <div className="hp-stat-item">
                                            <span className="hp-stat-value">{attendanceStats?.absents ?? 0}</span>
                                            <span className="hp-stat-label">Absences</span>
                                        </div>
                                        <div className="hp-stat-item divider"/>
                                        <div className="hp-stat-item">
                                            <span className="hp-stat-value">{attendanceStats?.retards ?? 0}</span>
                                            <span className="hp-stat-label">Retards</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hero-presence-right">
                                    <div className="large-gauge-container">
                                        <svg viewBox="0 0 120 120" className="large-gauge-svg">
                                            <circle cx="60" cy="60" r={radius} className="gauge-bg"/>
                                            <circle cx="60" cy="60" r={radius} className="gauge-fill"
                                                style={{
                                                    stroke: tauxColor,
                                                    strokeDasharray: `${dash} ${circ}`,
                                                    filter: `drop-shadow(0 0 8px ${tauxColor})`
                                                }}
                                            />
                                        </svg>
                                        <div className="large-gauge-text">
                                            <span className="large-gauge-pct" style={{ color: tauxColor }}>{taux}%</span>
                                            <span className="large-gauge-status" style={{ color: tauxColor }}>
                                                {getTauxLabel(taux)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── KPI Grid ── */}
                        <div className="kpi-grid">
                            <div className="kpi-card">
                                <div className="kpi-icon kpi-icon--blue"><Calendar size={22}/></div>
                                <span className="kpi-value">{myInscriptions.filter(i => i.statut === 'approuvee').length}</span>
                                <span className="kpi-label">SESSIONS</span>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-icon kpi-icon--amber"><Hourglass size={22}/></div>
                                <span className="kpi-value">{myInscriptions.filter(i => i.statut === 'en_attente').length}</span>
                                <span className="kpi-label">ATTENTES</span>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-icon kpi-icon--emerald"><BookMarked size={22}/></div>
                                <span className="kpi-value">{myInscriptions.reduce((acc, ins) => acc + (ins.coursTermines?.length || 0), 0)}</span>
                                <span className="kpi-label">COURS</span>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-icon kpi-icon--violet"><Award size={22}/></div>
                                <span className="kpi-value">0</span>
                                <span className="kpi-label">CERTIFICATS</span>
                            </div>
                        </div>

                        {/* ── Main Grid ── */}
                        <div className="lum-main-grid">
                            {/* LEFT: Sessions */}
                            <div className="lum-col-left">
                                <section className="sd-classes-section lum-section">
                                    <div className="sd-section-header lum-section-header">
                                        <h2 className="sd-section-title lum-title">Mes Sessions Inscrites</h2>
                                        <Link to="/inscriptions" className="sd-see-all lum-link">Voir tout</Link>
                                    </div>

                                    {inscriptionsLoading ? (
                                        <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>
                                            <p>Chargement de vos sessions...</p>
                                        </div>
                                    ) : !myInscriptions || myInscriptions.length === 0 ? (
                                        <div className="sd-no-class">
                                            <div className="sd-no-class__icon">🎓</div>
                                            <h3>Aucune session inscrite</h3>
                                            <p>Vous n'êtes encore inscrit à aucune session. Découvrez nos programmes disponibles !</p>
                                            <Link to="/formations" className="sd-enroll-link">
                                                <GraduationCap size={16}/> Voir les sessions disponibles
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="sd-classes-grid">
                                            {myInscriptions.map(inscription => {
                                                const session = inscription.session;
                                                // Find this session's attendance
                                                const sessPresence = parSession.find(ps => ps.sessionId === session?._id);
                                                const sessionTaux = sessPresence?.taux ?? (inscription.statut === 'approuvee' ? null : 0);
                                                const progColor = sessionTaux !== null ? getTauxColor(sessionTaux) : '#10b981';

                                                return (
                                                    <div
                                                        key={inscription._id}
                                                        className={`sd-class-card ${inscription.statut === 'en_attente' ? 'pending' : ''} sd-class-card--clickable`}
                                                        onClick={() => inscription.statut !== 'en_attente' && setSelectedInscription(inscription)}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={e => e.key === 'Enter' && inscription.statut !== 'en_attente' && setSelectedInscription(inscription)}
                                                        title={inscription.statut !== 'en_attente' ? 'Voir les détails' : ''}
                                                    >
                                                        {/* Hero Image */}
                                                        <div className="sd-class-card__header has-image"
                                                            style={{ background: session?.imageCouverture ? `url("http://localhost:5000${session.imageCouverture}")` : `url("${getCardImage(session?.nomSession)}")`, backgroundSize:'cover', backgroundPosition:'center' }}>
                                                            <div className="sd-class-card__image-overlay"/>
                                                            <div className="lum-badge card-category-badge">
                                                                {session?.classe?.[0]?.niveau || 'Session'}
                                                            </div>
                                                        </div>

                                                        {/* Body */}
                                                        <div className="lum-card-body">
                                                            <h3 className="sd-class-card__name">{session?.nomSession || 'Session'}</h3>
                                                            
                                                            <div className="sd-class-card__meta-refined">
                                                                {session?.enseignants?.[0] && (
                                                                    <div className="sd-meta-item">
                                                                        <User size={14} className="sd-meta-icon"/>
                                                                        <span>
                                                                            {`${session.enseignants[0].firstName} ${session.enseignants[0].lastName}`}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {session?.schedule && session.schedule !== 'À définir' && (
                                                                    <div className="sd-meta-item">
                                                                        <Clock size={14} className="sd-meta-icon"/>
                                                                        <span>{session.schedule}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Single Thick Study Progress Bar */}
                                                            {inscription.statut === 'approuvee' && (
                                                                <div className="sd-refined-progress-area">
                                                                    {(() => {
                                                                        const total = session?.totalCours || session?.coursPublies?.length || 0;
                                                                        const done = inscription.coursTermines?.length || 0;
                                                                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                                                                        return (
                                                                            <>
                                                                                <div className="lum-progress-bar-wrapper thick-blue">
                                                                                    <div className="lum-progress-bar" style={{ width: `${pct}%` }}/>
                                                                                </div>
                                                                                <div className="sd-progress-footer">
                                                                                    <span className="sd-progress-pct-text">{pct}% COMPLÉTÉ</span>
                                                                                    <button 
                                                                                        className="sd-btn-rejoindre"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            navigate('/inscriptions', { state: { selectedId: inscription._id } });
                                                                                        }}
                                                                                    >
                                                                                        Rejoindre
                                                                                    </button>
                                                                                </div>
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            )}

                                                            {inscription.statut === 'en_attente' && (
                                                                <div className="sd-pending-overlay-text">
                                                                    En attente d'approbation
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            </div>

                            {/* RIGHT: Sidebar Widgets */}
                            <div className="lum-col-right">
                                {/* Prochains Examens */}
                                <div className="lum-widget">
                                    <h3 className="lum-title mb-4">Prochains Examens</h3>
                                    <div className="lum-empty-card">
                                        <div className="lum-empty-icon"><Calendar size={24}/></div>
                                        <h4>Aucun examen prévu</h4>
                                        <p>Les dates de tests seront affichées ici.</p>
                                        <Link to="/examens" className="lum-link-gold">Parcourir le calendrier</Link>
                                    </div>
                                </div>


                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default StudentDashboard;
