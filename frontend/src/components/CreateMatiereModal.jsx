import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createMatiere, reset } from '../features/matieres/matiereSlice';
import { getClasses } from '../features/classes/classeSlice';
import './CreateClasseModal.css';

const LoaderIcon = () => (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CreateMatiereModal = ({ onClose }) => {
    const dispatch = useDispatch();

    const [nomMatiere, setNomMatiere] = useState('');
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [chapitres, setChapitres] = useState([{ titre: '', description: '' }]);

    const { isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.matieres
    );
    const { classes } = useSelector((state) => state.classes);

    useEffect(() => {
        dispatch(getClasses());
    }, [dispatch]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isSubmitting && isSuccess) {
            onClose();
            dispatch(reset());
        }
    }, [isSuccess, isSubmitting, onClose, dispatch]);

    const handleClassToggle = (classId) => {
        setSelectedClasses((prev) =>
            prev.includes(classId)
                ? prev.filter((id) => id !== classId)
                : [...prev, classId]
        );
    };

    const handleAddChapitre = () => {
        setChapitres([...chapitres, { titre: '', description: '' }]);
    };

    const handleRemoveChapitre = (index) => {
        setChapitres(chapitres.filter((_, i) => i !== index));
    };

    const handleChapitreChange = (index, field, value) => {
        const updated = [...chapitres];
        updated[index][field] = value;
        setChapitres(updated);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        if (!nomMatiere) {
            alert('Veuillez ajouter un nom de matière');
            return;
        }
        if (selectedClasses.length === 0) {
            alert('Veuillez sélectionner au moins une classe');
            return;
        }

        const matiereData = {
            nomMatiere,
            classes: selectedClasses,
            programme: chapitres.filter((chap) => chap.titre.trim() !== ''),
        };

        setIsSubmitting(true);
        dispatch(createMatiere(matiereData));
    };

    return (
        <div className="create-modal-overlay" onClick={onClose}>
            <div className="create-modal-content create-modal-content--large" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                <div className="create-modal-header">
                    <div className="modal-icon-wrapper">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                    </div>
                    <div className="modal-title-wrapper">
                        <h2>Ajouter une matière</h2>
                        <p className="modal-subtitle">Configurez le nom, les classes et le programme</p>
                    </div>
                </div>

                <div className="create-modal-body">
                    <form onSubmit={onSubmit}>
                        {/* ── Section 1: Basic Info ── */}
                        <div className="islamic-form-group">
                            <label htmlFor="nomMatiere">NOM DE LA MATIÈRE <span className="required">*</span></label>
                            <input
                                type="text"
                                id="nomMatiere"
                                value={nomMatiere}
                                onChange={(e) => setNomMatiere(e.target.value)}
                                placeholder="Ex: Tajweed, Fiqh..."
                                className="islamic-input"
                                required
                            />
                        </div>

                        {/* ── Section 2: Multi-select Classes ── */}
                        <div className="islamic-form-group">
                            <label>CLASSES ASSOCIÉES <span className="required">*</span></label>
                            <div className="classes-checkbox-grid">
                                {classes && classes.map((classe) => (
                                    <label key={classe._id} className={`class-checkbox-item ${selectedClasses.includes(classe._id) ? 'active' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={selectedClasses.includes(classe._id)}
                                            onChange={() => handleClassToggle(classe._id)}
                                        />
                                        <span>{classe.nomClasse}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* ── Section 3: Programme (Chapitres) ── */}
                        <div className="islamic-form-group">
                            <div className="flex-header">
                                <label>PROGRAMME (CHAPITRES)</label>
                                <button type="button" className="btn-add-mini" onClick={handleAddChapitre}>
                                    + Ajouter
                                </button>
                            </div>
                            <div className="chapitres-list">
                                {chapitres.map((chap, index) => (
                                    <div key={index} className="chapitre-entry">
                                        <div className="chapitre-header">
                                            <span># {index + 1}</span>
                                            {chapitres.length > 1 && (
                                                <button type="button" className="btn-remove-mini" onClick={() => handleRemoveChapitre(index)}>
                                                    &times;
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Titre du chapitre"
                                            value={chap.titre}
                                            onChange={(e) => handleChapitreChange(index, 'titre', e.target.value)}
                                            className="islamic-input chapitre-title"
                                        />
                                        <textarea
                                            placeholder="Description courte (optionnel)"
                                            value={chap.description}
                                            onChange={(e) => handleChapitreChange(index, 'description', e.target.value)}
                                            className="islamic-input chapitre-desc"
                                            rows="2"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {isError && (
                            <div className="error-alert">
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
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn-islamic btn-submit"
                                disabled={isLoading}
                            >
                                {isLoading ? <LoaderIcon /> : 'Ajouter la matière'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateMatiereModal;
