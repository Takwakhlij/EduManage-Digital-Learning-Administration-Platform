import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { getUsers, updateUserStatus, deleteUser, updateUser } from '../features/admin/adminSlice';
import './DashboardAdmin.css';
import './EditUserModal.css';
import logo from '../assets/logo.png';
function AdminDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { users, isLoading } = useSelector((state) => state.admin);
    const [activeTab, setActiveTab] = useState('tous');
    const [searchTerm, setSearchTerm] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [notification, setNotification] = useState('');
    const location = useLocation();

    useEffect(() => {
        if (location.state?.successMessage) {
            setNotification(location.state.successMessage);
            const timer = setTimeout(() => {
                setNotification('');
                // Optional: Clear state so it doesn't show on refresh? 
                // Using history.replaceState is cleaner but simple timeout works for UI
                navigate(location.pathname, { replace: true, state: {} });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [location, navigate]);

    const handleLogout = () => {
        if (window.confirm('Voulez-vous vraiment vous déconnecter?')) {
            dispatch(logout());
            navigate('/login');
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'admin') {
            navigate('/');
            return;
        }
        // Fetch all users
        dispatch(getUsers());
    }, [user, navigate, dispatch]);

    // Generate avatar with initials and color OR use profile image
    const getAvatar = (userData) => {
        // If userData is undefined or null, return default
        if (!userData) return { initials: '?', color: '#6b7280', hasImage: false };

        // If it's a string (just the name), handle it
        const name = typeof userData === 'string' ? userData : userData.name;
        const profileImage = typeof userData === 'object' ? userData.profileImage : null;

        // If user has a profile image, return it with server URL
        if (profileImage) {
            // Construct full URL for image
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

        // Otherwise generate initials
        if (!name) return { initials: '?', color: '#6b7280', hasImage: false };

        // Use only the first letter
        const initials = name.charAt(0).toUpperCase();
        // Generate color based on name
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

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Get current date in French format
    const getCurrentDate = () => {
        const date = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    };

    // Role translation
    const getRoleLabel = (role) => {
        const roles = {
            student: 'Étudiant',
            parent: 'Parent',
            teacher: 'Enseignant',
            admin: 'Admin'
        };
        return roles[role] || role;
    };

    // Calculate Age
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

    // Filter users based on active tab and search
    const getFilteredUsers = () => {
        if (!users) return [];
        let filtered = [...users];

        // Filter by tab
        if (activeTab === 'pending') {
            filtered = filtered.filter(u => u.status === 'pending');
        } else if (activeTab === 'active') {
            filtered = filtered.filter(u => u.status === 'active');
        }

        // Filter by search term
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(u =>
                u.name?.toLowerCase().includes(search) ||
                u.email?.toLowerCase().includes(search) ||
                u.phone?.includes(search)
            );
        }
        return filtered;
    };

    // Calculate statistics
    const stats = {
        totalMembers: users?.length || 0,
        activeRequests: users?.filter(u => u.status === 'active' && u.role !== 'admin').length || 0,
        pending: users?.filter(u => u.status === 'pending').length || 0,
        students: users?.filter(u => u.role === 'student').length || 0,
    };
    const filteredUsers = getFilteredUsers();
    if (!user) return null;
    return (
        <div className="admin-dashboard">
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
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <div className="admin-sidebar-title">
                        <img src={logo} alt="Logo Noor Tayyiba" className="admin-sidebar-logo" />
                        <button
                            className="close-sidebar-btn"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Navigation System */}
                <nav className="admin-sidebar-nav">
                    <button className="nav-item active">
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <span>Dashboard</span>
                    </button>

                    <button className="nav-item">
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>Membres</span>
                    </button>

                    <button className="nav-item">
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        <span>Statistiques</span>
                    </button>

                    <button className="nav-item">
                        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6M21 12h-6m-6 0H3"></path>
                            <path d="m20.49 8.51-4.24 4.24m-4.24 4.24L7.77 21.23m8.48-12.72 4.24-4.24M7.77 2.77l4.24 4.24"></path>
                        </svg>
                        <span>Paramètres</span>
                    </button>
                </nav>
            </aside>
            {/* Main Content */}
            <main className="admin-main">
                {/* Top Navbar */}
                <nav className="top-navbar">
                    <div className="navbar-left">
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <div className="search-bar">
                            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search"
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="navbar-right">
                        {/* Messages */}
                        <button className="navbar-icon-btn" title="Messages">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0 1.1.9 2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                        </button>

                        {/* Notifications */}
                        <button className="navbar-icon-btn" title="Notifications">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            <span className="notification-badge">1</span>
                        </button>

                        {/* Help */}
                        <button className="navbar-icon-btn" title="Aide">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </button>

                        {/* Separator */}
                        <div className="navbar-separator"></div>

                        {/* Admin Profile */}
                        <div className="navbar-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div className="navbar-avatar" style={{ background: getAvatar(user).hasImage ? 'transparent' : getAvatar(user).color }}>
                                {getAvatar(user).hasImage ? (
                                    <img src={getAvatar(user).imageUrl} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    getAvatar(user).initials
                                )}
                            </div>
                            <div className="navbar-profile-info">
                                <span className="navbar-profile-name">{user.firstName} {user.lastName}</span>
                                <span className="navbar-profile-role">Super Admin</span>
                            </div>
                            <svg className={`navbar-chevron ${showProfileMenu ? 'active' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>

                            {/* Dropdown Menu */}
                            {showProfileMenu && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-header">
                                        <p className="dropdown-name">{user.name || 'Super Admin'}</p>
                                        <p className="dropdown-role">{getRoleLabel(user.role)}</p>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item" onClick={() => navigate('/profile')}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        Mon Profil
                                    </button>
                                    <button className="dropdown-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="3"></circle>
                                            <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
                                        </svg>
                                        Paramètres
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item danger" onClick={handleLogout}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                        Déconnexion
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Header (Stats section qui existait) */}
                <header className="admin-header">
                    <h1 className="admin-header-title">Tableau de Bord</h1>
                    <p className="admin-header-subtitle">Vue d'overview et gestion des membres</p>
                    <div className="admin-header-date">{getCurrentDate()}</div>
                </header>
                {/* Statistics Cards */}
                <div className="admin-stats">
                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div className="stat-content">
                            <h3>Total Membres</h3>
                            <p>{stats.totalMembers}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <polyline points="17 11 19 13 23 9"></polyline>
                            </svg>
                        </div>
                        <div className="stat-content">
                            <h3>Comptes Actifs</h3>
                            <p>{stats.activeRequests}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <div className="stat-content">
                            <h3>En Attente</h3>
                            <p>{stats.pending}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon purple">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                            </svg>
                        </div>
                        <div className="stat-content">
                            <h3>Étudiants</h3>
                            <p>{stats.students}</p>
                        </div>
                    </div>
                </div>
                {/* Users Table */}
                <div className="admin-table-container">
                    {/* Tabs */}
                    <div className="admin-tabs">
                        <button
                            className={`admin-tab ${activeTab === 'tous' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tous')}
                        >
                            Tous
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            En attente
                            {stats.pending > 0 && <span className="badge">{stats.pending}</span>}
                        </button>
                        <button
                            className={`admin-tab ${activeTab === 'active' ? 'active' : ''}`}
                            onClick={() => setActiveTab('active')}
                        >
                            Actifs
                        </button>
                    </div>
                    {/* Search Bar */}
                    <div className="admin-search">
                        <input
                            type="text"
                            placeholder="Rechercher un membre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Membre</th>
                                    <th>Contact</th>
                                    <th>Rôle</th>
                                    <th>Statut</th>
                                    <th>Date</th>
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
                                                    {member.status === 'active' ? 'ACTIF' : member.status === 'rejected' ? 'REJETÉ' : 'EN ATTENTE'}
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
                                                                className="action-btn check"
                                                                title="Approuver"
                                                                onClick={() => dispatch(updateUserStatus({
                                                                    id: member._id,
                                                                    status: 'active'
                                                                }))}
                                                            >
                                                                ✓
                                                            </button>
                                                            <button
                                                                className="action-btn close"
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
            </main >
        </div >
    );
}
export default AdminDashboard;