
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateClasse, reset } from '../features/classes/classeSlice';
import { getUsers } from '../features/admin/adminSlice';
import { getMatieres } from '../features/matieres/matiereSlice';
import './CreateClasseModal.css'; // Reusing the same CSS

const LoaderIcon = () => (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const EditClasseModal = ({ classe, onClose }) => {
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        nomClasse: '',
        niveau: '',
        anneeScolaire: ''
    });

    const { nomClasse, niveau, anneeScolaire } = formData;
    
    const [selectedMatieres, setSelectedMatieres] = useState([]);

    const { isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.classes
    );

    const { users } = useSelector((state) => state.admin);
    const { matieres } = useSelector((state) => state.matieres);

    const [selectedProfessors, setSelectedProfessors] = useState([]);

    useEffect(() => {
        dispatch(getUsers());
        dispatch(getMatieres());
    }, [dispatch]);

    const teachers = users ? users.filter(user => user.role === 'teacher') : [];

    // Track if this specific instance submitted
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form data when class prop changes
    useEffect(() => {
        if (classe) {
            setFormData({
                nomClasse: classe.nomClasse || '',
                niveau: classe.niveau || '',
                anneeScolaire: classe.anneeScolaire || '2025/2026'
            });
            
            // Initialiser les matières
            if (classe.matieres) {
                setSelectedMatieres(classe.matieres.map(m =>
                    (m && typeof m === 'object' && m._id) ? m._id : m
                ));
            }
            
            // Pre-fill selections
            // Assuming classe.professeurs and classe.matieres are arrays of objects or IDs
            // If they are populated objects, map to _id. If IDs, use directly.
            if (classe.professeurs) {
                // Handle both array of IDs and array of populated objects
                setSelectedProfessors(classe.professeurs.map(p =>
                    (p && typeof p === 'object' && p._id) ? p._id : p
                ));
            }
        }
    }, [classe]);

    useEffect(() => {
        if (isSubmitting && isSuccess) {
            onClose();
            onClose();
            // dispatch(reset()); // Removed to avoid clearing list state
        }
    }, [isSuccess, isSubmitting, onClose, dispatch]);

    const onChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e) => {
        e.preventDefault();
        if (!nomClasse || !niveau) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        const classeData = {
            nomClasse,
            niveau,
            anneeScolaire,
            matieres: selectedMatieres
        };

        setIsSubmitting(true);
        dispatch(updateClasse({ id: classe._id, classeData }));
    };

    const toggleSelection = (id, list, setList) => {
        if (list.includes(id)) {
            setList(list.filter((item) => item !== id));
        } else {
            setList([...list, id]);
        }
    };

    // Fonctions pour gérer les groupes de Matière
    const toggleMatiere = (id) => {
        if (selectedMatieres.includes(id)) {
            setSelectedMatieres(selectedMatieres.filter(m => m !== id));
        } else {
            setSelectedMatieres([...selectedMatieres, id]);
        }
    };

    if (!classe) return null;

    return (
        <div className="create-modal-overlay" onClick={onClose}>
            <div className="create-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                {/* Header */}
                <div className="create-modal-header">
                    <div className="modal-icon-wrapper">
                        {/* Edit Icon */}
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </div>
                    <div className="modal-title-wrapper">
                        <h2>Modifier la classe</h2>
                        <p className="modal-subtitle">Modifiez les informations de la classe</p>
                    </div>
                </div>

                {/* Body */}
                <div className="create-modal-body">
                    <form onSubmit={onSubmit}>
                        <div className="islamic-form-group">
                            <label htmlFor="nomClasse">NOM DE LA CLASSE <span className="required">*</span></label>
                            <div className="islamic-input-wrapper">
                                <input
                                    type="text"
                                    id="nomClasse"
                                    name="nomClasse"
                                    value={nomClasse}
                                    onChange={onChange}
                                    placeholder="Ex: Classe Avancée A"
                                    className="islamic-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label htmlFor="niveau">NIVEAU <span className="required">*</span></label>
                            <div className="islamic-input-wrapper">
                                <select
                                    id="niveau"
                                    name="niveau"
                                    value={niveau}
                                    onChange={onChange}
                                    className="islamic-input"
                                    required
                                >
                                    <option value="">-- Sélectionnez un niveau --</option>
                                    <option value="Débutant">Débutant</option>
                                    <option value="Intermédiaire">Intermédiaire</option>
                                    <option value="Avancé">Avancé</option>
                                </select>
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label htmlFor="anneeScolaire">ANNÉE SCOLAIRE <span className="required">*</span></label>
                            <div className="islamic-input-wrapper">
                                <input
                                    type="text"
                                    id="anneeScolaire"
                                    name="anneeScolaire"
                                    value={anneeScolaire}
                                    onChange={onChange}
                                    placeholder="Ex: 2025/2026"
                                    className="islamic-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label>MATIÈRES ENSEIGNÉES <span className="required">*</span></label>
                            <div className="classes-checkbox-grid">
                                {matieres && matieres.map((mat) => (
                                    <label key={mat._id} className={`class-checkbox-item ${selectedMatieres.includes(mat._id) ? 'active' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={selectedMatieres.includes(mat._id)}
                                            onChange={() => toggleMatiere(mat._id)}
                                        />
                                        <span>{mat.nomMatiere}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Matières removed: Managed via Subject Management */}
                        <div style={{ marginBottom: '20px', fontSize: '13px', color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>
                            Les matières sont gérées dans la section "Mentions/Matières".
                        </div>

                        {isError && (
                            <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px', background: '#fef2f2', padding: '10px', borderRadius: '8px' }}>
                                {message}
                            </div>
                        )}

                        <div className="create-modal-footer">
                            <button
                                type="button"
                                className="btn-islamic btn-cancel"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                &times; Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn-islamic btn-submit"
                                disabled={isLoading}
                            >
                                {isLoading ? <LoaderIcon /> : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                )}
                                {isLoading ? ' Enregistrement...' : ' Enregistrer les modifications'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditClasseModal;
