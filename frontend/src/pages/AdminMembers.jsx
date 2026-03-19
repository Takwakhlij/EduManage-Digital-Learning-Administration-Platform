import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUsers, updateUserStatus, deleteUser, updateUser } from '../features/admin/adminSlice';
import AddUserModal from '../components/AddUserModal';
import './DashboardAdmin.css';
import './EditUserModal.css';

function AdminMembers() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { users, isLoading } = useSelector((state) => state.admin);
    const [activeTab, setActiveTab] = useState('tous');
    const [searchTerm, setSearchTerm] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [notification, setNotification] = useState('');
    const location = useLocation();

    useEffect(() => {
        if (location.state?.successMessage) {
            setNotification(location.state.successMessage);
            const timer = setTimeout(() => {
                setNotification('');
                navigate(location.pathname, { replace: true, state: {} });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [location, navigate]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'admin') {
            navigate('/');
            return;
        }
        dispatch(getUsers());
    }, [user, navigate, dispatch]);

    // Generate avatar helper
    const getAvatar = (userData) => {
        if (!userData) return { initials: '?', color: '#6b7280', hasImage: false };
        const name = typeof userData === 'string' ? userData : userData.name;
        const profileImage = typeof userData === 'object' ? userData.profileImage : null;

        if (profileImage) {
            const imageUrl = profileImage.startsWith('http')
                ? profileImage
                : `http://localhost:5000${profileImage}`;
            return {
                initials: name?.charAt(0).toUpperCase() || '?',
                color: '#6b7280',
                hasImage: true,
                imageUrl: imageUrl
            };
        }

        if (!name) return { initials: '?', color: '#6b7280', hasImage: false };
        const initials = name.charAt(0).toUpperCase();
        const colors = [
            'linear-gradient(135deg, #3b82f6, #2563eb)',
            'linear-gradient(135deg, #ec4899, #db2777)',
            'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            'linear-gradient(135deg, #10b981, #059669)',
            'linear-gradient(135deg, #f59e0b, #f97316)',
        ];
        const colorIndex = name.charCodeAt(0) % colors.length;
        return {
            initials: initials.toUpperCase(),
            color: colors[colorIndex],
            hasImage: false
        };
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getRoleLabel = (role) => {
        const roles = {
            student: 'Étudiant',
            parent: 'Parent',
            teacher: 'Enseignant',
            admin: 'Admin'
        };
        return roles[role] || role;
    };

    const calculateAge = (dob) => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return `${age} ans`;
    };

    const getFilteredUsers = () => {
        if (!users) return [];
        let filtered = [...users];

        if (activeTab === 'pending') {
            filtered = filtered.filter(u => u.status === 'pending');
        } else if (activeTab === 'active') {
            filtered = filtered.filter(u => u.status === 'active');
        }

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(u =>
                u.name?.toLowerCase().includes(search) ||
                (u.firstName + ' ' + u.lastName).toLowerCase().includes(search) ||
                u.email?.toLowerCase().includes(search) ||
                u.phone?.includes(search)
            );
        }
        return filtered;
    };

    const stats = {
        total: users?.length || 0,
        active: users?.filter(u => u.status === 'active').length || 0,
        pending: users?.filter(u => u.status === 'pending').length || 0,
    };

    const filteredUsers = getFilteredUsers();
    if (!user) return null;

    return (
        <div className="admin-members-page">
            {/* Notification Toast */}
            {notification && (
                <div className="notification-toast" style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 10000,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span style={{ fontWeight: '500' }}>{notification}</span>
                    </div>
                </div>
            )}

            {/* Hero Header Section */}
            <div className="members-hero">
                <div className="members-hero-content">
                    <h1 className="members-hero-title">Gestion des Membres</h1>
                    <p className="members-hero-subtitle">Visualisez, filtrez et gérez les comptes de la plateforme</p>
                </div>
            </div>

            {/* Quick Stats Section */}
            <div className="members-quick-stats">
                <div className="quick-stat-card">
                    <div className="quick-stat-icon total">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div className="quick-stat-info">
                        <span className="quick-stat-value">{stats.total}</span>
                        <span className="quick-stat-label">Total Utilisateurs</span>
                    </div>
                </div>

                <div className="quick-stat-card">
                    <div className="quick-stat-icon active">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <div className="quick-stat-info">
                        <span className="quick-stat-value">{stats.active}</span>
                        <span className="quick-stat-label">Comptes Actifs</span>
                    </div>
                </div>

                <div className="quick-stat-card">
                    <div className="quick-stat-icon pending">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <div className="quick-stat-info">
                        <span className="quick-stat-value">{stats.pending}</span>
                        <span className="quick-stat-label">En Attente</span>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="members-table-container">
                {/* Header Actions (Tabs & Search & Add Button) */}
                <div className="members-table-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="members-tabs">
                        <button
                            className={`members-tab-btn ${activeTab === 'tous' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tous')}
                        >
                            Tous les membres
                        </button>
                        <button
                            className={`members-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            En attente
                            {stats.pending > 0 && <span className="members-badge pending">{stats.pending}</span>}
                        </button>
                        <button
                            className={`members-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                            onClick={() => setActiveTab('active')}
                        >
                            Actifs
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="members-search-wrapper">
                            <svg className="members-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                className="members-search-input"
                                placeholder="Rechercher par nom, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setShowAddModal(true)}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Ajouter un membre
                        </button>
                    </div>
                </div>
                {/* Table */}
                {isLoading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <p>Aucun membre trouvé</p>
                    </div>
                ) : (
                    <table className="members-table">
                        <thead>
                            <tr>
                                <th>Profil</th>
                                <th>Contact</th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                <th>Date d'inscription</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((member) => {
                                const avatar = getAvatar(member);
                                return (
                                    <tr key={member._id}>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar-wrapper">
                                                    <div
                                                        className="user-avatar"
                                                        style={{ background: avatar.hasImage ? 'transparent' : avatar.color }}
                                                    >
                                                        {avatar.hasImage ? (
                                                            <img src={avatar.imageUrl} alt={member.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                        ) : (
                                                            avatar.initials
                                                        )}
                                                    </div>
                                                    <div className={`role-indicator ${member.role}`}>
                                                        {member.role === 'student' && (
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                                                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                                            </svg>
                                                        )}
                                                        {member.role === 'parent' && (
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                                <circle cx="9" cy="7" r="4"></circle>
                                                            </svg>
                                                        )}
                                                        {member.role === 'teacher' && (
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                                            </svg>
                                                        )}
                                                        {member.role === 'admin' && (
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="user-details">
                                                    <span className="user-name">
                                                        {member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Utilisateur'}
                                                    </span>
                                                    <span className="user-age">
                                                        {member.dateOfBirth
                                                            ? calculateAge(member.dateOfBirth)
                                                            : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-info">
                                                <div className="contact-email">{member.email}</div>
                                                <div className="contact-phone">{member.phone || '-'}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${member.role}`}>
                                                {member.role === 'student' && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                                    </svg>
                                                )}
                                                {member.role === 'parent' && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                        <circle cx="9" cy="7" r="4"></circle>
                                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                    </svg>
                                                )}
                                                {member.role === 'teacher' && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                                    </svg>
                                                )}
                                                {member.role === 'admin' && (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                                    </svg>
                                                )}
                                                {getRoleLabel(member.role)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${member.status}`}>
                                                {member.status === 'active' ? 'ACTIF' :
                                                    member.status === 'rejected' ? 'REJETÉ' :
                                                        member.status === 'inactive' ? 'INACTIF' :
                                                            'EN ATTENTE'}
                                            </span>
                                        </td>
                                        <td>{formatDate(member.createdAt)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn edit"
                                                    title="Modifier"
                                                    onClick={() => {
                                                        setEditingUser(member);
                                                        setShowEditModal(true);
                                                    }}
                                                >
                                                    ✏️
                                                </button>
                                                {member.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="action-btn approve"
                                                            title="Approuver"
                                                            onClick={() => dispatch(updateUserStatus({
                                                                id: member._id,
                                                                status: 'active'
                                                            }))}
                                                        >
                                                            ✓
                                                        </button>
                                                        <button
                                                            className="action-btn reject"
                                                            title="Rejeter"
                                                            onClick={() => {
                                                                if (window.confirm(`Êtes-vous sûr de vouloir rejeter ${member.name} ?`)) {
                                                                    dispatch(updateUserStatus({
                                                                        id: member._id,
                                                                        status: 'rejected'
                                                                    }));
                                                                }
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    className="action-btn delete"
                                                    title="Supprimer"
                                                    onClick={() => {
                                                        if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${member.name}?`)) {
                                                            dispatch(deleteUser(member._id));
                                                        }
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add User Modal */}
            {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} />}

            {/* Edit User Modal */}
            {
                showEditModal && editingUser && (
                    <div className="edit-modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="edit-modal-header">
                                <h3 className="edit-modal-title">Modifier l'utilisateur</h3>
                                <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                                    ×
                                </button>
                            </div>
                            <div className="edit-modal-body">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    const userData = {
                                        firstName: formData.get('firstName'),
                                        lastName: formData.get('lastName'),
                                        email: formData.get('email'),
                                        phoneNumber: formData.get('phoneNumber'),
                                        role: formData.get('role'),
                                        status: formData.get('status'),
                                    };
                                    dispatch(updateUser({ id: editingUser._id, userData }));
                                    setShowEditModal(false);
                                }}>
                                    <div className="modal-form-row">
                                        <div className="modal-form-group">
                                            <label className="modal-form-label">Prénom</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                className="modal-form-input"
                                                defaultValue={editingUser.firstName}
                                                required
                                            />
                                        </div>
                                        <div className="modal-form-group">
                                            <label className="modal-form-label">Nom</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                className="modal-form-input"
                                                defaultValue={editingUser.lastName}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="modal-form-group">
                                        <label className="modal-form-label">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="modal-form-input"
                                            defaultValue={editingUser.email}
                                            required
                                        />
                                    </div>

                                    <div className="modal-form-group">
                                        <label className="modal-form-label">Téléphone</label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            className="modal-form-input"
                                            defaultValue={editingUser.phoneNumber}
                                        />
                                    </div>

                                    <div className="modal-form-row">
                                        <div className="modal-form-group">
                                            <label className="modal-form-label">Rôle</label>
                                            <select
                                                className="modal-form-select"
                                                name="role"
                                                defaultValue={editingUser.role}
                                                required
                                            >
                                                <option value="student">Étudiant</option>
                                                <option value="teacher">Enseignant</option>
                                                <option value="parent">Parent</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div className="modal-form-group">
                                            <label className="modal-form-label">Statut</label>
                                            <select
                                                className="modal-form-select"
                                                name="status"
                                                defaultValue={editingUser.status}
                                                required
                                            >
                                                <option value="active">Actif</option>
                                                <option value="pending">En attente</option>
                                                <option value="rejected">Rejeté</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="edit-modal-footer">
                                        <button
                                            type="button"
                                            className="modal-btn modal-btn-cancel"
                                            onClick={() => setShowEditModal(false)}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="modal-btn modal-btn-save"
                                        >
                                            Enregistrer
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

export default AdminMembers;
