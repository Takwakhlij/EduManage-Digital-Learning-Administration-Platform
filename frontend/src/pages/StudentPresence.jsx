import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    CheckCircle, XCircle, Clock, TrendingUp, ArrowLeft,
    BookOpen, Calendar, AlertCircle, Award, Filter,
    ChevronRight, Activity, Star, Shield, CreditCard, 
    User, Settings, LogOut, Menu, Bell, GraduationCap, FileText, X, Globe, Sun, Moon
} from 'lucide-react';
import { logout, reset } from '../features/auth/authSlice';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationCenter from '../components/NotificationCenter';
import './StudentDashboard.css';
import './StudentPresence.css';

function StudentPresence() {
    const { user: authUser } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isDarkMode, toggleTheme } = useTheme();
    const { t, lang } = useLanguage();

    const [stats, setStats] = useState(null);
    const [parSession, setParSession] = useState([]);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'absent' | 'retard' | 'present'
    const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'sessions'
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!authUser) { navigate('/login'); return; }
        const fetchStats = async () => {
            try {
                setIsLoading(true);
                const config = { headers: { Authorization: `Bearer ${authUser.token}` } };
                const res = await axios.get(
                    `http://localhost:5000/api/presences/etudiant/${authUser._id}/stats`,
                    config
                );
                if (res.data.success) {
                    setStats(res.data.stats);
                    setParSession(res.data.parSession || []);
                    setHistory(res.data.history || []);
                }
            } catch (err) {
                console.error('Erreur chargement présences :', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [authUser, navigate]);

    const getTauxColor = (t) => {
        if (t >= 80) return '#10b981';
        if (t >= 60) return '#f59e0b';
        return '#ef4444';
    };
    const getTauxLabel = (t_val) => {
        if (t_val >= 80) return t.excellent;
        if (t_val >= 60) return t.passable;
        return t.insufficient;
    };
    const getTauxGrade = (t) => {
        if (t >= 90) return 'A+';
        if (t >= 80) return 'A';
        if (t >= 70) return 'B';
        if (t >= 60) return 'C';
        return 'D';
    };

    const filteredHistory = history.filter(p => {
        if (activeFilter === 'all') return true;
        return p.statut.toLowerCase() === activeFilter.toLowerCase();
    });

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/login');
    };

    const navItems = [
        { icon: <BookOpen size={20} />, label: t.formations, path: '/formations' },
        { icon: <GraduationCap size={20} />, label: t.myClasses, path: '/inscriptions' },
        { icon: <Calendar size={20} />, label: t.mySchedule, path: '/planning' },
        { icon: <TrendingUp size={20} />, label: t.myAbsences, path: '/presence' },
        { icon: <CreditCard size={20} />, label: t.myPayments, path: '/paiements' },
        { icon: <FileText size={20} />, label: t.myExams, path: '/examens' },
        { icon: <Award size={20} />, label: t.myCertificates, path: '/certificats' },
    ];

    if (isLoading) {
        return (
            <div className="sp2-loading">
                <div className="sp2-spinner" />
                <p>{t.loadingAttendance}</p>
            </div>
        );
    }

    const taux = stats?.tauxAssiduité ?? 0;
    const tauxColor = getTauxColor(taux);
    const radius = 70;
    const circ = 2 * Math.PI * radius;
    const dash = (taux / 100) * circ;

    const filterOpts = [
        { key: 'all',     label: t.all,    icon: <Activity size={13}/>,     count: history.length },
        { key: 'Present', label: t.presents, icon: <CheckCircle size={13}/>,  count: stats?.presents ?? 0, color: '#10b981' },
        { key: 'Absent',  label: t.absences,  icon: <XCircle size={13}/>,      count: stats?.absents ?? 0,  color: '#ef4444' },
        { key: 'Retard',  label: t.tardies,  icon: <Clock size={13}/>,        count: stats?.retards ?? 0,  color: '#f59e0b' },
    ];

    return (
        <div className={`dashboard-layout ${isSidebarOpen ? 'sidebar-mobile-open' : ''}`}>
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

            {/* ── SIDEBAR ── */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>
                </div>
                <div className="sidebar-profile">
                    <div className="profile-img-container">
                        {authUser?.profileImage ? (
                            <img
                                src={authUser.profileImage.startsWith('http') ? authUser.profileImage : `http://localhost:5000${authUser.profileImage}`}
                                alt="Profile" className="profile-img"
                            />
                        ) : (
                            <div className="profile-img-placeholder">{authUser?.firstName?.charAt(0)}</div>
                        )}
                    </div>
                    <div className="profile-info">
                        <h3>{authUser?.firstName} {authUser?.lastName}</h3>
                        <p className="profile-role">{t.studentAccount}</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/" className="nav-item back-home-nav">
                        <span className="nav-icon"><ArrowLeft size={20}/></span>
                        <span className="nav-label">{t.backToHome}</span>
                    </Link>
                    <div className="nav-divider" style={{ margin:'10px 0', opacity:0.3 }}/>
                    <Link to="/dashboard" className="nav-item">
                        <span className="nav-icon"><User size={20}/></span>
                        <span className="nav-label">{t.myDashboard}</span>
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
                        <span className="nav-label">{t.settings}</span>
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={onLogout} className="btn-logout">
                        <LogOut size={20}/><span>{t.logout}</span>
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="main-content">
                <header className="content-header">
                    <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}><Menu size={24}/></button>
                    <div className="header-actions">
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '2px 8px', marginRight: '8px' }}>
                            <Globe size={16} style={{ color: 'var(--text-color)', marginRight: '6px' }} />
                            <select
                                value={lang}
                                onChange={(e) => {
                                    const newLang = e.target.value;
                                    setLang(newLang);
                                    localStorage.setItem('app-lang', newLang);
                                }}
                                style={{
                                    background: 'transparent',
                                    color: 'var(--text-color)',
                                    border: 'none',
                                    padding: '4px 0',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                }}
                            >
                                <option value="fr" style={{color: '#000'}}>Français</option>
                                <option value="ar" style={{color: '#000'}}>العربية</option>
                                <option value="en" style={{color: '#000'}}>English</option>
                            </select>
                        </div>
                        <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title={isDarkMode ? 'Mode Clair' : 'Mode Sombre'}
                            style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'36px', height:'36px', borderRadius:'50%', border:'none', background:'transparent', color:'var(--text-color)', cursor:'pointer', transition:'all 0.2s ease' }}>
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <NotificationCenter />
                        <div className="user-badge" onClick={() => navigate('/profile')}>
                            <div className="badge-img-container">
                                {authUser?.profileImage ? (
                                    <img src={authUser.profileImage.startsWith('http') ? authUser.profileImage : `http://localhost:5000${authUser.profileImage}`} alt="User" className="badge-img"/>
                                ) : (
                                    <div className="badge-placeholder">{authUser?.firstName?.charAt(0)}</div>
                                )}
                            </div>
                            <span>{authUser?.firstName}</span>
                        </div>
                    </div>
                </header>

                <div className="content-inner sp2-inner">
                    
                    {/* ── PREMIUM PRESENCE HERO ── */}
                    <div className="sp2-hero">
                        <div className="sp2-hero-left">
                            <div className="sp2-arabic">بِسْمِ ٱللَّٰهِ</div>
                            <h1 className="sp2-hero-title">{t.myAbsences}</h1>
                            <p className="sp2-hero-subtitle">{t.presenceHeroSubtitle}</p>
                            
                            <div className="sp2-hero-kpis">
                                <div className="sp2-hero-kpi sp2-kpi-present">
                                    <CheckCircle size={18}/>
                                    <div className="sp2-hero-kpi-info">
                                        <span className="sp2-hero-kpi-val">{stats?.presents ?? 0}</span>
                                        <span className="sp2-hero-kpi-lbl">{t.presents}</span>
                                    </div>
                                </div>
                                <div className="sp2-hero-kpi sp2-kpi-absent">
                                    <XCircle size={18}/>
                                    <div className="sp2-hero-kpi-info">
                                        <span className="sp2-hero-kpi-val">{stats?.absents ?? 0}</span>
                                        <span className="sp2-hero-kpi-lbl">{t.absences}</span>
                                    </div>
                                </div>
                                <div className="sp2-hero-kpi sp2-kpi-retard">
                                    <Clock size={18}/>
                                    <div className="sp2-hero-kpi-info">
                                        <span className="sp2-hero-kpi-val">{stats?.retards ?? 0}</span>
                                        <span className="sp2-hero-kpi-lbl">{t.tardies}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sp2-hero-right">
                            <div className="sp2-donut-wrap">
                                <svg viewBox="0 0 180 180" width="160" height="160">
                                    <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14"/>
                                    <circle cx="90" cy="90" r={radius} fill="none" stroke={tauxColor} strokeWidth="14" strokeLinecap="round"
                                        strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 90 90)"
                                        style={{ filter: `drop-shadow(0 0 10px ${tauxColor})`, transition: 'stroke-dasharray 1.2s ease' }}
                                    />
                                </svg>
                                <div className="sp2-donut-center">
                                    <span className="sp2-donut-pct" style={{ color: tauxColor }}>{taux}%</span>
                                    <span className="sp2-donut-grade" style={{ color: tauxColor }}>{getTauxGrade(taux)}</span>
                                    <span className="sp2-donut-label">{getTauxLabel(taux)}</span>
                                </div>
                            </div>
                            <p className="sp2-seances-count">{stats?.total || 0} {t.recordedSessions}</p>
                        </div>
                    </div>

                    {/* Alerts / Congrats */}
                    <div className="sp2-alert-container">
                        {taux < 60 && stats?.total > 0 && (
                            <div className="sp2-alert">
                                <AlertCircle size={18}/>
                                <span>{t.insufficientAttendance} ({taux}%) {t.contactAdmin}</span>
                            </div>
                        )}
                        {taux >= 80 && stats?.total > 0 && (
                            <div className="sp2-congrats">
                                <Star size={18}/>
                                <span>{t.congratsAttendance}{authUser?.firstName}{t.congratsSub}</span>
                            </div>
                        )}
                    </div>

                    {/* Top tabs */}
                    <div className="sp2-top-tabs">
                        <button className={`sp2-top-tab ${activeTab === 'timeline' ? 'active' : ''}`}
                            onClick={() => setActiveTab('timeline')}>
                            <Calendar size={15}/> {t.history}
                        </button>
                        <button className={`sp2-top-tab ${activeTab === 'sessions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sessions')}>
                            <BookOpen size={15}/> {t.bySession}
                        </button>
                    </div>

                    {/* ── TIMELINE TAB ── */}
                    {activeTab === 'timeline' && (
                        <>
                            {/* Filter chips */}
                            <div className="sp2-filters">
                                <Filter size={14} className="sp2-filter-icon"/>
                                {filterOpts.map(f => (
                                    <button
                                        key={f.key}
                                        className={`sp2-chip ${activeFilter === f.key ? 'active' : ''}`}
                                        style={activeFilter === f.key && f.color ? { '--chip-color': f.color } : {}}
                                        onClick={() => setActiveFilter(f.key)}
                                    >
                                        {f.icon} {f.label}
                                        <span className="sp2-chip-count">{f.count}</span>
                                    </button>
                                ))}
                            </div>

                            {/* ── Grid Table ── */}
                            {(() => {
                                const grouped = filteredHistory.reduce((acc, p) => {
                                    const d = new Date(p.date).toDateString();
                                    if (!acc[d]) acc[d] = [];
                                    acc[d].push(p);
                                    return acc;
                                }, {});
                                const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
                                const maxSeances = sortedDates.length > 0 ? Math.max(...sortedDates.map(d => grouped[d].length)) : 0;
                                const colCount = Math.max(maxSeances, 1);

                                if (sortedDates.length === 0) {
                                    return (
                                        <div className="sp2-empty">
                                            <Award size={42}/>
                                            <h3>{t.noPresenceRecord}</h3>
                                            <p>{t.noSessionFilter}</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="sp2-table-wrapper">
                                        <table className="sp2-grid-table">
                                            <thead>
                                                <tr>
                                                    <th rowSpan="2" className="th-date">{t.dateAndDay}</th>
                                                    <th rowSpan="2" className="th-remarks">{t.remarks}</th>
                                                    <th colSpan={colCount} className="th-seances">{t.sessionsOfDay}</th>
                                                    <th rowSpan="2" className="th-total">{t.absences}</th>
                                                    <th rowSpan="2" className="th-late">{t.tardies}</th>
                                                </tr>
                                                <tr>
                                                    {Array.from({ length: colCount }, (_, i) => (
                                                        <th key={i} className="th-sub">{lang === 'ar' ? 'ح.' : 'S.'}{i + 1}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedDates.map(dateKey => {
                                                    const dayPresences = grouped[dateKey];
                                                    const dateObj = new Date(dateKey);
                                                    const locale = lang === 'ar' ? 'ar-TN' : lang === 'en' ? 'en-US' : 'fr-FR';
                                                    const formattedDate = dateObj.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
                                                    const dayName = dateObj.toLocaleDateString(locale, { weekday: 'long' });
                                                    const remarks = dayPresences.filter(p => p.remarque).map(p => p.remarque).join(' • ');
                                                    const sortedPres = [...dayPresences].sort((a, b) => (a.seance?.heureDebut || '').localeCompare(b.seance?.heureDebut || ''));
                                                    const dayAbsent = dayPresences.filter(p => p.statut === 'Absent').length;
                                                    const dayLate   = dayPresences.filter(p => p.statut === 'Retard').length;

                                                    return (
                                                        <tr key={dateKey}>
                                                            <td className="td-date-cell">
                                                                <span className="date-main">{formattedDate}</span>
                                                                <span className="date-sub">{dayName}</span>
                                                            </td>
                                                            <td className="td-remarks-cell" title={remarks || undefined}>
                                                                {remarks || '—'}
                                                            </td>
                                                            {Array.from({ length: colCount }, (_, idx) => {
                                                                const p = sortedPres[idx];
                                                                if (!p) return <td key={idx} className="td-empty-slot"></td>;
                                                                const tooltip = [p.seance?.matiere, p.seance?.heureDebut && p.seance?.heureFin ? `${p.seance.heureDebut} – ${p.seance.heureFin}` : null].filter(Boolean).join('\n');
                                                                return (
                                                                    <td key={idx} className="td-statut-slot" title={tooltip}>
                                                                        <div className="slot-inner">
                                                                            {p.statut === 'Absent'  && <XCircle    size={15} className="icon-abs" />}
                                                                            {p.statut === 'Retard'  && <Clock       size={15} className="icon-ret" />}
                                                                            {p.statut === 'Present' && <CheckCircle size={15} className="icon-pre" />}
                                                                            <span className="slot-matiere">{p.seance?.matiere || '—'}</span>
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className={`td-count ${dayAbsent > 0 ? 'highlight' : ''}`}>{dayAbsent}</td>
                                                            <td className="td-count" style={dayLate > 0 ? { color: '#f59e0b' } : {}}>{dayLate}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}

                            {/* ── Résumé ── */}
                            <div className="sp2-resume-container">
                                <h3 className="resume-title">{t.attendanceSummaryTitle}</h3>
                                <table className="sp2-resume-table">
                                    <thead>
                                        <tr>
                                            <th>{t.type}</th>
                                            <th>{t.number}</th>
                                            <th>{t.outOfTotal}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="row-label">{t.presents}</td>
                                            <td style={{ color: '#10b981', fontWeight: 800 }}>{stats?.presents || 0}</td>
                                            <td rowSpan="3" className="td-total-seances">{stats?.total || 0} {t.sessions}</td>
                                        </tr>
                                        <tr>
                                            <td className="row-label">{t.absences}</td>
                                            <td style={{ color: '#ef4444', fontWeight: 800 }}>{stats?.absents || 0}</td>
                                        </tr>
                                        <tr className="row-total">
                                            <td className="row-label">{t.tardies}</td>
                                            <td style={{ color: '#f59e0b', fontWeight: 800 }}>{stats?.retards || 0}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* ── SESSIONS TAB ── */}
                    {activeTab === 'sessions' && (
                        <div className="sp2-sessions">
                            {parSession.length === 0 ? (
                                <div className="sp2-empty">
                                    <Award size={52}/>
                                    <h3>{t.noData}</h3>
                                    <p>{t.presenceBySessionEmpty}</p>
                                </div>
                            ) : (
                                parSession.map(s => {
                                    const color = getTauxColor(s.taux);
                                    const r2 = 32;
                                    const c2 = 2 * Math.PI * r2;
                                    const d2 = (s.taux / 100) * c2;
                                    return (
                                        <div key={s.sessionId} className="sp2-session-card">
                                            <div className="sp2-scard-left">
                                                <h3 className="sp2-scard-name">{s.nomSession}</h3>
                                                <p className="sp2-scard-total">{s.total} {t.sessions}</p>
                                                <div className="sp2-scard-stats">
                                                    <span style={{color:'#10b981'}}><CheckCircle size={12}/> {s.presents} {t.presents}</span>
                                                    <span style={{color:'#f59e0b'}}><Clock size={12}/> {s.retards} {t.tardies}</span>
                                                    <span style={{color:'#ef4444'}}><XCircle size={12}/> {s.absents} {t.absences}</span>
                                                </div>
                                                <div className="sp2-scard-bar-bg">
                                                    <div className="sp2-scard-bar" style={{ width: `${s.taux}%`, background: color }}/>
                                                </div>
                                            </div>
                                            <div className="sp2-scard-ring">
                                                <svg viewBox="0 0 80 80" width="80" height="80">
                                                    <circle cx="40" cy="40" r={r2} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
                                                    <circle cx="40" cy="40" r={r2} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
                                                        strokeDasharray={`${d2} ${c2}`} transform="rotate(-90 40 40)"
                                                        style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                                                    />
                                                </svg>
                                                <span className="sp2-scard-pct" style={{color}}>{s.taux}%</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default StudentPresence;
