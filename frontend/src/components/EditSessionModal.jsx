import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateSession, getAllSessions, reset } from '../features/sessions/sessionSlice';
import { getClasses } from '../features/classes/classeSlice';
import { getUsers } from '../features/admin/adminSlice';
import { getMatieres } from '../features/matieres/matiereSlice';
import toast from 'react-hot-toast';

const LoaderIcon = () => (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const EditSessionModal = ({ isOpen, onClose, session }) => {
    const dispatch = useDispatch();
    const { classes } = useSelector((state) => state.classes);
    const { users } = useSelector((state) => state.admin);
    const { matieres } = useSelector((state) => state.matieres);
    const { isSuccess, isError, message } = useSelector((state) => state.sessions);

    const [formData, setFormData] = useState({
        nomSession: '',
        classe: '',
        montant: '',
        duree: '',
        dateDebut: '',
        dateFin: '',
        description: '',
        statut: 'En cours',
        isPublished: true
    });

    const [programmeSession, setProgrammeSession] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { nomSession, classe, montant, duree, dateDebut, dateFin, description, statut, isPublished } = formData;

    useEffect(() => {
        if (isOpen) {
            dispatch(getClasses());
            dispatch(getUsers());
            dispatch(getMatieres());
        }
    }, [dispatch, isOpen]);

    // Load session data into form when modal opens
    useEffect(() => {
        if (session && isOpen) {
            setFormData({
                nomSession: session.nomSession || '',
                classe: session.classe?._id || session.classe || '',
                montant: session.montant || 0,
                duree: session.duree || '',
                dateDebut: session.dateDebut ? new Date(session.dateDebut).toISOString().split('T')[0] : '',
                dateFin: session.dateFin ? new Date(session.dateFin).toISOString().split('T')[0] : '',
                description: session.description || '',
                statut: session.statut || 'En cours',
                isPublished: session.isPublished !== undefined ? session.isPublished : true
            });
            
            // Map programme from session
            if (session.programme) {
                setProgrammeSession(session.programme.map(p => ({
                    nomMatiere: p.nomMatiere || (p.matiere ? p.matiere.nomMatiere : 'Matière Inconnue'),
                    matiere: p.matiere?._id || p.matiere || null,
                    enseignant: p.enseignant?._id || p.enseignant || ''
                })));
            }
        }
    }, [session, isOpen]);

    // Handle class change (to load subjects)
    useEffect(() => {
        if (classe && classes && session && session.classe?._id !== classe) {
            const selectedClasseObj = classes.find((c) => c._id === classe);
            if (selectedClasseObj) {
                const legacySubjects = (selectedClasseObj.programme || []).map((p) => ({
                    nomMatiere: p.matiere ? p.matiere.nomMatiere : 'Matière Inconnue',
                    matiere: p.matiere ? p.matiere._id || p.matiere : null,
                    enseignant: ''
                }));

                const newSubjects = (selectedClasseObj.matieres || []).map((m) => ({
                    nomMatiere: m.nomMatiere || 'Matière Inconnue',
                    matiere: m._id || m,
                    enseignant: ''
                }));

                const combined = [...legacySubjects, ...newSubjects];
                const uniqueSubjects = combined.filter((v, i, a) => a.findIndex(t => t.nomMatiere === v.nomMatiere) === i);

                setProgrammeSession(uniqueSubjects);
            }
        }
    }, [classe, classes, session]);

    useEffect(() => {
        if (isSuccess && isSubmitting) {
            toast.success('Session modifiée avec succès !');
            dispatch(getAllSessions());
            setIsSubmitting(false);
            onClose();
            dispatch(reset());
        }
        if (isError && isSubmitting) {
            toast.error(message || 'Une erreur est survenue.');
            setIsSubmitting(false);
        }
    }, [isSuccess, isError, dispatch, onClose, isSubmitting, message]);

    if (!isOpen) return null;

    const teachers = users ? users.filter(user => user.role === 'enseignant' || user.role === 'teacher') : [];

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
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

        if (programmeSession.length === 0) {
            toast.error("La classe sélectionnée n'a aucune matière.");
            return;
        }

        const isComplete = programmeSession.every(p => p.enseignant && p.enseignant !== '');
        if (!isComplete) {
            const confirmed = window.confirm("Certaines matières n'ont pas de professeur assigné.\nVoulez-vous tout de même sauvegarder cette session sans tous les professeurs ?");
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
        dispatch(updateSession({ 
            id: session._id, 
            sessionData: { ...formData, programme: cleanedProgramme } 
        }));
    };

    return (
        <div className="create-modal-overlay" onClick={onClose}>
            <div className="create-modal-content" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="modal-close-btn" onClick={onClose}>&times;</button>

                <div className="create-modal-header">
                    <div className="modal-icon-wrapper" style={{ background: 'rgba(201, 169, 97, 0.1)', color: '#c9a961' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </div>
                    <div className="modal-title-wrapper">
                        <h2>Modifier la session</h2>
                        <p className="modal-subtitle">Mettez à jour les informations de la session</p>
                    </div>
                </div>

                <div className="create-modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="islamic-form-group">
                            <label htmlFor="nomSession">NOM DE LA SESSION <span className="required">*</span></label>
                            <div className="islamic-input-wrapper">
                                <input type="text" id="nomSession" name="nomSession" required value={nomSession} onChange={handleChange} className="islamic-input" />
                            </div>
                        </div>

                        <div className="islamic-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="islamic-form-group">
                                <label htmlFor="classe">CLASSE <span className="required">*</span></label>
                                <div className="islamic-input-wrapper">
                                    <select id="classe" name="classe" required value={classe} onChange={handleChange} className="islamic-input">
                                        <option value="">-- Sélectionnez --</option>
                                        {classes && classes.map(c => (
                                            <option key={c._id} value={c._id}>{c.nomClasse || c.nom}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="islamic-form-group">
                                <label htmlFor="statut">STATUT</label>
                                <div className="islamic-input-wrapper">
                                    <select id="statut" name="statut" value={statut} onChange={handleChange} className="islamic-input">
                                        <option value="En cours">En cours</option>
                                        <option value="Terminée">Terminée</option>
                                        <option value="Annulée">Annulée</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label>ASSIGNATION DES ENSEIGNANTS</label>
                            <div className="assignment-container">
                                {programmeSession.map((prog, index) => (
                                    <div key={index} className="assignment-item">
                                        <span className="assignment-subject">{prog.nomMatiere}</span>
                                        <select 
                                            className="islamic-input assignment-select"
                                            value={prog.enseignant}
                                            onChange={(e) => handleTeacherAssigned(index, e.target.value)}
                                        >
                                            <option value="" disabled>-- Professeur --</option>
                                            {teachers.map(t => (
                                                <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="islamic-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
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

                        <div className="islamic-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="islamic-form-group">
                                <label htmlFor="duree">DURÉE <span className="required">*</span></label>
                                <div className="islamic-input-wrapper">
                                    <input type="text" id="duree" name="duree" required value={duree} onChange={handleChange} className="islamic-input" />
                                </div>
                            </div>
                            <div className="islamic-form-group">
                                <label htmlFor="montant">MONTANT (DT) <span className="required">*</span></label>
                                <div className="islamic-input-wrapper">
                                    <input type="number" id="montant" name="montant" required value={montant} onChange={handleChange} className="islamic-input" />
                                </div>
                            </div>
                        </div>

                        <div className="islamic-form-group">
                            <label htmlFor="description">DESCRIPTION</label>
                            <div className="islamic-input-wrapper">
                                <textarea name="description" value={description} onChange={handleChange} className="islamic-input" style={{ height: '80px', padding: '12px', resize: 'vertical' }} />
                            </div>
                        </div>

                        <div className="islamic-form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                            <input type="checkbox" id="isPublished" name="isPublished" checked={isPublished} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: '#c9a961' }} />
                            <label htmlFor="isPublished" style={{ marginBottom: 0, cursor: 'pointer' }}>Publier la session (Visible par les étudiants)</label>
                        </div>

                        {isError && (
                            <div style={{ color: '#ef4444', marginTop: '15px', fontSize: '14px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>
                                {message}
                            </div>
                        )}

                        <div className="create-modal-footer">
                            <button type="button" className="btn-islamic btn-cancel" onClick={onClose} disabled={isSubmitting}>
                                Annuler
                            </button>
                            <button type="submit" className="btn-islamic btn-submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg, #c9a961 0%, #a68b4c 100%)' }}>
                                {isSubmitting ? <LoaderIcon /> : null}
                                {isSubmitting ? ' Mise à jour...' : ' Enregistrer les modifications'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditSessionModal;
