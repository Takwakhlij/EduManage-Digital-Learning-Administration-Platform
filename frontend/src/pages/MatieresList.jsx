
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMatieres, deleteMatiere, reset } from '../features/matieres/matiereSlice';
import CreateMatiereModal from '../components/CreateMatiereModal';
import EditMatiereModal from '../components/EditMatiereModal';
import './ClassesList.css'; // Reusing ClassesList CSS for consistency
import './MatieresList.css'; // Lighter gold/green theme for matieres

/* ── Inline SVG Icons ── */
const FaPlus = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const FaTrash = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const FaEdit = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const IconBook = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
);

const Spinner = () => <div className="spinner"></div>;

function MatieresList() {
    const dispatch = useDispatch();
    const { matieres, isLoading, isError, message } = useSelector((state) => state.matieres);
    const { user } = useSelector((state) => state.auth);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [matiereToDelete, setMatiereToDelete] = useState(null);
    const [matiereToEdit, setMatiereToEdit] = useState(null);

    useEffect(() => {
        if (isError) {
            console.error(message);
        }
        dispatch(getMatieres());

        return () => {
            console.log('Unmounting MatieresList, resetting state');
            dispatch(reset());
        };
    }, []); // Empty dependency array to run only once on mount

    useEffect(() => {
        console.log('Matieres state updated:', matieres);
    }, [matieres]);

    const handleDelete = (matiere) => {
        setMatiereToDelete(matiere);
        setShowDeleteModal(true);
    };

    const handleEdit = (matiere) => {
        setMatiereToEdit(matiere);
        setShowEditModal(true);
    };

    const confirmDelete = () => {
        if (matiereToDelete) {
            dispatch(deleteMatiere(matiereToDelete._id));
            setShowDeleteModal(false);
            setMatiereToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setMatiereToDelete(null);
    };

    if (isLoading && (!matieres || matieres.length === 0)) {
        return (
            <div className="loading-container">
                <Spinner />
                <p>Chargement des matières...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="error-container" style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                <p>Une erreur est survenue : {message}</p>
            </div>
        );
    }

    return (
        <div className="classes-container">
            <div className="classes-header-card">
                <div className="header-content">
                    <h1>Gestion des Matières</h1>
                    <p>Gérez les matières enseignées dans l'établissement.</p>
                </div>
            </div>

            {/* Debug section removed */}

            <div className="classes-grid">
                {/* Create Card */}
                {user && user.role === 'admin' && (
                    <div
                        className="classe-card create-card"
                        onClick={() => setShowCreateModal(true)}
                        role="button"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="create-icon-wrapper">
                            <FaPlus />
                        </div>
                        <h3>Ajouter une matière</h3>
                        <p>Créer une nouvelle matière</p>
                    </div>
                )}

                {/* Matiere Cards */}
                {matieres.length > 0 ? (
                    matieres.map((matiere) => (
                        <div key={matiere._id} className="classe-card">
                            <div className="classe-card-header matiere-card-header">
                                <div className="create-icon-wrapper matiere-icon-wrapper" style={{ width: '40px', height: '40px' }}>
                                    <IconBook />
                                </div>
                                <div className="matiere-title-wrapper" style={{ flex: 1 }}>
                                    <h3 className="matiere-title" style={{ margin: 0, fontSize: '1.2rem' }}>{matiere.nomMatiere}</h3>
                                </div>
                                <div className="matiere-actions" style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn-icon edit edit-matiere"
                                        onClick={(e) => { e.stopPropagation(); handleEdit(matiere); }}
                                        title="Modifier"
                                        style={{ color: '#c9a961' }}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="btn-icon delete delete-matiere"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(matiere); }}
                                        title="Supprimer"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>

                            <div className="classe-card-body" style={{ marginTop: '15px' }}>
                                <div className="matiere-details" style={{ fontSize: '13px', color: '#4b5563' }}>
                                    <p>
                                        <strong>Classes:</strong> {
                                            matiere.classes && matiere.classes.length > 0 
                                            ? matiere.classes.map(c => c.nomClasse).join(', ') 
                                            : (matiere.classe?.nomClasse || <span style={{ color: 'red' }}>Non assignée</span>)
                                        }
                                    </p>
                                    <p style={{ marginTop: '5px' }}>
                                        <strong>Programme:</strong> {matiere.programme?.length || 0} chapitres définis
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-classes">
                        <p>Aucune matière disponible.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateMatiereModal onClose={() => setShowCreateModal(false)} />
            )}

            {showEditModal && (
                <EditMatiereModal 
                    matiere={matiereToEdit} 
                    onClose={() => {
                        setShowEditModal(false);
                        setMatiereToEdit(null);
                    }} 
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={cancelDelete}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Confirmer la suppression</h2>
                        <p>Êtes-vous sûr de vouloir supprimer la matière « {matiereToDelete?.nomMatiere} » ?</p>
                        <p className="warning-text">Cette action est irréversible.</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={cancelDelete}>Annuler</button>
                            <button className="btn btn-danger" onClick={confirmDelete}>Supprimer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MatieresList;
