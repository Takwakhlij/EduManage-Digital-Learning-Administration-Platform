import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllSessions, reset, togglePublishSession, deleteSession } from '../features/sessions/sessionSlice';
import CreateSessionModal from '../components/CreateSessionModal';
import EditSessionModal from '../components/EditSessionModal';
import PlanningManagerModal from '../components/PlanningManagerModal';
import { 
    Eye, EyeOff, CheckCircle, Clock, Users, BookOpen, 
    Trash2, Edit, Plus, Search, Filter, Mail, Folder, FileText, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import './DashboardAdmin.css';

const SessionsList = () => {
    const dispatch = useDispatch();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionToEdit, setSessionToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('toutes');
    const [filterClasse, setFilterClasse] = useState('toutes');
    
    const { sessions, isLoading } = useSelector((state) => state.sessions);
    const [localSessions, setLocalSessions] = useState([]);

    // Extraire dynamiquement les classes existantes pour le filtre
    const availableClasses = useMemo(() => {
        const classesMap = {};
        localSessions.forEach(s => {
            const cls = Array.isArray(s.classe) ? s.classe[0] : s.classe;
            if (cls && cls._id) {
                classesMap[cls._id] = cls.nomClasse;
            }
        });
        return Object.entries(classesMap).map(([id, name]) => ({ id, name }));
    }, [localSessions]);

    useEffect(() => {
        dispatch(getAllSessions());
        return () => dispatch(reset());
    }, [dispatch]);

    useEffect(() => {
        if (sessions) setLocalSessions(sessions);
    }, [sessions]);

    const handleToggleVisibility = async (sessionId, currentStatus) => {
        if (!currentStatus) {
            const session = localSessions.find(s => s._id === sessionId);
            // Vérification si le corps enseignant est affecté (s'il y a un décalage entre le prg et les assignations)
            if (session && (!session.enseignants || session.enseignants.length === 0)) {
                const confirmed = window.confirm("Avertissement : Le corps enseignant n'est pas totalement affecté à cette session. Voulez-vous vraiment la publier ?");
                if (!confirmed) return;
            }
        }

        // Optimistic update: mise à jour immédiate de l'UI
        setLocalSessions(prev => prev.map(s => 
            s._id === sessionId ? { ...s, isPublished: !currentStatus } : s
        ));

        try {
            // Appel API réel via Redux — on attend le résultat
            const result = await dispatch(togglePublishSession(sessionId));
            
            // Si l'action a été rejetée (erreur serveur), on revert l'état local
            if (togglePublishSession.rejected.match(result)) {
                setLocalSessions(prev => prev.map(s => 
                    s._id === sessionId ? { ...s, isPublished: currentStatus } : s
                ));
                toast.error("Erreur : Impossible de changer la visibilité. Veuillez réessayer.");
            } else if (togglePublishSession.fulfilled.match(result)) {
                // Succès: on synchronise avec la vraie valeur retournée par le serveur
                const updatedSession = result.payload?.session;
                if (updatedSession) {
                    setLocalSessions(prev => prev.map(s => 
                        s._id === sessionId ? { ...s, isPublished: updatedSession.isPublished } : s
                    ));
                    toast.success(updatedSession.isPublished ? "Session publiée avec succès" : "Session masquée avec succès");
                }
            }
        } catch (error) {
            // Revert en cas d'erreur réseau
            setLocalSessions(prev => prev.map(s => 
                s._id === sessionId ? { ...s, isPublished: currentStatus } : s
            ));
            console.error("Erreur réseau lors du toggle :", error);
        }
    };

    const handleDeleteSession = (id, name) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la session "${name}" ? Cette action est irréversible.`)) {
            dispatch(deleteSession(id)).unwrap()
                .then(() => {
                    toast.success('Session supprimée avec succès !');
                })
                .catch((err) => {
                    toast.error(err || 'Erreur lors de la suppression de la session');
                });
        }
    };

    const handleEditSession = (session) => {
        setSessionToEdit(session);
        setIsEditModalOpen(true);
    };

    // Filtrage dynamique (Recherche + Onglets)
    const filteredSessions = useMemo(() => {
        return localSessions.filter(session => {
            const cls = Array.isArray(session.classe) ? session.classe[0] : session.classe;
            const matchesSearch = session.nomSession?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 session.enseignants?.some(t => 
                                    t.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    t.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
                                 ) ||
                                 cls?.nomClasse?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesTab = activeTab === 'toutes' || 
                              (activeTab === 'publiées' && session.isPublished) ||
                              (activeTab === 'masquées' && !session.isPublished);
                              
            const matchesClasse = filterClasse === 'toutes' || cls?._id === filterClasse;
            
            return matchesSearch && matchesTab && matchesClasse;
        });
    }, [localSessions, searchTerm, activeTab, filterClasse]);

    return (
        <div className="admin-sessions-unified" style={{ padding: '32px', fontFamily: "'Inter', system-ui, sans-serif" }}>
            <CreateSessionModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
            />

            <EditSessionModal 
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSessionToEdit(null);
                }}
                session={sessionToEdit}
            />

            {isPlanningModalOpen && selectedSession && (
                <PlanningManagerModal 
                    session={selectedSession} 
                    onClose={() => {
                        setIsPlanningModalOpen(false);
                        setSelectedSession(null);
                    }} 
                />
            )}

            {/* Header Unified */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#ffffff', margin: '0 0 6px 0' }}>Gestion des Sessions</h1>
                <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>Administration et visibilité des cours</p>
            </div>

            {/* Toolbar Unified */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '40px',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        style={{
                            background: '#059669', // Emerald Green Official
                            color: 'white', border: 'none', borderRadius: '8px',
                            padding: '12px 24px', fontSize: '15px', fontWeight: '600',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
                        }}
                    >
                        <Plus size={18} />
                        Nouvelle Session
                    </button>

                    <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.4)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        {['toutes', 'publiées', 'masquées'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '8px 20px', borderRadius: '6px', border: 'none',
                                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                                    textTransform: 'capitalize', transition: 'all 0.3s',
                                    background: activeTab === tab ? '#059669' : 'transparent',
                                    color: activeTab === tab ? 'white' : 'rgba(255, 255, 255, 0.6)'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px', 
                        background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px', padding: '8px 12px'
                    }}>
                        <BookOpen size={16} color="rgba(255, 255, 255, 0.4)" />
                        <select
                            value={filterClasse}
                            onChange={(e) => setFilterClasse(e.target.value)}
                            style={{
                                background: 'transparent', border: 'none', color: '#fff',
                                fontSize: '13px', outline: 'none', cursor: 'pointer'
                            }}
                        >
                            <option value="toutes" style={{ color: '#000' }}>Toutes les classes</option>
                            {availableClasses.map(cls => (
                                <option key={cls.id} value={cls.id} style={{ color: '#000' }}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px', padding: '10px 18px', width: '300px'
                    }}>
                        <Search size={16} color="rgba(255, 255, 255, 0.4)" />
                        <input 
                            type="text" 
                            placeholder="Recherche (session, prof, classe)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: 'none', border: 'none', color: '#fff',
                                outline: 'none', width: '100%', fontSize: '13px'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Table Card Unified */}
            <div style={{ 
                background: 'rgba(0, 0, 0, 0.4)', // Matching InscriptionsList.css
                border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '12px', 
                padding: '30px',
                backdropFilter: 'blur(10px)'
            }}>
                {isLoading ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}><div className="loading-spinner"></div></div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '0 16px 20px 16px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>Session / Année</th>
                                <th style={{ textAlign: 'left', padding: '0 16px 20px 16px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>Statut</th>
                                <th style={{ textAlign: 'left', padding: '0 16px 20px 16px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>Visibilité</th>
                                <th style={{ textAlign: 'left', padding: '0 16px 20px 16px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>Enseignant</th>
                                <th style={{ textAlign: 'left', padding: '0 16px 20px 16px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>Élèves</th>
                                <th style={{ textAlign: 'right', padding: '0 16px 20px 16px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSessions.length > 0 ? (
                                filteredSessions.map((session) => {
                                    const cls = Array.isArray(session.classe) ? session.classe[0] : session.classe;
                                    return (
                                    <tr key={session._id} style={{ background: 'rgba(255, 255, 255, 0.02)', transition: 'all 0.3s ease' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                                        <td style={{ padding: '28px 20px', borderRadius: '8px 0 0 8px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Folder size={18} color="#34d399" />
                                                    {session.nomSession}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <BookOpen size={13} /> {cls?.nomClasse || 'Classe Non Assignée'}
                                                    </span>
                                                    <span style={{ color: 'var(--gold-dark)', fontWeight: '600' }}>
                                                        {cls?.anneeScolaire || '2025/2026'}
                                                    </span>
                                                    <span style={{ color: 'rgba(255, 255, 255, 0.1)' }}>|</span>
                                                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Calendar size={13} /> {session.dateDebut && session.dateFin ? `${new Date(session.dateDebut).toLocaleDateString('fr-FR')} - ${new Date(session.dateFin).toLocaleDateString('fr-FR')}` : session.duree || 'Durée non spécifiée'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '28px 16px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '8px 16px', borderRadius: '24px', fontSize: '13px', fontWeight: '700',
                                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                                background: session.statut === 'Terminée' ? 'linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.1))' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))',
                                                color: session.statut === 'Terminée' ? '#94a3b8' : '#34d399',
                                                border: `1px solid ${session.statut === 'Terminée' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                            }}>
                                                {session.statut === 'Terminée' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                {session.statut || 'En cours'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '28px 16px' }}>
                                            <button 
                                                onClick={() => handleToggleVisibility(session._id, session.isPublished)}
                                                style={{
                                                    background: session.isPublished ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
                                                    border: `1px solid ${session.isPublished ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                                    borderRadius: '24px', padding: '8px 16px',
                                                    color: session.isPublished ? '#34d399' : '#f87171',
                                                    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                                    transition: 'all 0.3s'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                {session.isPublished ? <Eye size={13} /> : <EyeOff size={13} />}
                                                {session.isPublished ? 'Publié' : 'Masqué'}
                                            </button>
                                        </td>
                                        <td style={{ padding: '28px 16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {session.enseignants && session.enseignants.filter(t => t && t.firstName).length > 0 ? (
                                                    session.enseignants.filter(t => t && t.firstName).map((t, idx) => (
                                                        <div key={t._id || idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ 
                                                                width: '36px', height: '36px', borderRadius: '50%', 
                                                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: '700', color: '#ffffff', fontSize: '14px',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                                flexShrink: 0
                                                            }}>
                                                                {t.firstName?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                                                                    {t.firstName} {t.lastName}
                                                                </span>
                                                                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Mail size={10} /> {t.email}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.45)' }}>Aucun enseignant</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '28px 16px' }}>
                                            <div style={{ color: '#ffffff', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Users size={18} color="#60a5fa" />
                                                {session.etudiantsCount || 0}
                                            </div>
                                        </td>
                                        <td style={{ padding: '28px 20px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button 
                                                    onClick={() => {
                                                        setSelectedSession(session);
                                                        setIsPlanningModalOpen(true);
                                                    }}
                                                    style={{ 
                                                        background: 'none', border: 'none', padding: '8px', borderRadius: '4px', 
                                                        color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', transition: 'all 0.2s' 
                                                    }} 
                                                    title="Gérer le planning"
                                                    onMouseOver={e => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }} 
                                                    onMouseOut={e => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'; e.currentTarget.style.background = 'none'; }}
                                                >
                                                    <Calendar size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleEditSession(session)}
                                                    style={{ 
                                                        background: 'none', border: 'none', padding: '8px', borderRadius: '4px', 
                                                        color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', transition: 'all 0.2s' 
                                                    }} 
                                                    title="Modifier la session"
                                                    onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }} 
                                                    onMouseOut={e => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'; e.currentTarget.style.background = 'none'; }}
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteSession(session._id, session.nomSession)}
                                                    style={{ 
                                                        background: 'none', border: 'none', padding: '8px', borderRadius: '4px', 
                                                        color: 'rgba(255, 255, 255, 0.4)', cursor: 'pointer', transition: 'all 0.2s' 
                                                    }} 
                                                    title="Supprimer la session"
                                                    onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }} 
                                                    onMouseOut={e => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'; e.currentTarget.style.background = 'none'; }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )})
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                                        <Filter size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                        <p>Aucune session ne correspond à vos critères.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default SessionsList;