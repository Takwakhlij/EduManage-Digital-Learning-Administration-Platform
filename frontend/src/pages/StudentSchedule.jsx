import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
    BookOpen, GraduationCap, FileText, Award, User, Settings, 
    LogOut, Menu, X, Bell, Calendar as CalendarIcon, ChevronRight, 
    ArrowLeft, MapPin, Loader2, Clock, CreditCard, TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, setHours, setMinutes, isAfter, startOfDay } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './StudentSchedule.css';

// --- Date-fns Localizer setup ---
const locales = { fr };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

const SESSION_COLORS = [
    { border: '#3b82f6', text: '#60a5fa' }, // Blue
    { border: '#10b981', text: '#34d399' }, // Emerald
    { border: '#8b5cf6', text: '#a78bfa' }, // Violet
    { border: '#f59e0b', text: '#fbbf24' }, // Amber
    { border: '#ef4444', text: '#f87171' }, // Red/Rose
    { border: '#06b6d4', text: '#22d3ee' }, // Cyan
    { border: '#ec4899', text: '#f472b6' }, // Pink
];

const jourToIndex = {
    'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4, 'Vendredi': 5, 'Samedi': 6, 'Dimanche': 0
};

const StudentSchedule = () => {
    const { user: authUser } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const { t } = useLanguage();

    const [inscriptions, setInscriptions] = useState([]);
    const [seances, setSeances] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isGlobalView, setIsGlobalView] = useState(false);
    const [loading, setLoading] = useState(true);
    const [seancesLoading, setSeancesLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // 1. Fetch Student Inscriptions (Sessions)
    useEffect(() => {
        const fetchInscriptions = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${authUser.token}` } };
                const res = await axios.get('/api/inscriptions/my', config);
                if (res.data.success) {
                    const approved = res.data.inscriptions.filter(ins => ins.statut === 'approuvee');
                    setInscriptions(approved);
                    if (approved.length > 0) {
                        setSelectedSession(approved[0].session);
                    }
                }
            } catch (error) {
                console.error('Error fetching inscriptions:', error);
            } finally {
                setLoading(false);
            }
        };

        if (authUser?.token) fetchInscriptions();
    }, [authUser]);

    // 2. Fetch Seances: single session OR all sessions (global view)
    useEffect(() => {
        const fetchSeances = async () => {
            try {
                setSeancesLoading(true);
                const config = { headers: { Authorization: `Bearer ${authUser.token}` } };

                if (isGlobalView) {
                    // Fetch séances for ALL approved sessions and tag with session/class info
                    const allResults = await Promise.all(
                        inscriptions.map(async (ins) => {
                            const r = await axios.get(`/api/seances/session/${ins.session?._id}`, config);
                            // Tag each séance with session and class info from inscription
                            return r.data.map(seance => ({
                                ...seance,
                                _sessionName: seance.session?.nomSession || ins.session?.nomSession || 'Session',
                                _classeName: seance.classe?.nomClasse || ins.classe?.nomClasse || 'Classe',
                            }));
                        })
                    );
                    setSeances(allResults.flat());
                } else if (selectedSession?._id) {
                    const res = await axios.get(`/api/seances/session/${selectedSession._id}`, config);
                    setSeances(res.data);
                }
            } catch (error) {
                console.error('Error fetching seances:', error);
            } finally {
                setSeancesLoading(false);
            }
        };

        if (authUser?.token && (selectedSession || isGlobalView)) fetchSeances();
    }, [selectedSession, isGlobalView, authUser, inscriptions]);

    // 3. Map Seances to Calendar Events (bounded recurring)
    const events = useMemo(() => {
        const now = new Date();
        const results = [];

        seances.forEach(s => {
            const dayIdx = jourToIndex[s.jour];
            const [startH, startM] = (s.heureDebut || '08:00').split(':').map(Number);
            const [endH, endM]   = (s.heureFin   || '09:00').split(':').map(Number);

            const sessionDateDebut = s.session?.dateDebut;
            const sessionDateFin   = s.session?.dateFin;

            if (sessionDateDebut && sessionDateFin) {
                // ── BOUNDED: generate all weekly occurrences within the session range ──
                const rangeStart = startOfDay(new Date(sessionDateDebut));
                const rangeEnd   = startOfDay(new Date(sessionDateFin));

                let cursor = new Date(rangeStart);
                while (cursor.getDay() !== dayIdx) cursor = addDays(cursor, 1);

                let idx = 0;
                while (!isAfter(cursor, rangeEnd)) {
                    results.push({
                        id: `${s._id}_${idx}`,
                        title: s.matiere?.nomMatiere,
                        start: setMinutes(setHours(new Date(cursor), startH), startM),
                        end:   setMinutes(setHours(new Date(cursor), endH),   endM),
                        resource: s
                    });
                    cursor = addDays(cursor, 7);
                    idx++;
                }
            } else {
                // ── FREE MODE: project on current week ──
                const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
                const dayOffset = dayIdx === 0 ? 6 : dayIdx - 1;
                const eventDate = addDays(startOfCurrentWeek, dayOffset);
                results.push({
                    id: s._id,
                    title: s.matiere?.nomMatiere,
                    start: setMinutes(setHours(eventDate, startH), startM),
                    end:   setMinutes(setHours(eventDate, endH),   endM),
                    resource: s
                });
            }
        });

        return results;
    }, [seances]);

    // 4. Color map for subjects
    const matiereColorMap = useMemo(() => {
        const map = {};
        const uniqueMatieres = [...new Set(seances.map(s => s.matiere?.nomMatiere).filter(Boolean))];
        uniqueMatieres.forEach((name, idx) => {
            map[name] = SESSION_COLORS[idx % SESSION_COLORS.length];
        });
        return map;
    }, [seances]);

    // 5. Calendar Props & Stylers
    const eventPropGetter = useCallback((event) => {
        const s = event.resource;
        const color = matiereColorMap[s.matiere?.nomMatiere] || SESSION_COLORS[0];
        
        return {
            style: {
                background: 'rgba(0, 0, 0, 0.4)',
                borderLeft: `4px solid ${color.border}`,
                border: 'none',
                borderRadius: '4px',
                padding: '0'
            }
        };
    }, [matiereColorMap]);

    if (loading) {
        return (
            <div className="schedule-loading">
                <Loader2 className="animate-spin" size={48} />
                <p>Chargement de votre planning...</p>
            </div>
        );
    }

    const CustomEvent = ({ event }) => {
        const s = event.resource;
        const color = matiereColorMap[s.matiere?.nomMatiere] || SESSION_COLORS[0];
        const firstName = s.enseignant?.firstName || s.enseignant?.nom || '';
        const lastName = s.enseignant?.lastName || s.enseignant?.prenom || '';
        const teacherName = `${firstName} ${lastName}`.trim();

        return (
            <div className="lum-event-content">
                <div className="event-matiere" style={{ color: color.text }}>
                    {event.title}
                </div>
                {isGlobalView && (
                    <div className="event-session-info">
                        {s._sessionName} — {s._classeName}
                    </div>
                )}
                <div className="event-teacher-name">
                    {teacherName || "Enseignant..."}
                </div>
                <div className="event-info">
                    {s.salle}
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-layout lum-schedule-layout">
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
                    <X size={20} />
                </button>
                <div className="sidebar-profile">
                    <div className="profile-img-container">
                        {authUser?.profileImage ? (
                            <img src={authUser.profileImage.startsWith('http') ? authUser.profileImage : `http://localhost:5000${authUser.profileImage}`} alt="Profile" className="profile-img" />
                        ) : (
                            <div className="profile-img-placeholder">{authUser?.firstName?.charAt(0)}</div>
                        )}
                    </div>
                    <div className="profile-info">
                        <h3>{authUser?.firstName} {authUser?.lastName}</h3>
                        <p className="profile-role">Compte Étudiant</p>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/" className="nav-item back-home-nav">
                        <span className="nav-icon"><ArrowLeft size={20} /></span>
                        <span className="nav-label">Retour à l'accueil</span>
                    </Link>
                    <div className="nav-divider"></div>
                    <Link to="/dashboard" className="nav-item">
                        <span className="nav-icon"><User size={20} /></span>
                        <span className="nav-label">Mon Tableau de Bord</span>
                    </Link>
                    <Link to="/formations" className="nav-item">
                        <span className="nav-icon"><BookOpen size={20} /></span>
                        <span className="nav-label">Formations</span>
                    </Link>
                    <Link to="/inscriptions" className="nav-item">
                        <span className="nav-icon"><GraduationCap size={20} /></span>
                        <span className="nav-label">Mes Inscriptions</span>
                    </Link>
                    <Link to="/presence" className="nav-item">
                        <span className="nav-icon"><TrendingUp size={20} /></span>
                        <span className="nav-label">Mes Absences</span>
                    </Link>
                    <Link to="/paiements" className="nav-item">
                        <span className="nav-icon"><CreditCard size={20} /></span>
                        <span className="nav-label">Mes Paiements</span>
                    </Link>
                    <Link to="/planning" className="nav-item active">
                        <span className="nav-icon"><CalendarIcon size={20} /></span>
                        <span className="nav-label">Emploi du Temps</span>
                    </Link>
                </nav>
            </aside>

            <main className="main-content">
                <header className="content-header">
                    <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>
                    <div className="header-actions" style={{ display: 'none' }}></div>
                </header>

                <div className="content-inner">
                    <div className="schedule-header">
                        <div className="lum-banner-label">
                            <span className="lum-line"></span> PLANNING HEBDOMADAIRE
                        </div>
                        <h2 className="lum-title-serif">Mon Emploi du Temps</h2>
                    </div>

                    {inscriptions.length > 0 ? (
                        <div className="session-tabs">
                            <button
                                className={`session-tab ${isGlobalView ? 'active' : ''}`}
                                onClick={() => { setIsGlobalView(true); setSelectedSession(null); }}
                            >
                                📋 Vue Globale
                            </button>
                            {inscriptions.map(ins => (
                                <button
                                    key={ins._id}
                                    className={`session-tab ${!isGlobalView && selectedSession?._id === ins.session?._id ? 'active' : ''}`}
                                    onClick={() => { setIsGlobalView(false); setSelectedSession(ins.session); }}
                                >
                                    {ins.session?.nomSession}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="no-sessions-message">
                            <p>Vous n'êtes inscrit à aucune session approuvée.</p>
                            <Link to="/formations" className="lum-btn-gold">Parcourir les formations</Link>
                        </div>
                    )}

                    <div className="calendar-grid-container">
                        {seancesLoading ? (
                            <div className="seances-fetching"><Loader2 className="animate-spin" /></div>
                        ) : (selectedSession || isGlobalView) && seances.length > 0 ? (
                            <div className="lum-calendar-wrapper">
                                <Calendar
                                    localizer={localizer}
                                    events={events}
                                    defaultView="week"
                                    views={['week', 'day']}
                                    step={60}
                                    timeslots={1}
                                    min={setMinutes(setHours(new Date(), 7), 0)}
                                    max={setMinutes(setHours(new Date(), 19), 0)}
                                    toolbar={false}
                                    eventPropGetter={eventPropGetter}
                                    components={{
                                        event: CustomEvent
                                    }}
                                    messages={{
                                        allDay: 'Toute la journée',
                                        previous: 'Précédent',
                                        next: 'Suivant',
                                        today: 'Aujourd\'hui',
                                        month: 'Mois',
                                        week: 'Semaine',
                                        day: 'Jour',
                                    }}
                                />
                            </div>
                        ) : (selectedSession || isGlobalView) ? (
                            <div className="empty-schedule">
                                <div className="empty-icon-box"><CalendarIcon size={32} /></div>
                                <h3>Aucune séance planifiée</h3>
                                <p>{isGlobalView ? "Aucune séance trouvée dans vos sessions." : `Il n'y a pas encore de planning pour la session "${selectedSession?.nomSession}".`}</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentSchedule;
