import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import axios from 'axios';
import { getTeacherSessions, completeSession } from '../features/sessions/sessionSlice';
import { getMatieres } from '../features/matieres/matiereSlice';
import { getCours, createCours, updateCours, deleteCours, reset as resetCours } from '../features/cours/coursSlice';
import { getSeancesByEnseignant } from '../features/seances/seanceSlice';
import { getInscriptionsParSession } from '../features/inscriptions/inscriptionSlice';
import { fetchPresence, savePresence, resetPresence } from '../features/presence/presenceSlice';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
    Bell, RefreshCw, AlertTriangle, FileEdit, TrendingDown,
    CheckCircle, XCircle, Clock, Calendar, Users, BarChart, BookOpen, User, Settings,
    LogOut, ChevronRight, CheckSquare, MapPin, Eye, Search, ArrowLeft,
    Home, PlusCircle, MoreHorizontal, TrendingUp, Save, Lock
} from 'lucide-react';
import './TeacherDashboard.css';
import logo from '../assets/logo.png';
import NotificationCenter from '../components/NotificationCenter';

function TeacherDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isDarkMode, toggleTheme } = useTheme();
    const { lang, setLang, t } = useLanguage();
    const { user } = useSelector((state) => state.auth);
    const { sessions, isLoading: sessionsLoading } = useSelector((state) => state.sessions);
    const { matieres } = useSelector((state) => state.matieres);
    const { cours, isLoading: coursLoading, isError, message } = useSelector((state) => state.cours);
    const { seances } = useSelector((state) => state.seances);
    const { inscriptions, isLoading: inscLoading } = useSelector((state) => state.inscriptions);
    const { presences, editable, isLoading: presenceLoading, isSuccess: presenceSaved, message: presenceMsg } = useSelector((state) => state.presence);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedSession, setSelectedSession] = useState(null);
    const [showAddCours, setShowAddCours] = useState(false);
    const [coursForm, setCoursForm] = useState({ titre: '', description: '', matiere: '', statut: 'Brouillon', classeId: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [editingCours, setEditingCours] = useState(null);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [sessionFilter, setSessionFilter] = useState('all');
    const fileInputRef = useRef();

    // â”€â”€ Gestion PrÃ©sences (Cascading Dropdowns) â”€â”€
    const [apelSessionId, setApelSessionId] = useState('');
    const [apelSeanceId, setApelSeanceId] = useState('');
    const [apelDate, setApelDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [isApelLoaded, setIsApelLoaded] = useState(false);
    const [apelNotif, setApelNotif] = useState({ msg: '', type: 'success' });
    const [contenuSeance, setContenuSeance] = useState('');
    const [remarquesPedagogiques, setRemarquesPedagogiques] = useState('');
    const [devoirsMaison, setDevoirsMaison] = useState('');

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        if (user.role !== 'teacher') { navigate('/'); return; }
        dispatch(getTeacherSessions());
        dispatch(getMatieres());
        dispatch(getCours());
        if (user?._id) dispatch(getSeancesByEnseignant(user._id));
    }, [user, navigate, dispatch]);

    useEffect(() => {
        if (isError && message) setFormError(message);
    }, [isError, message]);

    // Cascade Step 2 : quand une session est choisie, charge les inscriptions
    useEffect(() => {
        if (apelSessionId) {
            dispatch(getInscriptionsParSession(apelSessionId));
            setApelSeanceId(''); // reset sÃ©ance
            setAttendanceMap({});
            setIsApelLoaded(false);
        }
    }, [apelSessionId, dispatch]);

    // Cascade Step 3 : quand une sÃ©ance + date changent, charge l'appel existant et le cahier de texte
    useEffect(() => {
        if (apelSeanceId && apelDate && (activeTab === 'attendance' || activeTab === 'cahier_texte')) {
            setIsApelLoaded(false);
            dispatch(fetchPresence({ seanceId: apelSeanceId, date: apelDate }))
                .then(() => setIsApelLoaded(true));
                
            const fetchCahier = async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${user.token}` } };
                    const res = await axios.get(`http://localhost:5000/api/teacher-presences?seanceId=${apelSeanceId}&date=${apelDate}`, config);
                    if (res.data && res.data.data) {
                        setContenuSeance(res.data.data.contenuSeance || '');
                        setRemarquesPedagogiques(res.data.data.remarquesPedagogiques || '');
                        setDevoirsMaison(res.data.data.devoirsMaison || '');
                    } else {
                        setContenuSeance('');
                        setRemarquesPedagogiques('');
                        setDevoirsMaison('');
                    }
                } catch (e) {
                    setContenuSeance('');
                    setRemarquesPedagogiques('');
                    setDevoirsMaison('');
                }
            };
            fetchCahier();
        }
    }, [apelSeanceId, apelDate, activeTab, dispatch, user?.token]);

    // PrÃ©-remplir attendanceMap avec les inscriptions filtrÃ©es par classe de la sÃ©ance
    const apelSeanceObj = seances?.find(s => s._id === apelSeanceId);
    const apelClasseId = apelSeanceObj?.classe?._id || apelSeanceObj?.classe;
    const apelInscriptions = (inscriptions || []).filter(ins => {
        const iC = ins.classe?._id || ins.classe;
        return apelClasseId ? iC?.toString() === apelClasseId?.toString() : true;
    });

    useEffect(() => {
        if (!isApelLoaded) return;
        const map = {};
        apelInscriptions.forEach(ins => {
            map[ins._id] = { statut: 'Present', remarque: '' };
        });
        (presences || []).forEach(p => {
            const insId = p.inscription?._id || p.inscription;
            if (insId) map[insId] = { statut: p.statut, remarque: p.remarque || '' };
        });
        setAttendanceMap(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [presences, isApelLoaded]);

    // Notification aprÃ¨s save
    useEffect(() => {
        if (presenceSaved && presenceMsg) {
            showApelNotif(presenceMsg, 'success');
            dispatch(resetPresence());
        }
    }, [presenceSaved, presenceMsg, dispatch]);

    const showApelNotif = (msg, type = 'success') => {
        setApelNotif({ msg, type });
        setTimeout(() => setApelNotif({ msg: '', type: 'success' }), 3500);
    };

    const handleApelStatutChange = (inscriptionId, statut) => {
        if (!editable) return;
        setAttendanceMap(prev => ({ ...prev, [inscriptionId]: { ...prev[inscriptionId], statut } }));
    };

    const handleApelRemarqueChange = (inscriptionId, remarque) => {
        if (!editable) return;
        setAttendanceMap(prev => ({ ...prev, [inscriptionId]: { ...prev[inscriptionId], remarque } }));
    };

    const handleMarkAllPresent = () => {
        if (!editable) return;
        const newMap = {};
        apelInscriptions.forEach(ins => {
            newMap[ins._id] = { statut: 'Present', remarque: attendanceMap[ins._id]?.remarque || '' };
        });
        setAttendanceMap(newMap);
    };

    const handleSaveApel = () => {
        if (!apelSeanceId) return showApelNotif('Veuillez sÃ©lectionner une sÃ©ance', 'error');
        if (!editable) return;
        const presencesArr = Object.entries(attendanceMap).map(([inscriptionId, data]) => ({
            inscriptionId,
            statut: data.statut,
            remarque: data.remarque || ''
        }));
        
        // 1. Sauvegarder les prÃ©sences Ã©tudiantes
        dispatch(savePresence({ seanceId: apelSeanceId, date: apelDate, presences: presencesArr }));
    };

    const handleSaveCahierTexte = async () => {
        if (!apelSeanceId) return showApelNotif('Veuillez sÃ©lectionner une sÃ©ance', 'error');
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('http://localhost:5000/api/teacher-presences', {
                seanceId: apelSeanceId,
                date: apelDate,
                cahierTexte
            }, config);
            showApelNotif('Cahier de texte enregistrÃ© avec succÃ¨s !', 'success');
        } catch (err) {
            console.error('Erreur sauvegarde cahier de texte', err);
            showApelNotif('Erreur lors de la sauvegarde', 'error');
        }
    };


    const getStatutCfg = (statut) => ({
        Present: { label: 'PrÃ©sent',  icon: <CheckCircle size={14} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)' },
        Absent:  { label: 'Absent',   icon: <XCircle size={14} />,    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)'  },
        Retard:  { label: 'Retard',   icon: <Clock size={14} />,      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)' },
    }[statut] || { label: statut, icon: null, color: '#94a3b8', bg: 'transparent', border: '#94a3b8' });

    // SÃ©ances de CET enseignant, filtrÃ©es par session sÃ©lectionnÃ©e
    const mySeancesForSession = (seances || []).filter(s => {
        const isMine = s.enseignant?._id === user?._id || s.enseignant === user?._id;
        const inSession = (s.session?._id || s.session)?.toString() === apelSessionId;
        return isMine && inSession;
    });

    const handleCoursSubmit = async (e) => {
        e.preventDefault();
        setFormError(''); setFormSuccess('');
        if (!coursForm.titre || !coursForm.matiere) return setFormError('Le titre et la matiÃ¨re sont requis.');

        const formData = new FormData();
        formData.append('titre', coursForm.titre);
        formData.append('description', coursForm.description);
        formData.append('matiere', coursForm.matiere);
        formData.append('statut', coursForm.statut);
        if (coursForm.classeId) formData.append('classeId', coursForm.classeId);
        if (selectedFile) formData.append('fichier', selectedFile);

        if (editingCours) {
            const result = await dispatch(updateCours({ id: editingCours._id, coursData: formData }));
            if (updateCours.fulfilled.match(result)) {
                setFormSuccess('Cours mis Ã  jour !');
            }
        } else {
            const result = await dispatch(createCours(formData));
            if (createCours.fulfilled.match(result)) {
                setFormSuccess('Cours crÃ©Ã© avec succÃ¨s !');
            }
        }

        setCoursForm({ titre: '', description: '', matiere: '', statut: 'Brouillon', classeId: '' });
        setSelectedFile(null);
        setEditingCours(null);
        setShowAddCours(false);
        dispatch(resetCours());
        setTimeout(() => setFormSuccess(''), 3000);
    };

    const handleEditCours = (c) => {
        setEditingCours(c);
        setCoursForm({ titre: c.titre, description: c.description || '', matiere: c.matiere?._id || '', statut: c.statut, classeId: c.classe?._id || '' });
        setShowAddCours(true);
    };

    const handleDeleteCours = (id) => {
        if (window.confirm('Supprimer ce cours ?')) dispatch(deleteCours(id));
    };

    const handleChangeStatut = (id, currentStatut) => {
        const nextStatut = currentStatut === 'PubliÃ©' ? 'Brouillon' : 'PubliÃ©';
        const fd = new FormData();
        fd.append('statut', nextStatut);
        dispatch(updateCours({ id, coursData: fd }));
    };

    const getStatutBadge = (statut) => {
        const map = { 'PubliÃ©': 'statut-publie', 'Brouillon': 'statut-brouillon', 'ArchivÃ©': 'statut-archive' };
        return map[statut] || 'statut-brouillon';
    };

    const getNiveauColor = (niveau) => {
        const map = { 'DÃ©butant': 'var(--td-green)', 'IntermÃ©diaire': 'var(--td-blue)', 'AvancÃ©': 'var(--td-purple)' };
        return map[niveau] || 'var(--td-text-mute)';
    };

    const handleLogout = () => {
        if (window.confirm('Voulez-vous vraiment vous dÃ©connecter ?')) {
            dispatch(logout());
            navigate('/login');
        }
    };

    const handleCompleteSession = async (sessionId) => {
        if (window.confirm('Marquer cette session comme terminÃ©e ? Elle ne sera plus affichÃ©e dans les inscriptions publiques.')) {
            dispatch(completeSession(sessionId));
        }
    };

    if (!user) return null;

    // Calculate total students from sessions (each session has etudiantsCount from backend)
    const totalEtudiants = sessions.reduce((acc, s) => acc + (s.etudiantsCount || 0), 0);
    const publishedCours = cours.filter(c => c.statut === 'PubliÃ©').length;

    // Calculate dynamic stats based on real data (if present)
    const alertesScolaires = 0; // Requires attendance/grades backend logic
    const evalsACorriger = 0;   // Requires assignments backend logic
    const elevesEnDifficulte = 0; // Requires grades backend logic
    const sessionsTerminees = sessions.filter(s => s.statut === 'TerminÃ©e').length;

    // Emploi du temps du jour (sÃ©curisÃ© contre la casse ou les accents)
    const todayName = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const scheduleItems = (seances || [])
        .filter(s => {
            if (!s.jour) return false;
            const sJour = s.jour.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            return sJour === todayName;
        })
        .map(s => ({
            id: s._id,
            seanceId: s._id,
            sessionId: s.session?._id || s.session,
            startTime: s.heureDebut,
            endTime: s.heureFin,
            courseName: s.matiere?.nomMatiere || 'MatiÃ¨re',
            className: s.session?.nomSession || 'Session',
            room: s.salle || 'Non assignÃ©e'
        }))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Remove old student extraction logic (will be handled via inscriptions)
    const filteredStudents = [];

    const filteredSessions = sessions.filter(s => {
        if (sessionFilter === 'all') return true;
        if (sessionFilter === 'active') return s.statut === 'En cours';
        if (sessionFilter === 'completed') return s.statut === 'TerminÃ©e';
        return true;
    });

    const getTeacherChaptersCount = (session) => {
        if (!session) return 0;
        
        let total = 0;
        const processedMatiereIds = new Set();

        // 1. Check in session.programme (the authoritative teacher-subject map for this session)
        if (session.programme && Array.isArray(session.programme)) {
            session.programme.forEach(p => {
                // If this is the logged-in teacher and we have the matiere populated
                const sameTeacher = p.enseignant === user?._id || (p.enseignant && p.enseignant._id === user?._id);
                if (sameTeacher && p.matiere && p.matiere.programme) {
                    total += (p.matiere.programme.length || 0);
                    processedMatiereIds.add(p.matiere._id.toString());
                }
            });
        }

        // 2. Fallback check in classe.matieres (if session.programme didn't have everything or and we want to cross-reference)
        // But only if the teacher is assigned to that matiere in the session
        return total;
    };


    return (
        <div className="td-app">
            {/* Sidebar (Left, matching the screenshot layout) */}
            <aside className="td-sidebar">
                <div className="td-sidebar-logo">
                    <img src={logo} alt="Logo" />
                </div>
                <nav className="td-nav-links">
                    <button className={`td-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <BookOpen size={18} /> <span>{t.dashboard}</span>
                    </button>
                    <button className={`td-nav-link ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
                        <Users size={18} /> <span>Mes Sessions</span>
                    </button>
                    <button className={`td-nav-link ${activeTab === 'cours' ? 'active' : ''}`} onClick={() => setActiveTab('cours')}>
                        <BookOpen size={18} /> <span>Mes cours</span>
                    </button>
                    <button className={`td-nav-link ${activeTab === 'cahier_texte' ? 'active' : ''}`} onClick={() => setActiveTab('cahier_texte')}>
                        <FileEdit size={18} /> <span>Carnet de notes</span>
                    </button>
                    <button className={`td-nav-link ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
                        <CheckSquare size={18} /> <span>Gestion PrÃ©sences</span>
                    </button>
                    <button className="td-nav-link" onClick={() => navigate('/teacher/planning')}><Calendar size={18} /> <span>Mon Planning</span></button>
                    <button className={`td-nav-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                        <Users size={18} /> <span>{t.myStudents}</span>
                    </button>
                    <button className="td-nav-link" onClick={() => navigate('/profile')}><User size={18} /> <span>{t.profile}</span></button>

                    <button className="td-nav-link"><Settings size={18} /> <span>{t.settings}</span></button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="td-main">
                {/* Topbar Re-design matching the dark theme image */}
                <header className="td-topbar">
                    <div className="td-search-bar">
                        <Search size={18} />
                        <input type="text" placeholder="Rechercher un Ã©tudiant, une sourate..." />
                    </div>
                    <div className="td-topbar-actions">
                        <NotificationCenter />
                        <button className="td-top-icon" onClick={() => navigate('/')}><Home size={20} /></button>
                        <div className="td-user-profile">
                            <div className="td-user-info">
                                <span className="td-user-name">{user?.firstName} {user?.lastName}</span>
                                <span className="td-user-role">ENSEIGNANT PRINCIPAL</span>
                            </div>
                            <div className="td-user-avatar">
                                {user?.profileImage ? (
                                    <img 
                                        src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`} 
                                        alt="Profile" 
                                        style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
                                    />
                                ) : (
                                    <User size={20} />
                                )}
                            </div>
                            <button className="td-logout-profile" onClick={handleLogout} title={t.logout}><LogOut size={16}/></button>
                        </div>
                    </div>
                </header>

                <div className="td-scroll-content">
                    {activeTab === 'dashboard' && (
                        <div className="td-dashboard-grid">
                            
                            {/* Hero Section */}
                            <div className="td-hero-section">
                                <div className="td-hero-left">
                                    <h1>Ø§Ù„Ø³Ù„Ø§Ù… Ø¹Ù„ÙŠÙƒÙ…ØŒ {user?.firstName}</h1>
                                    <p>Qu'Allah bÃ©nisse votre enseignement aujourd'hui, le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric'})}.</p>
                                </div>
                                <div className="td-hero-right">
                                    {/* Bouton Nouvelle Session encapsulÃ© et supprimÃ© selon la demande */}
                                </div>
                            </div>

                            {/* 4 Stats Cards */}
                            <div className="td-primary-stats">
                                <div className="td-stat-card">
                                    <div className="td-stat-header">
                                        <div className="td-stat-icon-wrapper td-blue">
                                            <Users size={20} />
                                        </div>
                                        <div className="td-stat-badge td-badge-green">+0%</div>
                                    </div>
                                    <div className="td-stat-body">
                                        <p className="td-stat-label">Ã‰tudiants</p>
                                        <h3 className="td-stat-val">{sessionsLoading ? '...' : totalEtudiants}</h3>
                                        <div className="td-stat-progress-bg"><div className="td-stat-progress-fill" style={{width: '60%', background: '#10b981'}}></div></div>
                                    </div>
                                </div>
                                <div className="td-stat-card">
                                    <div className="td-stat-header">
                                        <div className="td-stat-icon-wrapper td-gold">
                                            <BookOpen size={20} />
                                        </div>
                                        <div className="td-stat-badge td-badge-gold">S0</div>
                                    </div>
                                    <div className="td-stat-body">
                                        <p className="td-stat-label">Sourates RÃ©visÃ©es</p>
                                        <h3 className="td-stat-val">0</h3>
                                        <div className="td-stat-mini-chart">
                                            <div className="td-bar" style={{height: '30%'}}></div>
                                            <div className="td-bar" style={{height: '50%'}}></div>
                                            <div className="td-bar" style={{height: '40%'}}></div>
                                            <div className="td-bar" style={{height: '100%', background: '#fbbf24'}}></div>
                                            <div className="td-bar" style={{height: '20%'}}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="td-stat-card">
                                    <div className="td-stat-header">
                                        <div className="td-stat-icon-wrapper td-emerald">
                                            <CheckCircle size={20} />
                                        </div>
                                        <div className="td-stat-badge td-badge-teal">+0.0</div>
                                    </div>
                                    <div className="td-stat-body">
                                        <p className="td-stat-label">Moyenne Itqan</p>
                                        <h3 className="td-stat-val">0/20</h3>
                                        <div className="td-stat-avatars">
                                            <span className="td-avatar-circle"><User size={12}/></span>
                                            <span className="td-avatar-circle"><User size={12}/></span>
                                            <span className="td-stat-avatar-text">Hafiz en cours</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="td-stat-card">
                                    <div className="td-stat-header">
                                        <div className="td-stat-icon-wrapper td-yellow">
                                            <CheckSquare size={20} />
                                        </div>
                                        <div className="td-stat-badge td-icon-badge"><TrendingUp size={14} color="#10b981"/></div>
                                    </div>
                                    <div className="td-stat-body">
                                        <p className="td-stat-label">AssiduitÃ©</p>
                                        <h3 className="td-stat-val">0%</h3>
                                        <div className="td-stat-progress-row">
                                            <div className="td-stat-progress-bg"><div className="td-stat-progress-fill" style={{width: '0%', background: '#10b981'}}></div></div>
                                            <span className="td-stat-progress-target">Objectif 95%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom 2 Columns */}
                            <div className="td-bottom-grid">
                                {/* Left Column */}
                                <div className="td-bottom-left">
                                    
                                    {/* ActivitÃ©s de MÃ©morisation */}
                                    <div className="td-section-title-row">
                                        <div className="td-s-title">
                                            <div className="td-s-indicator"></div>
                                            <h2>ActivitÃ©s de MÃ©morisation</h2>
                                        </div>
                                        <button className="td-link-btn">Voir tout l'historique</button>
                                    </div>
                                    <div className="td-activities-panel">
                                        <div className="td-empty-activities">
                                            <p style={{color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px 0'}}>Aucune activitÃ© rÃ©cente.</p>
                                        </div>
                                    </div>

                                    {/* Progression des Cercles */}
                                    <div className="td-progression-panel">
                                        <div className="td-prog-header">
                                            <div className="td-prog-icon-bg"><BarChart size={16} color="#fbbf24" /></div>
                                            <h3>Progression des Cercles</h3>
                                        </div>
                                        <div className="td-prog-list">
                                            <div className="td-prog-item">
                                                <div className="td-prog-item-head">
                                                    <span>Aucun cercle (DÃ©butants)</span>
                                                    <span className="td-prog-pct" style={{color: '#10b981'}}>0%</span>
                                                </div>
                                                <div className="td-prog-bar-bg"><div className="td-prog-bar-fill" style={{width:'0%', background: '#10b981'}}></div></div>
                                            </div>
                                            <div className="td-prog-item">
                                                <div className="td-prog-item-head">
                                                    <span>Aucun cercle (AvancÃ©s)</span>
                                                    <span className="td-prog-pct" style={{color: '#fbbf24'}}>0%</span>
                                                </div>
                                                <div className="td-prog-bar-bg"><div className="td-prog-bar-fill" style={{width:'0%', background: '#fbbf24'}}></div></div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Right Column: Planning du Jour */}
                                <div className="td-bottom-right">
                                    <div className="td-section-title-row">
                                        <div className="td-s-title">
                                            <div className="td-s-indicator" style={{background: '#fbbf24'}}></div>
                                            <h2>Planning du Jour</h2>
                                        </div>
                                        <button className="td-icon-btn-small"><MoreHorizontal size={16}/></button>
                                    </div>
                                    <div className="td-panel-body">
                                        {scheduleItems.length === 0 ? (
                                            <div className="td-timeline-card-wrapper td-empty-timeline">
                                                <p className="td-text-mute">Aucun cours planifiÃ©.</p>
                                                <button className="td-btn-outline td-mt-4" onClick={() => setActiveTab('cours')}>
                                                    + Nouvel Ã‰vÃ©nement
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="td-timeline-card-wrapper">
                                                <div className="td-timeline">
                                                    {scheduleItems.map((item, idx) => (
                                                        <div className="td-timeline-item" key={item.id}>
                                                            <div className="td-timeline-marker" style={{
                                                                background: idx === 0 ? '#10b981' : idx === 1 ? '#fbbf24' : '#64748b',
                                                                boxShadow: idx === 0 ? '0 0 12px rgba(16, 185, 129, 0.6)' : idx === 1 ? '0 0 12px rgba(251, 191, 36, 0.6)' : 'none'
                                                            }}></div>
                                                            <div className="td-timeline-content">
                                                                <div className="td-tl-time">{item.startTime} - {item.endTime}</div>
                                                                <h4 className="td-tl-title">{item.courseName}</h4>
                                                                <p className="td-tl-desc">{item.className} â€¢ {item.room}</p>
                                                                <button 
                                                                    className="td-tl-link-btn"
                                                                    onClick={() => navigate(`/teacher/sessions/${item.sessionId}?tab=appel&seanceId=${item.seanceId}`)}
                                                                >
                                                                    <CheckSquare size={14} /> Faire l'appel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'sessions' && (
                        <div className="td-classes-view td-animate">
                            
                            {/* Premium Islamic Hero Banner */}
                            <div className="td-sessions-hero-banner" style={{ backgroundImage: `url('/islamic-hero.png')` }}>
                                <div className="td-hero-overlay"></div>
                                <div className="td-hero-content">
                                    <div className="td-sessions-hero-text">
                                        <span className="td-hero-badge">â— ESPACE FORMATEUR</span>
                                        <h2>Mes Sessions</h2>
                                        <p>GÃ©rez vos classes et suivez l'avancement de vos Ã©tudiants en temps rÃ©el.</p>
                                    </div>
                                    
                                    <div className="td-sessions-hero-stats">
                                        <div className="td-hero-stat-card glass-morph">
                                            <div className="td-hero-stat-icon td-green"><BookOpen size={20} /></div>
                                            <div className="td-hero-stat-info">
                                                <span>TOTAL SESSIONS</span>
                                                <strong>{sessions.length}</strong>
                                            </div>
                                        </div>
                                        <div className="td-hero-stat-card glass-morph">
                                            <div className="td-hero-stat-icon td-blue"><Users size={20} /></div>
                                            <div className="td-hero-stat-info">
                                                <span>Ã‰TUDIANTS</span>
                                                <strong>{totalEtudiants}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Decorative Tabs */}
                            <div className="td-sessions-tabs">
                                <button 
                                    className={`td-st-btn ${sessionFilter === 'all' ? 'active' : ''}`} 
                                    onClick={() => setSessionFilter('all')}
                                >
                                    Toutes les sessions
                                </button>
                                <button 
                                    className={`td-st-btn ${sessionFilter === 'active' ? 'active' : ''}`} 
                                    onClick={() => setSessionFilter('active')}
                                >
                                    En cours
                                </button>
                                <button 
                                    className={`td-st-btn ${sessionFilter === 'completed' ? 'active' : ''}`} 
                                    onClick={() => setSessionFilter('completed')}
                                >
                                    TerminÃ©es
                                </button>
                            </div>

                            {sessionsLoading ? (
                                <p className="td-loading">{t.loading}</p>
                            ) : sessions.length === 0 ? (
                                <div className="td-empty-state">
                                    <BookOpen size={48} style={{ opacity: 0.5 }} />
                                    <h3>Aucune session assignÃ©e</h3>
                                    <p>Vous n'avez pas encore Ã©tÃ© assignÃ© Ã  une session par l'administration.</p>
                                </div>
                            ) : (
                                <div className="td-sessions-grid">
                                    {filteredSessions.map(session => {
                                        const cls = Array.isArray(session.classe) ? session.classe[0] : session.classe;
                                        return (
                                        <div key={session._id} className={`td-session-card ${session.statut === 'TerminÃ©e' ? 'completed' : ''}`}>
                                            <div className={`td-sc-level-pill ${session.statut === 'TerminÃ©e' ? 'completed' : ''}`} style={{ backgroundColor: session.statut === 'TerminÃ©e' ? 'rgba(148, 163, 184, 0.2)' : getNiveauColor(cls?.niveau) + '20', color: session.statut === 'TerminÃ©e' ? '#94a3b8' : getNiveauColor(cls?.niveau) }}>
                                                {session.statut === 'TerminÃ©e' ? 'TERMINÃ‰E' : cls?.niveau?.toUpperCase() || 'STANDARD'}
                                            </div>

                                            {session.statut === 'En cours' && (
                                                <button 
                                                    className="td-sc-complete-btn" 
                                                    title="Marquer comme terminÃ©e"
                                                    onClick={(e) => { e.stopPropagation(); handleCompleteSession(session._id); }}
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            
                                            <h3 className="td-sc-title">{session.nomSession}</h3>
                                            <p className="td-sc-subtitle">{cls?.nomClasse || cls?.nom || 'Classe Non SpÃ©cifiÃ©e'}</p>
                                            
                                            <div className="td-sc-stats">
                                                <span><Users size={14} /> {session.etudiantsCount || 0} Ã‰tudiants</span>
                                                <span><BookOpen size={14} /> {getTeacherChaptersCount(session)} Chapitres</span>
                                            </div>
                                            
                                            <button className="td-sc-action" onClick={() => navigate(`/teacher/sessions/${session._id}`)}>
                                                Voir mes chapitres &rarr;
                                            </button>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'students' && (
                        <div className="td-students-view td-animate">
                            <div className="td-section-head" style={{ marginBottom: '24px' }}>
                                <h2>{t.myStudents}</h2>
                                <div className="td-search-wrapper">
                                    <Search size={16} className="td-search-icon" />
                                    <input
                                        type="text"
                                        className="td-search-input"
                                        placeholder="Rechercher un Ã©lÃ¨ve..."
                                        value={studentSearchTerm}
                                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {sessionsLoading ? (
                                <p className="td-loading">{t.loading}</p>
                            ) : filteredStudents.length === 0 ? (
                                <div className="td-empty-state">
                                    <Users size={48} style={{ opacity: 0.5 }} />
                                    <h3>Aucun Ã©lÃ¨ve trouvÃ©</h3>
                                    <p>Vous n'avez pas encore d'Ã©lÃ¨ves ou la recherche n'a donnÃ© aucun rÃ©sultat.</p>
                                </div>
                            ) : (
                                <div className="td-students-grid">
                                    {filteredStudents.map(student => (
                                        <div key={student._id} className="td-student-card">
                                            <div className="td-student-card-header">
                                                <div className="td-student-avatar-large">
                                                    {student.profileImage
                                                        ? <img src={student.profileImage.startsWith('http') ? student.profileImage : `http://localhost:5000${student.profileImage}`} alt="Profile" />
                                                        : <User size={28} />
                                                    }
                                                </div>
                                                <div className="td-student-info">
                                                    <h3>{student.firstName} {student.lastName}</h3>
                                                    <p>{student.email}</p>
                                                    {student.phoneNumber && <p className="td-student-phone">ðŸ“ž {student.phoneNumber}</p>}
                                                </div>
                                            </div>
                                            <div className="td-student-card-body">
                                                <h4>Classes ({student.enrolledClasses.length}) :</h4>
                                                <div className="td-enrolled-tags">
                                                    {student.enrolledClasses.map(c => (
                                                        <span key={c._id} className="td-enrolled-tag" style={{ borderLeftColor: getNiveauColor(c.niveau) }}>
                                                            {c.nomClasse}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="td-student-card-footer">
                                                <button className="td-btn-secondary td-btn-sm"><FileEdit size={14} /> Notes</button>
                                                <button className="td-btn-secondary td-btn-sm"><CheckSquare size={14} /> Absences</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'cours' && (
                        <div className="td-cours-view td-animate">
                            <div className="td-section-head">
                                <h2>{t.myCoursesMaterials}</h2>
                                <button className="td-btn-primary" onClick={() => { setEditingCours(null); setCoursForm({ titre: '', description: '', matiere: '', statut: 'Brouillon' }); setShowAddCours(true); }}>
                                    {t.addCourse}
                                </button>
                            </div>

                            {formSuccess && <div className="td-alert success">{formSuccess}</div>}
                            {formError && <div className="td-alert error">{formError}</div>}

                            {showAddCours && (
                                <div className="td-form-card">
                                    <h3>{editingCours ? t.editCourse : t.newCourse}</h3>
                                    <form onSubmit={handleCoursSubmit} className="td-form">
                                        <div className="td-form-group">
                                            <label>{t.titleRequired}</label>
                                            <input type="text" placeholder={t.titlePlaceholder} value={coursForm.titre} onChange={e => setCoursForm({ ...coursForm, titre: e.target.value })} required />
                                        </div>
                                        <div className="td-form-group">
                                            <label>{t.descriptionText}</label>
                                            <textarea placeholder={t.descriptionPlaceholder} value={coursForm.description} onChange={e => setCoursForm({ ...coursForm, description: e.target.value })} rows={3} />
                                        </div>
                                        <div className="td-form-row">
                                            <div className="td-form-group">
                                                <label>Session liÃ©e (optionnelle)</label>
                                                <select value={coursForm.classeId} onChange={e => setCoursForm({ ...coursForm, classeId: e.target.value })}>
                                                    <option value="">-- Aucune session --</option>
                                                    {sessions.map(s => <option key={s._id} value={s._id}>{s.nomSession} ({s.classe?.nomClasse})</option>)}
                                                </select>
                                            </div>
                                            <div className="td-form-group">
                                                <label>{t.subjectRequired}</label>
                                                <select value={coursForm.matiere} onChange={e => setCoursForm({ ...coursForm, matiere: e.target.value })} required>
                                                    <option value="">{t.selectSubject}</option>
                                                    {matieres.map(m => <option key={m._id} value={m._id}>{m.nomMatiere}</option>)}
                                                </select>
                                            </div>
                                            <div className="td-form-group">
                                                <label>{t.status}</label>
                                                <select value={coursForm.statut} onChange={e => setCoursForm({ ...coursForm, statut: e.target.value })}>
                                                    <option value="Brouillon">{t.statusDraft}</option>
                                                    <option value="PubliÃ©">{t.statusPublished}</option>
                                                    <option value="ArchivÃ©">{t.statusArchived}</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="td-form-group">
                                            <label>{t.fileUpload}</label>
                                            <div className="td-file-upload" onClick={() => fileInputRef.current?.click()}>
                                                <span>ðŸ“Ž</span>
                                                <span>{selectedFile ? selectedFile.name : t.clickToUpload}</span>
                                            </div>
                                            <input ref={fileInputRef} type="file" accept=".pdf,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.ogg" style={{ display: 'none' }} onChange={e => setSelectedFile(e.target.files[0] || null)} />
                                        </div>
                                        <div className="td-form-actions">
                                            <button type="button" className="td-btn-secondary" onClick={() => { setShowAddCours(false); setEditingCours(null); }}>{t.cancelButton}</button>
                                            <button type="submit" className="td-btn-primary" disabled={coursLoading}>{coursLoading ? t.loading : editingCours ? t.updateCourseButton : t.createCourseButton}</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {coursLoading ? (
                                <p className="td-loading">{t.loadingCourses}</p>
                            ) : cours.length === 0 && !showAddCours ? (
                                <div className="td-empty-state">
                                    <BookOpen size={48} style={{ opacity: 0.5 }} />
                                    <h3>{t.noCoursesPublished}</h3>
                                    <p>{t.startCreatingCourse}</p>
                                    <button className="td-btn-primary" onClick={() => setShowAddCours(true)}>{t.createFirstCourse}</button>
                                </div>
                            ) : (
                                <div className="td-cours-list">
                                    {cours.map(c => (
                                        <div key={c._id} className="td-cours-item">
                                            <div className="td-cours-ico">{c.fichier?.includes('.pdf') ? 'ðŸ“„' : c.fichier?.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? 'ðŸŽ¬' : c.fichier?.match(/\.(mp3|wav|ogg)$/i) ? 'ðŸŽ§' : 'ðŸ“'}</div>
                                            <div className="td-cours-info">
                                                <h4 className="td-cours-title">{c.titre}</h4>
                                                <p className="td-cours-meta">
                                                    <span className="td-cours-mat">{c.matiere?.nomMatiere || t.unknownSubject}</span>
                                                    {c.classe && <span className="td-cours-date"> Â· ðŸ« {c.classe?.nomClasse}</span>}
                                                    <span className="td-cours-date"> Â· {new Date(c.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}</span>
                                                </p>
                                                {c.description && <p className="td-cours-desc">{c.description}</p>}
                                                {c.fichier && <a href={`http://localhost:5000${c.fichier}`} target="_blank" rel="noopener noreferrer" className="td-cours-link">{t.viewFile}</a>}
                                            </div>
                                            <div className="td-cours-right">
                                                <span className={`td-badge ${getStatutBadge(c.statut)}`}>
                                                    {c.statut === 'PubliÃ©' ? t.statusPublished : c.statut === 'Brouillon' ? t.statusDraft : t.statusArchived}
                                                </span>
                                                <div className="td-cours-actions">
                                                    <button className="td-act-btn" title={c.statut === 'PubliÃ©' ? t.demoteToDraft : t.publishCourse} onClick={() => handleChangeStatut(c._id, c.statut)}>
                                                        <RefreshCw size={14} />
                                                    </button>
                                                    <button className="td-act-btn" title={t.modifyCourse} onClick={() => handleEditCours(c)}>
                                                        <FileEdit size={14} />
                                                    </button>
                                                    <button className="td-act-btn td-act-del" title={t.deleteCourse} onClick={() => handleDeleteCours(c._id)}>
                                                        <LogOut size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                    }

                    {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                        TAB: Gestion des PrÃ©sences (Cascading Dropdowns)
                        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                    {activeTab === 'attendance' && (
                        <div className="td-attendance-view td-animate">
                            {/* Notification Toast */}
                            {apelNotif.msg && (
                                <div className={`td-apel-toast ${apelNotif.type === 'error' ? 'td-apel-toast-error' : ''}`}>
                                    {apelNotif.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />} {apelNotif.msg}
                                </div>
                            )}

                            <div className="td-section-head">
                                <h2><CheckSquare size={22} style={{marginRight: '10px', color: '#10b981'}} />Gestion des PrÃ©sences</h2>
                            </div>

                            {/* â”€â”€ SÃ©lecteurs en cascade â”€â”€ */}
                            <div className="td-apel-controls">

                                {/* Champ 1 : Session */}
                                <div className="td-apel-control-group">
                                    <label className="td-apel-label"><span className="td-apel-step">1</span> Session</label>
                                    <select
                                        className="td-apel-select"
                                        value={apelSessionId}
                                        onChange={e => setApelSessionId(e.target.value)}
                                    >
                                        <option value="">-- Choisir une session --</option>
                                        {sessions.map(s => (
                                            <option key={s._id} value={s._id}>{s.nomSession}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Champ 2 : Classe & Horaire */}
                                <div className="td-apel-control-group">
                                    <label className="td-apel-label"><span className="td-apel-step">2</span> Classe &amp; Horaire</label>
                                    <select
                                        className="td-apel-select"
                                        value={apelSeanceId}
                                        onChange={e => setApelSeanceId(e.target.value)}
                                        disabled={!apelSessionId}
                                    >
                                        <option value="">{apelSessionId ? '-- Choisir la classe --' : 'â† Choisir une session d\'abord'}</option>
                                        {mySeancesForSession.map(s => {
                                            const cls = s.classe;
                                            const clsName = cls?.nomClasse || cls?.nom || 'Classe';
                                            return (
                                                <option key={s._id} value={s._id}>
                                                    {clsName} â€” {s.jour} Â· {s.heureDebut} Ã  {s.heureFin}
                                                    {s.matiere?.nomMatiere ? ` Â· ${s.matiere.nomMatiere}` : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Champ 3 : Date */}
                                <div className="td-apel-control-group td-apel-date-group">
                                    <label className="td-apel-label"><span className="td-apel-step">3</span> Date du cours</label>
                                    <input
                                        type="date"
                                        className="td-apel-select"
                                        value={apelDate}
                                        onChange={e => setApelDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* â”€â”€ Bandeau statut â”€â”€ */}
                            {isApelLoaded && apelSeanceId && (
                                <div className={`td-apel-status ${editable ? 'td-apel-status-ok' : 'td-apel-status-lock'}`}>
                                    {editable
                                        ? <><CheckCircle size={15} /> Modifiable â€” vous Ãªtes dans la fenÃªtre de 48h.</>
                                        : <><Lock size={15} /> VerrouillÃ© â€” dÃ©lai de 48h dÃ©passÃ©, lecture seule.</>
                                    }
                                </div>
                            )}

                            {/* â”€â”€ Corps : Tableau d'appel â”€â”€ */}
                            {!apelSeanceId ? (
                                <div className="td-apel-empty">
                                    <CheckSquare size={48} style={{ opacity: 0.25 }} />
                                    <p>Choisissez une session puis une sÃ©ance pour commencer l'appel.</p>
                                </div>
                            ) : presenceLoading || inscLoading ? (
                                <div className="td-apel-empty"><p>Chargement...</p></div>
                            ) : apelInscriptions.length === 0 ? (
                                <div className="td-apel-empty"><Users size={40} style={{opacity:0.3}} /><p>Aucun Ã©tudiant inscrit dans cette classe.</p></div>
                            ) : (
                                <div className="td-apel-table-wrap">
                                    {/* Bulk action */}
                                    <div className="td-apel-bulk">
                                        <span className="td-apel-count">{apelInscriptions.length} Ã©tudiant(s)</span>
                                        <button className="td-apel-bulk-btn" onClick={handleMarkAllPresent} disabled={!editable}>
                                            <CheckCircle size={14} /> Tout le monde est prÃ©sent
                                        </button>
                                    </div>

                                    <table className="td-apel-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Ã‰tudiant</th>
                                                <th>Statut</th>
                                                <th>Remarque</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {apelInscriptions.map((ins, idx) => {
                                                const curStatut = attendanceMap[ins._id]?.statut || 'Present';
                                                const curRemark = attendanceMap[ins._id]?.remarque || '';
                                                const cfg = getStatutCfg(curStatut);
                                                return (
                                                    <tr key={ins._id} className={`td-apel-row td-apel-row-${curStatut.toLowerCase()}`}>
                                                        <td className="td-apel-num">{idx + 1}</td>
                                                        <td>
                                                            <div className="td-apel-student">
                                                                <div className="td-apel-avatar-ring" style={{ borderColor: cfg.color }}>
                                                                    <div className="td-apel-avatar">
                                                                        {ins.etudiant?.profileImage
                                                                            ? <img src={ins.etudiant.profileImage.startsWith('http') ? ins.etudiant.profileImage : `http://localhost:5000${ins.etudiant.profileImage}`} alt="" />
                                                                            : <span>{(ins.etudiant?.firstName?.[0] || '?').toUpperCase()}</span>
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <strong>{ins.etudiant?.firstName} {ins.etudiant?.lastName}</strong>
                                                                    <span className="td-apel-mail">{ins.etudiant?.email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="td-apel-statut-btns">
                                                                {['Present', 'Absent', 'Retard'].map(s => {
                                                                    const c = getStatutCfg(s);
                                                                    return (
                                                                        <button
                                                                            key={s}
                                                                            className={`td-apel-statut-btn ${curStatut === s ? 'active' : ''}`}
                                                                            style={{
                                                                                '--asc': c.color,
                                                                                '--asb': c.bg,
                                                                                '--asbd': c.border,
                                                                            }}
                                                                            onClick={() => handleApelStatutChange(ins._id, s)}
                                                                            disabled={!editable}
                                                                        >
                                                                            {c.icon} {c.label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <input
                                                                className="td-apel-remark-input"
                                                                type="text"
                                                                placeholder={editable ? 'Remarque...' : 'â€”'}
                                                                value={curRemark}
                                                                onChange={e => handleApelRemarqueChange(ins._id, e.target.value)}
                                                                disabled={!editable}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {/* Cahier de Texte */}
                                    <div style={{ marginTop: '24px', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <BookOpen size={20}/> Cahier de Texte
                                        </h4>
                                        <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)' }}>
                                            Remplissez le contenu de votre séance. Cela valide automatiquement votre présence.
                                        </p>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                                                Contenu de la séance <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <textarea
                                                style={{ width: '100%', minHeight: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
                                                placeholder="Ex: Révision collective Sourate Al-Kahf (Verset 1 à 30)..."
                                                value={contenuSeance}
                                                onChange={(e) => setContenuSeance(e.target.value)}
                                                disabled={!editable}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                                                Remarques pédagogiques <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>(optionnel)</span>
                                            </label>
                                            <textarea
                                                style={{ width: '100%', minHeight: '60px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
                                                placeholder="Observations sur le niveau de la classe, difficultés..."
                                                value={remarquesPedagogiques}
                                                onChange={(e) => setRemarquesPedagogiques(e.target.value)}
                                                disabled={!editable}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                                                Devoirs à la maison <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>(optionnel)</span>
                                            </label>
                                            <textarea
                                                style={{ width: '100%', minHeight: '60px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
                                                placeholder="Apprendre Verset 31 à 40, réviser les règles de Tajweed..."
                                                value={devoirsMaison}
                                                onChange={(e) => setDevoirsMaison(e.target.value)}
                                                disabled={!editable}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    {editable && (
                                        <div className="td-apel-footer">
                                            <div className="td-apel-sum">
                                                <span style={{color:'#10b981'}}><CheckCircle size={13}/> {Object.values(attendanceMap).filter(v=>v.statut==='Present').length} PrÃ©sents</span>
                                                <span style={{color:'#ef4444'}}><XCircle size={13}/> {Object.values(attendanceMap).filter(v=>v.statut==='Absent').length} Absents</span>
                                                <span style={{color:'#f59e0b'}}><Clock size={13}/> {Object.values(attendanceMap).filter(v=>v.statut==='Retard').length} Retards</span>
                                            </div>
                                            <button className="td-apel-save-btn" onClick={handleSaveApel} disabled={presenceLoading}>
                                                <Save size={15} /> {presenceLoading ? 'Enregistrement...' : 'Enregistrer l\'Appel'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                        TAB: Carnet de notes (Cahier de Texte / PrÃ©sence Enseignant)
                        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                    {activeTab === 'cahier_texte' && (
                        <div className="td-attendance-view td-animate">
                            {apelNotif.msg && (
                                <div className={`td-apel-toast ${apelNotif.type === 'error' ? 'td-apel-toast-error' : ''}`}>
                                    {apelNotif.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />} {apelNotif.msg}
                                </div>
                            )}

                            <div className="td-section-head">
                                <h2><FileEdit size={22} style={{marginRight: '10px', color: '#10b981'}} />Carnet de notes (Cahier de texte)</h2>
                            </div>

                            {/* â”€â”€ SÃ©lecteurs en cascade partagÃ©s â”€â”€ */}
                            <div className="td-apel-controls">
                                <div className="td-apel-control-group">
                                    <label className="td-apel-label"><span className="td-apel-step">1</span> Session</label>
                                    <select className="td-apel-select" value={apelSessionId} onChange={e => setApelSessionId(e.target.value)}>
                                        <option value="">-- Choisir une session --</option>
                                        {sessions.map(s => <option key={s._id} value={s._id}>{s.nomSession}</option>)}
                                    </select>
                                </div>

                                <div className="td-apel-control-group">
                                    <label className="td-apel-label"><span className="td-apel-step">2</span> Classe &amp; Horaire</label>
                                    <select className="td-apel-select" value={apelSeanceId} onChange={e => setApelSeanceId(e.target.value)} disabled={!apelSessionId}>
                                        <option value="">{apelSessionId ? '-- Choisir la classe --' : 'â† Choisir session'}</option>
                                        {mySeancesForSession.map(s => {
                                            const clsName = s.classe?.nomClasse || s.classe?.nom || 'Classe';
                                            return (
                                                <option key={s._id} value={s._id}>
                                                    {clsName} â€” {s.jour} Â· {s.heureDebut} Ã  {s.heureFin}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div className="td-apel-control-group td-apel-date-group">
                                    <label className="td-apel-label"><span className="td-apel-step">3</span> Date du cours</label>
                                    <input className="td-apel-select" type="date" value={apelDate} onChange={e => setApelDate(e.target.value)} />
                                </div>
                            </div>

                            {/* â”€â”€ Zone Cahier de Texte â”€â”€ */}
                            {apelSeanceId && (
                                <div className="td-apel-body td-animate">
                                    <div className="td-apel-cahier-wrap" style={{ marginTop: '0', padding: '24px', background: 'rgba(255,255,255,0.015)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1.05rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <BookOpen size={20}/> Mon Cahier de Texte
                                        </h4>
                                        <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
                                            Remplissez le contenu du cours pour suivre la progression pÃ©dagogique de la classe.<br/>
                                            <strong>Note :</strong> Sauvegarder ce document justifie instantanÃ©ment votre prÃ©sence pour ce cours !
                                        </p>
                                        
                                        <textarea
                                            style={{
                                                width: '100%',
                                                minHeight: '140px',
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                padding: '16px',
                                                color: '#fff',
                                                fontSize: '0.95rem',
                                                resize: 'vertical'
                                            }}
                                            placeholder="Ex: RÃ©vision collective Sourate Al-Kahf (Verset 1 Ã  30). Devoirs: Apprendre Verset 31 Ã  40 pour le prochain cours..."
                                            value={cahierTexte}
                                            onChange={(e) => setCahierTexte(e.target.value)}
                                        />

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                            <button 
                                                className="td-apel-save-btn" 
                                                onClick={handleSaveCahierTexte}
                                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Save size={18} /> {cahierTexte ? 'Mettre Ã  jour le cahier' : 'Enregistrer le cahier'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div >
            </main >
        </div >
    );
}

export default TeacherDashboard;
