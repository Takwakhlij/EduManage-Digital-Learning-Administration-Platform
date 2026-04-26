import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSeancesBySession, createSeance, deleteSeance, reset } from '../features/seances/seanceSlice';
import toast from 'react-hot-toast';
import './PlanningManagerModal.css';

const FaClose = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const FaTrash = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function PlanningManagerModal({ session, onClose }) {
    const dispatch = useDispatch();
    const { seances, isLoading, isError, message } = useSelector((state) => state.seances);

    // Form state for a new slot
    const [jour, setJour] = useState('Lundi');
    const [heureDebut, setHeureDebut] = useState('');
    const [heureFin, setHeureFin] = useState('');
    const [matiereId, setMatiereId] = useState('');
    const [enseignantId, setEnseignantId] = useState('');

    useEffect(() => {
        if (session?._id) {
            dispatch(getSeancesBySession(session._id));
        }
        return () => {
            dispatch(reset());
        };
    }, [dispatch, session]);



    const handleAddSlot = (e) => {
        e.preventDefault();
        if (!heureDebut || !heureFin || !matiereId || !enseignantId) {
            toast.error("Veuillez remplir tous les champs du créneau.");
            return;
        }

        const seanceData = {
            session: session._id,
            matiere: matiereId,
            enseignant: enseignantId,
            jour,
            heureDebut,
            heureFin,
            type: 'Présentiel' // Par défaut
        };

        dispatch(createSeance(seanceData)).unwrap()
            .then(() => {
                toast.success("Séance ajoutée avec succès !");
                dispatch(getSeancesBySession(session._id));
                // Reset form
                setHeureDebut('');
                setHeureFin('');
                setMatiereId('');
                setEnseignantId('');
            })
            .catch((err) => {
                toast.error(err || "Erreur lors de l'ajout de la séance.");
            });
    };

    const handleDeleteSeance = (id) => {
        if (window.confirm("Voulez-vous vraiment supprimer cette séance ?")) {
            dispatch(deleteSeance(id)).unwrap()
                .then(() => {
                    toast.success("Séance supprimée avec succès !");
                    dispatch(getSeancesBySession(session._id));
                })
                .catch((err) => {
                    toast.error(err || "Erreur lors de la suppression.");
                });
        }
    };

    // Extract matieres from the session's class programme
    const matieres = session?.classe?.programme?.map(p => p.matiere) || [];
    const enseignants = session?.enseignants || [];

    return (
        <div className="planning-modal-overlay" onClick={onClose}>
            <div className="planning-modal" onClick={e => e.stopPropagation()}>
                <div className="planning-modal-header">
                    <h2>Gérer le Planning - {session.nomSession}</h2>
                    <button className="details-close-btn" onClick={onClose}><FaClose /></button>
                </div>

                <div className="planning-modal-body">
                    {/* Add Slot Form */}
                    <div className="add-slot-section">
                        <h3>Ajouter un créneau</h3>
                        <form onSubmit={handleAddSlot} className="add-slot-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Jour</label>
                                    <select value={jour} onChange={(e) => setJour(e.target.value)} required>
                                        {joursSemaine.map(j => (
                                            <option key={j} value={j}>{j}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group time-group">
                                    <label>De (Heure) :</label>
                                    <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} required />
                                </div>
                                <div className="form-group time-group">
                                    <label>À (Heure) :</label>
                                    <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} required />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Matière</label>
                                    <select value={matiereId} onChange={(e) => setMatiereId(e.target.value)} required>
                                        <option value="">Sélectionnez une matière</option>
                                        {matieres.map(m => (
                                            <option key={m._id || m} value={m._id || m}>
                                                {m.nomMatiere || (typeof m === 'string' ? m : 'Matière')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Enseignant</label>
                                    <select value={enseignantId} onChange={(e) => setEnseignantId(e.target.value)} required>
                                        <option value="">Sélectionnez un enseignant</option>
                                        {enseignants.map(p => (
                                            <option key={p._id || p} value={p._id || p}>
                                                {p.firstName ? `${p.firstName} ${p.lastName}` : (typeof p === 'string' ? p : 'Enseignant')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary add-slot-btn">Ajouter le créneau</button>
                        </form>
                    </div>

                    {/* Current Schedule List */}
                    <div className="current-schedule-section">
                        <h3>Créneaux prévus</h3>
                        {isLoading ? (
                            <p style={{ textAlign: 'center', padding: '10px' }}>Chargement...</p>
                        ) : seances.length === 0 ? (
                            <p className="empty-schedule-msg">Aucun créneau programmé pour le moment.</p>
                        ) : (
                            <div className="schedule-list">
                                {seances.map((seance) => (
                                    <div key={seance._id} className="schedule-list-item">
                                        <div className="schedule-slot-info">
                                            <span className="slot-day">{seance.jour}</span>
                                            <span className="slot-time">{seance.heureDebut} - {seance.heureFin}</span>
                                        </div>
                                        <div className="schedule-details">
                                            <span className="slot-matiere">{seance.matiere?.nomMatiere || 'Matière'}</span>
                                            <span className="slot-professeur">
                                                {seance.enseignant ? `${seance.enseignant.nom || seance.enseignant.firstName} ${seance.enseignant.prenom || seance.enseignant.lastName}` : 'Enseignant non assigné'}
                                            </span>
                                        </div>
                                        <button
                                            className="btn-icon btn-delete"
                                            onClick={() => handleDeleteSeance(seance._id)}
                                            title="Supprimer ce créneau"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="planning-modal-footer">
                    <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onClose}>Fermer</button>
                </div>
            </div>
        </div>
    );
}

export default PlanningManagerModal;
