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

    // ── Gestion Présences (Cascading Dropdowns) ──
    const [apelSessionId, setApelSessionId] = useState('');
    const [apelSeanceId, setApelSeanceId] = useState('');
    const [apelDate, setApelDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [isApelLoaded, setIsApelLoaded] = useState(false);
    const [apelNotif, setApelNotif] = useState({ msg: '', type: 'success' });
    const [cahierTexte, setCahierTexte] = useState('');
    
    // ── Carnet de notes (Présence Enseignant / Cahier de Texte) ──
    const [isNotesLoading, setIsNotesLoading] = useState(false);
    const [notesNotif, setNotesNotif] = useState({ msg: '', type: 'success' });
    const cahierTextareaRef = useRef(null);
    const [lastCahierTexte, setLastCahierTexte] = useState('');

    // Smart Tags for Cahier de texte
    const SMART_TAGS = ['حفظ جديد', 'مراجعة', 'تسميع', 'أحكام تجويد', 'اختبار'];

    const handleSmartTag = (tag) => {
        if (!editable) return;
        const textarea = cahierTextareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = cahierTexte.substring(0, start);
        const after = cahierTexte.substring(end);
        const separator = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '';
        const newText = before + separator + tag + ' ' + after;
        setCahierTexte(newText);
        // Restore cursor after React re-render
        setTimeout(() => {
            textarea.focus();
            const newPos = start + separator.length + tag.length + 1;
            textarea.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleReprendre = () => {
        if (lastCahierTexte) setCahierTexte(lastCahierTexte);
    };

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
            setApelSeanceId(''); // reset séance
            setAttendanceMap({});
            setIsApelLoaded(false);
        }
    }, [apelSessionId, dispatch]);

    // Cascade Step 3 : quand une séance + date changent, charge l'appel existant
    useEffect(() => {
        if (apelSeanceId && apelDate && activeTab === 'attendance') {
            setIsApelLoaded(false);
            dispatch(fetchPresence({ seanceId: apelSeanceId, date: apelDate }))
                .then(() => setIsApelLoaded(true));
        }
    }, [apelSeanceId, apelDate, activeTab, dispatch]);

    // Fetch Cahier de texte quand la séance d'appel change
    useEffect(() => {
        if (apelSeanceId && apelDate && activeTab === 'attendance') {
            const fetchCahier = async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${user.token}` } };
                    const res = await axios.get(`http://localhost:5000/api/teacher-presences?seanceId=${apelSeanceId}&date=${apelDate}`, config);
                    if (res.data && res.data.data) {
                        const fetched = res.data.data.cahierTexte || '';
                        setCahierTexte(fetched);
                        setLastCahierTexte(fetched);
                    } else {
                        setCahierTexte('');
                    }
                } catch (e) {
                    setCahierTexte('');
                }
            };
            fetchCahier();
        }
    }, [apelSeanceId, apelDate, activeTab, user?.token]);

    // Pré-remplir attendanceMap avec les inscriptions filtrées par classe de la séance
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

    // Notification après save
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
        if (!apelSeanceId) return showApelNotif('Veuillez sélectionner une séance', 'error');
        if (!editable) return;
        const presencesArr = Object.entries(attendanceMap).map(([inscriptionId, data]) => ({
            inscriptionId,
            statut: data.statut,
            remarque: data.remarque || ''
        }));
        dispatch(savePresence({ seanceId: apelSeanceId, date: apelDate, presences: presencesArr }));
    };

    const showNotesNotif = (msg, type = 'success') => {
        setNotesNotif({ msg, type });
        setTimeout(() => setNotesNotif({ msg: '', type: 'success' }), 3500);
    };

    const handleSaveNotes = async () => {
        if (!apelSeanceId) return showNotesNotif('Veuillez sélectionner une séance', 'error');
        setIsNotesLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('http://localhost:5000/api/teacher-presences', {
                seanceId: apelSeanceId,
                date: apelDate,
                cahierTexte
            }, config);
            showNotesNotif('Cahier de texte enregistré !', 'success');
        } catch (err) {
            console.error('Erreur sauvegarde cahier de texte', err);
            showNotesNotif('Erreur lors de la sauvegarde.', 'error');
        } finally {
            setIsNotesLoading(false);
        }
    };

    const getStatutCfg = (statut) => ({
        Present: { label: 'Présent',  icon: <CheckCircle size={14} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)' },
        Absent:  { label: 'Absent',   icon: <XCircle size={14} />,    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)'  },
        Retard:  { label: 'Retard',   icon: <Clock size={14} />,      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)' },
    }[statut] || { label: statut, icon: null, color: '#94a3b8', bg: 'transparent', border: '#94a3b8' });

    // Séances de CET enseignant, filtrées par session sélectionnée
    const mySeancesForSession = (seances || []).filter(s => {
        const isMine = s.enseignant?._id === user?._id || s.enseignant === user?._id;
        const inSession = (s.session?._id || s.session)?.toString() === apelSessionId;
        return isMine && inSession;
    });

    const handleCoursSubmit = async (e) => {
        e.preventDefault();
        setFormError(''); setFormSuccess('');
        if (!coursForm.titre || !coursForm.matiere) return setFormError('Le titre et la matière sont requis.');

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
                setFormSuccess('Cours mis à jour !');
            }
        } else {
            const result = await dispatch(createCours(formData));
            if (createCours.fulfilled.match(result)) {
                setFormSuccess('Cours créé avec succès !');
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
        const nextStatut = currentStatut === 'Publié' ? 'Brouillon' : 'Publié';
        const fd = new FormData();
        fd.append('statut', nextStatut);
        dispatch(updateCours({ id, coursData: fd }));
    };

    const getStatutBadge = (statut) => {
        const map = { 'Publié': 'statut-publie', 'Brouillon': 'statut-brouillon', 'Archivé': 'statut-archive' };
        return map[statut] || 'statut-brouillon';
    };

    const getNiveauColor = (niveau) => {
        const map = { 'Débutant': 'var(--td-green)', 'Intermédiaire': 'var(--td-blue)', 'Avancé': 'var(--td-purple)' };
        return map[niveau] || 'var(--td-text-mute)';
    };

    const handleLogout = () => {
        if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
            dispatch(logout());
            navigate('/login');
        }
    };

    const handleCompleteSession = async (sessionId) => {
        if (window.confirm('Marquer cette session comme terminée ? Elle ne sera plus affichée dans les inscriptions publiques.')) {
            dispatch(completeSession(sessionId));
        }
    };

    if (!user) return null;

    // Calculate total students from sessions (each session has etudiantsCount from backend)
    const totalEtudiants = sessions.reduce((acc, s) => acc + (s.etudiantsCount || 0), 0);
    const publishedCours = cours.filter(c => c.statut === 'Publié').length;

    // Calculate dynamic stats based on real data (if present)
    const alertesScolaires = 0; // Requires attendance/grades backend logic
    const evalsACorriger = 0;   // Requires assignments backend logic
    const elevesEnDifficulte = 0; // Requires grades backend logic
    const sessionsTerminees = sessions.filter(s => s.statut === 'Terminée').length;

    // Emploi du temps du jour (sécurisé contre la casse ou les accents)
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
            courseName: s.matiere?.nomMatiere || 'Matière',
            className: s.session?.nomSession || 'Session',
            room: s.salle || 'Non assignée'
        }))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Remove old student extraction logic (will be handled via inscriptions)
    const filteredStudents = [];

    const filteredSessions = sessions.filter(s => {
        if (sessionFilter === 'all') return true;
        if (sessionFilter === 'active') return s.statut === 'En cours';
        if (sessionFilter === 'completed') return s.statut === 'Terminée';
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
                    <button className={`td-nav-link ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}><CheckSquare size={18} /> <span>Gestion Présences</span></button>
                    <button className="td-nav-link" onClick={() => navigate('/teacher/planning')}><Calendar size={18} /> <span>Mon Planning</span></button>
                    <button className={`td-nav-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
                        <Users size={18} /> <span>{t.myStudents}</span>
                    </button>
                    <button className="td-nav-link" onClick={() => navigate('/profile')}><User size={18} /> <span>{t.profile}</span></button>
                    <button className="td-nav-link"><Bell size={18} /> <span>Notifications</span></button>
                    <button className="td-nav-link"><Settings size={18} /> <span>{t.settings}</span></button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="td-main">
                {/* Topbar Re-design matching the dark theme image */}
                <header className="td-topbar">
                    <div className="td-search-bar">
                        <Search size={18} />
                        <input type="text" placeholder="Rechercher un étudiant, une sourate..." />
                    </div>
                    <div className="td-topbar-actions">
                        <button className="td-top-icon"><Bell size={20} /></button>
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
                                    <h1>السلام عليكم، {user?.firstName}</h1>
                                    <p>Qu'Allah bénisse votre enseignement aujourd'hui, le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric'})}.</p>
                                </div>
                                <div className="td-hero-right">
                                    {/* Bouton Nouvelle Session encapsulé et supprimé selon la demande */}
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
                                        <p className="td-stat-label">Étudiants</p>
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
                                        <p className="td-stat-label">Sourates Révisées</p>
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
                                        <p className="td-stat-label">Assiduité</p>
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
                                    
                                    {/* Activités de Mémorisation */}
                                    <div className="td-section-title-row">
                                        <div className="td-s-title">
                                            <div className="td-s-indicator"></div>
                                            <h2>Activités de Mémorisation</h2>
                                        </div>
                                        <button className="td-link-btn">Voir tout l'historique</button>
                                    </div>
                                    <div className="td-activities-panel">
                                        <div className="td-empty-activities">
                                            <p style={{color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px 0'}}>Aucune activité récente.</p>
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
                                                    <span>Aucun cercle (Débutants)</span>
                                                    <span className="td-prog-pct" style={{color: '#10b981'}}>0%</span>
                                                </div>
                                                <div className="td-prog-bar-bg"><div className="td-prog-bar-fill" style={{width:'0%', background: '#10b981'}}></div></div>
                                            </div>
                                            <div className="td-prog-item">
                                                <div className="td-prog-item-head">
                                                    <span>Aucun cercle (Avancés)</span>
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
                                                <p className="td-text-mute">Aucun cours planifié.</p>
                                                <button className="td-btn-outline td-mt-4" onClick={() => setActiveTab('cours')}>
                                                    + Nouvel Événement
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
                                                                <p className="td-tl-desc">{item.className} • {item.room}</p>
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
                                        <span className="td-hero-badge">● ESPACE FORMATEUR</span>
                                        <h2>Mes Sessions</h2>
                                        <p>Gérez vos classes et suivez l'avancement de vos étudiants en temps réel.</p>
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
                                                <span>ÉTUDIANTS</span>
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
                                    Terminées
                                </button>
                            </div>

                            {sessionsLoading ? (
                                <p className="td-loading">{t.loading}</p>
                            ) : sessions.length === 0 ? (
                                <div className="td-empty-state">
                                    <BookOpen size={48} style={{ opacity: 0.5 }} />
                                    <h3>Aucune session assignée</h3>
                                    <p>Vous n'avez pas encore été assigné à une session par l'administration.</p>
                                </div>
                            ) : (
                                <div className="td-sessions-grid">
                                    {filteredSessions.map(session => {
                                        const cls = Array.isArray(session.classe) ? session.classe[0] : session.classe;
                                        return (
                                        <div key={session._id} className={`td-session-card ${session.statut === 'Terminée' ? 'completed' : ''}`}>
                                            <div className={`td-sc-level-pill ${session.statut === 'Terminée' ? 'completed' : ''}`} style={{ backgroundColor: session.statut === 'Terminée' ? 'rgba(148, 163, 184, 0.2)' : getNiveauColor(cls?.niveau) + '20', color: session.statut === 'Terminée' ? '#94a3b8' : getNiveauColor(cls?.niveau) }}>
                                                {session.statut === 'Terminée' ? 'TERMINÉE' : cls?.niveau?.toUpperCase() || 'STANDARD'}
                                            </div>

                                            {session.statut === 'En cours' && (
                                                <button 
                                                    className="td-sc-complete-btn" 
                                                    title="Marquer comme terminée"
                                                    onClick={(e) => { e.stopPropagation(); handleCompleteSession(session._id); }}
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            
                                            <h3 className="td-sc-title">{session.nomSession}</h3>
                                            <p className="td-sc-subtitle">{cls?.nomClasse || cls?.nom || 'Classe Non Spécifiée'}</p>
                                            
                                            <div className="td-sc-stats">
                                                <span><Users size={14} /> {session.etudiantsCount || 0} Étudiants</span>
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
                                        placeholder="Rechercher un élève..."
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
                                    <h3>Aucun élève trouvé</h3>
                                    <p>Vous n'avez pas encore d'élèves ou la recherche n'a donné aucun résultat.</p>
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
                                                    {student.phoneNumber && <p className="td-student-phone">📞 {student.phoneNumber}</p>}
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
                                                <label>Session liée (optionnelle)</label>
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
                                                    <option value="Publié">{t.statusPublished}</option>
                                                    <option value="Archivé">{t.statusArchived}</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="td-form-group">
                                            <label>{t.fileUpload}</label>
                                            <div className="td-file-upload" onClick={() => fileInputRef.current?.click()}>
                                                <span>📎</span>
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
                                            <div className="td-cours-ico">{c.fichier?.includes('.pdf') ? '📄' : c.fichier?.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? '🎬' : c.fichier?.match(/\.(mp3|wav|ogg)$/i) ? '🎧' : '📝'}</div>
                                            <div className="td-cours-info">
                                                <h4 className="td-cours-title">{c.titre}</h4>
                                                <p className="td-cours-meta">
                                                    <span className="td-cours-mat">{c.matiere?.nomMatiere || t.unknownSubject}</span>
                                                    {c.classe && <span className="td-cours-date"> · 🏫 {c.classe?.nomClasse}</span>}
                                                    <span className="td-cours-date"> · {new Date(c.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}</span>
                                                </p>
                                                {c.description && <p className="td-cours-desc">{c.description}</p>}
                                                {c.fichier && <a href={`http://localhost:5000${c.fichier}`} target="_blank" rel="noopener noreferrer" className="td-cours-link">{t.viewFile}</a>}
                                            </div>
                                            <div className="td-cours-right">
                                                <span className={`td-badge ${getStatutBadge(c.statut)}`}>
                                                    {c.statut === 'Publié' ? t.statusPublished : c.statut === 'Brouillon' ? t.statusDraft : t.statusArchived}
                                                </span>
                                                <div className="td-cours-actions">
                                                    <button className="td-act-btn" title={c.statut === 'Publié' ? t.demoteToDraft : t.publishCourse} onClick={() => handleChangeStatut(c._id, c.statut)}>
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

                    {/* ══════════════════════════════════════════════════════
                        TAB: Gestion des Présences (Cascading Dropdowns)
                        ══════════════════════════════════════════════════════ */}
                    {activeTab === 'attendance' && (
                        <div className="td-attendance-view td-animate">
                            {/* Notification Toast */}
                            {apelNotif.msg && (
                                <div className={`td-apel-toast ${apelNotif.type === 'error' ? 'td-apel-toast-error' : ''}`}>
                                    {apelNotif.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />} {apelNotif.msg}
                                </div>
                            )}

                            <div className="td-section-head">
                                <h2><CheckSquare size={22} style={{marginRight: '10px', color: '#10b981'}} />Gestion des Présences</h2>
                            </div>

                            {/* ── Sélecteurs en cascade ── */}
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
                                        <option value="">{apelSessionId ? '-- Choisir la classe --' : '← Choisir une session d\'abord'}</option>
                                        {mySeancesForSession.map(s => {
                                            const cls = s.classe;
                                            const clsName = cls?.nomClasse || cls?.nom || 'Classe';
                                            return (
                                                <option key={s._id} value={s._id}>
                                                    {clsName} — {s.jour} · {s.heureDebut} à {s.heureFin}
                                                    {s.matiere?.nomMatiere ? ` · ${s.matiere.nomMatiere}` : ''}
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

                            {/* ── Bandeau statut ── */}
                            {isApelLoaded && apelSeanceId && (
                                <div className={`td-apel-status ${editable ? 'td-apel-status-ok' : 'td-apel-status-lock'}`}>
                                    {editable
                                        ? <><CheckCircle size={15} /> Modifiable — vous êtes dans la fenêtre de 48h.</>
                                        : <><Lock size={15} /> Verrouillé — délai de 48h dépassé, lecture seule.</>
                                    }
                                </div>
                            )}

                            {/* ── Corps : Tableau d'appel ── */}
                            {!apelSeanceId ? (
                                <div className="td-apel-empty">
                                    <CheckSquare size={48} style={{ opacity: 0.25 }} />
                                    <p>Choisissez une session puis une séance pour commencer l'appel.</p>
                                </div>
                            ) : presenceLoading || inscLoading ? (
                                <div className="td-apel-empty"><p>Chargement...</p></div>
                            ) : apelInscriptions.length === 0 ? (
                                <div className="td-apel-empty"><Users size={40} style={{opacity:0.3}} /><p>Aucun étudiant inscrit dans cette classe.</p></div>
                            ) : (
                                <div className="td-apel-table-wrap">
                                    {/* Bulk action */}
                                    <div className="td-apel-bulk">
                                        <span className="td-apel-count">{apelInscriptions.length} étudiant(s)</span>
                                        <button className="td-apel-bulk-btn" onClick={handleMarkAllPresent} disabled={!editable}>
                                            <CheckCircle size={14} /> Tout le monde est présent
                                        </button>
                                    </div>

                                    <table className="td-apel-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Étudiant</th>
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
                                                                placeholder={editable ? 'Remarque...' : '—'}
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

                                    {/* Footer */}
                                    {editable && (
                                        <div className="td-apel-footer">
                                            <div className="td-apel-sum">
                                                <span style={{color:'#10b981'}}><CheckCircle size={13}/> {Object.values(attendanceMap).filter(v=>v.statut==='Present').length} Présents</span>
                                                <span style={{color:'#ef4444'}}><XCircle size={13}/> {Object.values(attendanceMap).filter(v=>v.statut==='Absent').length} Absents</span>
                                                <span style={{color:'#f59e0b'}}><Clock size={13}/> {Object.values(attendanceMap).filter(v=>v.statut==='Retard').length} Retards</span>
                                            </div>
                                            <button className="td-apel-save-btn" onClick={handleSaveApel} disabled={presenceLoading}>
                                                <Save size={15} /> {presenceLoading ? 'Enregistrement...' : 'Enregistrer l\'Appel'}
                                            </button>
                                        </div>
                                    )}

                                    {/* ── UNIFIED CAHIER DE TEXTE ── */}
                                    <div className="td-unified-cahier td-animate">
                                        <div className="td-notes-card">
                                            <h4 className="td-notes-card-title">
                                                <BookOpen size={20} /> 
                                                <span>Cahier de texte pédagogique</span>
                                            </h4>
                                            {notesNotif.msg && (
                                                <div className={`td-alert-notes-small td-alert-${notesNotif.type}`}>
                                                    {notesNotif.type === 'success' ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
                                                    <span>{notesNotif.msg}</span>
                                                </div>
                                            )}
                                            <p className="td-notes-card-subtitle">Veuillez consigner ici le contenu de votre cours pour valider votre séance.</p>

                                            {/* ── Smart Tags Toolbar ── */}
                                            <div className="td-smart-tags-bar">
                                                <div className="td-smart-tags-list">
                                                    {SMART_TAGS.map(tag => (
                                                        <button
                                                            key={tag}
                                                            type="button"
                                                            className={`td-smart-tag ${!editable ? 'td-smart-tag-disabled' : ''}`}
                                                            onClick={() => handleSmartTag(tag)}
                                                            disabled={!editable}
                                                            title={`Insérer «${tag}» au curseur`}
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    className={`td-reprendre-btn ${!lastCahierTexte || !editable ? 'td-reprendre-btn-disabled' : ''}`}
                                                    onClick={handleReprendre}
                                                    disabled={!lastCahierTexte || !editable}
                                                    title="Reprendre le contenu de la dernière séance enregistrée"
                                                >
                                                    <RefreshCw size={13} />
                                                    <span>Reprendre la dernière séance</span>
                                                </button>
                                            </div>

                                            <textarea
                                                ref={cahierTextareaRef}
                                                className="td-notes-textarea"
                                                placeholder="Décrivez ce que vous avez enseigné aujourd'hui (Sourates, leçons, versets révisés, devoirs...)"
                                                value={cahierTexte}
                                                onChange={(e) => setCahierTexte(e.target.value)}
                                                disabled={!editable}
                                            />
                                            
                                            <div className="td-notes-footer">
                                                <button 
                                                    className="td-apel-save-btn td-notes-save-btn" 
                                                    onClick={handleSaveNotes} 
                                                    disabled={isNotesLoading || !editable}
                                                >
                                                    <Save size={18} /> 
                                                    <span>{isNotesLoading ? 'Enregistrement...' : 'Enregistrer le Cahier de Texte'}</span>
                                                </button>
                                            </div>
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
