
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createMatiere, reset } from '../features/matieres/matiereSlice';
import { getClasses } from '../features/classes/classeSlice';
import { getUsers } from '../features/admin/adminSlice';
import './CreateClasseModal.css'; // Reusing the same CSS

const LoaderIcon = () => (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CreateMatiereModal = ({ onClose }) => {
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        nomMatiere: '',
        coefficient: 1,
        description: '',
    });

    const { nomMatiere, coefficient, description } = formData;

    const { isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.matieres
    );
    const { classes } = useSelector((state) => state.classes);
    const { users } = useSelector((state) => state.admin);

    const [selectedClasse, setSelectedClasse] = useState('');
    const [selectedProfessors, setSelectedProfessors] = useState([]);

    const teachers = users ? users.filter(user => user.role === 'teacher') : [];

    useEffect(() => {
        dispatch(getClasses());
        dispatch(getUsers());
    }, [dispatch]);

    // Track if this specific instance submitted
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isSubmitting && isSuccess) {
            onClose();
            dispatch(reset());
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
        if (!nomMatiere) {
            alert('Veuillez ajouter un nom de matière');
            return;
        }

        if (!selectedClasse) {
            alert('Veuillez sélectionner une classe');
            return;
        }

        const matiereData = {
            nomMatiere,
            coefficient: Number(coefficient),
            description,
            classe: selectedClasse,
            professeurs: selectedProfessors,
        };

        setIsSubmitting(true);
        dispatch(createMatiere(matiereData));
    };

    const toggleSelection = (id, list, setList) => {
        if (list.includes(id)) {
            setList(list.filter((item) => item !== id));
        } else {
            setList([...list, id]);
        }
    };

    return (
        <div className="create-modal-overlay" onClick={onClose}>
            <div className="create-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                {/* Header */}
                <div className="create-modal-header">
                    <div className="modal-icon-wrapper">
                        {/* Book Icon for Subject */}
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                    </div>
                    <div className="modal-title-wrapper">
                        <h2>Ajouter une matière</h2>
                        <p className="modal-subtitle">Créez une nouvelle matière d'enseignement</p>
                    </div>
                </div>

                {/* Body */}
                <div className="create-modal-body">
                    <form onSubmit={onSubmit}>
                        <div className="islamic-form-group">
                            <label htmlFor="nomMatiere">NOM DE LA MATIÈRE <span className="required">*</span></label>
                            <div className="islamic-input-wrapper">
                                <input
                                    type="text"
                                    id="nomMatiere"
                                    name="nomMatiere"
                                    value={nomMatiere}
                                    onChange={onChange}
                                    placeholder="Ex: Tajweed, Fiqh..."
                                    className="islamic-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label htmlFor="classe">CLASSE <span className="required">*</span></label>
                            <div className="islamic-input-wrapper">
                                <select
                                    id="classe"
                                    name="classe"
                                    value={selectedClasse}
                                    onChange={(e) => setSelectedClasse(e.target.value)}
                                    className="islamic-input"
                                    required
                                >
                                    <option value="">Sélectionner une classe</option>
                                    {classes && classes.map((classe) => (
                                        <option key={classe._id} value={classe._id}>
                                            {classe.nomClasse}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Multi-select for Teachers */}
                        <div className="islamic-form-group">
                            <label>ENSEIGNANTS</label>
                            <div className="islamic-multiselect">
                                {teachers.length > 0 ? (
                                    teachers.map((teacher) => (
                                        <div
                                            key={teacher._id}
                                            className={`multiselect-item ${selectedProfessors.includes(teacher._id) ? 'selected' : ''}`}
                                            onClick={() => toggleSelection(teacher._id, selectedProfessors, setSelectedProfessors)}
                                        >
                                            {teacher.firstName} {teacher.lastName}
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-data">Aucun enseignant disponible</p>
                                )}
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label htmlFor="coefficient">COEFFICIENT</label>
                            <div className="islamic-input-wrapper">
                                <input
                                    type="number"
                                    id="coefficient"
                                    name="coefficient"
                                    value={coefficient}
                                    onChange={onChange}
                                    min="1"
                                    className="islamic-input"
                                />
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label htmlFor="description">DESCRIPTION</label>
                            <div className="islamic-input-wrapper">
                                <textarea
                                    id="description"
                                    name="description"
                                    value={description}
                                    onChange={onChange}
                                    placeholder="Description optionnelle..."
                                    className="islamic-input"
                                    rows="3"
                                />
                            </div>
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
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                )}
                                {isLoading ? ' Ajout...' : ' Ajouter la matière'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateMatiereModal;
