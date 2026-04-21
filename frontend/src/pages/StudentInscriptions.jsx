import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getClasses, getAvailableClasses, enrollInClasse, resetEnroll } from '../features/classes/classeSlice';
import { getCours } from '../features/cours/coursSlice';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
    User, BookOpen, Clock, CheckCircle,
    PlusCircle, ArrowRight, X, XCircle, ArrowLeft, Moon, Sun,
    Search, Filter, ChevronDown, ChevronUp, FileText, Video, Archive,
    Link as LinkIcon, Headphones, Download, ExternalLink, PlayCircle, Globe
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './StudentInscriptions.css';
import quranImg from '../assets/quran-hifz.png';
import libraryImg from '../assets/library-study.png';
import patternImg from '../assets/islamic-pattern.jpg';
import axios from 'axios';
import PaymentModal from '../components/PaymentModal';

function StudentInscriptions({ effectiveUser }) {
    const { user: authUser } = useSelector((state) => state.auth);
    // Use local state for inscriptions instead of relying on the global (insecure) classes list
    const [myInscriptions, setMyInscriptions] = useState([]);
    const [inscriptionsLoading, setInscriptionsLoading] = useState(true);
    
    const { availableClasses, isLoading, isError, message, enrollMessage, enrollLoading } = useSelector((state) => state.classes);
    const { cours } = useSelector((state) => state.cours);
    const user = effectiveUser || authUser;
    const { t, lang, setLang } = useLanguage();
    const { isDarkMode, toggleTheme } = useTheme();

    const [selectedId, setSelectedId] = useState(null);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedClasseId, setSelectedClasseId] = useState('');
    const [enrollFeedback, setEnrollFeedback] = useState(null);
    const [previewClasseId, setPreviewClasseId] = useState('');

    // Sidebar search & subject filter
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    // ── MULTI-SELECT DROPDOWN (course-title filter) ──
    const [selectedCoursTitles, setSelectedCoursTitles] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownSearch, setDropdownSearch] = useState('');
    const dropdownRef = useRef(null);

    // ── Supports de cours filters ──
    const [coursSearchTerm, setCoursSearchTerm] = useState('');
    const [selectedCoursMatiere, setSelectedCoursMatiere] = useState('');
    const [selectedFileType, setSelectedFileType] = useState('ALL');
    const [openChapterIndex, setOpenChapterIndex] = useState(null);

    // ── Payment Modal State ──
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentInscription, setPaymentInscription] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (isError) console.error(message);
    }, [isError, message]);

    const fetchRef = useRef(false);
    useEffect(() => {
        if (authUser?.token && !fetchRef.current) {
            fetchRef.current = true;
            
            const fetchMyData = async () => {
                try {
                    setInscriptionsLoading(true);
                    const config = { headers: { Authorization: `Bearer ${authUser.token}` } };
                    
                    // 1. Fetch private inscriptions
                    const resInscriptions = await axios.get('/api/inscriptions/my', config);
                    if (resInscriptions.data.success) {
                        setMyInscriptions(resInscriptions.data.inscriptions);
                    }
                    
                    // 2. Fetch available classes for enrollment
                    dispatch(getAvailableClasses());
                    
                    // 3. Fetch courses related to this student
                    dispatch(getCours({ studentId: user._id }));
                } catch (error) {
                    console.error('Erreur data fetch:', error);
                } finally {
                    setInscriptionsLoading(false);
                }
            };
            
            fetchMyData();
        }
    }, [authUser?.token, user?._id, dispatch]);

    useEffect(() => {
        if (enrollMessage === 'success') {
            setEnrollFeedback({ type: 'success', text: t.enrollSuccess });
            setSelectedClasseId('');
            setShowEnrollModal(false);
            setPreviewClasseId('');
            const timer = setTimeout(() => { setEnrollFeedback(null); dispatch(resetEnroll()); }, 3000);
            return () => clearTimeout(timer);
        } else if (enrollMessage && enrollMessage !== '' && enrollMessage !== 'unenrolled') {
            setEnrollFeedback({ type: 'error', text: enrollMessage });
            const timer = setTimeout(() => { setEnrollFeedback(null); dispatch(resetEnroll()); }, 4000);
            return () => clearTimeout(timer);
        }
    }, [enrollMessage, dispatch, t.enrollSuccess]);

    // ── Helper: Déterminer le type de fichier et ses couleurs ──
    const getFileTypeInfo = (filename) => {
        if (!filename) return { type: 'LINK', color: '#3b82f6', bg: '#3b82f6', icon: LinkIcon, label: 'Lien', actionIcon: ExternalLink, actionText: t.viewOnline || 'Ouvrir', singleAction: true };

        const isExternalUrl = filename.startsWith('http://') || filename.startsWith('https://');
        
        let cleaned = filename.split('?')[0].split('#')[0];
        const ext = cleaned.split('.').pop().toLowerCase();

        if (isExternalUrl && !['pdf', 'mp4', 'mkv', 'avi', 'mp3', 'wav', 'ogg', 'zip', 'rar', '7z', 'doc', 'docx'].includes(ext)) {
             return { type: 'LINK', color: '#3b82f6', bg: '#3b82f6', icon: LinkIcon, label: 'Lien', actionIcon: ExternalLink, actionText: t.viewOnline || 'Ouvrir', singleAction: true };
        }

        switch (ext) {
            case 'pdf':
                return { type: 'PDF', color: '#10b981', bg: '#10b981', icon: FileText, label: 'PDF', actionIcon: Globe, actionText: t.viewOnline || 'View Online', singleAction: false };
            case 'mp4':
            case 'mkv':
            case 'avi':
                return { type: 'VIDEO', color: '#3b82f6', bg: '#3b82f6', icon: PlayCircle, label: 'Video', actionIcon: PlayCircle, actionText: t.openPlayer || 'Open Video Player', singleAction: false };
            case 'mp3':
            case 'wav':
            case 'ogg':
                return { type: 'AUDIO', color: '#f59e0b', bg: '#f59e0b', icon: Headphones, label: 'Audio', actionIcon: Headphones, actionText: t.listenOnline || 'Listen Online', singleAction: true };
            case 'zip':
            case 'rar':
            case '7z':
                return { type: 'ARCHIVE', color: '#eab308', bg: '#eab308', icon: Archive, label: 'ZIP', actionIcon: Download, actionText: t.downloadZip || 'Download Zip', singleAction: true };
            case 'doc':
            case 'docx':
                return { type: 'DOC', color: '#3b82f6', bg: '#3b82f6', icon: FileText, label: 'DOCX', actionIcon: ExternalLink, actionText: 'Open in Viewer', singleAction: false };
            default:
                return { type: 'FILE', color: '#8b5cf6', bg: '#8b5cf6', icon: FileText, label: 'FILE', actionIcon: Download, actionText: t.download || 'Download', singleAction: true };
        }
    };

    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', filename.split('/').pop());
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        }
    };

    const handleToggleCours = async (inscriptionId, coursId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${authUser.token}` } };
            const res = await axios.put(`/api/inscriptions/${inscriptionId}/toggle-cours`, { coursId }, config);
            if (res.data.success) {
                // Update local state for immediate feedback
                setMyInscriptions(prev => prev.map(ins => 
                    ins._id === inscriptionId ? { ...ins, coursTermines: res.data.coursTermines } : ins
                ));
            }
        } catch (err) {
            console.error('Erreur toggle cours :', err);
        }
    };

    const handleEnrollSubmit = (e) => {
        e.preventDefault();
        if (selectedClasseId) dispatch(enrollInClasse(selectedClasseId));
    };

    const handleOpenEnrollModal = () => {
        dispatch(getAvailableClasses());
        setShowEnrollModal(true);
    };

    const filtrerClassesDisponibles = () => {
        if (!availableClasses || !Array.isArray(availableClasses)) return [];
        // Extract class IDs from inscriptions where the student is already enrolled
        const mesIds = myInscriptions.map(ins => ins.classe?._id || ins.session?.classe?._id).filter(Boolean);
        return availableClasses.filter(c => !mesIds.includes(c._id));
    };

    // ── DROPDOWN HELPERS (by course title) ──
    // All unique course titles across every class
    const allCoursTitles = Array.from(new Set((cours || []).map(c => c.titre).filter(Boolean)));

    const dropdownTitles = allCoursTitles.filter(title =>
        title.toLowerCase().includes(dropdownSearch.toLowerCase())
    );

    const allTitlesSelected = allCoursTitles.length > 0 && selectedCoursTitles.length === allCoursTitles.length;

    const toggleTitleSelection = (titre) => {
        setSelectedCoursTitles(prev =>
            prev.includes(titre) ? prev.filter(x => x !== titre) : [...prev, titre]
        );
    };

    const toggleSelectAll = () => {
        setSelectedCoursTitles(allTitlesSelected ? [] : allCoursTitles);
    };

    const removeTitleTag = (titre) => {
        setSelectedCoursTitles(prev => prev.filter(x => x !== titre));
    };

    // ── SUBJECT FILTER (sidebar) ──
    const allSubjects = Array.from(new Set(myInscriptions?.flatMap(ins => {
        const cl = ins.classe || ins.session?.classe;
        if (!cl) return [];
        if (cl.matieres && cl.matieres.length > 0) return cl.matieres.map(m => m.nomMatiere);
        if (cl.planning) return cl.planning.map(p => typeof p.matiere === 'object' ? p.matiere?.nomMatiere : p.matiere);
        return [];
    }).filter(Boolean) || []));

    const toggleSubjectFilter = (subject) => {
        setSelectedSubjects(prev =>
            prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
        );
    };

    // ── FILTERED SIDEBAR LIST ──
    const filteredInscriptions = myInscriptions?.filter(ins => {
        const cl = ins.classe || ins.session?.classe;
        if (!cl) return false;
        
        const matchesSearch = (cl?.nomClasse?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             ins.session?.nomSession?.toLowerCase().includes(searchTerm.toLowerCase())) || false;
                             
        const clSubjects = cl.matieres?.length > 0
            ? cl.matieres.map(m => m.nomMatiere)
            : (cl.planning?.map(p => typeof p.matiere === 'object' ? p.matiere?.nomMatiere : p.matiere).filter(Boolean) || []);
            
        const matchesSubject = selectedSubjects.length === 0 || selectedSubjects.some(s => clSubjects.includes(s));
        return matchesSearch && matchesSubject;
    }) || [];

    // Prioritize approved inscriptions for default selection
    useEffect(() => {
        // 1. Prioritize ID from navigation state (Rejoindre button)
        if (location.state?.selectedId) {
            setSelectedId(location.state.selectedId);
            // Clear state after reading to avoid re-selection on refresh
            window.history.replaceState({}, document.title);
            return;
        }

        // 2. Default fallback
        if (filteredInscriptions?.length > 0 && !selectedId) {
            const firstApproved = filteredInscriptions.find(i => i.statut === 'approuvee');
            setSelectedId(firstApproved ? firstApproved._id : filteredInscriptions[0]._id);
        }
    }, [filteredInscriptions, selectedId, location.state]);

    // ── AGGREGATED COURSES ──
    const isGlobalView = selectedCoursTitles.length > 0;
    const selectedInscription = isGlobalView ? null : myInscriptions?.find(ins => ins._id === selectedId);
    const selectedClass = selectedInscription?.classe || selectedInscription?.session?.classe;

    // Pool: all courses relative to MY inscriptions
    const allActiveCours = isGlobalView
        ? (cours || [])
        : (cours?.filter(c => {
            const courseSessionId = c.session?._id || c.session;
            const targetSessionId = selectedInscription?.session?._id || selectedInscription?.session;
            return courseSessionId && targetSessionId && String(courseSessionId) === String(targetSessionId);
        }) || []);

    const localCoursSubjectOptions = Array.from(new Set(allActiveCours.map(c => c.matiere?.nomMatiere).filter(Boolean)));

    // Apply filters
    const displayedCours = allActiveCours.filter(c => {
        const matchesTitleFilter = isGlobalView
            ? selectedCoursTitles.includes(c.titre)
            : true;
        const matchesSearch = !coursSearchTerm ||
            c.titre?.toLowerCase().includes(coursSearchTerm.toLowerCase()) ||
            c.description?.toLowerCase().includes(coursSearchTerm.toLowerCase());
        const matchesMatiere = !selectedCoursMatiere || c.matiere?.nomMatiere === selectedCoursMatiere;
        
        let matchesFileType = true;
        if (selectedFileType !== 'ALL') {
             const fileInfo = getFileTypeInfo(c.fichier);
             matchesFileType = fileInfo.type === selectedFileType;
        }

        return matchesTitleFilter && matchesSearch && matchesMatiere && matchesFileType;
    });

    // activeCours = what's shown in count badges
    const activeCours = isGlobalView
        ? allActiveCours.filter(c => selectedCoursTitles.includes(c.titre))
        : allActiveCours;

    // ── HELPERS ──
    const getClasseImage = (nom) => {
        if (!nom) return libraryImg;
        const low = nom.toLowerCase();
        if (['hifz', 'coran', 'mémorisation', 'memorisation', 'tajwid', 'tajweed', 'fajr', 'فجر', 'نور'].some(k => low.includes(k))) return quranImg;
        return libraryImg;
    };

    const getNiveauKey = (niveau) => {
        if (!niveau) return '';
        const n = niveau.toLowerCase();
        if (n.includes('debut') || n.includes('مبتدئ') || n.includes('ابتدائ')) return 'debutant';
        if (n.includes('interm') || n.includes('متوسط') || n.includes('moyen')) return 'intermediaire';
        if (n.includes('avan') || n.includes('متقدم') || n.includes('avancé')) return 'avance';
        return n;
    };
    const getNiveauLabel = (niveau) => t.niveaux?.[getNiveauKey(niveau)] || niveau;
    const getNiveauColor = (niveau) => {
        if (getNiveauKey(niveau) === 'avance') return { color: '#ceaa5f', border: '#ceaa5f' };
        return { color: '#2fb38b', border: '#1a6e54' };
    };

    const orderedDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    // Smart timestamp: if < 24h show time, else show date
    const formatCoursTime = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now - created;
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 24) {
            return { label: created.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) };
        }
        return { label: created.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) };
    };

    const getFileUrl = (fichier) => {
        if (!fichier) return null;
        if (fichier.startsWith('http://') || fichier.startsWith('https://')) return fichier;
        return `http://localhost:5000${fichier}`;
    };

    const renderEnrollModal = () => {
        if (!showEnrollModal) return null;
        const available = filtrerClassesDisponibles();
        const previewClasse = available.find(c => c._id === previewClasseId);

        return (
            <div className="exa-modal-overlay" onClick={() => setShowEnrollModal(false)}>
                <div className="exa-modal-content" onClick={e => e.stopPropagation()}>
                    <div className="exa-modal-header">
                        <h3>{t.enroll}</h3>
                        <button className="exa-modal-close" onClick={() => setShowEnrollModal(false)}><X size={20} /></button>
                    </div>
                    <div className="exa-modal-body">
                        <div className="exa-enroll-select-group">
                            <label>{t.enrollSelect}</label>
                            <select
                                value={previewClasseId}
                                onChange={(e) => {
                                    setPreviewClasseId(e.target.value);
                                    setSelectedClasseId(e.target.value);
                                }}
                                className="exa-enroll-select"
                            >
                                <option value="">-- {t.enrollSelect} --</option>
                                {available.map(c => (
                                    <option key={c._id} value={c._id}>{c.nomClasse} ({getNiveauLabel(c.niveau)})</option>
                                ))}
                            </select>
                        </div>

                        {previewClasse ? (
                            <div className="exa-enroll-preview">
                                <div className="exa-enroll-preview-header">
                                    <h4>{previewClasse.nomClasse}</h4>
                                    <span className="exa-hero-badge" style={{ color: getNiveauColor(previewClasse.niveau).color, borderColor: getNiveauColor(previewClasse.niveau).border }}>
                                        {getNiveauLabel(previewClasse.niveau)}
                                    </span>
                                </div>

                                {previewClasse.description && (
                                    <div className="exa-enroll-preview-section">
                                        <h5>Description</h5>
                                        <p>{previewClasse.description}</p>
                                    </div>
                                )}

                                {previewClasse.professeurs?.length > 0 && (
                                    <div className="exa-enroll-preview-section">
                                        <h5>{t.teachers}</h5>
                                        <div className="exa-profs">
                                            {previewClasse.professeurs.map(p => (
                                                <span key={p._id} className="exa-prof-pill">{p.firstName} {p.lastName}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {previewClasse.planning?.length > 0 && (
                                    <div className="exa-enroll-preview-section">
                                        <h5>{t.schedule}</h5>
                                        <div className="exa-enroll-mini-schedule">
                                            {previewClasse.planning.map((s, i) => (
                                                <div key={i} className="exa-mini-slot">
                                                    <span className="exa-mini-day">{t.days?.[s.jour] || s.jour}</span>
                                                    <span className="exa-mini-time">{s.heureDebut} - {s.heureFin}</span>
                                                    <span className="exa-mini-subject">{typeof s.matiere === 'object' ? s.matiere?.nomMatiere : s.matiere}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="exa-enroll-empty">
                                {available.length === 0 ? t.enrollNone : (t.selectClassToView || "Sélectionnez une classe pour voir les détails")}
                            </div>
                        )}
                    </div>
                    <div className="exa-modal-footer">
                        <button className="exa-modal-btn exa-modal-btn--secondary" onClick={() => setShowEnrollModal(false)}>{t.cancel}</button>
                        <button
                            className="exa-modal-btn exa-modal-btn--primary"
                            disabled={enrollLoading || !selectedClasseId}
                            onClick={handleEnrollSubmit}
                        >
                            {enrollLoading ? '...' : t.enrollConfirm}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handlePaymentSuccess = (data) => {
        setEnrollFeedback({ type: 'success', text: data.message });
        setPaymentModalOpen(false);
        setPaymentInscription(null);
        // Mettre à jour l'état local pour refléter le nouveau paiement
        setMyInscriptions(prev => prev.map(ins => {
            if (ins._id === paymentInscription._id) {
                return { 
                    ...ins, 
                    montantVerseTotal: data.montantVerseTotal, 
                    statutPaiement: data.statutPaiement,
                    resteAPayer: data.resteAPayer
                };
            }
            return ins;
        }));
    };

    // ── RENDER ──
    return (
        <div className="exa-layout" dir={t.dir}>
            {renderEnrollModal()}
            
            {paymentModalOpen && paymentInscription && (
                <PaymentModal 
                    inscription={paymentInscription}
                    onClose={() => setPaymentModalOpen(false)}
                    onSuccess={handlePaymentSuccess}
                />
            )}

            {/* TOP BAR */}
            <header className="exa-topbar">
                <div className="exa-topbar-start">
                    <button className="exa-back-btn" onClick={() => navigate('/dashboard')}>
                        <span>{t.dashboard}</span>
                        {t.dir === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                    </button>
                </div>
                <div className="exa-topbar-center">
                    <h1>{t.classesTitle}</h1>
                    <p>{t.classesSubtitle}</p>
                </div>
                <div className="exa-topbar-end">
                    <div className="exa-lang-pills">
                        {['en', 'fr', 'ar'].map(l => (
                            <button key={l} className={`exa-top-icon-btn ${lang === l ? 'active' : ''}`} onClick={() => setLang(l)}>
                                {l === 'ar' ? 'ع' : l === 'fr' ? 'Fr' : 'En'}
                            </button>
                        ))}
                    </div>
                    <button className="exa-top-icon-btn" onClick={toggleTheme}>
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </header>


            {enrollFeedback && (
                <div className={`exa-toast ${enrollFeedback.type}`}>
                    {enrollFeedback.type === 'success' ? <CheckCircle size={16} /> : <X size={16} />}
                    <span>{enrollFeedback.text}</span>
                </div>
            )}

            {/* MAIN */}
            <main className="exa-main" style={{ '--bg-pattern': `url(${patternImg})` }}>

                {/* SIDEBAR */}
                <div className="exa-list">
                    <div className="exa-list-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2>{t.classesTitle}</h2>
                                <p>{t.classesSubtitle}</p>
                            </div>
                            <button className="exa-sidebar-enroll-btn" onClick={handleOpenEnrollModal} title={t.enroll}>
                                <PlusCircle size={20} />
                            </button>
                        </div>

                        {/* ── MULTI-SELECT DROPDOWN (by course title) ── */}
                        <div className="exa-multiselect" ref={dropdownRef}>
                            {/* Selected tags row */}
                            <div className="exa-multiselect-tags" onClick={() => setDropdownOpen(o => !o)}>
                                {selectedCoursTitles.length === 0 ? (
                                    <span className="exa-multiselect-placeholder">
                                        <Filter size={14} /> {t.filterByChapter || 'Filtrer par chapitre...'}
                                    </span>
                                ) : (
                                    selectedCoursTitles.map(titre => (
                                        <span key={titre} className="exa-multiselect-tag">
                                            {titre}
                                            <button
                                                className="exa-multiselect-tag-remove"
                                                onClick={(e) => { e.stopPropagation(); removeTitleTag(titre); }}
                                            >×</button>
                                        </span>
                                    ))
                                )}
                                <ChevronDown size={16} className={`exa-multiselect-chevron ${dropdownOpen ? 'open' : ''}`} />
                            </div>

                            {/* Dropdown panel */}
                            {dropdownOpen && (
                                <div className="exa-multiselect-dropdown">
                                    <div className="exa-multiselect-search">
                                        <Search size={14} />
                                        <input
                                            type="text"
                                            placeholder={t.filter || "Filtrer..."}
                                            value={dropdownSearch}
                                            onChange={e => setDropdownSearch(e.target.value)}
                                            onClick={e => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                    {/* Select All */}
                                    <label className="exa-multiselect-item exa-multiselect-item--all" onClick={toggleSelectAll}>
                                        <span className={`exa-multiselect-checkbox ${allTitlesSelected ? 'checked' : ''}`}>
                                            {allTitlesSelected && '✓'}
                                        </span>
                                        <span>{t.selectAll || 'Sélectionner tout'}</span>
                                    </label>
                                    {/* Course title items */}
                                    {dropdownTitles.map(titre => (
                                        <label key={titre} className="exa-multiselect-item" onClick={() => toggleTitleSelection(titre)}>
                                            <span className={`exa-multiselect-checkbox ${selectedCoursTitles.includes(titre) ? 'checked' : ''}`}>
                                                {selectedCoursTitles.includes(titre) && '✓'}
                                            </span>
                                            <span>{titre}</span>
                                        </label>
                                    ))}
                                    {dropdownTitles.length === 0 && (
                                        <div className="exa-multiselect-empty">{t.noChapterFound || 'Aucun chapitre trouvé'}</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sidebar search */}
                        <div className="exa-filters">
                            <div className="exa-search-bar">
                                <Search size={18} className="exa-search-icon" />
                                <input type="text" placeholder={t.searchClass || "Rechercher une classe..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="exa-search-input" />
                            </div>
                            {/* Filter par matière removed per user request */}
                        </div>
                    </div>

                    <div className="exa-list-scroll">
                        {inscriptionsLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--sc-text-muted)' }}>
                                {t.loading}
                            </div>
                        ) : filteredInscriptions?.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--sc-text-muted)' }}>
                                {myInscriptions.length === 0 
                                    ? "Vous n'êtes inscrit à aucune session pour le moment."
                                    : t.noClassMatchSearch || 'Aucune inscription ne correspond à vos critères.'}
                            </div>
                        ) : filteredInscriptions?.map(ins => {
                            const cl = ins.classe || ins.session?.classe;
                            const badgeTheme = getNiveauColor(cl?.niveau);
                            const subjectNames = cl?.matieres?.length > 0
                                ? cl.matieres.map(m => m.nomMatiere)
                                : [...new Set(cl?.planning?.map(p => typeof p.matiere === 'object' ? p.matiere?.nomMatiere : p.matiere).filter(Boolean) || [])];
                            
                            return (
                                <div key={ins._id}
                                    className={`exa-item ${selectedId === ins._id && !isGlobalView ? 'active' : ''} ${ins.statut === 'en_attente' ? 'pending' : ''}`}
                                    onClick={() => { setSelectedId(ins._id); setSelectedCoursTitles([]); setCoursSearchTerm(''); setSelectedCoursMatiere(''); }}
                                >
                                    <div className="exa-item-img">
                                        <img src={getClasseImage(cl?.nomClasse)} alt={cl?.nomClasse} />
                                        {ins.statut === 'en_attente' && <div className="exa-item-pending-overlay">⏳</div>}
                                    </div>
                                    <div className="exa-item-text">
                                        <div className="exa-item-name">
                                            {ins.session?.nomSession || cl?.nomClasse}
                                            {ins.statut === 'en_attente' && <span className="exa-item-status-tag">En attente</span>}
                                        </div>
                                        {subjectNames.length > 0 && (
                                            <div className="exa-item-subject" title={subjectNames.join(' • ')}>{subjectNames.join(' • ')}</div>
                                        )}
                                        <div className="exa-item-nivel" style={{ color: badgeTheme.color, borderColor: badgeTheme.border }}>
                                            {getNiveauLabel(cl?.niveau)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* DETAIL PANEL */}
                <div className="exa-detail">
                    {inscriptionsLoading ? (
                        <div className="exa-empty">{t.loading}</div>
                    ) : myInscriptions.length === 0 ? (
                        <div className="exa-empty">Vous n'êtes inscrit à aucune session pour le moment.</div>
                    ) : isGlobalView ? (
                        /* ── GLOBAL VIEW ── */
                        <>
                            <div className="exa-hero-container">
                                <div className="exa-hero" style={{ backgroundImage: `url(${libraryImg})` }}>
                                    <div className="exa-hero-overlay" />
                                    <div className="exa-hero-content">
                                        <h2 className="exa-hero-name">
                                            {selectedCoursTitles.length === allCoursTitles.length
                                                ? (t.allChapters || 'Tous les chapitres')
                                                : `${selectedCoursTitles.length} ${t.chaptersSelected || 'chapitres sélectionnés'}`}
                                        </h2>
                                        <div className="exa-hero-meta">
                                            <span className="exa-hero-badge" style={{ color: '#ceaa5f', borderColor: '#ceaa5f' }}>
                                                {activeCours.length} {t.materials || 'supports'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="exa-detail-body">
                                <section className="exa-section">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                                        <h3 className="exa-section-title" style={{ margin: 0 }}>
                                            <BookOpen size={24} strokeWidth={1.5} className="exa-sect-icon" /> {t.courseMaterials || 'Supports de cours'}
                                        </h3>
                                        <div className="exa-course-filters">
                                            <div className="exa-course-search">
                                                <Search size={16} className="exa-search-icon" />
                                                <input type="text" placeholder={t.searchMaterial || "Rechercher un cours..."}
                                                    value={coursSearchTerm}
                                                    onChange={(e) => setCoursSearchTerm(e.target.value)}
                                                    className="exa-course-search-input" />
                                            </div>
                                            <select className="exa-course-select"
                                                value={selectedCoursMatiere}
                                                onChange={(e) => setSelectedCoursMatiere(e.target.value)}>
                                                <option value="">{t.allSubjects || 'Toutes les matières'}</option>
                                                {localCoursSubjectOptions.map(subj => (
                                                    <option key={subj} value={subj}>{subj}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="exa-file-type-filters">
                                        <button className={`exa-type-filter-btn ${selectedFileType === 'ALL' ? 'active' : ''}`} onClick={() => setSelectedFileType('ALL')}>{t.allTypes || 'Tous'}</button>
                                        <button className={`exa-type-filter-btn ${selectedFileType === 'PDF' ? 'active' : ''}`} onClick={() => setSelectedFileType('PDF')}>PDF ({activeCours.filter(c => getFileTypeInfo(c.fichier).type === 'PDF').length})</button>
                                        <button className={`exa-type-filter-btn ${selectedFileType === 'VIDEO' ? 'active' : ''}`} onClick={() => setSelectedFileType('VIDEO')}>Vidéo ({activeCours.filter(c => getFileTypeInfo(c.fichier).type === 'VIDEO').length})</button>
                                        <button className={`exa-type-filter-btn ${selectedFileType === 'AUDIO' ? 'active' : ''}`} onClick={() => setSelectedFileType('AUDIO')}>Audio ({activeCours.filter(c => getFileTypeInfo(c.fichier).type === 'AUDIO').length})</button>
                                    </div>
                                    {activeCours.length === 0 ? (
                                        <p className="exa-empty-text">{t.noMaterialInClass || 'Aucun support dans les classes sélectionnées.'}</p>
                                    ) : displayedCours.length === 0 ? (
                                        <p className="exa-empty-text">{t.noMaterialMatch || 'Aucun support ne correspond à votre recherche.'}</p>
                                    ) : (
                                        <div className="exa-course-grid">
                                            {displayedCours.map(c => {
                                                const fileInfo = getFileTypeInfo(c.fichier);
                                                return (
                                                    <div key={c._id} className="exa-course-grid-card">
                                                        <div className="exa-cgc-main">
                                                            <div className="exa-cgc-icon-wrapper" style={{ backgroundColor: fileInfo.bg }}>
                                                                <fileInfo.icon size={26} color="#ffffff" strokeWidth={1.5} />
                                                                <span className="exa-cgc-icon-label" style={{ color: '#ffffff' }}>{fileInfo.label}</span>
                                                            </div>
                                                            <div className="exa-cgc-info">
                                                                <div className="exa-cgc-header">
                                                                    <h4 className="exa-cgc-title" title={c.titre}>{c.titre}</h4>
                                                                    {c.description && <h5 className="exa-cgc-desc">{c.description}</h5>}
                                                                </div>
                                                                <div className="exa-cgc-meta">
                                                                    {c.matiere?.nomMatiere && (
                                                                        <span className="exa-cgc-matiere-badge">{c.matiere.nomMatiere}</span>
                                                                    )}
                                                                    <span className="exa-cgc-date">{new Date(c.createdAt).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {c.fichier && (
                                                            <div className="exa-cgc-actions">
                                                                {!fileInfo.singleAction && (
                                                                    <button onClick={() => handleDownload(getFileUrl(c.fichier), c.fichier)} className="exa-cgc-action-btn dl-btn">
                                                                        <Download size={14} strokeWidth={2} /> {t.download || 'Download'}
                                                                    </button>
                                                                )}
                                                                <a href={getFileUrl(c.fichier)} target="_blank" rel="noopener noreferrer" className={`exa-cgc-action-btn view-btn ${fileInfo.singleAction ? 'single-action' : ''}`}>
                                                                    <fileInfo.actionIcon size={14} strokeWidth={2} /> {fileInfo.actionText}
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            </div>
                        </>
                    ) : selectedInscription ? (
                        /* ── SINGLE INSCRIPTION VIEW ── */
                        <>
                            <div className="exa-hero-container">
                                <div className="exa-hero" style={{ backgroundImage: `url(${getClasseImage(selectedClass?.nomClasse)})` }}>
                                    <div className="exa-hero-overlay" />
                                    <div className="exa-hero-content">
                                        <h2 className="exa-hero-name">{selectedInscription.session?.nomSession || selectedClass?.nomClasse}</h2>
                                        <div className="exa-hero-meta">
                                            {selectedClass?.niveau && (
                                                <span className="exa-hero-badge" style={{ color: getNiveauColor(selectedClass.niveau).color, borderColor: getNiveauColor(selectedClass.niveau).border }}>
                                                    {getNiveauLabel(selectedClass.niveau)}
                                                </span>
                                            )}
                                            <span className="exa-hero-year">هـ {selectedClass?.anneeScolaire}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="exa-detail-body">
                                {selectedInscription.statut === 'en_attente' && (
                                    <div className="exa-status-banner warning" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <Clock size={24} />
                                            <div>
                                                <strong>{t.pendingValidation || 'Inscription en cours de validation'}</strong>
                                                <p>{t.pendingValidationDesc || "Vous aurez accès aux cours et au planning une fois que votre règlement sera validé par l'administration."}</p>
                                            </div>
                                        </div>

                                        {/* Proposer le bouton Stripe même si en attente */}
                                        {(() => {
                                            const prixSession = selectedInscription.session?.montant || 0;
                                            const totalVerse = selectedInscription.montantVerseTotal || 0;
                                            const resteAPayer = Math.max(0, prixSession - totalVerse);

                                            if (resteAPayer > 0 && prixSession > 0) {
                                                return (
                                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ fontSize: '0.9rem' }}>
                                                            <span>Reste à payer : <strong>{resteAPayer} TND</strong></span>
                                                        </div>
                                                        <button 
                                                            className="exa-modal-btn exa-modal-btn--primary" 
                                                            style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                                            onClick={() => {
                                                                setPaymentInscription(selectedInscription);
                                                                setPaymentModalOpen(true);
                                                            }}
                                                        >
                                                            Régler par Carte (En ligne)
                                                        </button>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                )}

                                {selectedInscription.statut === 'approuvee' ? (
                                    <>
                                        {/* Status de Paiement Banner */}
                                        {(() => {
                                            const prixSession = selectedInscription.session?.montant || 0;
                                            const totalVerse = selectedInscription.montantVerseTotal || 0;
                                            const resteAPayer = Math.max(0, prixSession - totalVerse);

                                            if (resteAPayer > 0 && prixSession > 0) {
                                                return (
                                                    <div className="exa-status-banner error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', paddingColor: '#ef4444' }}>
                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                            <Archive size={24} color="#ef4444" />
                                                            <div>
                                                                <strong style={{ color: '#ef4444' }}>Reste à payer : {resteAPayer} TND</strong>
                                                                <p style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '0.85rem' }}>Vous avez payé {totalVerse} TND sur un total de {prixSession} TND.</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            className="exa-modal-btn exa-modal-btn--primary" 
                                                            style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                                            onClick={() => {
                                                                setPaymentInscription(selectedInscription);
                                                                setPaymentModalOpen(true);
                                                            }}
                                                        >
                                                            Payer maintenant
                                                        </button>
                                                    </div>
                                                );
                                            } else if (prixSession > 0 && resteAPayer === 0) {
                                                return (
                                                    <div className="exa-status-banner success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                        <CheckCircle size={24} color="#10b981" />
                                                        <div>
                                                            <strong style={{ color: '#10b981' }}>Paiement complet</strong>
                                                            <p style={{ color: 'rgba(16, 185, 129, 0.8)', fontSize: '0.85rem' }}>Vous avez réglé la totalité des frais ({prixSession} TND).</p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {/* Schedule */}
                                        <section className="exa-section">
                                            <h3 className="exa-section-title"><BookOpen size={24} strokeWidth={1.5} className="exa-sect-icon" /> {t.schedule}</h3>


                                            {selectedClass?.planning?.length > 0 ? (
                                                <div className="exa-schedule">
                                                    {orderedDays.map(jour => {
                                                        const slots = selectedClass.planning.filter(p => p.jour === jour).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
                                                        if (!slots.length) return null;
                                                        return (
                                                            <div key={jour} className="exa-day-group">
                                                                <div className="exa-day-header"><span className="exa-dot" /> {t.days?.[jour] || jour}</div>
                                                                {slots.map((slot, i) => (
                                                                    <div key={i} className="exa-slot">
                                                                        <div className="exa-slot-right"><Clock size={16} /> {slot.heureDebut} - {slot.heureFin}</div>
                                                                        <div className="exa-slot-left">{typeof slot.matiere === 'object' ? slot.matiere?.nomMatiere : slot.matiere}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="exa-empty-text">{t.noSchedule}</p>
                                            )}
                                        </section>

                                        {/* Supports de cours */}
                                        <section className="exa-section">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                                                <h3 className="exa-section-title" style={{ margin: 0 }}>
                                                    <BookOpen size={24} strokeWidth={1.5} className="exa-sect-icon" /> {t.courseMaterials || 'Supports de cours'}
                                                </h3>
                                                <div className="exa-course-filters">
                                                    <div className="exa-course-search">
                                                        <Search size={16} className="exa-search-icon" />
                                                        <input type="text" placeholder={t.searchMaterial || "Rechercher un cours..."}
                                                            value={coursSearchTerm}
                                                            onChange={(e) => setCoursSearchTerm(e.target.value)}
                                                            className="exa-course-search-input" />
                                                    </div>
                                                    <select className="exa-course-select" value={selectedCoursMatiere} onChange={(e) => setSelectedCoursMatiere(e.target.value)}>
                                                        <option value="">{t.allSubjects || 'Toutes les matières'}</option>
                                                        {localCoursSubjectOptions.map(subj => <option key={subj} value={subj}>{subj}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="exa-file-type-filters">
                                                <button className={`exa-type-filter-btn ${selectedFileType === 'ALL' ? 'active' : ''}`} onClick={() => setSelectedFileType('ALL')}>{t.allTypes || 'Tous'}</button>
                                                <button className={`exa-type-filter-btn ${selectedFileType === 'PDF' ? 'active' : ''}`} onClick={() => setSelectedFileType('PDF')}>PDF ({activeCours.filter(c => getFileTypeInfo(c.fichier).type === 'PDF').length})</button>
                                                <button className={`exa-type-filter-btn ${selectedFileType === 'VIDEO' ? 'active' : ''}`} onClick={() => setSelectedFileType('VIDEO')}>Vidéo ({activeCours.filter(c => getFileTypeInfo(c.fichier).type === 'VIDEO').length})</button>
                                                <button className={`exa-type-filter-btn ${selectedFileType === 'AUDIO' ? 'active' : ''}`} onClick={() => setSelectedFileType('AUDIO')}>Audio ({activeCours.filter(c => getFileTypeInfo(c.fichier).type === 'AUDIO').length})</button>
                                            </div>
                                            {activeCours.length === 0 ? (
                                                <p className="exa-empty-text">{t.noMaterialForClass || 'Aucun support de cours pour cette classe.'}</p>
                                            ) : displayedCours.length === 0 ? (
                                                <p className="exa-empty-text">{t.noMaterialMatch || 'Aucun support ne correspond à votre recherche.'}</p>
                                            ) : (
                                                <>
                                                    {(() => {
                                                        const renderCourseCard = (c) => {
                                                            const fileInfo = getFileTypeInfo(c.fichier);
                                                            return (
                                                                <div key={c._id} className="exa-course-grid-card">
                                                                    <div className="exa-cgc-main">
                                                                        <div className="exa-cgc-icon-wrapper" style={{ backgroundColor: fileInfo.bg }}>
                                                                            <fileInfo.icon size={26} color="#ffffff" strokeWidth={1.5} />
                                                                            <span className="exa-cgc-icon-label" style={{ color: '#ffffff' }}>{fileInfo.label}</span>
                                                                        </div>
                                                                        <div className="exa-cgc-info">
                                                                            <div className="exa-cgc-header">
                                                                                <h4 className="exa-cgc-title" title={c.titre}>{c.titre}</h4>
                                                                                {c.description && <h5 className="exa-cgc-desc">{c.description}</h5>}
                                                                            </div>
                                                                            <div className="exa-cgc-meta">
                                                                                {c.matiere?.nomMatiere && (
                                                                                    <span className="exa-cgc-matiere-badge">{c.matiere.nomMatiere}</span>
                                                                                )}
                                                                                <span className="exa-cgc-date">{new Date(c.createdAt).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {c.fichier && (
                                                                        <div className="exa-cgc-actions">
                                                                            {!isGlobalView && selectedInscription && (
                                                                                <button 
                                                                                    className={`exa-course-toggle-btn ${selectedInscription.coursTermines?.includes(c._id) ? 'active' : ''}`}
                                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleCours(selectedInscription._id, c._id); }}
                                                                                    title={selectedInscription.coursTermines?.includes(c._id) ? "Marquer comme non terminé" : "Marquer comme terminé"}
                                                                                >
                                                                                    {selectedInscription.coursTermines?.includes(c._id) ? <CheckCircle size={18} fill="currentColor" color="white"/> : <div className="exa-check-empty" />}
                                                                                </button>
                                                                            )}
                                                                            {!fileInfo.singleAction && (
                                                                                <button onClick={() => handleDownload(getFileUrl(c.fichier), c.fichier)} className="exa-cgc-action-btn dl-btn">
                                                                                    <Download size={14} strokeWidth={2} /> {t.download || 'Download'}
                                                                                </button>
                                                                            )}
                                                                            <a href={getFileUrl(c.fichier)} target="_blank" rel="noopener noreferrer" className={`exa-cgc-action-btn view-btn ${fileInfo.singleAction ? 'single-action' : ''}`}>
                                                                                <fileInfo.actionIcon size={14} strokeWidth={2} /> {fileInfo.actionText}
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        };

                                                        if (selectedClass?.chapitresTemplate?.length > 0 && !isGlobalView) {
                                                            const sansChapitre = displayedCours.filter(c => !c.chapitreRef);
                                                            return (
                                                                <div className="exa-chapters-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', padding: '0' }}>
                                                                    {selectedClass.chapitresTemplate.map((chap, index) => {
                                                                        const chapCourses = displayedCours.filter(c => c.chapitreRef === chap._id);
                                                                        if (chapCourses.length === 0) return null;
                                                                        
                                                                        return (
                                                                            <div key={chap._id} className="exa-chapter-section" style={{ display: 'block' }}>
                                                                                <div style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                                                                                    <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ceaa5f', margin: '0 0 4px 0', fontFamily: 'Amiri, Cairo, sans-serif' }}>
                                                                                        {index + 1}. {chap.titre}
                                                                                    </h4>
                                                                                    {chap.description && (
                                                                                        <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: '4px 0 0 0', fontFamily: 'Inter, sans-serif' }}>
                                                                                            {chap.description}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="exa-course-grid">
                                                                                    {chapCourses.map(renderCourseCard)}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    
                                                                    {sansChapitre.length > 0 && (
                                                                        <div className="exa-chapter-section" style={{ display: 'block' }}>
                                                                            <div style={{ marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                                                                                <h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ceaa5f', margin: '0 0 4px 0', fontFamily: 'Amiri, Cairo, sans-serif' }}>
                                                                                    Autres supports
                                                                                </h4>
                                                                                <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: '4px 0 0 0', fontFamily: 'Inter, sans-serif' }}>
                                                                                    Supports non rattachés à un chapitre ({sansChapitre.length})
                                                                                </p>
                                                                            </div>
                                                                            <div className="exa-course-grid">
                                                                                {sansChapitre.map(renderCourseCard)}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        }

                                                        // Default flat view for global view or classes without chapters
                                                        return (
                                                            <div className="exa-course-grid">
                                                                {displayedCours.map(renderCourseCard)}
                                                            </div>
                                                        );
                                                    })()}
                                                </>
                                            )}
                                        </section>
                                    </>
                                ) : selectedInscription.statut === 'refusee' ? (
                                    <div className="exa-status-banner error">
                                        <XCircle size={24} color="#ef4444" />
                                        <div>
                                            <strong>Inscription refusée</strong>
                                            <p>Veuillez contacter l'administration pour plus de détails.</p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                        </>
                    ) : (
                        <div className="exa-empty">{t.myClasses}</div>
                    )}
                </div>

            </main>
        </div>
    );
}

export default StudentInscriptions;
