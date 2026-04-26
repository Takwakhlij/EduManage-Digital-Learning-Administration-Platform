import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createInscription } from '../features/inscriptions/inscriptionSlice';
import { getAllSessions } from '../features/sessions/sessionSlice';
// Remarque: L'idéal est d'avoir un usersSlice pour récupérer les étudiants, mais on suppose ici 
// qu'on a déjà accès à une liste ou qu'on va appeler une API (pour l'instant, on laisse la place)
import axios from 'axios'; 
import toast from 'react-hot-toast';
import './CreateClasseModal.css'; // On réutilise le même style que le modal des classes

const CreateInscriptionModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        etudiant: '',
        session: '',
    });

    const [etudiantsDisponibles, setEtudiantsDisponibles] = useState([]);

    // Récupérer les sessions depuis le Redux state
    const { sessions } = useSelector((state) => state.sessions);
    const { auth } = useSelector((state) => state); // Pour le token API

    // Charger les listes (Sessions et Étudiants) à l'ouverture du modal
    useEffect(() => {
        if (isOpen) {
            dispatch(getAllSessions());
            fetchEtudiants();
        }
    }, [isOpen, dispatch]);

    // Fonction rapide pour chercher tous les utilisateurs avec le rôle 'student'
    const fetchEtudiants = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${auth.user.token}` }
            };
            const response = await axios.get('/api/users?role=student', config);
            setEtudiantsDisponibles(response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des étudiants", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.etudiant || !formData.session) {
            toast.error('Veuillez sélectionner un Étudiant et une Session.');
            return;
        }

        const result = await dispatch(createInscription(formData));
        
        if (createInscription.fulfilled.match(result)) {
            toast.success("Inscription ajoutée avec succès !");
            setFormData({ etudiant: '', session: '' });
            onClose();
        } else {
            toast.error(result.payload || "Erreur lors de la création de l'inscription.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Ajouter une Inscription</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <form className="modal-form" onSubmit={onSubmit}>
                    {/* Sélection de l'Étudiant */}
                    <div className="form-group">
                        <label>Étudiant *</label>
                        <select
                            name="etudiant"
                            value={formData.etudiant}
                            onChange={handleChange}
                            required
                            className="form-input custom-select"
                        >
                            <option value="">Sélectionnez un étudiant...</option>
                            {etudiantsDisponibles && etudiantsDisponibles.map((student) => (
                                <option key={student._id} value={student._id}>
                                    {student.firstName} {student.lastName} ({student.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sélection de la Session */}
                    <div className="form-group">
                        <label>Session *</label>
                        <select
                            name="session"
                            value={formData.session}
                            onChange={handleChange}
                            required
                            className="form-input custom-select"
                        >
                            <option value="">Sélectionnez une session...</option>
                            {sessions && sessions.map((session) => (
                                <option key={session._id} value={session._id}>
                                    {session.nomSession} — {session.classe ? session.classe.nomClasse : 'Sans classe'} ({session.montant ? session.montant + ' DT' : 'Gratuit'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="btn-submit">
                            S'inscrire
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateInscriptionModal;
