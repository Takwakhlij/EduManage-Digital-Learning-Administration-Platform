import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getSessionById } from '../features/sessions/sessionSlice';
import { getInscriptionsParSession, reset as resetInscriptions } from '../features/inscriptions/inscriptionSlice';
import { getCours, deleteCours } from '../features/cours/coursSlice';
import { getSeancesBySession } from '../features/seances/seanceSlice';
import { fetchPresence, savePresence, resetPresence } from '../features/presence/presenceSlice';
import {
    ArrowLeft, BookOpen, Plus, FileText, ChevronDown, ChevronUp,
    Calendar, Link, PlayCircle, Music, Users, Edit3, Trash2,
    CheckCircle, XCircle, Clock, Save, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import AddDocumentModal from '../components/AddDocumentModal';
import './TeacherSessionDetails.css';

function TeacherSessionDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const { session, isLoading, isError, message } = useSelector((state) => state.sessions);
    const { cours } = useSelector((state) => state.cours);
    const { inscriptions, isLoading: inscriptionsLoading } = useSelector((state) => state.inscriptions);
    const { seances } = useSelector((state) => state.seances);
    const { presences, editable, isLoading: presenceLoading, isSuccess: presenceSaved, message: presenceMsg } = useSelector((state) => state.presence);

    const [activeTab, setActiveTab] = useState('programme');
    const [openChapterIndex, setOpenChapterIndex] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [editingDoc, setEditingDoc] = useState(null);

    // ── Appel / Présence states ──
    const [selectedSeanceId, setSelectedSeanceId] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]); // Aujourd'hui
    const [attendanceMap, setAttendanceMap] = useState({}); // { inscriptionId: { statut, remarque } }
    const [isApelLoaded, setIsApelLoaded] = useState(false);

    const getResourceIcon = (doc) => {
        const type = doc.typeFichier?.toLowerCase() || '';
        const url = doc.fichier?.toLowerCase() || '';
        if (type === 'pdf' || url.endsWith('.pdf')) return { icon: <FileText size={18} />, color: '#EF4444' };
        if (type === 'video' || url.endsWith('.mp4') || url.endsWith('.mov')) return { icon: <PlayCircle size={18} />, color: '#8B5CF6' };
        if (type === 'audio' || url.endsWith('.mp3') || url.endsWith('.wav')) return { icon: <Music size={18} />, color: '#F59E0B' };
        if (url.startsWith('http')) return { icon: <Link size={18} />, color: '#3B82F6' };
        return { icon: <FileText size={18} />, color: '#10b981' };
    };

    useEffect(() => {
        if (!user || user.role !== 'teacher') { navigate('/login'); return; }
        dispatch(getSessionById(id));
        dispatch(getCours({ sessionId: id }));
        dispatch(getInscriptionsParSession(id));
        dispatch(getSeancesBySession(id));
        return () => { dispatch(resetInscriptions()); };
    }, [dispatch, id, user, navigate]);

    // Lire les paramètres URL pour ouverture directe depuis le tableau de bord
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        const seanceIdParam = params.get('seanceId');
        if (tabParam === 'appel') {
            setActiveTab('appel');
        }
        if (seanceIdParam) {
            setSelectedSeanceId(seanceIdParam);
        }
    }, [location.search]);

    // Auto-sélectionner la séance du jour
    useEffect(() => {
        if (seances && seances.length > 0 && !selectedSeanceId) {
            const todayName = new Date().toLocaleDateString('fr-FR', { weekday: 'long' })
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

            // Chercher la séance d'aujourd'hui enseignée par le prof connecté
            const todaySeance = seances.find(s => {
                const sJour = (s.jour || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
                const isTeacher = s.enseignant?._id === user?._id || s.enseignant === user?._id;
                return sJour === todayName && isTeacher;
            });

            // Sinon prendre la première séance de l'enseignant
            const mySeance = todaySeance || seances.find(s =>
                s.enseignant?._id === user?._id || s.enseignant === user?._id
            );

            if (mySeance) setSelectedSeanceId(mySeance._id);
        }
    }, [seances, user]);

    // Charger l'appel quand la séance ou la date change
    useEffect(() => {
        if (selectedSeanceId && selectedDate && activeTab === 'appel') {
            setIsApelLoaded(false);
            dispatch(fetchPresence({ seanceId: selectedSeanceId, date: selectedDate }))
                .then(() => setIsApelLoaded(true));
        }
    }, [selectedSeanceId, selectedDate, activeTab, dispatch]);

    // Initialiser attendanceMap depuis les presences récupérées OR avec 'Present' par défaut
    useEffect(() => {
        if (!isApelLoaded) return;
        const map = {};
        // D'abord mettre tout le monde à "Present" par défaut
        inscriptions?.forEach(ins => {
            map[ins._id] = { statut: 'Present', remarque: '' };
        });
        // Ensuite, écraser avec les données réelles de la BDD si elles existent
        presences?.forEach(p => {
            if (p.inscription?._id) {
                map[p.inscription._id] = { statut: p.statut, remarque: p.remarque || '' };
            }
        });
        setAttendanceMap(map);
    }, [presences, inscriptions, isApelLoaded]);

    // Notification après sauvegarde
    useEffect(() => {
        if (presenceSaved && presenceMsg) {
            toast.success(presenceMsg);
            dispatch(resetPresence());
        }
    }, [presenceSaved, presenceMsg, dispatch]);



    const toggleChapter = (index) => {
        setOpenChapterIndex(openChapterIndex === index ? null : index);
    };

    const handleAddDocument = (chapitre) => {
        setEditingDoc(null); setSelectedChapter(chapitre); setIsModalOpen(true);
    };

    const handleEditDoc = (doc, chapitre) => {
        setEditingDoc(doc); setSelectedChapter(chapitre); setIsModalOpen(true);
    };

    const handleDeleteDoc = async (doc) => {
        if (window.confirm(`Supprimer "${doc.titre}" ?`)) {
            const result = await dispatch(deleteCours(doc._id));
            if (deleteCours.fulfilled.match(result)) toast.success('Document supprimé avec succès');
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false); setEditingDoc(null);
        dispatch(getCours({ sessionId: id }));
    };

    // ── Appel Handlers ──
    const handleStatutChange = (inscriptionId, statut) => {
        if (!editable) return;
        setAttendanceMap(prev => ({
            ...prev,
            [inscriptionId]: { ...prev[inscriptionId], statut }
        }));
    };

    const handleRemarqueChange = (inscriptionId, remarque) => {
        if (!editable) return;
        setAttendanceMap(prev => ({
            ...prev,
            [inscriptionId]: { ...prev[inscriptionId], remarque }
        }));
    };

    const handleSavePresence = () => {
        if (!selectedSeanceId) return toast.error('Veuillez sélectionner une séance');
        if (!editable) return;

        const presencesArr = Object.entries(attendanceMap).map(([inscriptionId, data]) => ({
            inscriptionId,
            statut: data.statut,
            remarque: data.remarque || ''
        }));

        dispatch(savePresence({
            seanceId: selectedSeanceId,
            date: selectedDate,
            presences: presencesArr
        }));
    };

    const getStatutConfig = (statut) => ({
        Present:  { label: 'Présent', icon: <CheckCircle size={15} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
        Absent:   { label: 'Absent',  icon: <XCircle size={15} />,     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)'  },
        Retard:   { label: 'Retard',  icon: <Clock size={15} />,       color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    }[statut] || { label: statut, icon: null, color: '#94a3b8', bg: 'transparent', border: '#94a3b8' });

    if (isLoading) return <div className="tsd-loading">Chargement des détails de la session...</div>;
    if (isError) return <div className="tsd-error">Erreur: {message}</div>;
    if (!session) return <div className="tsd-error">Session non trouvée.</div>;

    const mySubjectsData = session?.programme?.filter(p =>
        p.enseignant === user?._id || (p.enseignant && p.enseignant._id === user?._id)
    ) || [];

    const chapitresGroupes = mySubjectsData.map(p => {
        const matiereObj = p.matiere;
        return {
            matiere: matiereObj,
            nomMatiere: matiereObj?.nomMatiere || p.nomMatiere || 'Matière Inconnue',
            chapitres: matiereObj?.programme || []
        };
    }).filter(g => g.chapitres.length > 0 || g.nomMatiere);

    // Séances de cet enseignant pour cette session
    const mySeances = (seances || []).filter(s =>
        s.enseignant?._id === user?._id || s.enseignant === user?._id
    );

    const selectedSeanceObj = mySeances.find(s => s._id === selectedSeanceId);

    return (
        <div className="tsd-page">


            {/* Header */}
            <header className="tsd-header">
                <div style={{ padding: '0 2.5rem', width: '100%' }}>
                    <button className="tsd-back-btn" onClick={() => navigate('/teacher')} style={{ marginBottom: '1rem' }}>
                        <ArrowLeft size={16} /> Retour aux sessions
                    </button>
                </div>
                <div className="tsd-container">
                    <div className="tsd-header-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '0.5rem', marginTop: '1rem', marginLeft: '5rem' }}>
                        <div style={{ color: '#fbbf24', fontSize: '2.5rem', fontFamily: 'Amiri, serif', fontWeight: 'bold' }}>
                            بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </div>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', margin: '0.25rem 0', color: '#ffffff' }}>{session.nomSession}</h1>
                        <div className="tsd-badges" style={{ marginTop: '0.5rem' }}>
                            <span className="tsd-badge tsd-badge-class">
                                {(() => {
                                    const cls = Array.isArray(session.classe) ? session.classe[0] : session.classe;
                                    const clsName = cls?.nomClasse || cls?.nom || 'Classe Non Spécifiée';
                                    return cls?.niveau ? `${clsName} - ${cls.niveau}` : clsName;
                                })()}
                            </span>
                            <span className="tsd-badge tsd-badge-time">
                                <Calendar size={14} /> {session.duree || 'Durée non spécifiée'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="tsd-content tsd-container">
                <div className="tsd-tabs">
                    <button className={`tsd-tab-btn ${activeTab === 'programme' ? 'active' : ''}`} onClick={() => setActiveTab('programme')}>
                        <BookOpen size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Programme
                    </button>
                    <button className={`tsd-tab-btn ${activeTab === 'etudiants' ? 'active' : ''}`} onClick={() => setActiveTab('etudiants')}>
                        <Users size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Étudiants ({inscriptions?.length || 0})
                    </button>
                    <button className={`tsd-tab-btn ${activeTab === 'appel' ? 'active' : ''}`} onClick={() => setActiveTab('appel')}>
                        <CheckCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Faire l'Appel
                        {inscriptions?.length > 0 && (
                            <span className="tsd-tab-badge">{inscriptions.length}</span>
                        )}
                    </button>
                </div>

                {/* ── TAB: Programme ── */}
                {activeTab === 'programme' && (
                    <div className="tsd-programme-view">
                        <div className="tsd-section-header"><h2>Programme des Chapitres</h2></div>
                        {chapitresGroupes.length === 0 ? (
                            <div className="tsd-empty-state">
                                <FileText size={48} /><h3>Aucun programme défini</h3>
                                <p>Vous n'avez aucun chapitre assigné ou le programme est vide.</p>
                            </div>
                        ) : (
                            <div className="tsd-chapters-list" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {chapitresGroupes.map((groupe, groupIndex) => (
                                    <div key={groupIndex} className="tsd-matiere-group">
                                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <BookOpen size={20} /> {groupe.nomMatiere}
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {groupe.chapitres?.map((chapitre, chapIndex) => {
                                                const globalIndex = `${groupIndex}-${chapIndex}`;
                                                return (
                                                    <div key={chapitre._id || globalIndex} className={`tsd-chapter-card ${openChapterIndex === globalIndex ? 'open' : ''}`}>
                                                        <div className="tsd-chapter-header" onClick={() => toggleChapter(globalIndex)}>
                                                            <div className="tsd-chapter-title-group">
                                                                <div className="tsd-chapter-number">{chapIndex + 1}</div>
                                                                <div>
                                                                    <h3 className="tsd-chapter-title">{chapitre.titre}</h3>
                                                                    <p className="tsd-chapter-desc">
                                                                        {cours?.filter(c => c.chapitreRef === chapitre._id).length || 0} ressources
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button className="tsd-chapter-toggle">
                                                                {openChapterIndex === globalIndex ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                            </button>
                                                        </div>
                                                        {openChapterIndex === globalIndex && (
                                                            <div className="tsd-chapter-body">
                                                                {(() => {
                                                                    const chapCours = cours?.filter(c => c.chapitreRef === chapitre._id) || [];
                                                                    return chapCours.length === 0 ? (
                                                                        <div className="tsd-documents-empty"><p>Aucun document pour ce chapitre.</p></div>
                                                                    ) : (
                                                                        <div className="tsd-documents-list">
                                                                            {chapCours.map(doc => {
                                                                                const isExternal = doc.fichier?.startsWith('http');
                                                                                const fileUrl = isExternal ? doc.fichier : `http://localhost:5000${doc.fichier}`;
                                                                                const { icon, color } = getResourceIcon(doc);
                                                                                return (
                                                                                    <div key={doc._id} className="tsd-document-item">
                                                                                        <div className="tsd-doc-icon" style={{ color }}>{icon}</div>
                                                                                        <div className="tsd-doc-info">
                                                                                            <h4>{doc.titre}</h4>
                                                                                            <span className="tsd-doc-date">{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                                                                                        </div>
                                                                                        <div className="tsd-doc-actions">
                                                                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="tsd-doc-link">Ouvrir</a>
                                                                                            <button className="tsd-doc-action-btn tsd-doc-edit-btn" title="Modifier" onClick={() => handleEditDoc(doc, chapitre)}><Edit3 size={15} /></button>
                                                                                            <button className="tsd-doc-action-btn tsd-doc-delete-btn" title="Supprimer" onClick={() => handleDeleteDoc(doc)}><Trash2 size={15} /></button>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    );
                                                                })()}
                                                                <button className="tsd-add-doc-btn" onClick={() => handleAddDocument(chapitre)}>
                                                                    <Plus size={16} /> Ajouter un document (PDF, Audio, Vidéo, Lien)
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: Étudiants ── */}
                {activeTab === 'etudiants' && (
                    <div className="tsd-students-view">
                        <div className="tsd-section-header">
                            <h2>Étudiants Inscrits</h2>
                            <p>Liste des élèves ayant rejoint cette session.</p>
                        </div>
                        {inscriptionsLoading ? (
                            <div className="tsd-loading-small">Chargement des étudiants...</div>
                        ) : inscriptions?.length === 0 ? (
                            <div className="tsd-empty-state"><Users size={48} /><h3>Aucun étudiant inscrit</h3></div>
                        ) : (
                            <div className="tsd-students-list">
                                {inscriptions.map((ins) => (
                                    <div key={ins._id} className="tsd-student-item">
                                        <div className="tsd-student-avatar">
                                            {ins.etudiant?.profileImage
                                                ? <img src={ins.etudiant.profileImage.startsWith('http') ? ins.etudiant.profileImage : `http://localhost:5000${ins.etudiant.profileImage}`} alt="Profile" />
                                                : <Users size={20} />}
                                        </div>
                                        <div className="tsd-student-info">
                                            <h4>{ins.etudiant?.firstName} {ins.etudiant?.lastName}</h4>
                                            <p>{ins.etudiant?.email}</p>
                                        </div>
                                        <div className="tsd-student-status">
                                            <span className={`tsd-status-badge ${ins.statutPaiement === 'Payé' ? 'tsd-status-paye' : ins.statutPaiement === 'Avance' ? 'tsd-status-avance' : 'tsd-status-non-paye'}`}>
                                                {ins.statutPaiement}
                                            </span>
                                            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                Inscrit le {new Date(ins.dateInscription).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: Appel / Présence ── */}
                {activeTab === 'appel' && (
                    <div className="tsd-appel-view">
                        <div className="tsd-section-header">
                            <h2>Feuille d'Appel</h2>
                            <p>Sélectionnez la séance et la date, puis notez les présences.</p>
                        </div>

                        {/* Sélecteurs : Séance + Date */}
                        <div className="tsd-appel-controls">
                            <div className="tsd-control-group">
                                <label className="tsd-control-label">
                                    <Calendar size={15} /> Séance
                                </label>
                                <select
                                    className="tsd-control-select"
                                    value={selectedSeanceId}
                                    onChange={e => setSelectedSeanceId(e.target.value)}
                                >
                                    <option value="">-- Choisir une séance --</option>
                                    {mySeances.map(s => (
                                        <option key={s._id} value={s._id}>
                                            {s.jour} · {s.heureDebut} - {s.heureFin}
                                            {s.matiere?.nomMatiere ? ` · ${s.matiere.nomMatiere}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="tsd-control-group">
                                <label className="tsd-control-label">
                                    <Calendar size={15} /> Date du cours
                                </label>
                                <input
                                    type="date"
                                    className="tsd-control-input"
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Bandeau de statut : Modifiable ou Verrouillé */}
                        {isApelLoaded && (
                            <div className={`tsd-appel-status-bar ${editable ? 'tsd-editable' : 'tsd-locked'}`}>
                                {editable ? (
                                    <><CheckCircle size={16} /> Modifiable — Vous êtes dans la fenêtre de 48 heures.</>
                                ) : (
                                    <><Lock size={16} /> Verrouillé — La date dépasse 48 heures, l'appel est en lecture seule.</>
                                )}
                            </div>
                        )}

                        {/* Tableau d'Appel */}
                        {!selectedSeanceId ? (
                            <div className="tsd-appel-empty">
                                <CheckCircle size={40} />
                                <p>Sélectionnez une séance pour commencer l'appel.</p>
                            </div>
                        ) : presenceLoading ? (
                            <div className="tsd-loading-small">Chargement de l'appel...</div>
                        ) : inscriptions?.length === 0 ? (
                            <div className="tsd-appel-empty"><p>Aucun étudiant inscrit à cette session.</p></div>
                        ) : (
                            <div className="tsd-appel-table-wrapper">
                                <div className="tsd-appel-bulk-actions">
                                    <button 
                                        className="tsd-bulk-btn"
                                        onClick={() => {
                                            const newMap = { ...attendanceMap };
                                            inscriptions.forEach(ins => {
                                                newMap[ins._id] = { ...newMap[ins._id], statut: 'Present' };
                                            });
                                            setAttendanceMap(newMap);
                                        }}
                                        disabled={!editable}
                                    >
                                        <CheckCircle size={14} /> Tout le monde est présent
                                    </button>
                                </div>
                                <table className="tsd-appel-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Étudiant</th>
                                            <th>Statut de Présence</th>
                                            <th>Remarque (optionnel)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inscriptions.map((ins, index) => {
                                            const currentStatut = attendanceMap[ins._id]?.statut || 'Present';
                                            const currentRemarque = attendanceMap[ins._id]?.remarque || '';
                                            const cfg = getStatutConfig(currentStatut);

                                            return (
                                                <tr key={ins._id} className={`tsd-appel-row tsd-row-${currentStatut?.toLowerCase()}`}>
                                                    <td className="tsd-appel-num">{index + 1}</td>
                                                    <td>
                                                        <div className="tsd-appel-student">
                                                            <div className="tsd-appel-avatar-ring" style={{ borderColor: cfg.color }}>
                                                                <div className="tsd-appel-avatar">
                                                                    {ins.etudiant?.profileImage
                                                                        ? <img src={ins.etudiant.profileImage.startsWith('http') ? ins.etudiant.profileImage : `http://localhost:5000${ins.etudiant.profileImage}`} alt="" />
                                                                        : <span>{(ins.etudiant?.firstName?.[0] || '?').toUpperCase()}</span>
                                                                    }
                                                                </div>
                                                            </div>
                                                            <div className="tsd-st-meta">
                                                                <span className="tsd-st-name">{ins.etudiant?.firstName} {ins.etudiant?.lastName}</span>
                                                                <span className="tsd-st-mail">{ins.etudiant?.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="tsd-statut-btns">
                                                            {['Present', 'Absent', 'Retard'].map(s => {
                                                                const c = getStatutConfig(s);
                                                                return (
                                                                    <button
                                                                        key={s}
                                                                        className={`tsd-statut-btn ${currentStatut === s ? 'active' : ''}`}
                                                                        style={{
                                                                            '--btn-color': c.color,
                                                                            '--btn-bg': c.bg,
                                                                            '--btn-border': c.border,
                                                                        }}
                                                                        onClick={() => handleStatutChange(ins._id, s)}
                                                                        disabled={!editable}
                                                                        title={editable ? c.label : 'Verrouillé (>48h)'}
                                                                    >
                                                                        {c.icon} {c.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="tsd-remarque-input"
                                                            type="text"
                                                            placeholder={editable ? "Ex: Certificat médical..." : "—"}
                                                            value={currentRemarque}
                                                            onChange={e => handleRemarqueChange(ins._id, e.target.value)}
                                                            disabled={!editable}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Footer : Résumé + Bouton Enregistrer */}
                                {editable && (
                                    <div className="tsd-appel-footer">
                                        <div className="tsd-appel-summary">
                                            <span className="tsd-sum-present">
                                                <CheckCircle size={14} /> {Object.values(attendanceMap).filter(v => v.statut === 'Present').length} Présents
                                            </span>
                                            <span className="tsd-sum-absent">
                                                <XCircle size={14} /> {Object.values(attendanceMap).filter(v => v.statut === 'Absent').length} Absents
                                            </span>
                                            <span className="tsd-sum-retard">
                                                <Clock size={14} /> {Object.values(attendanceMap).filter(v => v.statut === 'Retard').length} Retards
                                            </span>
                                        </div>
                                        <button
                                            className="tsd-save-appel-btn"
                                            onClick={handleSavePresence}
                                            disabled={presenceLoading}
                                        >
                                            <Save size={16} />
                                            {presenceLoading ? 'Enregistrement...' : 'Enregistrer l\'Appel'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            <AddDocumentModal isOpen={isModalOpen} onClose={handleModalClose} sessionId={id} chapitre={selectedChapter} editingDoc={editingDoc} />
        </div>
    );
}

export default TeacherSessionDetails;
