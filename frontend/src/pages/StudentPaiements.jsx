import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { logout } from '../features/auth/authSlice';
import { 
    CreditCard, ArrowLeft, Calendar, FileText, 
    CheckCircle2, Clock, History, DollarSign,
    Filter, Download, TrendingUp, Ban, Globe,
    BookOpen, GraduationCap, Award, User, Settings, LogOut,
    ChevronLeft, ChevronRight, Search, Bell, HelpCircle,
    TrendingDown, Info, ChevronDown, X, RotateCcw, Banknote, Menu
} from 'lucide-react';
import { isSameMonth, subMonths, parseISO, startOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './StudentDashboard.css'; 
import './StudentPaiements.css'; 

const StudentPaiements = () => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [paiements, setPaiements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filtres actifs
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        mode: 'all',
        session: 'all'
    });

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchPaiements = async () => {
            try {
                setLoading(true);
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get('/api/paiements/my', config);
                if (res.data.success) {
                    setPaiements(res.data.paiements);
                }
            } catch (err) {
                console.error('Erreur lors du chargement des paiements:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPaiements();
    }, [user, navigate]);

    const uniqueSessions = useMemo(() => {
        const sessions = paiements
            .map(p => p.session?.nomSession)
            .filter((s, i, self) => s && self.indexOf(s) === i);
        return sessions;
    }, [paiements]);

    const filteredPaiements = useMemo(() => {
        return paiements.filter(p => {
            // Search filter
            const searchStr = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' || (
                p.session?.nomSession?.toLowerCase().includes(searchStr) ||
                p.modePaiement?.toLowerCase().includes(searchStr) ||
                p.montant.toString().includes(searchStr) ||
                new Date(p.datePaiement).toLocaleDateString('fr-FR').includes(searchStr)
            );

            // Mode filter
            const matchesMode = activeFilters.mode === 'all' || 
                (activeFilters.mode === 'online' && p.modePaiement === 'Stripe') ||
                (activeFilters.mode === 'onsite' && p.modePaiement !== 'Stripe');

            // Session filter
            const matchesSession = activeFilters.session === 'all' || 
                p.session?.nomSession === activeFilters.session;

            return matchesSearch && matchesMode && matchesSession;
        });
    }, [paiements, searchTerm, activeFilters]);

    // --- NEW: Reactive Stats Calculation ---
    const computedStats = useMemo(() => {
        const data = filteredPaiements;
        const today = new Date();
        const lastMonth = subMonths(today, 1);

        const total = data.reduce((acc, p) => acc + p.montant, 0);
        const online = data.filter(p => p.modePaiement === 'Stripe').reduce((acc, p) => acc + p.montant, 0);
        const onsite = total - online;

        // Trend calculation based on filtered set
        const currentMonthTotal = data
            .filter(p => isSameMonth(parseISO(p.datePaiement), today))
            .reduce((acc, p) => acc + p.montant, 0);
        
        const lastMonthTotal = data
            .filter(p => isSameMonth(parseISO(p.datePaiement), lastMonth))
            .reduce((acc, p) => acc + p.montant, 0);

        let trend = 0;
        let trendDirection = 'up';
        
        if (lastMonthTotal > 0) {
            trend = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
            trendDirection = trend >= 0 ? 'up' : 'down';
        } else if (currentMonthTotal > 0) {
            trend = 100; 
        }

        // --- Session Specific Info (if filtered) ---
        let sessionInfo = null;
        if (activeFilters.session !== 'all' && data.length > 0) {
            const firstP = data[0]; 
            const sessionPrice = firstP.session?.montant || 0;
            const paidForThisSession = paiements
                .filter(p => p.session?.nomSession === activeFilters.session)
                .reduce((acc, p) => acc + p.montant, 0);
            
            sessionInfo = {
                price: sessionPrice,
                paid: paidForThisSession,
                remaining: Math.max(0, sessionPrice - paidForThisSession),
                progress: sessionPrice > 0 ? (paidForThisSession / sessionPrice) * 100 : 0
            };
        }

        return { 
            total, 
            online, 
            onsite, 
            trend: Math.abs(trend).toFixed(0), 
            trendDirection,
            sessionInfo
        };
    }, [filteredPaiements, paiements, activeFilters.session]);

    // --- NEW: Professional Backend-Powered PDF Export ---
    const handleExportPDF = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            
            // On peut appeler un nouvel endpoint mes rapports ou le rapport par inscription si on est dans une vue spécifique
            // Ici on va créer un endpoint global 'my-report' ou utiliser le student report
            const res = await axios.get(`/api/paiements/report/student/${user._id}`, config);
            
            if (res.data.success) {
                window.open(`http://localhost:5000${res.data.reportUrl}`, '_blank');
            }
        } catch (err) {
            console.error('Erreur téléch. rapport:', err);
        } finally {
            setLoading(false);
        }
    };

    const navItems = [
        { icon: <BookOpen size={20} />, label: 'Formations', path: '/formations' },
        { icon: <GraduationCap size={20} />, label: 'Mes Classes', path: '/inscriptions' },
        { icon: <Calendar size={20} />, label: 'Emploi du Temps', path: '/planning' },
        { icon: <TrendingUp size={20} />, label: 'Mes Absences', path: '/presence' },
        { icon: <CreditCard size={20} />, label: 'Mes Paiements', path: '/paiements' },
        { icon: <FileText size={20} />, label: 'Mes Examens', path: '/examens' },
        { icon: <Award size={20} />, label: 'Mes Certificats', path: '/certificats' },
    ];

    const onLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    if (!user) return null;

    const onlinePct = computedStats.total > 0 ? (computedStats.online / computedStats.total) * 100 : 0;
    const onsitePct = computedStats.total > 0 ? (computedStats.onsite / computedStats.total) * 100 : 0;

    return (
        <div className={`dashboard-layout ev-page-wrapper ${mobileSidebarOpen ? 'sidebar-mobile-open' : ''}`}>
            {/* Overlay for mobile sidebar */}
            {mobileSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
            )}

            <aside className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : 'open'}`}>
                <div className="sidebar-mobile-header">
                    <span className="ev-logo-text">NOOR TAYYIBA</span>
                    <button className="sidebar-close-btn" onClick={() => setMobileSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <div className="sidebar-profile" style={{ background: 'rgba(0,0,0,0.2)', marginBottom: '20px' }}>
                    <div className="profile-img-container" style={{ borderColor: 'var(--ev-gold)' }}>
                        {user.profileImage ? (
                             <img src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`} alt="Profile" className="profile-img" />
                        ) : (
                            <div className="profile-img-placeholder" style={{ background: 'var(--ev-gold)' }}>{user.firstName.charAt(0)}</div>
                        )}
                    </div>
                    <div className="profile-info">
                        <h3 style={{ color: 'white' }}>{user.firstName} {user.lastName}</h3>
                        <p className="profile-role" style={{ color: 'var(--ev-gold)' }}>Étudiant</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/" className="nav-item back-home-nav">
                        <span className="nav-icon"><ArrowLeft size={20}/></span>
                        <span className="nav-label">Retour à l'accueil</span>
                    </Link>
                    <div className="nav-divider" style={{ margin:'10px 0', opacity:0.1 }}/>
                    <Link to="/dashboard" className={`nav-item ${window.location.pathname === '/dashboard' ? 'active' : ''}`}>
                        <span className="nav-icon"><User size={20}/></span>
                        <span className="nav-label">Tableau de Bord</span>
                    </Link>
                    {navItems.map((item, i) => (
                        <Link key={i} to={item.path} className={`nav-item ${window.location.pathname === item.path ? 'active' : ''}`}>
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    ))}
                    <div className="nav-divider" style={{ opacity: 0.1 }}/>
                    <Link to="/profile" className="nav-item">
                        <span className="nav-icon"><Settings size={20}/></span>
                        <span className="nav-label">Paramètres</span>
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={onLogout} className="btn-logout" style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px' }}>
                        <LogOut size={20}/><span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header className="content-header ev-header">
                    <button className="mobile-menu-toggle" onClick={() => setMobileSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>
                    
                    <div className="ev-header-search-container">
                        <Search size={18} className="ev-search-icon" />
                        <input 
                            type="text" 
                            placeholder="Rechercher une transaction..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="ev-search-input" 
                        />
                    </div>
                    <div className="header-actions" style={{ gap: '24px' }}>
                        <Bell size={20} style={{ opacity: 0.6, cursor: 'pointer' }} />
                        <HelpCircle size={20} style={{ opacity: 0.6, cursor: 'pointer' }} />
                        <div className="user-badge" style={{ background: 'transparent', border: 'none', color: 'white', padding: 0 }}>
                            <div style={{ textAlign: 'right', marginRight: '12px' }}>
                                <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{user.firstName} {user.lastName}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--ev-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Étudiant</p>
                            </div>
                            <div className="badge-img-container" style={{ width: '44px', height: '44px', border: '2px solid rgba(255,255,255,0.1)' }}>
                                <div className="badge-placeholder" style={{ background: 'linear-gradient(135deg, #ceaa5f, #a16207)' }}>{user.firstName.charAt(0)}</div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="content-inner ev-inner-container">
                    <div className="ev-hero">
                        <h1 className="ev-hero-title">Historique de vos Règlements</h1>
                        <p className="ev-hero-subtitle">Consultez l'intégralité de vos transactions sécurisées au sein de l'archive. Chaque règlement est scellé et certifié par notre protocole de sécurité.</p>
                    </div>

                    <div className="ev-kpi-grid">
                        <div className="ev-kpi-card">
                            <div className="ev-kpi-icon-row">
                                <span className="ev-kpi-label">TOTAL VERSÉ</span>
                                <DollarSign size={18} className="ev-kpi-icon gold" />
                            </div>
                            <div className="ev-kpi-value-container">
                                <span className="ev-kpi-value">{computedStats.total.toLocaleString()}</span>
                                <span className="ev-kpi-currency">TND</span>
                            </div>
                            <div className="ev-kpi-trend" style={{ color: computedStats.trendDirection === 'up' ? '#10b981' : '#ef4444' }}>
                                {computedStats.trendDirection === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span>{computedStats.trend === '100' && computedStats.total > 0 ? 'Nouveau' : `${computedStats.trend}%` } vs mois dernier</span>
                            </div>
                        </div>

                        <div className="ev-kpi-card">
                            <div className="ev-kpi-icon-row">
                                <span className="ev-kpi-label">PAIEMENTS EN LIGNE</span>
                                <Globe size={18} className="ev-kpi-icon blue" />
                            </div>
                            <div className="ev-kpi-value-container">
                                <span className="ev-kpi-value">{computedStats.online.toLocaleString()}</span>
                                <span className="ev-kpi-currency">TND</span>
                            </div>
                            <div className="ev-progress-wrapper">
                                <div className="ev-progress-bar">
                                    <div className="ev-progress-fill online" style={{ width: `${onlinePct}%` }}></div>
                                </div>
                                <span className="ev-progress-info">{onlinePct.toFixed(0)}% de l'archive actuelle</span>
                            </div>
                        </div>

                        <div className="ev-kpi-card">
                            <div className="ev-kpi-icon-row">
                                <span className="ev-kpi-label">EN PRÉSENTIEL</span>
                                <Banknote size={18} className="ev-kpi-icon green" />
                            </div>
                            <div className="ev-kpi-value-container">
                                <span className="ev-kpi-value">{computedStats.onsite.toLocaleString()}</span>
                                <span className="ev-kpi-currency">TND</span>
                            </div>
                            <div className="ev-progress-wrapper">
                                <div className="ev-progress-bar">
                                    <div className="ev-progress-fill onsite" style={{ width: `${onsitePct}%` }}></div>
                                </div>
                                <span className="ev-progress-info">{onsitePct.toFixed(0)}% de l'archive actuelle</span>
                            </div>
                        </div>

                        {computedStats.sessionInfo && (
                            <div className="ev-kpi-card session-balance">
                                <div className="ev-kpi-icon-row">
                                    <span className="ev-kpi-label">RESTE À PAYER</span>
                                    <Clock size={18} className="ev-kpi-icon orange" />
                                </div>
                                <div className="ev-kpi-value-container">
                                    <span className="ev-kpi-value">{computedStats.sessionInfo.remaining.toLocaleString()}</span>
                                    <span className="ev-kpi-currency">TND</span>
                                </div>
                                <div className="ev-progress-wrapper">
                                    <div className="ev-progress-bar">
                                        <div className="ev-progress-fill session" style={{ width: `${computedStats.sessionInfo.progress}%` }}></div>
                                    </div>
                                    <span className="ev-progress-info">{computedStats.sessionInfo.progress.toFixed(0)}% réglé (Formation)</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="ev-table-container">
                        <div className="ev-table-header">
                            <h2 className="ev-table-title">Détails des Transactions</h2>
                            <div className="ev-table-actions">
                                <button 
                                    onClick={() => setShowFilters(!showFilters)} 
                                    className={`ev-btn ev-btn-outline ${showFilters ? 'active' : ''}`}
                                    style={showFilters ? { borderColor: 'var(--ev-gold)', background: 'rgba(206, 170, 95, 0.1)' } : {}}
                                >
                                    <Filter size={16} /> 
                                    {showFilters ? 'FERMER' : 'FILTRER'}
                                </button>
                            </div>
                        </div>

                        {/* --- Advanced Filter Bar --- */}
                        {showFilters && (
                            <div className="ev-filter-panel">
                                <div className="ev-filter-group">
                                    <label className="ev-filter-label">SESSION / FORMATION</label>
                                    <div className="ev-filter-select-wrapper">
                                        <select 
                                            value={activeFilters.session}
                                            onChange={(e) => setActiveFilters({ ...activeFilters, session: e.target.value })}
                                            className="ev-filter-select"
                                        >
                                            <option value="all">Toutes les sessions</option>
                                            {uniqueSessions.map((s, i) => (
                                                <option key={i} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="ev-select-icon" />
                                    </div>
                                </div>

                                <div className="ev-filter-group">
                                    <label className="ev-filter-label">MODE DE PAIEMENT</label>
                                    <div className="ev-filter-pills">
                                        <button 
                                            onClick={() => setActiveFilters({ ...activeFilters, mode: 'all' })}
                                            className={`ev-filter-pill ${activeFilters.mode === 'all' ? 'active' : ''}`}
                                        >
                                            Tout
                                        </button>
                                        <button 
                                            onClick={() => setActiveFilters({ ...activeFilters, mode: 'online' })}
                                            className={`ev-filter-pill ${activeFilters.mode === 'online' ? 'active' : ''}`}
                                        >
                                            En ligne
                                        </button>
                                        <button 
                                            onClick={() => setActiveFilters({ ...activeFilters, mode: 'onsite' })}
                                            className={`ev-filter-pill ${activeFilters.mode === 'onsite' ? 'active' : ''}`}
                                        >
                                            Espèces
                                        </button>
                                    </div>
                                </div>

                                <div className="ev-filter-group ev-filter-actions">
                                    <button 
                                        className="ev-reset-btn"
                                        onClick={() => setActiveFilters({ mode: 'all', session: 'all' })}
                                    >
                                        <RotateCcw size={14} /> 
                                        Réinitialiser
                                    </button>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px' }}>
                                <div className="pm-spinner" />
                                <p style={{ marginTop: '20px', color: 'var(--ev-text-muted)' }}>Synchronisation avec l'archive...</p>
                            </div>
                        ) : filteredPaiements.length === 0 ? (
                            <div className="empty-dashboard" style={{ padding: '80px 20px' }}>
                                <Ban size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                                <h3 style={{ color: 'white' }}>Aucune transaction trouvée</h3>
                                <p style={{ color: 'var(--ev-text-muted)' }}>{searchTerm ? 'Aucun résultat pour cette recherche.' : 'Vos versements apparaîtront ici après validation.'}</p>
                            </div>
                        ) : (
                            <table className="ev-data-table">
                                <thead>
                                    <tr>
                                        <th>DATE</th>
                                        <th>SESSION / FORMATION</th>
                                        <th>MONTANT</th>
                                        <th>MODE DE PAIEMENT</th>
                                        <th>STATUT</th>
                                        <th>REÇU</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPaiements.map((p) => (
                                        <tr key={p._id}>
                                            <td data-label="DATE">
                                                <div className="ev-date-box">
                                                    <span className="ev-date-main">{new Date(p.datePaiement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                    <span className="ev-date-sub">{new Date(p.datePaiement).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td data-label="SESSION">
                                                <div className="ev-session-cell">
                                                    <span className="ev-session-name">{p.session?.nomSession || 'Formation Générale'}</span>
                                                    <span className="ev-session-meta">{p.session?.type || ''}</span>
                                                </div>
                                            </td>
                                            <td data-label="MONTANT">
                                                <span className="ev-amount">{p.montant.toFixed(3).toLocaleString()} TND</span>
                                            </td>
                                            <td data-label="MODE">
                                                <div className="ev-mode-pill">
                                                    <div className="ev-mode-icon">
                                                        {p.modePaiement === 'Stripe' ? <CreditCard size={14} /> : <DollarSign size={14} />}
                                                    </div>
                                                    <span>{p.modePaiement === 'Stripe' ? 'En ligne' : (p.modePaiement || 'Espèces')}</span>
                                                </div>
                                            </td>
                                            <td data-label="STATUT">
                                                <div className="ev-status-pill">
                                                    <span className="ev-status-dot"></span>
                                                    VALIDÉ
                                                </div>
                                            </td>
                                            <td data-label="REÇU">
                                                {p.receiptUrl ? (
                                                    <a 
                                                        href={`http://localhost:5000${p.receiptUrl}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="ev-receipt-link"
                                                        title="Télécharger le reçu"
                                                    >
                                                        <FileText size={18} />
                                                    </a>
                                                ) : (
                                                    <span className="ev-no-receipt">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <div className="ev-pagination">
                            <span className="ev-pagination-info">Affichage de 1 à {filteredPaiements.length} sur {paiements.length} transactions</span>
                            <div className="ev-pagination-list">
                                <div className="ev-page-btn"><ChevronLeft size={16} /></div>
                                <div className="ev-page-btn active">1</div>
                                <div className="ev-page-btn">2</div>
                                <div className="ev-page-btn">3</div>
                                <div className="ev-page-btn"><ChevronRight size={16} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentPaiements;
