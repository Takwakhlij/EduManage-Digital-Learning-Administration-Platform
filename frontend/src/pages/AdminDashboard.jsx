import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUsers, updateUserStatus, deleteUser, updateUser } from '../features/admin/adminSlice';
import { getAllSessions } from '../features/sessions/sessionSlice';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import './DashboardAdmin.css';
import './EditUserModal.css';

function AdminDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { users, isLoading: usersLoading } = useSelector((state) => state.admin);
    const { sessions, isLoading: sessionsLoading } = useSelector((state) => state.sessions);
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
        dispatch(getAllSessions());
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


    const getCurrentDate = () => {
        const date = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
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

    const stats = {
        totalMembers: users?.length || 0,
        activeRequests: users?.filter(u => u.status === 'active' && u.role !== 'admin').length || 0,
        pending: users?.filter(u => u.status === 'pending').length || 0,
        students: users?.filter(u => u.role === 'student').length || 0,
        activeSessions: sessions?.filter(s => s.statut !== 'Terminée').length || 0,
        completedSessions: sessions?.filter(s => s.statut === 'Terminée').length || 0,
    };

    // -- Data for Charts --
    const getChartData = () => {
        if (!users || users.length === 0) return { registrationData: [], roleData: [], statusData: [], monthlyNewUsersData: [] };

        // 1. Role Distribution
        const roleCounts = users.reduce((acc, user) => {
            const role = user.role || 'unknown';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});

        const roleData = [
            { name: 'Étudiants', value: roleCounts['student'] || 0, color: '#8b5cf6' },
            { name: 'Enseignants', value: roleCounts['teacher'] || 0, color: '#10b981' },
            { name: 'Parents', value: roleCounts['parent'] || 0, color: '#f59e0b' },
            { name: 'Admins', value: roleCounts['admin'] || 0, color: '#3b82f6' },
        ].filter(item => item.value > 0);

        // 2. Status Distribution (Actif, En attente, Inactif/Rejeté)
        const statusCounts = users.reduce((acc, user) => {
            if (user.role === 'admin') return acc; // Exclude admins from status metrics usually
            const status = user.status || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const statusData = [
            { name: 'Actifs', value: statusCounts['active'] || 0, fill: '#10b981' }, // Green
            { name: 'En attente', value: statusCounts['pending'] || 0, fill: '#f59e0b' }, // Orange
            { name: 'Inactifs/Rejetés', value: (statusCounts['inactive'] || 0) + (statusCounts['rejected'] || 0), fill: '#ef4444' } // Red
        ];


        // 3. Registrations over time (last 6 months) - Génération dynamique (Sliding Window)
        const generateLast6Months = () => {
            const result = [];
            const currentDate = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                // Format: 'mars 26' (fr-FR short format, removing any dots)
                let monthStr = d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
                // Clean up possible dots from abbreviations like 'oct.'
                monthStr = monthStr.replace(/\./g, '');
                result.push({ date: d, key: monthStr });
            }
            return result;
        };

        const last6Months = generateLast6Months();
        const sixMonthsAgo = last6Months[0].date;

        const monthlyCounts = {};
        last6Months.forEach(m => {
            monthlyCounts[m.key] = 0;
        });

        // Mapping des données backend
        users.forEach(user => {
            if (user.createdAt) {
                const d = new Date(user.createdAt);
                if (d >= sixMonthsAgo) {
                    let monthStr = d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }).replace(/\./g, '');
                    if (monthlyCounts[monthStr] !== undefined) {
                        monthlyCounts[monthStr]++;
                    }
                }
            }
        });

        // Compute cumulative total for the Area chart
        let previousTotal = users.filter(u => new Date(u.createdAt) < sixMonthsAgo).length;

        const registrationData = Object.keys(monthlyCounts).map(month => {
            previousTotal += monthlyCounts[month];
            return {
                name: month,
                'Nouveaux inscrits': monthlyCounts[month],
                'Total cumulé': previousTotal
            };
        });

        // Compute purely new users per month for the Line/Bar chart
        const monthlyNewUsersData = Object.keys(monthlyCounts).map(month => ({
            name: month,
            'Nouveaux': monthlyCounts[month]
        }));


        return { roleData, registrationData, statusData, monthlyNewUsersData };
    };

    const { roleData, registrationData, statusData, monthlyNewUsersData } = useMemo(() => getChartData(), [users]);

    if (!user) return null;

    return (
        <div style={{ width: '100%' }}>
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

            {/* Date display and Subtitle moved from header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '30px 0 10px', gap: '8px' }}>
                <span className="admin-header-subtitle" style={{ fontSize: '14px', color: 'var(--text-gray)', fontWeight: '500', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Panneau de Contrôle — Administration Générale
                </span>
            </div>

            {/* ── Quranic Verse Card ── */}
            <div className="quran-verse-card">
                <div className="quran-opening">Verset du jour</div>
                <div className="quran-arabic-text">
                    <span className="quran-bracket-open">﴿</span>
                    {' '}يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ{' '}
                    <span className="quran-bracket-close">﴾</span>
                </div>
                <p className="quran-translation">« Allah élèvera ceux d'entre vous qui ont cru et ceux qui ont reçu la science, de plusieurs degrés »</p>
                <span className="quran-reference">📖 Sourate Al-Mujadila — Verset 11</span>
            </div>

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
                        <h3>Sessions Actives</h3>
                        <p>{stats.activeSessions}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon gold" style={{ color: '#c9a961', backgroundColor: 'rgba(201, 169, 97, 0.1)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <div className="stat-content">
                        <h3>Sess. Terminées</h3>
                        <p>{stats.completedSessions}</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="admin-charts-container">
                {/* Chart 1: Evolution Cumulée (Full Width) */}
                <div className="chart-card full-width">
                    <div className="chart-header">
                        <h3>Évolution des Inscriptions</h3>
                        <p>Progression totale sur les 6 derniers mois</p>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={registrationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="Total cumulé" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Répartition des Rôles (Pie) */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Répartition des Rôles</h3>
                        <p>Distribution selon le type de compte</p>
                    </div>
                    <div className="chart-wrapper pie-chart-wrapper">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={roleData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {roleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pie-chart-legend">
                            {roleData.map((entry, index) => (
                                <div key={index} className="legend-item">
                                    <span className="legend-color" style={{ backgroundColor: entry.color }}></span>
                                    <span className="legend-name">{entry.name}</span>
                                    <span className="legend-value">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart 3: Répartition par statuts (Bar Chart) */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Statuts des Comptes</h3>
                        <p>Aperçu des comptes actifs vs attente/rejetés</p>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={statusData} margin={{ top: 30, right: 30, left: 0, bottom: 0 }} barSize={40}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} allowDecimals={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default AdminDashboard;