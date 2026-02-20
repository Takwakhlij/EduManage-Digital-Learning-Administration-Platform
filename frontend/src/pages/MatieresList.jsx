
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMatieres, deleteMatiere, reset } from '../features/matieres/matiereSlice';
import CreateMatiereModal from '../components/CreateMatiereModal';
import './ClassesList.css'; // Reusing ClassesList CSS for consistency

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
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [matiereToDelete, setMatiereToDelete] = useState(null);

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
                            <div className="classe-card-header">
                                <div className="create-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.1)', width: '40px', height: '40px' }}>
                                    <IconBook />
                                </div>
                                <div style={{ flex: 1, marginLeft: '10px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>{matiere.nomMatiere}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px' }}>
                                        Coef: {matiere.coefficient}
                                    </span>
                                </div>
                                <button
                                    className="btn-icon delete"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(matiere); }}
                                    title="Supprimer"
                                    style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                                >
                                    <FaTrash />
                                </button>
                            </div>

                            <div className="classe-card-body">
                                <p className="classe-stat">
                                    {matiere.description || "Aucune description"}
                                </p>
                                <div className="matiere-details" style={{ marginTop: '10px', fontSize: '13px', color: '#4b5563' }}>
                                    <p><strong>Classe:</strong> {matiere.classe ? matiere.classe.nomClasse : <span style={{ color: 'red' }}>Non assignée</span>}</p>
                                    <p><strong>Enseignants:</strong> {matiere.professeurs && matiere.professeurs.length > 0
                                        ? matiere.professeurs.map(p => `${p.firstName} ${p.lastName}`).join(', ')
                                        : 'Aucun'}</p>
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
