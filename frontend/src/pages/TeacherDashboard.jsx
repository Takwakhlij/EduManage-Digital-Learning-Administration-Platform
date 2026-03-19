import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { getTeacherSessions, completeSession } from '../features/sessions/sessionSlice';
import { getMatieres } from '../features/matieres/matiereSlice';
import { getCours, createCours, updateCours, deleteCours, reset as resetCours } from '../features/cours/coursSlice';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
    Bell, RefreshCw, AlertTriangle, FileEdit, TrendingDown,
    CheckCircle, Calendar, Users, BarChart, BookOpen, User, Settings,
    LogOut, ChevronRight, CheckSquare, MapPin, Eye, Search
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

    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedSession, setSelectedSession] = useState(null);
    const [showAddCours, setShowAddCours] = useState(false);
    const [coursForm, setCoursForm] = useState({ titre: '', description: '', matiere: '', statut: 'Brouillon', classeId: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [editingCours, setEditingCours] = useState(null);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [sessionFilter, setSessionFilter] = useState('all'); // 'all', 'active', 'completed'
    const fileInputRef = useRef();

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        if (user.role !== 'teacher') { navigate('/'); return; }
        dispatch(getTeacherSessions());
        dispatch(getMatieres());
        dispatch(getCours());
    }, [user, navigate, dispatch]);

    useEffect(() => {
        if (isError && message) setFormError(message);
    }, [isError, message]);

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
    const leconsTerminees = cours.filter(c => c.statut === 'Archivé').length;

    // Aggregate schedule from actual sessions planning array
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }); // e.g., 'lundi'
    const scheduleItems = sessions.flatMap(s => {
        const c = s.classe;
        if (!c || !c.planning) return [];
        return c.planning
            .filter(p => p.jour.toLowerCase() === today.toLowerCase())
            .map(p => ({
                id: `${s._id}-${p._id || Math.random()}`,
                startTime: p.heureDebut,
                endTime: p.heureFin,
                courseName: 'Cours',
                className: s.nomSession,
                room: 'En Ligne / Classe'
            }));
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Remove old student extraction logic (will be handled via inscriptions)
    const filteredStudents = [];

    const filteredSessions = sessions.filter(s => {
        if (sessionFilter === 'all') return true;
        if (sessionFilter === 'active') return s.statut === 'En cours';
        if (sessionFilter === 'completed') return s.statut === 'Terminée';
        return true;
    });


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
                    <button className="td-nav-link"><FileEdit size={18} /> <span>Carnet de notes</span></button>
                    <button className="td-nav-link"><CheckSquare size={18} /> <span>{t.attendance}</span></button>
                    <button className="td-nav-link"><Calendar size={18} /> <span>{t.schedule}</span></button>
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
                {activeTab === 'dashboard' && (
                    <header className="td-header">
                        <div className="td-header-title">
                            <h1>
                                {t.dashboard} <span className="td-highlight">| Prof. {user?.firstName} {user?.lastName}</span>
                            </h1>
                            <p className="td-greeting">
                                <span className="td-text-gold">السلام عليكم !</span> {t.overviewToday}
                            </p>
                        </div>

                        <div className="td-header-actions">
                            <div className="td-lang-switcher">
                                {['ar', 'fr', 'en'].map(l => (
                                    <button key={l} className={`td-lang-btn ${lang === l ? 'active' : ''}`} onClick={() => setLang(l)}>
                                        {l.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            <button className="td-logout-icon" onClick={handleLogout} title={t.logout}>
                                <LogOut size={18} />
                            </button>
                        </div>
                    </header>
                )}

                <div className="td-scroll-content">
                    {activeTab === 'dashboard' && (
                        <div className="td-dashboard-grid">
                            <div className="td-primary-stats">
                                <div className="td-stat-card">
                                    <div className="td-stat-icon-wrapper td-blue">
                                        <Users size={24} />
                                    </div>
                                    <div className="td-stat-text">
                                        <h3 className="td-stat-label">{t.myStudents}</h3>
                                        <p className="td-stat-val">{sessionsLoading ? '...' : totalEtudiants}</p>
                                    </div>
                                </div>
                                <div className="td-stat-card">
                                    <div className="td-stat-icon-wrapper td-green">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div className="td-stat-text">
                                        <h3 className="td-stat-label">{t.attendance}</h3>
                                        <p className="td-stat-val">-</p>
                                    </div>
                                </div>
                                <div className="td-stat-card">
                                    <div className="td-stat-icon-wrapper td-purple">
                                        <BarChart size={24} />
                                    </div>
                                    <div className="td-stat-text">
                                        <h3 className="td-stat-label">{t.generalAverage}</h3>
                                        <p className="td-stat-val">-</p>
                                    </div>
                                </div>
                                <div className="td-stat-card">
                                    <div className="td-stat-icon-wrapper td-orange">
                                        <Calendar size={24} />
                                    </div>
                                    <div className="td-stat-text">
                                        <h3 className="td-stat-label">{t.coursesToday}</h3>
                                        <p className="td-stat-val">{coursLoading ? '...' : publishedCours}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Stats */}
                            <div className="td-secondary-stats">
                                <div className="td-sec-card">
                                    <div className="td-sec-header td-red-text">
                                        <AlertTriangle size={18} /> <span>{t.alerts}</span>
                                    </div>
                                    <h2 className="td-sec-val td-red-text">{alertesScolaires}</h2>
                                    <p className="td-sec-sub">{t.studentsToFollow}</p>
                                </div>
                                <div className="td-sec-card">
                                    <div className="td-sec-header td-blue-text">
                                        <FileEdit size={18} /> <span>{t.toCorrect}</span>
                                    </div>
                                    <h2 className="td-sec-val td-blue-text">{evalsACorriger}</h2>
                                    <p className="td-sec-sub">{t.evaluations}</p>
                                </div>
                                <div className="td-sec-card">
                                    <div className="td-sec-header td-gold-text">
                                        <TrendingDown size={18} /> <span>{t.difficulties}</span>
                                    </div>
                                    <h2 className="td-sec-val td-gold-text">{elevesEnDifficulte}</h2>
                                    <p className="td-sec-sub">{t.studentsBelowQuery}</p>
                                </div>
                                <div className="td-sec-card">
                                    <div className="td-sec-header td-green-text">
                                        <CheckCircle size={18} /> <span>{t.completed}</span>
                                    </div>
                                    <h2 className="td-sec-val td-green-text">{leconsTerminees}</h2>
                                    <p className="td-sec-sub">{t.archivedLessons}</p>
                                </div>
                            </div>

                            {/* Bottom Area */}
                            <div className="td-bottom-area">
                                {/* Left Col */}
                                <div className="td-schedule-panel">
                                    <div className="td-panel-header">
                                        <Calendar size={20} />
                                        <h2>{t.todaySchedule}</h2>
                                    </div>
                                    <div className="td-schedule-list">
                                        {scheduleItems.length === 0 ? (
                                            <p className="td-text-mute" style={{ textAlign: 'center', padding: '20px 0' }}>{t.noScheduleYet}</p>
                                        ) : scheduleItems.map(item => (
                                            <div key={item.id} className="td-schedule-item">
                                                <div className="td-sched-time">
                                                    <span className="td-time-start">{item.startTime}</span>
                                                    <span className="td-time-end">{item.endTime}</span>
                                                </div>
                                                <div className="td-sched-course">
                                                    <p className="td-course-name">{item.courseName}</p>
                                                    <p className="td-course-class">{item.className}</p>
                                                </div>
                                                <div className="td-sched-room">
                                                    <MapPin size={14} /> <span>{item.room}</span>
                                                </div>
                                                <button className="td-sched-btn"><CheckSquare size={16} /> {t.markAbsence}</button>
                                                <button className="td-sched-btn"><Eye size={16} /> {t.view}</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Col */}
                                <div className="td-actions-panel">
                                    <div className="td-panel-header">
                                        <RefreshCw size={20} />
                                        <h2>{t.quickActions}</h2>
                                    </div>
                                    <div className="td-actions-list">
                                        {[
                                            { icon: <Users size={18} />, label: t.myStudents, onClick: () => setActiveTab('students') },
                                            { icon: <FileEdit size={18} />, label: t.enterGrades },
                                            { icon: <CheckSquare size={18} />, label: t.manageAbsences },
                                            { icon: <Calendar size={18} />, label: t.todaySchedule },
                                            { icon: <BookOpen size={18} />, label: 'Mes Sessions', onClick: () => setActiveTab('sessions') },
                                        ].map((action, i) => (
                                            <button key={i} className="td-action-btn" onClick={action.onClick}>
                                                <span className="td-act-icon">{action.icon}</span>
                                                <span className="td-act-lbl">{action.label}</span>
                                                <ChevronRight size={18} className="td-act-arrow" />
                                            </button>
                                        ))}
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
                                    {filteredSessions.map(session => (
                                        <div key={session._id} className={`td-session-card ${session.statut === 'Terminée' ? 'completed' : ''}`}>
                                            <div className={`td-sc-level-pill ${session.statut === 'Terminée' ? 'completed' : ''}`} style={{ backgroundColor: session.statut === 'Terminée' ? 'rgba(148, 163, 184, 0.2)' : getNiveauColor(session.classe?.niveau) + '20', color: session.statut === 'Terminée' ? '#94a3b8' : getNiveauColor(session.classe?.niveau) }}>
                                                {session.statut === 'Terminée' ? 'TERMINÉE' : session.classe?.niveau?.toUpperCase() || 'STANDARD'}
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
                                            <p className="td-sc-subtitle">{session.classe?.nomClasse || 'Classe Non Spécifiée'}</p>
                                            
                                            <div className="td-sc-stats">
                                                <span><Users size={14} /> {session.etudiantsCount || 0} Étudiants</span>
                                                <span><BookOpen size={14} /> {session.classe?.chapitresTemplate?.length || 0} Chapitres</span>
                                            </div>
                                            
                                            <button className="td-sc-action" onClick={() => navigate(`/teacher/sessions/${session._id}`)}>
                                                Voir mes chapitres &rarr;
                                            </button>
                                        </div>
                                    ))}
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
                </div >
            </main >
        </div >
    );
}

export default TeacherDashboard;
