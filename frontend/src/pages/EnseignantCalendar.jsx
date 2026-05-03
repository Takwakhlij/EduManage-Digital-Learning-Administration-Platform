import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import {
    format, parse, startOfWeek, getDay, addDays, setHours, setMinutes,
    startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay,
    addMonths, subMonths
} from 'date-fns';
import fr from 'date-fns/locale/fr';
import { getSeancesByEnseignant } from '../features/seances/seanceSlice';
import { getAllSessions } from '../features/sessions/sessionSlice';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './GlobalCalendar.css'; // ← Reuse the same styles

/* ── date-fns localizer ── */
const locales = { fr };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

/* ── Day index → jour string ── */
const jourToIndex = {
    Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4,
    Vendredi: 5, Samedi: 6, Dimanche: 0,
};

/* ── Color palette (same as GlobalCalendar) ── */
const SESSION_COLORS = [
    { bg: 'rgba(16, 185, 129, 0.20)', border: '#10b981', text: '#6ee7b7' },
    { bg: 'rgba(99, 102, 241, 0.20)', border: '#6366f1', text: '#a5b4fc' },
    { bg: 'rgba(236, 72, 153, 0.20)', border: '#ec4899', text: '#f9a8d4' },
    { bg: 'rgba(245, 158, 11, 0.20)', border: '#f59e0b', text: '#fcd34d' },
    { bg: 'rgba(14, 165, 233, 0.20)', border: '#0ea5e9', text: '#7dd3fc' },
    { bg: 'rgba(239, 68, 68, 0.20)', border: '#ef4444', text: '#fca5a5' },
    { bg: 'rgba(20, 184, 166, 0.20)', border: '#14b8a6', text: '#5eead4' },
    { bg: 'rgba(249, 115, 22, 0.20)', border: '#f97316', text: '#fdba74' },
    { bg: 'rgba(168, 85, 247, 0.20)', border: '#a855f7', text: '#d8b4fe' },
    { bg: 'rgba(34, 197, 94, 0.20)', border: '#22c55e', text: '#86efac' },
];

/* ═══════════════════════════════════════════════════════
   MINI CALENDAR COMPONENT
   ═══════════════════════════════════════════════════════ */
