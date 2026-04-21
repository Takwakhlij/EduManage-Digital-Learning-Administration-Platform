import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import _withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import {
    format, parse, startOfWeek, getDay, addDays, setHours, setMinutes,
    startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay,
    addMonths, subMonths
} from 'date-fns';
import fr from 'date-fns/locale/fr';
import { getAllSeances, createSeance, deleteSeance, updateSeance } from '../features/seances/seanceSlice';
import { getAllSessions } from '../features/sessions/sessionSlice';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './GlobalCalendar.css';

/* ── DnD-enabled Calendar ── */
const withDragAndDrop = _withDragAndDrop.default || _withDragAndDrop;
const DnDCalendar = withDragAndDrop(Calendar);

/* ── date-fns localizer ── */
const locales = { fr };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

/* ── Maps ── */
const jourToIndex = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 0 };
const indexToJour = { 0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi' };
const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/* ── Color palette (dark-mode pastels) ── */
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
    const days = eachDayOfInterval({ start: weekStart, end: endOfMonth(addDays(monthEnd, 6)) }).slice(0, 42);
    const dayLabels = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

    return (
        <div className="gc-mini-calendar">
            <div className="gc-mini-header">
                <button className="gc-mini-nav" onClick={() => setViewMonth(subMonths(viewMonth, 1))}>‹</button>
                <span className="gc-mini-month">{format(viewMonth, 'MMMM yyyy', { locale: fr })}</span>
                <button className="gc-mini-nav" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>›</button>
            </div>
            <div className="gc-mini-grid">
                {dayLabels.map((d) => <div key={d} className="gc-mini-day-label">{d}</div>)}
                {days.map((day, i) => {
                    const isCurrentMonth = isSameMonth(day, viewMonth);
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    return (
                        <button
                            key={i}
                            className={`gc-mini-day${!isCurrentMonth ? ' other-month' : ''}${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}`}
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
   SLOT CREATION MODAL
   ═══════════════════════════════════════════════════════ */
function SlotCreationModal({ isOpen, onClose, slotData, sessions, filterSessionId, filterClasseId, availableMatieres, availableEnseignants, onSubmit, isLoading, seanceToEdit }) {
    const [matiereId, setMatiereId] = useState('');
    const [enseignantId, setEnseignantId] = useState('');
    const [sessionId, setSessionId] = useState(filterSessionId || '');
    const [classeId, setClasseId] = useState(filterClasseId || '');
    const [salle, setSalle] = useState('');
    const [type, setType] = useState('Présentiel');

    useEffect(() => {
        if (isOpen) {
            if (seanceToEdit) {
                const extractId = (val) => val && typeof val === 'object' ? val._id?.toString() : (val ? val.toString() : '');
                
                setSessionId(extractId(seanceToEdit.session) || filterSessionId || '');
                setClasseId(extractId(seanceToEdit.classe) || filterClasseId || '');
                setMatiereId(extractId(seanceToEdit.matiere));
                setEnseignantId(extractId(seanceToEdit.enseignant));
                setSalle(seanceToEdit.salle || '');
                setType(seanceToEdit.type || 'Présentiel');
            } else {
                setSessionId(filterSessionId || '');
                setClasseId(filterClasseId || '');
                setMatiereId('');
                setEnseignantId('');
                setSalle('');
                setType('Présentiel');
            }
        }
    }, [isOpen, filterSessionId, filterClasseId, seanceToEdit]);

    /* ── Classes for the selected session in modal ── */
    const modalClasses = useMemo(() => {
        let classes = [];
        if (sessionId && sessions) {
            const sessionObj = sessions.find((s) => String(s._id) === String(sessionId));
            if (sessionObj) {
                const raw = Array.isArray(sessionObj.classe) ? sessionObj.classe : sessionObj.classe ? [sessionObj.classe] : [];
                classes = raw.filter((c) => c && typeof c === 'object' && c._id).map((c) => ({ ...c, _id: String(c._id) }));
            }
        }
        
        // S'assurer que la classe sélectionnée existe toujours dans la liste
        if (seanceToEdit && seanceToEdit.classe && typeof seanceToEdit.classe === 'object' && seanceToEdit.classe._id) {
            const cId = String(seanceToEdit.classe._id);
            if (!classes.find(c => c._id === cId)) {
                classes.push({ ...seanceToEdit.classe, _id: cId });
            }
        }
        return classes;
    }, [sessionId, sessions, seanceToEdit]);

    /* ── Enseignants for the selected session in modal ── */
    const modalEnseignants = useMemo(() => {
        let enseignants = [];
        if (sessionId && sessions) {
            const sessionObj = sessions.find((s) => String(s._id) === String(sessionId));
            if (sessionObj && sessionObj.enseignants) {
                enseignants = sessionObj.enseignants.filter((e) => e && typeof e === 'object' && e._id).map((e) => ({ ...e, _id: String(e._id) }));
            }
        }

        if (seanceToEdit && seanceToEdit.enseignant && typeof seanceToEdit.enseignant === 'object' && seanceToEdit.enseignant._id) {
            const eId = String(seanceToEdit.enseignant._id);
            if (!enseignants.find(e => e._id === eId)) {
                enseignants.push({ ...seanceToEdit.enseignant, _id: eId });
            }
        }
        return enseignants;
    }, [sessionId, sessions, seanceToEdit]);

    /* ── Matieres for the selected classe in modal ── */
    const modalMatieres = useMemo(() => {
        let matieres = [];
        const targetClasse = modalClasses.find((c) => String(c._id) === String(classeId)) || modalClasses[0];
        if (targetClasse) {
            const fromProgramme = (targetClasse.programme || [])
                .map((p) => p.matiere)
                .filter((m) => m && typeof m === 'object' && m._id);
            const fromMatieres = (targetClasse.matieres || [])
                .filter((m) => m && typeof m === 'object' && m._id);
            const map = new Map();
            [...fromProgramme, ...fromMatieres].forEach((m) => {
                const mId = String(m._id);
                if (!map.has(mId)) map.set(mId, { ...m, _id: mId });
            });
            matieres = [...map.values()];
        }

        if (seanceToEdit && seanceToEdit.matiere && typeof seanceToEdit.matiere === 'object' && seanceToEdit.matiere._id) {
            const mId = String(seanceToEdit.matiere._id);
            if (!matieres.find(m => m._id === mId)) {
                matieres.push({ ...seanceToEdit.matiere, _id: mId });
            }
        }
        return matieres;
    }, [classeId, modalClasses, seanceToEdit]);

    if (!isOpen || (!slotData && !seanceToEdit)) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // Seules Session et Classe restent obligatoires ici
        if (!sessionId || !classeId) {
            alert('Veuillez sélectionner au moins une Session et une Classe.');
            return;
        }
        onSubmit({
            session: sessionId,
            classe: classeId,
            matiere: matiereId || undefined, // Optionnel: peut être renseigné ultérieurement
            enseignant: enseignantId || undefined, // Optionnel: peut être renseigné ultérieurement
            jour: slotData?.jour || seanceToEdit?.jour,
            heureDebut: slotData?.heureDebut || seanceToEdit?.heureDebut,
            heureFin: slotData?.heureFin || seanceToEdit?.heureFin,
            salle: salle || undefined,
            type,
        });
    };

    return (
        <div className="gc-slot-modal-overlay" onClick={onClose}>
            <div className="gc-slot-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="gc-slot-modal-header">
                    <div className="gc-slot-modal-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="gc-slot-modal-title">{seanceToEdit ? 'Modifier Séance' : 'Nouvelle Séance'}</h3>
                        <p className="gc-slot-modal-subtitle">{seanceToEdit ? 'Modifier les détails de la séance' : 'Confirmer les détails de la séance'}</p>
                    </div>
                    <button className="gc-slot-modal-close" onClick={onClose}>✕</button>
                </div>

                {/* Time Preview Banner */}
                <div className="gc-slot-time-banner">
                    <div className="gc-slot-time-item">
                        <span className="gc-slot-time-label">Jour</span>
                        <span className="gc-slot-time-value">{slotData?.jour || seanceToEdit?.jour}</span>
                    </div>
                    <div className="gc-slot-time-divider">→</div>
                    <div className="gc-slot-time-item">
                        <span className="gc-slot-time-label">Début</span>
                        <span className="gc-slot-time-value">{slotData?.heureDebut || seanceToEdit?.heureDebut}</span>
                    </div>
                    <div className="gc-slot-time-divider">—</div>
                    <div className="gc-slot-time-item">
                        <span className="gc-slot-time-label">Fin</span>
                        <span className="gc-slot-time-value">{slotData?.heureFin || seanceToEdit?.heureFin}</span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="gc-slot-modal-form">
                    {/* Session (si non pré-filtrée) */}
                    {!filterSessionId && (
                        <div className="gc-slot-field">
                            <label className="gc-slot-field-label">Session *</label>
                            <select className="gc-slot-select" value={sessionId} onChange={(e) => setSessionId(e.target.value)} required>
                                <option value="">— Sélectionnez une session —</option>
                                {sessions && sessions.map((s) => (
                                    <option key={s._id} value={s._id}>{s.nomSession} {s.classe?.nomClasse ? `(${s.classe.nomClasse})` : ''}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Classe */}
                    <div className="gc-slot-field">
                        <label className="gc-slot-field-label">Classe *</label>
                        <select className="gc-slot-select" value={classeId} onChange={(e) => setClasseId(e.target.value)} required>
                            <option value="">— Sélectionnez une classe —</option>
                            {modalClasses.map((c) => (
                                <option key={c._id} value={c._id}>{c.nomClasse} ({c.niveau})</option>
                            ))}
                        </select>
                    </div>

                    {/* Matière */}
                    <div className="gc-slot-field">
                        <label className="gc-slot-field-label">
                            Matière
                            <span style={{ fontSize: '9px', opacity: 0.6, marginLeft: '8px', textTransform: 'none' }}>(Optionnel)</span>
                        </label>
                        <select className="gc-slot-select" value={matiereId} onChange={(e) => setMatiereId(e.target.value)}>
                            <option value="">— Sélectionnez une matière —</option>
                            {modalMatieres.map((m) => (
                                <option key={m._id} value={m._id}>{m.nomMatiere}</option>
                            ))}
                        </select>
                        {/* Note: L'association de la matière peut être faite ultérieurement via modification */}
                    </div>

                    {/* Enseignant */}
                    <div className="gc-slot-field">
                        <label className="gc-slot-field-label">
                            Enseignant
                            <span style={{ fontSize: '9px', opacity: 0.6, marginLeft: '8px', textTransform: 'none' }}>(Optionnel)</span>
                        </label>
                        <select className="gc-slot-select" value={enseignantId} onChange={(e) => setEnseignantId(e.target.value)}>
                            <option value="">— Sélectionnez un enseignant —</option>
                            {modalEnseignants.map((t) => (
                                <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
                            ))}
                        </select>
                        {/* Note: L'enseignant peut être assigné ultérieurement via modification */}
                    </div>

                    {/* Salle + Type */}
                    <div className="gc-slot-row">
                        <div className="gc-slot-field">
                            <label className="gc-slot-field-label">Salle</label>
                            <input className="gc-slot-input" type="text" value={salle} onChange={(e) => setSalle(e.target.value)} placeholder="Ex: Salle 1" />
                        </div>
                        <div className="gc-slot-field">
                            <label className="gc-slot-field-label">Type</label>
                            <select className="gc-slot-select" value={type} onChange={(e) => setType(e.target.value)}>
                                <option value="Présentiel">Présentiel</option>
                                <option value="En ligne">En ligne</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="gc-slot-modal-actions">
                        <button type="button" className="gc-slot-btn-cancel" onClick={onClose}>Annuler</button>
                        <button type="submit" className="gc-slot-btn-submit" disabled={isLoading}>
                            {isLoading ? (
                                <span className="gc-slot-btn-loader">⏳ Création...</span>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    {seanceToEdit ? 'Enregistrer les modifications' : 'Confirmer la séance'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   GLOBAL CALENDAR COMPONENT
   ═══════════════════════════════════════════════════════ */
function GlobalCalendar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { seances, isLoading } = useSelector((state) => state.seances);
    const { sessions } = useSelector((state) => state.sessions);

    /* ── Calendar navigation ── */
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [view, setView] = useState('week');
    const calendarRef = useRef(null);

    /* ── CASCADE FILTER STATE ── */
    const [filterSessionId, setFilterSessionId] = useState('');       // Step 1: Session
    const [filterMode, setFilterMode] = useState('classe');            // Step 2: 'classe' | 'professeur'
    const [filterClasseId, setFilterClasseId] = useState('');         // Step 3a: Classe
    const [filterEnseignantId, setFilterEnseignantId] = useState(''); // Step 3b: Enseignant

    /* ── Modal state ── */
    const [slotModalOpen, setSlotModalOpen] = useState(false);
    const [slotData, setSlotData] = useState(null);
    const [seanceToEdit, setSeanceToEdit] = useState(null);

    /* ── Tooltip state ── */
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
    const tooltipRef = useRef(null);

    useEffect(() => {
        dispatch(getAllSeances());
        dispatch(getAllSessions());
    }, [dispatch]);

    /* ── Reset steps on session change ── */
    useEffect(() => {
        setFilterClasseId('');
        setFilterEnseignantId('');
    }, [filterSessionId, filterMode]);

    /* ── Selected session object ── */
    const selectedSessionObj = useMemo(() => {
        if (!filterSessionId || !sessions) return null;
        return sessions.find((s) => s._id === filterSessionId);
    }, [filterSessionId, sessions]);

    /* ── Classes from selected session ── */
    const classesOfSession = useMemo(() => {
        if (!selectedSessionObj) return [];
        // A session is linked to one or many classes
        const classesRaw = Array.isArray(selectedSessionObj.classe)
            ? selectedSessionObj.classe
            : selectedSessionObj.classe ? [selectedSessionObj.classe] : [];

        const map = new Map();
        classesRaw.forEach((c) => {
            if (c && typeof c === 'object' && c._id) {
                map.set(c._id, c);
            }
        });
        return [...map.values()];
    }, [selectedSessionObj]);

    /* ── Enseignants from selected session ── */
    const enseignantsOfSession = useMemo(() => {
        if (!selectedSessionObj?.enseignants) return [];
        return selectedSessionObj.enseignants.filter((e) => e && typeof e === 'object' && e._id);
    }, [selectedSessionObj]);

    /* ── Matières available (for modal & sidebar display) ── */
    const availableMatieres = useMemo(() => {
        // Use the filterClasseId if in classe mode, else use the session's classe
        const targetClasse = filterMode === 'classe' && filterClasseId
            ? classesOfSession.find((c) => c._id === filterClasseId)
            : classesOfSession[0]; // fallback to first

        if (!targetClasse) return [];

        const fromProgramme = (targetClasse.programme || [])
            .map((p) => p.matiere)
            .filter((m) => m && typeof m === 'object' && m._id);
        const fromMatieres = (targetClasse.matieres || [])
            .filter((m) => m && typeof m === 'object' && m._id);
        const map = new Map();
        [...fromProgramme, ...fromMatieres].forEach((m) => {
            if (!map.has(m._id)) map.set(m._id, m);
        });
        return [...map.values()];
    }, [filterMode, filterClasseId, classesOfSession]);

    /* ── Count seances per matière (for badges) ── */
    const matiereSeanceCount = useMemo(() => {
        const counts = {};
        const relevantSeances = filterSessionId
            ? seances.filter((s) => s.session?._id === filterSessionId)
            : seances;
        relevantSeances.forEach((s) => {
            const mid = s.matiere?._id;
            if (mid) counts[mid] = (counts[mid] || 0) + 1;
        });
        return counts;
    }, [seances, filterSessionId]);

    /* ── Build color map: matière name → color ── */
    const matiereColorMap = useMemo(() => {
        const map = {};
        const uniqueNames = [...new Set(seances.map((s) => s.matiere?.nomMatiere).filter(Boolean))];
        uniqueNames.forEach((name, idx) => {
            map[name] = SESSION_COLORS[idx % SESSION_COLORS.length];
        });
        return map;
    }, [seances]);

    /* ── Extract unique sessions for the first select (from all seances) ── */
    const uniqueSessionsFromSeances = useMemo(() => {
        const map = new Map();
        seances.forEach((s) => {
            if (s.session?._id && !map.has(s.session._id)) {
                map.set(s.session._id, { _id: s.session._id, nomSession: s.session.nomSession, nomClasse: s.classe?.nomClasse || '' });
            }
        });
        return [...map.values()];
    }, [seances]);

    /* ── Filter seances for calendar display ── */
    const filteredSeances = useMemo(() => {
        return seances.filter((s) => {
            if (filterSessionId && s.session?._id !== filterSessionId) return false;
            if (filterMode === 'classe' && filterClasseId) {
                const sessionClasseId = s.classe?._id || s.classe;
                if (sessionClasseId !== filterClasseId) return false;
            }
            if (filterMode === 'professeur' && filterEnseignantId) {
                if (s.enseignant?._id !== filterEnseignantId) return false;
            }
            return true;
        });
    }, [seances, filterSessionId, filterMode, filterClasseId, filterEnseignantId]);

    /* ── Convert seances to calendar events ── */
    const events = useMemo(() => {
        const now = new Date();
        const mondayOfWeek = startOfWeek(now, { weekStartsOn: 1 });
        return filteredSeances.map((seance) => {
            const dayIdx = jourToIndex[seance.jour];
            let offset = dayIdx - 1;
            if (offset < 0) offset += 7;
            const eventDate = addDays(mondayOfWeek, offset);
            const [startH, startM] = (seance.heureDebut || '08:00').split(':').map(Number);
            const [endH, endM] = (seance.heureFin || '09:00').split(':').map(Number);
            const start = setMinutes(setHours(eventDate, startH), startM);
            const end = setMinutes(setHours(eventDate, endH), endM);
            return { id: seance._id, title: seance.matiere?.nomMatiere || 'Séance', start, end, resource: seance };
        });
    }, [filteredSeances]);

    /* ── onSelectSlot: Ouvre le modal avec données pré-remplies ── */
    const handleSelectSlot = useCallback(({ start, end }) => {
        const jour = indexToJour[start.getDay()];
        const heureDebut = format(start, 'HH:mm');
        const heureFin = format(end, 'HH:mm');
        setSlotData({ start, end, jour, heureDebut, heureFin });
        setSlotModalOpen(true);
    }, []);

    /* ── Modal submit ── */
    const handleSlotSubmit = useCallback((seanceData) => {
        if (seanceToEdit) {
            dispatch(updateSeance({
                id: seanceToEdit._id,
                seanceData
            }))
                .unwrap()
                .then(() => {
                    dispatch(getAllSeances());
                    setSlotModalOpen(false);
                    setSlotData(null);
                    setSeanceToEdit(null);
                })
                .catch((err) => {
                    alert(`Erreur : ${err}`);
                });
        } else {
            dispatch(createSeance(seanceData))
                .unwrap()
                .then(() => {
                    dispatch(getAllSeances());
                    setSlotModalOpen(false);
                    setSlotData(null);
                })
                .catch((err) => {
                    alert(`Erreur : ${err}`);
                });
        }
    }, [dispatch, seanceToEdit]);

    /* ── Edit seance (from tooltip button) ── */
    const handleEditSeance = useCallback((event) => {
        setSeanceToEdit(event.resource);
        setSlotModalOpen(true);
        setTooltip((prev) => ({ ...prev, visible: false }));
    }, []);

    /* ── Delete seance (from tooltip button) ── */
    const handleDeleteSeance = useCallback((event) => {
        const seanceId = event.id;
        const s = event.resource;
        if (window.confirm(`Supprimer la séance "${s.matiere?.nomMatiere || 'Séance'}" du ${s.jour} (${s.heureDebut} - ${s.heureFin}) ?`)) {
            dispatch(deleteSeance(seanceId)).then(() => dispatch(getAllSeances()));
            setTooltip((prev) => ({ ...prev, visible: false }));
        }
    }, [dispatch]);

    /* ── Drag & Drop: onEventDrop ── */
    const handleEventDrop = useCallback(({ event, start, end }) => {
        dispatch(updateSeance({
            id: event.id,
            seanceData: { jour: indexToJour[start.getDay()], heureDebut: format(start, 'HH:mm'), heureFin: format(end, 'HH:mm') },
        }))
            .unwrap()
            .then(() => dispatch(getAllSeances()))
            .catch((err) => {
                alert(`Conflit détecté : ${err}`);
                dispatch(getAllSeances()); // Recharger pour remettre l'événement à sa place
            });
    }, [dispatch]);

    /* ── Drag & Drop: onEventResize ── */
    const handleEventResize = useCallback(({ event, start, end }) => {
        dispatch(updateSeance({
            id: event.id,
            seanceData: { heureDebut: format(start, 'HH:mm'), heureFin: format(end, 'HH:mm') },
        }))
            .unwrap()
            .then(() => dispatch(getAllSeances()))
            .catch((err) => {
                alert(`Conflit détecté : ${err}`);
                dispatch(getAllSeances()); // Recharger pour remettre l'événement à sa taille initiale
            });
    }, [dispatch]);

    /* ── Tooltip handlers ── */
    const handleMouseEnter = useCallback((e, event) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({ visible: true, x: rect.right + 8, y: rect.top, data: event });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setTooltip((prev) => ({ ...prev, visible: false }));
    }, []);

    /* ── Custom event component ── */
    const EventComponent = useCallback(({ event }) => {
        const s = event.resource;
        const color = matiereColorMap[s.matiere?.nomMatiere] || SESSION_COLORS[0];
        return (
            <div
                className="gc-event-block"
                style={{ borderLeftColor: color.border, background: color.bg }}
                onMouseEnter={(e) => handleMouseEnter(e, event)}
                onMouseLeave={handleMouseLeave}
            >
                <div className="gc-event-content">
                    <div className="gc-event-info">
                        <div className="gc-event-matiere" style={{ color: color.text }}>{s.matiere?.nomMatiere || 'Matière'}</div>
                        <div className="gc-event-classe">{s.classe?.nomClasse || 'Classe'}</div>
                    </div>
                    {s.salle && s.salle !== 'Non assignée' && (
                        <div className="gc-event-room-badge">{s.salle}</div>
                    )}
                </div>
                <div className="gc-event-teacher">{s.enseignant ? `${s.enseignant.firstName} ${s.enseignant.lastName}` : ''}</div>
            </div>
        );
    }, [matiereColorMap, handleMouseEnter, handleMouseLeave]);

    /* ── Custom event styling ── */
    const eventStyleGetter = useCallback((event) => {
        const s = event.resource;
        const color = matiereColorMap[s.matiere?.nomMatiere] || SESSION_COLORS[0];
        return {
            style: {
                background: color.bg, borderLeft: `4px solid ${color.border}`, borderRadius: '8px',
                color: 'inherit', padding: '0', fontSize: '12px', border: 'none', boxShadow: `0 2px 8px rgba(0,0,0,0.15)`,
            },
        };
    }, [matiereColorMap]);

    /* ── French messages ── */
    const messages = {
        today: "Aujourd'hui", previous: '←', next: '→',
        month: 'Mois', week: 'Semaine', day: 'Jour', agenda: 'Agenda',
        noEventsInRange: 'Aucune séance dans cette période.',
        selectRangeHeader: 'Sélectionnez une plage horaire',
    };

    /* ── Sidebar: Matières display with badges ── */
    const sidebarMatieres = useMemo(() => {
        if (filterMode === 'classe' && !filterClasseId) return [];
        if (filterMode === 'professeur' && !filterEnseignantId) return [];
        return availableMatieres;
    }, [filterMode, filterClasseId, filterEnseignantId, availableMatieres]);

    const resetFilters = () => {
        setFilterSessionId('');
        setFilterMode('classe');
        setFilterClasseId('');
        setFilterEnseignantId('');
    };

    /* ─────────────────────────────────────────────────── */
    return (
        <div className="gc-fullscreen">
            {/* ═══ LEFT SIDEBAR ═══ */}
            <aside className="gc-sidebar">
                {/* Back to Dashboard */}
                <button className="gc-back-btn" onClick={() => navigate('/admin')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                    Retour au Dashboard
                </button>

                {/* Mini Calendar */}
                <MiniCalendar
                    selectedDate={calendarDate}
                    onSelectDate={(date) => {
                        setCalendarDate(date);
                        if (calendarRef.current) calendarRef.current.handleNavigate(date);
                    }}
                />

                {/* ═══ CASCADE FILTER ═══ */}
                <div className="gc-sidebar-section">
                    <h4 className="gc-sidebar-section-title">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        Filtrage en cascade
                    </h4>

                    {/* ── STEP 1: Session ── */}
                    <div className="gc-cascade-step gc-cascade-step--active">
                        <div className="gc-cascade-step-label">
                            <span className="gc-cascade-step-num">01</span>
                            SESSION
                        </div>
                        <select
                            className="gc-filter-select"
                            value={filterSessionId}
                            onChange={(e) => setFilterSessionId(e.target.value)}
                        >
                            <option value="">Toutes les sessions</option>
                            {/* Sessions with existing seances */}
                            {uniqueSessionsFromSeances.map((s) => (
                                <option key={s._id} value={s._id}>
                                    {s.nomSession}{s.nomClasse ? ` (${s.nomClasse})` : ''}
                                </option>
                            ))}
                            {/* Also offer sessions without seances yet */}
                            {sessions && sessions
                                .filter((s) => !uniqueSessionsFromSeances.find((u) => u._id === s._id))
                                .map((s) => (
                                    <option key={s._id} value={s._id}>
                                        {s.nomSession}
                                        {s.classe && Array.isArray(s.classe) 
                                            ? (s.classe.length > 0 ? ` (${s.classe.map(c => c.nomClasse).join(', ')})` : '')
                                            : (s.classe?.nomClasse ? ` (${s.classe.nomClasse})` : '')
                                        }
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    {/* ── STEP 2: Radio Par Classe / Par Professeur ── */}
                    {filterSessionId && (
                        <div className="gc-cascade-step gc-cascade-step--visible">
                            <div className="gc-cascade-step-label">
                                <span className="gc-cascade-step-num">02</span>
                                FILTRER PAR
                            </div>
                            <div className="gc-radio-group">
                                <label className={`gc-radio-btn ${filterMode === 'classe' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="filterMode"
                                        value="classe"
                                        checked={filterMode === 'classe'}
                                        onChange={() => setFilterMode('classe')}
                                    />
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                                    </svg>
                                    Par Classe
                                </label>
                                <label className={`gc-radio-btn ${filterMode === 'professeur' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="filterMode"
                                        value="professeur"
                                        checked={filterMode === 'professeur'}
                                        onChange={() => setFilterMode('professeur')}
                                    />
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Par Professeur
                                </label>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3a: Classe Select ── */}
                    {filterSessionId && filterMode === 'classe' && (
                        <div className="gc-cascade-step gc-cascade-step--visible">
                            <div className="gc-cascade-step-label">
                                <span className="gc-cascade-step-num">03</span>
                                CLASSE
                            </div>
                            {classesOfSession.length > 0 ? (
                                <select
                                    className="gc-filter-select"
                                    value={filterClasseId}
                                    onChange={(e) => setFilterClasseId(e.target.value)}
                                >
                                    <option value="">Toutes les classes</option>
                                    {classesOfSession.map((c) => (
                                        <option key={c._id} value={c._id}>{c.nomClasse}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="gc-cascade-empty">Aucune classe associée</p>
                            )}
                        </div>
                    )}

                    {/* ── STEP 3b: Enseignant Select ── */}
                    {filterSessionId && filterMode === 'professeur' && (
                        <div className="gc-cascade-step gc-cascade-step--visible">
                            <div className="gc-cascade-step-label">
                                <span className="gc-cascade-step-num">03</span>
                                PROFESSEUR
                            </div>
                            {enseignantsOfSession.length > 0 ? (
                                <select
                                    className="gc-filter-select"
                                    value={filterEnseignantId}
                                    onChange={(e) => setFilterEnseignantId(e.target.value)}
                                >
                                    <option value="">Tous les professeurs</option>
                                    {enseignantsOfSession.map((t) => (
                                        <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="gc-cascade-empty">Aucun professeur associé</p>
                            )}
                        </div>
                    )}

                    {/* ── STEP 4: Matières with badges ── */}
                    {filterSessionId && (filterClasseId || filterEnseignantId) && (
                        <div className="gc-cascade-step gc-cascade-step--visible">
                            <div className="gc-cascade-step-label">
                                <span className="gc-cascade-step-num">04</span>
                                MATIÈRES
                            </div>
                            {sidebarMatieres.length > 0 ? (
                                <div className="gc-matieres-list">
                                    {sidebarMatieres.map((m, idx) => {
                                        const color = SESSION_COLORS[idx % SESSION_COLORS.length];
                                        const count = matiereSeanceCount[m._id] || 0;
                                        return (
                                            <div key={m._id} className="gc-matiere-tag" style={{ borderColor: color.border }}>
                                                <div className="gc-matiere-tag-dot" style={{ background: color.border }} />
                                                <span className="gc-matiere-tag-name">{m.nomMatiere}</span>
                                                <span className="gc-matiere-badge" style={{ background: color.bg, color: color.text, borderColor: color.border }}>
                                                    {count}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="gc-cascade-empty">Aucune matière trouvée</p>
                            )}
                        </div>
                    )}

                    {/* Reset */}
                    {filterSessionId && (
                        <button className="gc-filter-reset" onClick={resetFilters}>
                            ✕ Réinitialiser
                        </button>
                    )}

                    {/* Count */}
                    <div className="gc-filter-count">
                        <span className="gc-count-badge">{filteredSeances.length}</span>
                        séance{filteredSeances.length !== 1 ? 's' : ''} affichée{filteredSeances.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Hint: click to add */}
                <div className="gc-sidebar-hint">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Cliquez-glissez sur le calendrier pour créer une séance
                </div>
            </aside>

            {/* ═══ RIGHT MAIN AREA ═══ */}
            <div className="gc-main">
                {/* Header */}
                <div className="gc-header">
                    <div>
                        <h1 className="gc-title">Planning Général</h1>
                        <p className="gc-subtitle">Vue globale de l'emploi du temps — cliquez-glissez pour créer une séance</p>
                    </div>
                </div>

                {/* Calendar */}
                <div className="gc-calendar-wrapper">
                    {isLoading ? (
                        <div className="gc-loading">
                            <div className="loading-spinner"></div>
                            <p>Chargement du planning...</p>
                        </div>
                    ) : (
                        <DnDCalendar
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
                            selectable={true}
                            onSelectSlot={handleSelectSlot}
                            onSelectEvent={() => {}} // désactivé — suppression via tooltip
                            onEventDrop={handleEventDrop}
                            onEventResize={handleEventResize}
                            resizable
                            draggableAccessor={() => true}
                            formats={{
                                dayHeaderFormat: (date) => format(date, 'EEEE d MMMM', { locale: fr }),
                                dayRangeHeaderFormat: ({ start, end }) => `${format(start, 'd MMM', { locale: fr })} — ${format(end, 'd MMM yyyy', { locale: fr })}`,
                                timeGutterFormat: (date) => format(date, 'HH:mm', { locale: fr }),
                            }}
                            style={{ minHeight: '100%', height: '100%' }}
                        />
                    )}
                </div>
            </div>

            {/* ═══ SLOT CREATION MODAL ═══ */}
            <SlotCreationModal
                isOpen={slotModalOpen}
                onClose={() => { setSlotModalOpen(false); setSlotData(null); setSeanceToEdit(null); }}
                slotData={slotData}
                sessions={sessions}
                filterSessionId={filterSessionId}
                filterClasseId={filterClasseId}
                availableMatieres={availableMatieres}
                availableEnseignants={filterMode === 'professeur' && filterEnseignantId
                    ? enseignantsOfSession.filter((e) => e._id === filterEnseignantId)
                    : enseignantsOfSession}
                onSubmit={handleSlotSubmit}
                isLoading={isLoading}
                seanceToEdit={seanceToEdit}
            />

            {/* ═══ TOOLTIP AU SURVOL (avec bouton supprimer) ═══ */}
            {tooltip.visible && tooltip.data && (() => {
                const s = tooltip.data.resource;
                const color = matiereColorMap[s.matiere?.nomMatiere] || SESSION_COLORS[0];
                return (
                    <div
                        ref={tooltipRef}
                        className="gc-tooltip"
                        style={{ position: 'fixed', left: tooltip.x, top: tooltip.y }}
                        onMouseEnter={() => setTooltip((prev) => ({ ...prev, visible: true }))}
                        onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
                    >
                        <div className="gc-tooltip-header">
                            <span className="gc-tooltip-matiere">
                                {s.matiere?.nomMatiere || 'Matière'}
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    className="gc-tooltip-edit-btn"
                                    onClick={() => handleEditSeance(tooltip.data)}
                                    title="Modifier cette séance"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button
                                    className="gc-tooltip-delete-btn"
                                    onClick={() => handleDeleteSeance(tooltip.data)}
                                    title="Supprimer cette séance"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14H6L5 6" />
                                        <path d="M10 11v6M14 11v6" />
                                        <path d="M9 6V4h6v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="gc-tooltip-body">
                            <div className="gc-tooltip-time">
                                {format(tooltip.data.start, 'HH:mm')} – {format(tooltip.data.end, 'HH:mm')}
                            </div>
                            <div className="gc-tooltip-details">
                                <div className="gc-tooltip-detail">
                                    <span className="gc-tooltip-label">Classe:</span>
                                    <span className="gc-tooltip-value">{s.classe?.nomClasse || '—'}</span>
                                </div>
                                <div className="gc-tooltip-detail">
                                    <span className="gc-tooltip-label">Session:</span>
                                    <span className="gc-tooltip-value">{s.session?.nomSession}</span>
                                </div>
                                <div className="gc-tooltip-detail">
                                    <span className="gc-tooltip-label">Prof:</span>
                                    <span className="gc-tooltip-value">{s.enseignant ? `${s.enseignant.firstName} ${s.enseignant.lastName}` : '—'}</span>
                                </div>
                                {s.salle && s.salle !== 'Non assignée' && (
                                    <div className="gc-tooltip-detail">
                                        <span className="gc-tooltip-label">Salle:</span>
                                        <span className="gc-tooltip-value">{s.salle}</span>
                                    </div>
                                )}
                                {s.type && (
                                    <div className="gc-tooltip-detail">
                                        <span className="gc-tooltip-label">Type:</span>
                                        <span className="gc-tooltip-value">{s.type}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

export default GlobalCalendar;
