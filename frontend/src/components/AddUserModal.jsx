import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createUserAdmin } from '../features/admin/adminSlice';
import '../pages/EditUserModal.css'; // Path adapted since AddUserModal is in components/

function AddUserModal({ onClose }) {
    const dispatch = useDispatch();
    const { isLoading } = useSelector((state) => state.admin);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        role: 'student',
        status: 'active'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await dispatch(createUserAdmin(formData));
        onClose();
    };

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="edit-modal-header">
                    <h3 className="edit-modal-title">Ajouter un nouveau membre</h3>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="edit-modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label className="modal-form-label">Prénom *</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    className="modal-form-input"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="modal-form-group">
                                <label className="modal-form-label">Nom *</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    className="modal-form-input"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="modal-form-group">
                            <label className="modal-form-label">Email *</label>
                            <input
                                type="email"
                                name="email"
                                className="modal-form-input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="modal-form-group">
                            <label className="modal-form-label">Mot de passe provisoire *</label>
                            <input
                                type="text"
                                name="password"
                                className="modal-form-input"
                                placeholder="ex: 123456"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="modal-form-group">
                            <label className="modal-form-label">Téléphone</label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                className="modal-form-input"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="modal-form-row">
                            <div className="modal-form-group">
                                <label className="modal-form-label">Rôle *</label>
                                <select
                                    className="modal-form-select"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="student">Étudiant</option>
                                    <option value="parent">Parent</option>
                                    <option value="teacher">Enseignant</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="modal-form-group">
                                <label className="modal-form-label">Statut *</label>
                                <select
                                    className="modal-form-select"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="active">Actif</option>
                                    <option value="pending">En attente</option>
                                    <option value="rejected">Rejeté</option>
                                </select>
                            </div>
                        </div>

                        <div className="edit-modal-footer">
                            <button type="button" className="modal-btn modal-btn-cancel" onClick={onClose} disabled={isLoading}>
                                Annuler
                            </button>
                            <button type="submit" className="modal-btn modal-btn-save" style={{ background: '#10b981' }} disabled={isLoading}>
                                {isLoading ? 'Création...' : 'Créer l\'utilisateur'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddUserModal;