function MiniCalendar({ selectedDate, onSelectDate }) {
    const [viewMonth, setViewMonth] = useState(selectedDate || new Date());

    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: endOfMonth(addDays(monthEnd, 6)) })
        .slice(0, 42);

    const dayLabels = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

    return (
        <div className="gc-mini-calendar">
            <div className="gc-mini-header">
                <button className="gc-mini-nav" onClick={() => setViewMonth(subMonths(viewMonth, 1))}>‹</button>
                <span className="gc-mini-month">{format(viewMonth, 'MMMM yyyy', { locale: fr })}</span>
                <button className="gc-mini-nav" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>›</button>
            </div>
            <div className="gc-mini-grid">
                {dayLabels.map((d) => (
                    <div key={d} className="gc-mini-day-label">{d}</div>
                ))}
                {days.map((day, i) => {
                    const isCurrentMonth = isSameMonth(day, viewMonth);
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    return (
                        <button
                            key={i}
                            className={`gc-mini-day
                                ${!isCurrentMonth ? 'other-month' : ''}
                                ${isSelected ? 'selected' : ''}
                                ${isToday ? 'today' : ''}`}
                            onClick={() => onSelectDate(day)}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   ENSEIGNANT CALENDAR — Read-Only View
   ═══════════════════════════════════════════════════════ */
function EnseignantCalendar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    /* ── Auth: get logged-in user ── */
    const { user } = useSelector((state) => state.auth);
    const currentUserId = user?._id;

    /* ── Data ── */
    const { seances, isLoading } = useSelector((state) => state.seances);
    const { sessions } = useSelector((state) => state.sessions);

    /* ── Calendar state ── */
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [view, setView] = useState('week');
    const calendarRef = useRef(null);

    /* ── Filters (only session, no teacher filter) ── */
    const [filterSession, setFilterSession] = useState('');

    /* ── Tooltip ── */
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

    /* ── Fetch data on mount ── */
    useEffect(() => {
        if (currentUserId) {
            dispatch(getSeancesByEnseignant(currentUserId));
        }
        dispatch(getAllSessions());
    }, [dispatch, currentUserId]);

    /* ── Filter: only this teacher's séances + optional session ── */
    const filteredSeances = useMemo(() => {
        return seances.filter((s) => {
            // Optional session filter
            if (filterSession && s.session?._id !== filterSession) return false;
            return true;
        });
    }, [seances, filterSession]);

    /* ── Unique sessions from teacher's own séances ── */
    const uniqueSessions = useMemo(() => {
        const map = new Map();
        filteredSeances.forEach((s) => {
            if (s.session?._id && !map.has(s.session._id)) {
                map.set(s.session._id, {
                    _id: s.session._id,
                    nomSession: s.session.nomSession,
                    nomClasse: s.session.classe?.nomClasse || '',
                });
            }
        });
        return [...map.values()];
    }, [filteredSeances]);

    /* ── Color map ── */
    const matiereColorMap = useMemo(() => {
        const map = {};
        const uniqueNames = [...new Set(seances.map((s) => s.matiere?.nomMatiere).filter(Boolean))];
        uniqueNames.forEach((name, idx) => {
            map[name] = SESSION_COLORS[idx % SESSION_COLORS.length];
        });
        return map;
    }, [seances]);

    /* ── Convert séances to calendar events ── */
    const events = useMemo(() => {
        const now = new Date();
        const mondayOfWeek = startOfWeek(now, { weekStartsOn: 1 });

        return filteredSeances.map((seance) => {
            const dayIdx = jourToIndex[seance.jour];
            const mondayDayIdx = 1;
            let offset = dayIdx - mondayDayIdx;
            if (offset < 0) offset += 7;

            const eventDate = addDays(mondayOfWeek, offset);
            const [startH, startM] = (seance.heureDebut || '08:00').split(':').map(Number);
            const [endH, endM] = (seance.heureFin || '09:00').split(':').map(Number);

            return {
                id: seance._id,
                title: seance.matiere?.nomMatiere || 'Séance',
                start: setMinutes(setHours(eventDate, startH), startM),
                end: setMinutes(setHours(eventDate, endH), endM),
                resource: seance,
            };
        });
    }, [filteredSeances]);

    /* ── Weekly Summary Stats ── */
    const weeklyStats = useMemo(() => {
        let totalHours = 0;
        events.forEach((ev) => {
            const durationMs = ev.end.getTime() - ev.start.getTime();
            totalHours += durationMs / (1000 * 60 * 60);
        });
        return {
            totalSessions: events.length,
            totalHours: totalHours % 1 === 0 ? totalHours : totalHours.toFixed(1),
        };
    }, [events]);

    /* ── Tooltip handlers ── */
    const handleMouseEnter = useCallback((e, event) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const scrollX = window.scrollX || document.documentElement.scrollLeft;
        setTooltip({ visible: true, x: rect.right + scrollX + 8, y: rect.top + scrollY, data: event });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setTooltip((prev) => ({ ...prev, visible: false }));
    }, []);

    /* ── Custom event card ── */
    const EventComponent = useCallback(
        ({ event }) => {
            const s = event.resource;
            const color = matiereColorMap[s.matiere?.nomMatiere] || SESSION_COLORS[0];
            return (
                <div
                    className="gc-event-block"
                    style={{ borderLeftColor: color.border, background: color.bg }}
                    onMouseEnter={(e) => handleMouseEnter(e, event)}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="gc-event-matiere" style={{ color: color.text }}>
                        {s.matiere?.nomMatiere || 'Matière'}
                    </div>
                    <div className="gc-event-session">
                        {s.session?.nomSession || ''}
                    </div>
                    {s.salle && s.salle !== 'Non assignée' && (
                        <div className="gc-event-room">{s.salle}</div>
                    )}
                </div>
            );
        },
        [matiereColorMap, handleMouseEnter, handleMouseLeave]
    );

    /* ── Event style getter ── */
    const eventStyleGetter = useCallback(
        (event) => {
            const s = event.resource;
            const color = matiereColorMap[s.matiere?.nomMatiere] || SESSION_COLORS[0];
            return {
                style: {
                    background: color.bg,
                    borderLeft: `4px solid ${color.border}`,
                    borderRadius: '8px',
                    color: 'inherit',
                    padding: '0',
                    fontSize: '12px',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                },
            };
        },
        [matiereColorMap]
    );

    /* ── French messages ── */
    const messages = {
        today: "Aujourd'hui",
        previous: '←',
        next: '→',
        month: 'Mois',
        week: 'Semaine',
        day: 'Jour',
        agenda: 'Agenda',
        noEventsInRange: 'Aucune séance cette semaine.',
        showMore: (total) => `+${total} de plus`,
    };

    /* ── Tooltip: get teacher name from event ── */
    const getTooltipTeacherName = () => {
        return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '—';
    };

    return (
        <div className="gc-fullscreen">

            {/* ════ LEFT SIDEBAR ════ */}
            <aside className="gc-sidebar">

                {/* Back Button */}
                <button className="gc-back-btn" onClick={() => navigate('/teacher')}>
                    ← Retour au Dashboard
                </button>

                {/* Mini Calendar */}
                <MiniCalendar
                    selectedDate={calendarDate}
                    onSelectDate={(day) => {
                        setCalendarDate(day);
                        setView('day');
                    }}
                />

                {/* Session Filter only */}
                <div className="gc-sidebar-section" style={{ flex: 'none' }}>
                    <p className="gc-sidebar-section-title">Filtres</p>

                    <div className="gc-sidebar-filter">
                        <label className="gc-filter-label">📋 Session / Classe</label>
                        <select
                            className="gc-filter-select"
                            value={filterSession}
                            onChange={(e) => setFilterSession(e.target.value)}
                        >
                            <option value="">Toutes mes sessions</option>
                            {uniqueSessions.map((s) => (
                                <option key={s._id} value={s._id}>
                                    {s.nomSession} {s.nomClasse ? `— ${s.nomClasse}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {filterSession && (
                        <button className="gc-filter-reset" onClick={() => setFilterSession('')}>
                            ✕ Réinitialiser le filtre
                        </button>
                    )}

                    <div className="gc-filter-count">
                        <span>Séances affichées :</span>
                        <span className="gc-count-badge">{filteredSeances.length}</span>
                    </div>
                </div>

                {/* ── Weekly Summary ── */}
                <div className="gc-sidebar-section" style={{ marginTop: 'auto', flex: 'none' }}>
                    <p className="gc-sidebar-section-title">Résumé de la semaine</p>
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px', padding: '14px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '8px',
                                background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '18px'
                            }}>📚</div>
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', lineHeight: '1' }}>
                                    {weeklyStats.totalSessions}
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                                    Séances planifiées
                                </div>
                            </div>
                        </div>

                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '18px'
                            }}>⏱️</div>
                            <div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', lineHeight: '1' }}>
                                    {weeklyStats.totalHours}h
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                                    Heures de cours
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </aside>

            {/* ════ MAIN CALENDAR AREA ════ */}
            <main className="gc-main">

                {/* Header */}
                <div className="gc-header">
                    <div>
                        <h1 className="gc-title">Mon Emploi du Temps</h1>
                        <p className="gc-subtitle">
                            Vos séances assignées — {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : ''}
                        </p>
                    </div>
                </div>

                {/* Calendar */}
                <div className="gc-calendar-wrapper">
                    {isLoading ? (
                        <div className="gc-loading">
                            <div className="loading-spinner"></div>
                            <p>Chargement de vos séances...</p>
                        </div>
                    ) : (
                        /* ── Regular Calendar (NO Drag & Drop) ── */
                        <Calendar
                            ref={calendarRef}
                            localizer={localizer}
                            events={events}
                            date={calendarDate}
                            onNavigate={(date) => setCalendarDate(date)}
                            view={view}
                            onView={(v) => setView(v)}
                            defaultView="week"
                            views={['week', 'day']}
                            step={30}
                            timeslots={2}
                            min={new Date(0, 0, 0, 7, 0)}
                            max={new Date(0, 0, 0, 21, 0)}
                            culture="fr"
                            messages={messages}
                            components={{ event: EventComponent }}
                            eventPropGetter={eventStyleGetter}
                            toolbar={true}
                            selectable={false}
                            style={{ height: '100%' }}
                        />
                    )}
                </div>

                {/* ── Tooltip ── */}
                {tooltip.visible && tooltip.data && (() => {
                    const s = tooltip.data.resource;
                    const color = matiereColorMap[s.matiere?.nomMatiere] || SESSION_COLORS[0];
                    return (
                        <div
                            className="gc-tooltip"
                            style={{ top: tooltip.y, left: tooltip.x }}
                        >
                            <div className="gc-tooltip-header" style={{ background: color.bg, borderBottom: `1px solid ${color.border}` }}>
                                <span className="gc-tooltip-matiere" style={{ color: color.text }}>
                                    {s.matiere?.nomMatiere || 'Matière'}
                                </span>
                            </div>
                            <div className="gc-tooltip-body">
                                <div className="gc-tooltip-row">
                                    <span className="gc-tooltip-icon">🕐</span>
                                    <span>{s.heureDebut} – {s.heureFin}</span>
                                </div>
                                <div className="gc-tooltip-row">
                                    <span className="gc-tooltip-icon">📚</span>
                                    <span>{s.session?.nomSession || '—'}</span>
                                </div>
                                <div className="gc-tooltip-row">
                                    <span className="gc-tooltip-icon">👤</span>
                                    <span>{getTooltipTeacherName()}</span>
                                </div>
                                {s.salle && s.salle !== 'Non assignée' && (
                                    <div className="gc-tooltip-row">
                                        <span className="gc-tooltip-icon">📍</span>
                                        <span>{s.salle}</span>
                                    </div>
                                )}
                                {s.type && (
                                    <div className="gc-tooltip-row">
                                        <span className="gc-tooltip-icon">🎓</span>
                                        <span>{s.type}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </main>
        </div>
    );
}

export default EnseignantCalendar;
