import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getSessionById } from '../features/sessions/sessionSlice';
import { getInscriptionsParSession, reset as resetInscriptions } from '../features/inscriptions/inscriptionSlice';
import { getCours } from '../features/cours/coursSlice';
import { ArrowLeft, Clock, BookOpen, Plus, FileText, Video, Headphones, ExternalLink, ChevronDown, ChevronUp, Calendar, Link, PlayCircle, Music, Users, ShieldCheck } from 'lucide-react';
import AddDocumentModal from '../components/AddDocumentModal';
import './TeacherSessionDetails.css';

function TeacherSessionDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const { session, isLoading, isError, message } = useSelector((state) => state.sessions);
    const { cours } = useSelector((state) => state.cours);
    const { inscriptions, isLoading: inscriptionsLoading } = useSelector((state) => state.inscriptions);

    const [activeTab, setActiveTab] = useState('programme'); // 'programme' or 'etudiants'

    const [openChapterIndex, setOpenChapterIndex] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState(null);

    // Helper to get icon and color based on resource type
    const getResourceIcon = (doc) => {
        // Checking doc.typeFichier (from backend) or extensions in doc.fichier
        const type = doc.typeFichier?.toLowerCase() || '';
        const url = doc.fichier?.toLowerCase() || '';

        if (type === 'pdf' || url.endsWith('.pdf')) {
            return { icon: <FileText size={18} />, color: '#EF4444' }; // Red
        }
        if (type === 'video' || url.endsWith('.mp4') || url.endsWith('.mov')) {
            return { icon: <PlayCircle size={18} />, color: '#8B5CF6' }; // Purple
        }
        if (type === 'audio' || url.endsWith('.mp3') || url.endsWith('.wav')) {
            return { icon: <Music size={18} />, color: '#F59E0B' }; // Orange/Yellow
        }
        if (url.startsWith('http')) {
            return { icon: <Link size={18} />, color: '#3B82F6' }; // Blue
        }

        return { icon: <FileText size={18} />, color: '#10b981' }; // Default Emerald
    };

    useEffect(() => {
        if (!user || user.role !== 'teacher') {
            navigate('/login');
            return;
        }
        dispatch(getSessionById(id));
        dispatch(getCours({ sessionId: id }));
        dispatch(getInscriptionsParSession(id));

        return () => {
            dispatch(resetInscriptions());
        };
    }, [dispatch, id, user, navigate]);

    const toggleChapter = (index) => {
        setOpenChapterIndex(openChapterIndex === index ? null : index);
    };

    const handleAddDocument = (chapitre) => {
        setSelectedChapter(chapitre);
        setIsModalOpen(true);
    };

    if (isLoading) return <div className="tsd-loading">Chargement des détails de la session...</div>;
    if (isError) return <div className="tsd-error">Erreur: {message}</div>;
    if (!session) return <div className="tsd-error">Session non trouvée.</div>;

    const chapitres = session.classe?.chapitresTemplate || [];

    return (
        <div className="tsd-page">
            {/* Header / Navigation */}
            <header className="tsd-header">
                <div style={{ padding: '0 2.5rem', width: '100%' }}>
                    <button className="tsd-back-btn" onClick={() => navigate('/teacher')} style={{ marginBottom: '1rem' }}>
                        <ArrowLeft size={16} /> Retour aux sessions
                    </button>
                </div>
                
                <div className="tsd-container">
                    <div className="tsd-header-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div className="tsd-header-bismillah" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ color: '#fbbf24', fontSize: '2.5rem', fontFamily: 'Amiri, serif', fontWeight: 'bold' }}>بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
                        </div>
                        
                        <div className="tsd-header-info">
                            <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', color: '#ffffff' }}>{session.nomSession}</h1>
                            <div className="tsd-badges">
                                <span className="tsd-badge tsd-badge-class">
                                    {session.classe?.nomClasse} - {session.classe?.niveau}
                                </span>
                                <span className="tsd-badge tsd-badge-time">
                                    <Calendar size={14} /> {session.duree || 'Durée non spécifiée'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="tsd-content tsd-container">
                <div className="tsd-tabs">
                    <button 
                        className={`tsd-tab-btn ${activeTab === 'programme' ? 'active' : ''}`}
                        onClick={() => setActiveTab('programme')}
                    >
                        <BookOpen size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Programme
                    </button>
                    <button 
                        className={`tsd-tab-btn ${activeTab === 'etudiants' ? 'active' : ''}`}
                        onClick={() => setActiveTab('etudiants')}
                    >
                        <Users size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Étudiants ({inscriptions?.length || 0})
                    </button>
                </div>

                {activeTab === 'programme' ? (
                    <div className="tsd-programme-view">
                        <div className="tsd-section-header">
                            <h2 style={{ color: '#f8fafc', fontSize: '1.5rem' }}>Programme des Chapitres</h2>
                        </div>

                        {chapitres.length === 0 ? (
                            <div className="tsd-empty-state">
                                <FileText size={48} />
                                <h3>Aucun chapitre défini</h3>
                                <p>Cette classe n'a pas de programme configuré. Veuillez contacter l'administration.</p>
                            </div>
                        ) : (
                            <div className="tsd-chapters-list">
                                {chapitres.map((chapitre, index) => (
                                    <div 
                                        key={chapitre._id || index} 
                                        className={`tsd-chapter-card ${openChapterIndex === index ? 'open' : ''}`}
                                    >
                                        <div className="tsd-chapter-header" onClick={() => toggleChapter(index)}>
                                            <div className="tsd-chapter-title-group">
                                                <div className="tsd-chapter-number">{index + 1}</div>
                                                <div>
                                                    <h3 className="tsd-chapter-title">{chapitre.titre}</h3>
                                                    <p className="tsd-chapter-desc" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                                        {cours?.filter(c => c.chapitreRef === chapitre._id).length || 0} ressources
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="tsd-chapter-toggle">
                                                {openChapterIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </div>

                                        {/* Accordion Content (Documents) */}
                                        {openChapterIndex === index && (
                                            <div className="tsd-chapter-body">
                                                {(() => {
                                                    const chapCours = cours?.filter(c => c.chapitreRef === chapitre._id) || [];
                                                    return chapCours.length === 0 ? (
                                                        <div className="tsd-documents-empty">
                                                            <p>Aucun document pour ce chapitre pour l'instant.</p>
                                                        </div>
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
                                                                        </div>
                                                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="tsd-doc-link">
                                                                            Ouvrir
                                                                        </a>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}
                                                
                                                <button 
                                                    className="tsd-add-doc-btn" 
                                                    onClick={() => handleAddDocument(chapitre)}
                                                >
                                                    <Plus size={16} /> Ajouter un document (PDF, Audio, Vidéo, Lien)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="tsd-students-view">
                        <div className="tsd-section-header">
                            <h2 style={{ color: '#f8fafc', fontSize: '1.5rem' }}>Étudiants Inscrits</h2>
                            <p style={{ color: '#94a3b8' }}>Liste des élèves ayant rejoint cette session.</p>
                        </div>

                        {inscriptionsLoading ? (
                            <div className="tsd-loading-small" style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>
                                Chargement de la liste des étudiants...
                            </div>
                        ) : inscriptions?.length === 0 ? (
                            <div className="tsd-empty-state">
                                <Users size={48} />
                                <h3>Aucun étudiant inscrit</h3>
                                <p>Il n'y a pas encore d'étudiants inscrits à cette session.</p>
                            </div>
                        ) : (
                            <div className="tsd-students-list">
                                {inscriptions.map((ins) => (
                                    <div key={ins._id} className="tsd-student-item">
                                        <div className="tsd-student-avatar">
                                            {ins.etudiant?.profileImage ? (
                                                <img 
                                                    src={ins.etudiant.profileImage.startsWith('http') 
                                                        ? ins.etudiant.profileImage 
                                                        : `http://localhost:5000${ins.etudiant.profileImage}`} 
                                                    alt="Profile" 
                                                />
                                            ) : (
                                                <Users size={20} />
                                            )}
                                        </div>
                                        <div className="tsd-student-info">
                                            <h4>{ins.etudiant?.firstName} {ins.etudiant?.lastName}</h4>
                                            <p>{ins.etudiant?.email}</p>
                                        </div>
                                        <div className="tsd-student-status">
                                            <span className={`tsd-status-badge ${
                                                ins.statutPaiement === 'Payé' ? 'tsd-status-paye' : 
                                                ins.statutPaiement === 'Avance' ? 'tsd-status-avance' : 
                                                'tsd-status-non-paye'
                                            }`}>
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
            </main>

            <AddDocumentModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                sessionId={id} 
                chapitre={selectedChapter} 
            />
        </div>
    );
}

export default TeacherSessionDetails;
