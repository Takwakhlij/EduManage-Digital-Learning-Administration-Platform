import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateMatiere, reset } from '../features/matieres/matiereSlice';
import { getClasses } from '../features/classes/classeSlice';
import './CreateClasseModal.css';

const LoaderIcon = () => (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const EditMatiereModal = ({ matiere, onClose }) => {
    const dispatch = useDispatch();

    const [nomMatiere, setNomMatiere] = useState('');
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [chapitres, setChapitres] = useState([{ titre: '', description: '' }]);

    const { isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.matieres
    );
    const { classes } = useSelector((state) => state.classes);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialisation des données
    useEffect(() => {
        dispatch(getClasses());
        if (matiere) {
            setNomMatiere(matiere.nomMatiere || '');
            setSelectedClasses(matiere.classes ? matiere.classes.map(c => c._id || c) : []);
            setChapitres(matiere.programme && matiere.programme.length > 0 
                ? matiere.programme.map(p => ({ titre: p.titre, description: p.description || '' }))
                : [{ titre: '', description: '' }]
            );
        }
    }, [dispatch, matiere]);

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

        const matiereData = {
            nomMatiere,
            classes: selectedClasses,
            programme: chapitres.filter((chap) => chap.titre.trim() !== ''),
        };

        setIsSubmitting(true);
        dispatch(updateMatiere({ id: matiere._id, matiereData }));
    };

    if (!matiere) return null;

    return (
        <div className="create-modal-overlay" onClick={onClose}>
            <div className="create-modal-content create-modal-content--large" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                <div className="create-modal-header">
                    <div className="modal-icon-wrapper" style={{ background: 'rgba(201, 169, 97, 0.1)', color: '#c9a961' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </div>
                    <div className="modal-title-wrapper">
                        <h2>Modifier la matière</h2>
                        <p className="modal-subtitle">Modifiez le nom, les classes et le programme (chapitres)</p>
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
                            <label>CLASSES ASSOCIÉES</label>
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
                                <label>PROGRAMME (CHAPITRES TEMPLATES)</label>
                                <button type="button" className="btn-add-mini" onClick={handleAddChapitre}>
                                    + Ajouter un chapitre
                                </button>
                            </div>
                            <div className="chapitres-list" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                                {chapitres.map((chap, index) => (
                                    <div key={index} className="chapitre-entry" style={{ background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <div className="chapitre-header" style={{ marginBottom: '10px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#c9a961' }}>Chapitre # {index + 1}</span>
                                            {chapitres.length > 1 && (
                                                <button type="button" className="btn-remove-mini" onClick={() => handleRemoveChapitre(index)} style={{ color: '#ef4444' }}>
                                                    Supprimer
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Titre du chapitre (ex: Introduction)"
                                            value={chap.titre}
                                            onChange={(e) => handleChapitreChange(index, 'titre', e.target.value)}
                                            className="islamic-input chapitre-title"
                                            style={{ marginBottom: '10px' }}
                                        />
                                        <textarea
                                            placeholder="Description courte ou objectifs (optionnel)"
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
                                style={{ background: 'linear-gradient(135deg, #c9a961 0%, #a68b4c 100%)' }}
                            >
                                {isLoading ? <LoaderIcon /> : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditMatiereModal;
