import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getClasses, deleteClasse, reset } from '../features/classes/classeSlice';
import CreateClasseModal from '../components/CreateClasseModal';
import EditClasseModal from '../components/EditClasseModal';
import './ClassesList.css';

/* ── Inline SVG Icons ── */
const FaPlus = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const FaEdit = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const FaTrash = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const FaEye = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const FaGraduationCap = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
);

const FaClose = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const IconBook = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
);

const IconUser = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const IconUsers = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const IconCalendar = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const IconInfo = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);


/* ════════════════════════════════════════════════════
   DETAILS MODAL COMPONENT
   ════════════════════════════════════════════════════ */
function ClasseDetailsModal({ classe, onClose, onEdit }) {
    if (!classe) return null;

    const niveauColors = {
        'Débutant': { bg: '#f0fdf4', border: '#86efac', text: '#15803d' },
        'Intermédiaire': { bg: '#fffbeb', border: '#fcd34d', text: '#b45309' },
        'Avancé': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    };
    const nColor = niveauColors[classe.niveau] || niveauColors['Débutant'];

    // Jours de la semaine pour le planning (données futures)
    const joursPlanning = ['Samedi', 'Dimanche', 'Lundi', 'Mardi', 'Mercredi'];

    return (
        <div className="details-modal-overlay" onClick={onClose}>
            <div className="details-modal" onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="details-modal-header">
                    <div className="details-modal-title-area">
                        <span
                            className="details-niveau-pill"
                            style={{ background: nColor.bg, borderColor: nColor.border, color: nColor.text }}
                        >
                            {classe.niveau}
                        </span>
                        <h2 className="details-modal-title">{classe.nomClasse}</h2>
                        <p className="details-modal-sub">Année scolaire : {classe.anneeScolaire}</p>
                    </div>
                    <button className="details-close-btn" onClick={onClose} title="Fermer">
                        <FaClose />
                    </button>
                </div>

                {/* ── Arabic ornament ── */}
                <div className="details-ornament">
                    <span>❖</span>
                    <span style={{ fontFamily: "'Amiri', serif", fontSize: '13px', color: 'var(--gold-dark)' }}>
                        بسم الله الرحمن الرحيم
                    </span>
                    <span>❖</span>
                </div>

                {/* ── Body Grid ── */}
                <div className="details-modal-body">

                    {/* Section: Informations générales */}
                    <div className="details-section">
                        <div className="details-section-title">
                            <IconInfo /> Informations générales
                        </div>
                        <div className="details-info-grid">
                            <div className="details-info-item">
                                <span className="details-info-label">Nom de la classe</span>
                                <span className="details-info-value">{classe.nomClasse}</span>
                            </div>
                            <div className="details-info-item">
                                <span className="details-info-label">Niveau</span>
                                <span className="details-info-value">{classe.niveau}</span>
                            </div>
                            <div className="details-info-item">
                                <span className="details-info-label">Année scolaire</span>
                                <span className="details-info-value">{classe.anneeScolaire}</span>
                            </div>
                            <div className="details-info-item">
                                <span className="details-info-label">Créée le</span>
                                <span className="details-info-value">
                                    {new Date(classe.createdAt).toLocaleDateString('fr-FR', {
                                        day: '2-digit', month: 'long', year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Section: Enseignants */}
                    <div className="details-section">
                        <div className="details-section-title">
                            <IconUser /> Enseignants
                        </div>
                        {classe.professeurs && classe.professeurs.length > 0 ? (
                            <div className="details-teachers-list">
                                {classe.professeurs.map((prof, i) => (
                                    <div key={i} className="details-teacher-chip">
                                        <div className="details-teacher-avatar">
                                            {typeof prof === 'object'
                                                ? (prof.firstName?.charAt(0) || prof.name?.charAt(0) || '?')
                                                : (i + 1)}
                                        </div>
                                        <span>
                                            {typeof prof === 'object'
                                                ? `${prof.firstName || ''} ${prof.lastName || ''}`.trim()
                                                : `Enseignant ${i + 1}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="details-empty-slot">
                                <IconUser />
                                <span>Aucun enseignant assigné pour le moment</span>
                            </div>
                        )}
                    </div>

                    {/* Section: Matières */}
                    <div className="details-section">
                        <div className="details-section-title">
                            <IconBook /> Matières
                        </div>
                        {classe.matieres && classe.matieres.length > 0 ? (
                            <div className="details-matieres-list">
                                {classe.matieres.map((mat, i) => (
                                    <span key={i} className="details-matiere-tag">
                                        {typeof mat === 'object' ? mat.nomMatiere || mat.nom || `Matière ${i + 1}` : `Matière ${i + 1}`}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="details-empty-slot">
                                <IconBook />
                                <span>Aucune matière assignée pour le moment</span>
                            </div>
                        )}
                    </div>

                    {/* Section: Élèves */}
                    <div className="details-section">
                        <div className="details-section-title">
                            <IconUsers /> Élèves inscrits
                        </div>
                        <div className="details-stat-row">
                            <div className="details-stat-box">
                                <span className="details-stat-number">
                                    {classe.eleves?.length ?? 0}
                                </span>
                                <span className="details-stat-label">Total élèves</span>
                            </div>
                            <div className="details-stat-box">
                                <span className="details-stat-number">
                                    {classe.professeurs?.length ?? 0}
                                </span>
                                <span className="details-stat-label">Enseignants</span>
                            </div>
                            <div className="details-stat-box">
                                <span className="details-stat-number">
                                    {classe.matieres?.length ?? 0}
                                </span>
                                <span className="details-stat-label">Matières</span>
                            </div>
                        </div>
                    </div>

                    {/* Section: Planning */}
                    <div className="details-section">
                        <div className="details-section-title">
                            <IconCalendar /> Planning hebdomadaire
                        </div>
                        {classe.planning && classe.planning.length > 0 ? (
                            <div className="details-planning-grid">
                                {classe.planning.map((session, i) => (
                                    <div key={i} className="details-planning-slot">
                                        <span className="planning-day">{session.jour}</span>
                                        <span className="planning-time">{session.heureDebut} – {session.heureFin}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="details-planning-week">
                                {joursPlanning.map(jour => (
                                    <div key={jour} className="details-planning-day-col">
                                        <div className="planning-day-label">{jour}</div>
                                        <div className="planning-day-empty">—</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {(!classe.planning || classe.planning.length === 0) && (
                            <p className="details-planning-note">
                                Le planning sera disponible une fois la fonctionnalité activée.
                            </p>
                        )}
                    </div>

                </div>

                {/* ── Footer ── */}
                <div className="details-modal-footer">
                    <button className="details-btn-close" onClick={onClose}>Fermer</button>
                    <button
                        className="details-btn-edit"
                        onClick={() => { onClose(); onEdit(classe); }}
                    >
                        <FaEdit /> Modifier la classe
                    </button>
                </div>
            </div>
        </div>
    );
}


/* ════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════ */


function ClassesList() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { classes, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.classes
    );
    const { user } = useSelector((state) => state.auth);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingClasse, setEditingClasse] = useState(null); // Added state for edit modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [classeToDelete, setClasseToDelete] = useState(null);
    const [selectedClasse, setSelectedClasse] = useState(null); // for details modal

    useEffect(() => {
        if (isError) console.error(message);
        dispatch(getClasses());
        return () => { dispatch(reset()); };
    }, [dispatch, isError, message]);

    const handleDelete = (classe) => { setClasseToDelete(classe); setShowDeleteModal(true); };
    const confirmDelete = () => {
        if (classeToDelete) {
            dispatch(deleteClasse(classeToDelete._id));
            setShowDeleteModal(false);
            setClasseToDelete(null);
        }
    };
    const cancelDelete = () => { setShowDeleteModal(false); setClasseToDelete(null); };

    const handleEdit = (classe) => {
        setEditingClasse(classe);
    };

    const handleViewDetails = (classe) => setSelectedClasse(classe);
    const closeDetails = () => setSelectedClasse(null);

    // Don't show full loading spinner for just open/close modal interactions if data is already loaded,
    // but do show if initial load.
    if (isLoading && (!classes || classes.length === 0)) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Chargement...</p>
            </div>
        );
    }

    return (
        <div className="classes-container">
            <div className="classes-header-card">
                <div className="header-content">
                    <h1>Gestion des Classes</h1>
                    <p>Retrouvez et gérez l'ensemble des classes de l'association.</p>
                </div>
            </div>

            <div className="classes-grid">
                {/* ── Create Class Card (Admin Only) ── */}
                {user && user.role === 'admin' && (
                    <div
                        className="classe-card create-card"
                        onClick={() => setShowCreateModal(true)} // Updated onClick
                        role="button"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="create-icon-wrapper">
                            <FaPlus size={32} />
                        </div>
                        <h3>Créer une classe</h3>
                    </div>
                )}

                {/* ── Classes List ── */}
                {classes && classes.map((classe) => (
                    <div key={classe._id} className="classe-card">
                        <div className="classe-card-header">
                            <h3>{classe.nomClasse}</h3>
                            <span className={`niveau-badge niveau-${classe.niveau?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}>
                                {classe.niveau}
                            </span>
                        </div>

                        <div className="classe-card-body">
                            <div className="classe-info">
                                <span className="info-label">Année scolaire :</span>
                                <span className="info-value">{classe.anneeScolaire}</span>
                            </div>
                            <div className="classe-info">
                                <span className="info-label">Créé le :</span>
                                <span className="info-value">
                                    {new Date(classe.createdAt).toLocaleDateString('fr-FR')}
                                </span>
                            </div>
                            {classe.professeurs && classe.professeurs.length > 0 && (
                                <div className="classe-info">
                                    <span className="info-label">Enseignants :</span>
                                    <span className="info-value">{classe.professeurs.length}</span>
                                </div>
                            )}
                            {classe.matieres && classe.matieres.length > 0 && (
                                <div className="classe-info">
                                    <span className="info-label">Matières :</span>
                                    <span className="info-value">{classe.matieres.length}</span>
                                </div>
                            )}
                        </div>

                        {/* ── Actions ── */}
                        <div className="classe-card-actions">
                            {/* 👁 Voir détails — available to all */}
                            <button
                                type="button"
                                className="btn-icon btn-view"
                                onClick={() => handleViewDetails(classe)}
                                title="Voir les détails"
                            >
                                <FaEye />
                            </button>

                            {user && user.role === 'admin' && (
                                <>
                                    <button
                                        type="button"
                                        className="btn-icon btn-edit"
                                        title="Modifier"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingClasse(classe); // Open edit modal
                                        }}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-icon btn-delete"
                                        onClick={() => handleDelete(classe)}
                                        title="Supprimer"
                                    >
                                        <FaTrash />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Empty State (Only if no classes and NOT admin, since admin sees Create Card) ── */}
            {(!classes || classes.length === 0) && user?.role !== 'admin' && (
                <div className="empty-state">
                    <FaGraduationCap size={64} />
                    <h2>Aucune classe trouvée</h2>
                    <p>Aucune classe n'a encore été créée.</p>
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={cancelDelete}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Confirmer la suppression</h2>
                        <p>Êtes-vous sûr de vouloir supprimer la classe « {classeToDelete?.nomClasse} » ?</p>
                        <p className="warning-text">Cette action est irréversible.</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={cancelDelete}>Annuler</button>
                            <button className="btn btn-danger" onClick={confirmDelete}>Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedClasse && (
                <ClasseDetailsModal
                    classe={selectedClasse}
                    onClose={closeDetails}
                    onEdit={handleEdit}
                />
            )}

            {/* Modal de création */}
            {showCreateModal && (
                <CreateClasseModal onClose={() => setShowCreateModal(false)} />
            )}

            {/* Modal de modification */}
            {editingClasse && (
                <EditClasseModal
                    classe={editingClasse}
                    onClose={() => setEditingClasse(null)}
                />
            )}
        </div>
    );
}

export default ClassesList;
