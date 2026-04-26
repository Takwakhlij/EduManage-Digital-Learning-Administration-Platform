
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMatieres, deleteMatiere, reset } from '../features/matieres/matiereSlice';
import CreateMatiereModal from '../components/CreateMatiereModal';
import EditMatiereModal from '../components/EditMatiereModal';
import toast from 'react-hot-toast';
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
            dispatch(deleteMatiere(matiereToDelete._id)).unwrap()
            .then(() => toast.success('Matière supprimée avec succès !'))
            .catch(err => toast.error(err || 'Erreur lors de la suppression de la matière'));
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
                {user && user.role === 'admin' && (
                    <button className="btn-create-table" onClick={() => setShowCreateModal(true)}>
                        <FaPlus /> Créer une matière
                    </button>
                )}
            </div>

            <div className="classes-table-container" style={{ marginTop: '24px' }}>
                <table className="classes-table">
                    <thead>
                        <tr>
                            <th>Nom de la matière</th>
                            <th>Classes affectées</th>
                            <th>Programme</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matieres && matieres.length > 0 ? (
                            matieres.map((matiere) => (
                                <tr key={matiere._id}>
                                    <td className="font-medium">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: 'var(--accent-gold)' }}><IconBook /></span>
                                            {matiere.nomMatiere}
                                        </div>
                                    </td>
                                    <td>
                                        {matiere.classes && matiere.classes.length > 0 
                                            ? matiere.classes.map(c => c.nomClasse).join(', ') 
                                            : (matiere.classe?.nomClasse || <span style={{ color: '#ef4444' }}>Non assignée</span>)}
                                    </td>
                                    <td>
                                        <span className="niveau-badge niveau-intermédiaire" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            {matiere.programme?.length || 0} chapitres
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        {user && user.role === 'admin' && (
                                            <>
                                                <button className="btn-icon btn-edit" onClick={(e) => { e.stopPropagation(); handleEdit(matiere); }} title="Modifier">
                                                    <FaEdit />
                                                </button>
                                                <button className="btn-icon btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(matiere); }} title="Supprimer">
                                                    <FaTrash />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="empty-table-cell">
                                    <div className="empty-state">
                                        <IconBook size={48} />
                                        <h2>Aucune matière trouvée</h2>
                                        <p>Créez une nouvelle matière pour commencer.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
