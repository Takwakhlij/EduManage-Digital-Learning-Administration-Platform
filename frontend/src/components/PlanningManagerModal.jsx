import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateClassePlanning } from '../features/classes/classeSlice';
import './PlanningManagerModal.css'; // We will create this next

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

function PlanningManagerModal({ classe, onClose }) {
    const dispatch = useDispatch();
    const [planning, setPlanning] = useState([]);

    // Form state for a new slot
    const [jour, setJour] = useState('Lundi');
    const [heureDebut, setHeureDebut] = useState('');
    const [heureFin, setHeureFin] = useState('');
    const [matiereId, setMatiereId] = useState('');
    const [professeurId, setProfesseurId] = useState('');

    useEffect(() => {
        if (classe && classe.planning) {
            // Keep local state of the planning to modify it before saving
            // Use spread operator to avoid mutating the original Redux state object directly
            setPlanning([...classe.planning]);
        }
    }, [classe]);

    const handleAddSlot = (e) => {
        e.preventDefault();
        if (!heureDebut || !heureFin || !matiereId || !professeurId) return;

        const newSlot = {
            jour,
            heureDebut,
            heureFin,
            matiere: matiereId, // Store just the ObjectId to send to backend
            professeur: professeurId
        };

        setPlanning([...planning, newSlot]);

        // Reset form
        setHeureDebut('');
        setHeureFin('');
        setMatiereId('');
        setProfesseurId('');
    };

    const handleRemoveSlot = (indexToRemove) => {
        setPlanning(planning.filter((_, index) => index !== indexToRemove));
    };

    const handleSave = () => {
        let finalPlanning = [...planning];

        // Check if the user filled the form but forgot to click "Ajouter le créneau"
        const isFormPartiallyFilled = heureDebut || heureFin || matiereId || professeurId;
        const isFormFullyFilled = heureDebut && heureFin && matiereId && professeurId;

        if (isFormFullyFilled) {
            // Auto-add the valid slot
            finalPlanning.push({
                jour,
                heureDebut,
                heureFin,
                matiere: matiereId,
                professeur: professeurId
            });
        } else if (isFormPartiallyFilled) {
            // Warn the user that the current slot is incomplete
            if (!window.confirm("Vous avez commencé à saisir un créneau mais il manque des informations. Ce créneau incomplet sera ignoré. Voulez-vous quand même enregistrer le reste du planning ?")) {
                return; // Cancel save
            }
        } else if (finalPlanning.length === 0) {
            // Planning is completely empty
            if (!window.confirm("Le planning est vide. Voulez-vous vraiment enregistrer un planning vide ?")) {
                return; // Cancel save
            }
        }

        dispatch(updateClassePlanning({ id: classe._id, planningData: finalPlanning }));
        onClose();
    };

    // Helper functions to get names for display in the local list
    const getMatiereName = (mId) => {
        const mat = classe.matieres?.find(m => m._id === mId || m === mId);
        if (!mat) return 'Inconnue';
        return typeof mat === 'object' ? mat.nomMatiere : mId; // It might be populated or just ID
    };

    const getProfName = (pId) => {
        const prof = classe.professeurs?.find(p => p._id === pId || p === pId);
        if (!prof) return 'Inconnu';
        return typeof prof === 'object' ? `${prof.firstName} ${prof.lastName}` : pId;
    };

    return (
        <div className="planning-modal-overlay" onClick={onClose}>
            <div className="planning-modal" onClick={e => e.stopPropagation()}>
                <div className="planning-modal-header">
                    <h2>Gérer le Planning - {classe.nomClasse}</h2>
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
                                        {classe.matieres?.map(m => (
                                            <option key={m._id || m} value={m._id || m}>
                                                {m.nomMatiere || m}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Enseignant</label>
                                    <select value={professeurId} onChange={(e) => setProfesseurId(e.target.value)} required>
                                        <option value="">Sélectionnez un enseignant</option>
                                        {classe.professeurs?.map(p => (
                                            <option key={p._id || p} value={p._id || p}>
                                                {p.firstName ? `${p.firstName} ${p.lastName}` : p}
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
                        {planning.length === 0 ? (
                            <p className="empty-schedule-msg">Aucun créneau programmé pour le moment.</p>
                        ) : (
                            <div className="schedule-list">
                                {planning.map((slot, idx) => {
                                    // Handle populated subdocuments or just IDs
                                    const mName = typeof slot.matiere === 'object' ? slot.matiere?.nomMatiere : getMatiereName(slot.matiere);
                                    const pName = typeof slot.professeur === 'object' ? `${slot.professeur?.firstName} ${slot.professeur?.lastName}` : getProfName(slot.professeur);

                                    return (
                                        <div key={idx} className="schedule-list-item">
                                            <div className="schedule-slot-info">
                                                <span className="slot-day">{slot.jour}</span>
                                                <span className="slot-time">{slot.heureDebut} - {slot.heureFin}</span>
                                            </div>
                                            <div className="schedule-details">
                                                <span className="slot-matiere">{mName}</span>
                                                <span className="slot-professeur">{pName}</span>
                                            </div>
                                            <button
                                                className="btn-icon btn-delete"
                                                onClick={() => handleRemoveSlot(idx)}
                                                title="Supprimer ce créneau"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="planning-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button className="btn btn-primary" onClick={handleSave}>Enregistrer le planning</button>
                </div>
            </div>
        </div>
    );
}

export default PlanningManagerModal;
