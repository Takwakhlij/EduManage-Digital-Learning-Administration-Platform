import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createClasse, reset } from '../features/classes/classeSlice';
import { getUsers } from '../features/admin/adminSlice';
import './CreateClasseModal.css';

const LoaderIcon = () => (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CreateClasseModal = ({ onClose }) => {
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        nomClasse: '',
        niveau: '',
    });

    const { nomClasse, niveau } = formData;
    
    // NOUVEAU: Gérer les chapitres dynamiquement
    const [chapitres, setChapitres] = useState([{ titre: '', description: '' }]);

    const { isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.classes
    );

    const { users } = useSelector((state) => state.admin);

    const [selectedProfessors, setSelectedProfessors] = useState([]);

    useEffect(() => {
        dispatch(getUsers());
    }, [dispatch]);

    const teachers = users ? users.filter(user => user.role === 'teacher') : [];

    // Track if this specific instance submitted
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isSubmitting && isSuccess) {
            onClose();
            // Reset state in parent or re-fetch is handled by parent,
            // but we should reset slice state to avoid stale success
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
        // Allow creation without subjects/professors if they are optional, but basic info is required
        if (!nomClasse || !niveau) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const classeData = {
            nomClasse,
            niveau,
            chapitresTemplate: chapitres.filter(ch => ch.titre.trim() !== '') // Ne garder que ceux qui ont un titre
        };

        setIsSubmitting(true);
        dispatch(createClasse(classeData));
    };

    // Toggle selection helper (for potential future use, e.g. multi-select teachers)
    const toggleSelection = (id, list, setList) => {
        if (list.includes(id)) {
            setList(list.filter((item) => item !== id));
        } else {
            setList([...list, id]);
        }
    };

    // Fonctions pour gérer les chapitres
    const handleAddChapitre = () => {
        setChapitres([...chapitres, { titre: '', description: '' }]);
    };

    const handleRemoveChapitre = (index) => {
        const newChapitres = [...chapitres];
        newChapitres.splice(index, 1);
        setChapitres(newChapitres);
    };

    const handleChapitreChange = (index, field, value) => {
        const newChapitres = [...chapitres];
        newChapitres[index][field] = value;
        setChapitres(newChapitres);
    };

    return (
        <div className="create-modal-overlay" onClick={onClose}>
            <div className="create-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                {/* Header */}
                <div className="create-modal-header">
                    <div className="modal-icon-wrapper">
                        {/* Graduation Cap Icon */}
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                        </svg>
                    </div>
                    <div className="modal-title-wrapper">
                        <h2>Créer une nouvelle classe</h2>
                        <p className="modal-subtitle">Ajoutez une nouvelle classe à l'Association</p>
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
                            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                PROGRAMME (CHAPITRES)
                                <button 
                                    type="button" 
                                    onClick={handleAddChapitre}
                                    style={{ background: 'var(--green-mist)', color: 'var(--green-deep)', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    + Ajouter
                                </button>
                            </label>
                            
                            <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '5px', marginTop: '10px' }}>
                                {chapitres.map((chapitre, index) => (
                                    <div key={index} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', marginBottom: '10px', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>Chapitre {index + 1}</span>
                                            {chapitres.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveChapitre(index)}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                                                >
                                                    &times;
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Titre du chapitre *"
                                            value={chapitre.titre}
                                            onChange={(e) => handleChapitreChange(index, 'titre', e.target.value)}
                                            className="islamic-input"
                                            style={{ marginBottom: '8px', padding: '8px', fontSize: '14px' }}
                                            required
                                        />
                                        <textarea
                                            placeholder="Description (Optionnel)"
                                            value={chapitre.description}
                                            onChange={(e) => handleChapitreChange(index, 'description', e.target.value)}
                                            className="islamic-input"
                                            style={{ padding: '8px', fontSize: '13px', resize: 'vertical', minHeight: '50px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Matières removed: Created separately */}
                        <div style={{ marginBottom: '20px', fontSize: '13px', color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>
                            Le programme sera visible pour les étudiants.
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
                                {isLoading ? ' Création...' : ' Créer la classe'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateClasseModal;
