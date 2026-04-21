import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createClasse, reset } from '../features/classes/classeSlice';
import { getUsers } from '../features/admin/adminSlice';
import { getMatieres } from '../features/matieres/matiereSlice';
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
        anneeScolaire: '2025/2026'
    });

    const { nomClasse, niveau, anneeScolaire } = formData;
    
    const { isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.classes
    );

    const { users } = useSelector((state) => state.admin);

    useEffect(() => {
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
        if (!nomClasse || !niveau) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const classeData = {
            nomClasse,
            niveau,
            anneeScolaire,
        };

        setIsSubmitting(true);
        dispatch(createClasse(classeData));
    };

    return (
        <div className="create-modal-overlay" onClick={onClose}>
            <div className="create-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                <div className="create-modal-header">
                    <div className="modal-icon-wrapper">
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

                <div className="create-modal-body">
                    <form onSubmit={onSubmit}>
                        <div className="islamic-form-group">
                            <label htmlFor="nomClasse">NOM DE LA CLASSE <span className="required">*</span></label>
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

                        <div className="islamic-form-group">
                            <label htmlFor="niveau">NIVEAU <span className="required">*</span></label>
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

                        <div className="islamic-form-group">
                            <label htmlFor="anneeScolaire">ANNÉE SCOLAIRE <span className="required">*</span></label>
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
                                {isLoading ? <LoaderIcon /> : 'Créer la classe'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateClasseModal;
