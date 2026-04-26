import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSession, getAllSessions, reset } from '../features/sessions/sessionSlice';
import { getClasses } from '../features/classes/classeSlice';
import { getUsers } from '../features/admin/adminSlice';
import { getMatieres } from '../features/matieres/matiereSlice';
import toast from 'react-hot-toast';
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
        dateDebut: '',
        dateFin: '',
        montant: '',
        classe: '', 
        description: ''
    });

    const { nomSession, duree, dateDebut, dateFin, montant, classe, description } = formData;
    const [programmeSession, setProgrammeSession] = useState([]);

    const { isError, isSuccess, message } = useSelector(
        (state) => state.sessions
    );

    const { classes } = useSelector((state) => state.classes);
    const { users } = useSelector((state) => state.admin);
    const { matieres } = useSelector((state) => state.matieres);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            dispatch(getClasses());
            dispatch(getUsers());
            dispatch(getMatieres());
        }
    }, [dispatch, isOpen]);

    // Kif tenja7 l'khedma
    useEffect(() => {
        if (isSubmitting && isSuccess) {
            toast.success('Session créée avec succès !');
            dispatch(getAllSessions());
            onClose();
            dispatch(reset());
            setIsSubmitting(false);
            setFormData({
                nomSession: '', duree: '', dateDebut: '', dateFin: '', montant: '', classe: '', description: ''
            });
            setProgrammeSession([]);
        }
    }, [isSuccess, isSubmitting, onClose, dispatch]);

    // Kif tsir erreur, n-wa9fou l'animation mta3 l'bouton
    useEffect(() => {
        if (isSubmitting && isError) {
            toast.error(message || 'Une erreur est survenue.');
            setIsSubmitting(false);
        }
    }, [isError, isSubmitting, message]);

    useEffect(() => {
        if (classe && classes) {
            const selectedClasseObj = classes.find((c) => c._id === classe);
            if (selectedClasseObj) {
                // Combine both legacy and new subject formats
                const legacySubjects = (selectedClasseObj.programme || []).map((p) => ({
                    nomMatiere: p.matiere ? p.matiere.nomMatiere : 'Matière Inconnue',
                    matiere: p.matiere ? p.matiere._id : null,
                    enseignant: ''
                }));

                const newSubjects = (selectedClasseObj.matieres || []).map((m) => ({
                    nomMatiere: m.nomMatiere || 'Matière Inconnue',
                    matiere: m._id,
                    enseignant: ''
                }));

                // Deduplicate by name if needed, but usually we just want to show all associated subjects
                const combined = [...legacySubjects, ...newSubjects];
                
                // Final deduplication for safety (if the same subject is in both)
                const uniqueSubjects = combined.filter((v, i, a) => a.findIndex(t => t.nomMatiere === v.nomMatiere) === i);

                setProgrammeSession(uniqueSubjects);
            } else {
                setProgrammeSession([]);
            }
        } else {
            setProgrammeSession([]);
        }
    }, [classe, classes]);

    if (!isOpen) return null;

    // Salla7na l'Role (enseignant f'3oudh teacher)
    const teachers = users ? users.filter(user => user.role === 'enseignant' || user.role === 'teacher') : [];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTeacherAssigned = (index, teacherId) => {
        const updatedProgramme = [...programmeSession];
        updatedProgramme[index].enseignant = teacherId;
        setProgrammeSession(updatedProgramme);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (dateDebut && dateFin) {
            const start = new Date(dateDebut);
            const end = new Date(dateFin);
            if (end < start) {
                toast.error("Erreur de configuration : La date de fin doit être ultérieure à la date de début.");
                return;
            }
        }
        
        // Ensure the class has subjects
        if (programmeSession.length === 0) {
            toast.error("Impossible de créer la session : la classe n'a aucune matière.");
            return;
        }

        // Warning if some subjects don't have an assigned teacher
        const isComplete = programmeSession.every(p => p.enseignant && p.enseignant !== '');
        if (!isComplete) {
            const confirmed = window.confirm("Certaines matières n'ont pas de professeur assigné.\nVoulez-vous tout de même confirmer la création de cette session sans tous les professeurs ?");
            if (!confirmed) {
                return;
            }
        }

        // Clean up empty teacher strings to prevent Mongoose CastError (ObjectId)
        const cleanedProgramme = programmeSession.map(p => {
            if (!p.enseignant || p.enseignant === '') {
                const { enseignant, ...rest } = p;
                return rest;
            }
            return p;
        });

        setIsSubmitting(true);
        dispatch(createSession({ ...formData, programme: cleanedProgramme }));
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
                            <label>TEACHER ASSIGNMENT <span className="required">*</span></label>
                            <div className="assignment-container">
                                {!classe ? (
                                    <p className="assignment-placeholder">
                                        Veuillez sélectionner une classe pour assigner des enseignants aux matières.
                                    </p>
                                ) : programmeSession.length === 0 ? (
                                    <p className="assignment-placeholder">
                                        Aucune matière n'est associée à cette classe.
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {programmeSession.map((prog, index) => (
                                            <div key={index} className="assignment-item">
                                                <span className="assignment-subject">
                                                    {prog.nomMatiere}
                                                </span>
                                                <select 
                                                    className="islamic-input assignment-select"
                                                    value={prog.enseignant}
                                                    onChange={(e) => handleTeacherAssigned(index, e.target.value)}
                                                >
                                                    <option value="" disabled>-- Select a teacher --</option>
                                                    {teachers.map(t => (
                                                        <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label htmlFor="duree">DURÉE <span className="required">*</span></label>
                            <div className="islamic-input-wrapper">
                                <input type="text" id="duree" name="duree" required value={duree} onChange={handleChange} placeholder="Ex: 3 mois" className="islamic-input" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div className="islamic-form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="dateDebut">DATE DE DÉBUT</label>
                                <div className="islamic-input-wrapper">
                                    <input type="date" id="dateDebut" name="dateDebut" value={dateDebut} onChange={handleChange} className="islamic-input" />
                                </div>
                            </div>
                            <div className="islamic-form-group" style={{ marginBottom: 0 }}>
                                <label htmlFor="dateFin">DATE DE FIN</label>
                                <div className="islamic-input-wrapper">
                                    <input type="date" id="dateFin" name="dateFin" value={dateFin} onChange={handleChange} className="islamic-input" />
                                </div>
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