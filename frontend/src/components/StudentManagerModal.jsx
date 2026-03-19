import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateClasseEtudiants } from '../features/classes/classeSlice';
import { getUsers } from '../features/admin/adminSlice';
import './StudentManagerModal.css';

const FaClose = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

function StudentManagerModal({ classe, onClose }) {
    const dispatch = useDispatch();
    const { users, isLoading } = useSelector((state) => state.admin);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Obtenir tous les utilisateurs pour filtrer les étudiants
        dispatch(getUsers());

        // Pré-sélectionner les étudiants déjà dans la classe
        if (classe && classe.etudiants) {
            const initialSelected = classe.etudiants.map(student =>
                typeof student === 'object' ? student._id : student
            );
            setSelectedStudents(initialSelected);
        }
    }, [dispatch, classe]);

    // Filtrer les utilisateurs pour ne garder que les étudiants (role === 'student' ou par défaut si non défini)
    const studentsList = users.filter(user => user.role === 'student');

    // Filtrer par recherche
    const filteredStudents = studentsList.filter(student =>
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCheckboxChange = (studentId) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(selectedStudents.filter(id => id !== studentId));
        } else {
            setSelectedStudents([...selectedStudents, studentId]);
        }
    };

    const handleSave = () => {
        dispatch(updateClasseEtudiants({ id: classe._id, etudiantsData: selectedStudents }));
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="planning-modal-content student-modal">
                <div className="planning-modal-header">
                    <h2>Gérer les Étudiants de {classe.nomClasse}</h2>
                    <button className="close-planning-btn" onClick={onClose}>
                        <FaClose />
                    </button>
                </div>

                <div className="planning-modal-body">
                    {/* Explications */}
                    <div className="planning-intro">
                        <p>Cochez les étudiants que vous souhaitez inscrire à cette classe. Ils auront ainsi accès au planning et aux cours de la classe depuis leur espace.</p>
                    </div>

                    <div className="student-search">
                        <input
                            type="text"
                            placeholder="Rechercher un étudiant par nom ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="students-selection-list">
                        {isLoading ? (
                            <p className="loading-students">Chargement des étudiants...</p>
                        ) : filteredStudents.length === 0 ? (
                            <p className="no-students">Aucun étudiant trouvé.</p>
                        ) : (
                            filteredStudents.map((student) => (
                                <label key={student._id} className={`student-checkbox-item ${selectedStudents.includes(student._id) ? 'selected' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.includes(student._id)}
                                        onChange={() => handleCheckboxChange(student._id)}
                                    />
                                    <div className="student-info-row">
                                        <div className="student-avatar-small">
                                            {student.profileImage ? (
                                                <img src={`http://localhost:5000${student.profileImage}`} alt="Avatar" />
                                            ) : (
                                                student.firstName.charAt(0)
                                            )}
                                        </div>
                                        <div className="student-text">
                                            <span className="student-name">{student.firstName} {student.lastName}</span>
                                            <span className="student-email">{student.email}</span>
                                        </div>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                </div>

                <div className="planning-modal-footer">
                    <span className="selected-count">
                        <strong>{selectedStudents.length}</strong> étudiant(s) sélectionné(s)
                    </span>
                    <div className="footer-actions">
                        <button className="btn-cancel" onClick={onClose}>Annuler</button>
                        <button className="btn-save" onClick={handleSave}>Enregistrer la liste</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentManagerModal;
