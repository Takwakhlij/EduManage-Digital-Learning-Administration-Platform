import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSession, getAllSessions, reset } from '../features/sessions/sessionSlice';
import { getClasses } from '../features/classes/classeSlice';
import { getUsers } from '../features/admin/adminSlice';
import './CreateClasseModal.css'; 

const LoaderIcon = () => (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </svg>
);

const CreateSessionModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    
    const [formData, setFormData] = useState({
        nomSession: '',
        duree: '',
        montant: '',
        classe: '', 
        enseignants: [],
        description: ''
    });

    const { nomSession, duree, montant, classe, enseignants, description } = formData;

    const { isError, isSuccess, message } = useSelector(
        (state) => state.sessions
    );

    const { classes } = useSelector((state) => state.classes);
    const { users } = useSelector((state) => state.admin);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            dispatch(getClasses());
            dispatch(getUsers());
        }
    }, [dispatch, isOpen]);

    // Kif tenja7 l'khedma
    useEffect(() => {
        if (isSubmitting && isSuccess) {
            dispatch(getAllSessions());
            onClose();
            dispatch(reset());
            setIsSubmitting(false);
            setFormData({
                nomSession: '', duree: '', montant: '', classe: '', enseignants: [], description: ''
            });
        }
    }, [isSuccess, isSubmitting, onClose, dispatch]);

    // Kif tsir erreur, n-wa9fou l'animation mta3 l'bouton
    useEffect(() => {
        if (isSubmitting && isError) {
            setIsSubmitting(false);
        }
    }, [isError, isSubmitting]);

    if (!isOpen) return null;

    // Salla7na l'Role (enseignant f'3oudh teacher)
    const teachers = users ? users.filter(user => user.role === 'enseignant' || user.role === 'teacher') : [];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTeacherToggle = (teacherId) => {
        const updatedEnseignants = enseignants.includes(teacherId)
            ? enseignants.filter(id => id !== teacherId)
            : [...enseignants, teacherId];
        setFormData({ ...formData, enseignants: updatedEnseignants });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        dispatch(createSession(formData));
    };

    return (
        <div className="create-modal-overlay" onClick={onClose}>
            <div className="create-modal-content" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="modal-close-btn" onClick={onClose}>&times;</button>

                <div className="create-modal-header">
                    <div className="modal-icon-wrapper">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                    <div className="modal-title-wrapper">
                        <h2>Créer une nouvelle session</h2>
                        <p className="modal-subtitle">Configurez une nouvelle session de cours</p>
                    </div>
                </div>

                <div className="create-modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="islamic-form-group">
                            <label htmlFor="nomSession">NOM DE LA SESSION <span className="required">*</span></label>
                            <div className="islamic-input-wrapper">
                                <input type="text" id="nomSession" name="nomSession" required value={nomSession} onChange={handleChange} placeholder="Ex: Session Hifz Matin" className="islamic-input" />
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label htmlFor="classe">CLASSE <span className="required">*</span></label>
                            <div className="islamic-input-wrapper">
                                <select id="classe" name="classe" required value={classe} onChange={handleChange} className="islamic-input">
                                    <option value="">-- Sélectionnez une classe --</option>
                                    {/* Salla7na esm l'classe (nomClasse walla nom) */}
                                    {classes && classes.map(c => (
                                        <option key={c._id} value={c._id}>{c.nomClasse || c.nom}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label>ENSEIGNANTS <span className="required">*</span></label>
                            <div className="islamic-teachers-grid" style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '10px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                padding: '15px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                maxHheight: '200px',
                                overflowY: 'auto'
                            }}>
                                {teachers && teachers.map(t => (
                                    <label key={t._id} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px', 
                                        cursor: 'pointer',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s',
                                        background: enseignants.includes(t._id) ? 'rgba(5, 150, 105, 0.15)' : 'transparent',
                                        border: `1px solid ${enseignants.includes(t._id) ? 'rgba(5, 150, 105, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`
                                    }}>
                                        <input 
                                            type="checkbox" 
                                            checked={enseignants.includes(t._id)}
                                            onChange={() => handleTeacherToggle(t._id)}
                                            style={{ cursor: 'pointer', accentColor: '#059669' }}
                                        />
                                        <span style={{ fontSize: '14px', color: '#fff' }}>{t.firstName} {t.lastName}</span>
                                    </label>
                                ))}
                            </div>
                            {enseignants.length === 0 && <p className="required" style={{ fontSize: '12px', marginTop: '5px' }}>Veuillez sélectionner au moins un enseignant</p>}
                        </div>

                        <div className="islamic-form-group">
                            <label htmlFor="duree">DURÉE <span className="required">*</span></label>
                            <div className="islamic-input-wrapper">
                                <input type="text" id="duree" name="duree" required value={duree} onChange={handleChange} placeholder="Ex: 3 mois" className="islamic-input" />
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label htmlFor="montant">MONTANT (DT) <span className="required">*</span></label>
                            <div className="islamic-input-wrapper">
                                <input type="number" id="montant" name="montant" required value={montant} onChange={handleChange} placeholder="Ex: 150 (Mettez 0 si gratuit)" className="islamic-input" />
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label htmlFor="description">DESCRIPTION DE LA SESSION</label>
                            <div className="islamic-input-wrapper">
                                <textarea 
                                    id="description" 
                                    name="description" 
                                    value={description} 
                                    onChange={handleChange} 
                                    placeholder="Décrivez brièvement le programme de cette session..." 
                                    className="islamic-input"
                                    style={{ height: '100px', padding: '12px', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        {isError && (
                            <div style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px', background: '#fef2f2', padding: '10px', borderRadius: '8px' }}>
                                {message}
                            </div>
                        )}

                        <div className="create-modal-footer">
                            <button type="button" className="btn-islamic btn-cancel" onClick={onClose} disabled={isSubmitting}>
                                &times; Annuler
                            </button>
                            {/* Rbatna l'bouton b'isSubmitting f'3oudh isLoading */}
                            <button type="submit" className="btn-islamic btn-submit" disabled={isSubmitting}>
                                {isSubmitting ? <LoaderIcon /> : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                )}
                                {isSubmitting ? ' Création...' : ' Créer la session'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateSessionModal;