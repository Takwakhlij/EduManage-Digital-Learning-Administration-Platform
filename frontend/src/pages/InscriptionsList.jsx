import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllInscriptions, updateInscriptionStatut } from '../features/inscriptions/inscriptionSlice';
import CreateInscriptionModal from '../components/CreateInscriptionModal';
import { Plus, CreditCard, BarChart2, Search, MoreHorizontal, Edit2, CheckCircle2, XCircle, History, Mail, Folder, BookOpen, FileText, CheckCircle, Clock, X } from 'lucide-react';
import './InscriptionsList.css';

const InscriptionsList = () => {
    const dispatch = useDispatch();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [notification, setNotification] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatut, setFilterStatut] = useState('tous');

    const { inscriptions, isLoading } = useSelector(
        (state) => state.inscriptions
    );

    useEffect(() => {
        dispatch(getAllInscriptions());
    }, [dispatch]);

    const handleUpdateStatut = async (id, statut, studentName) => {
        const label = statut === 'approuvee' ? 'approuver' : 'refuser';
        if (!window.confirm(`Êtes-vous sûr de vouloir ${label} l'inscription de ${studentName} ?`)) return;

        const result = await dispatch(updateInscriptionStatut({ id, statut }));
        if (updateInscriptionStatut.fulfilled.match(result)) {
            const msg = statut === 'approuvee'
                ? `✅ Inscription de ${studentName} approuvée. L'étudiant a maintenant accès aux cours.`
                : `❌ Inscription de ${studentName} refusée.`;
            setNotification({ type: statut === 'approuvee' ? 'success' : 'error', text: msg });
            setTimeout(() => setNotification(null), 4000);
        }
    };

    const getStatutBadgeClass = (statut) => {
        switch (statut) {
            case 'approuvee': return 'status-badge paye';
            case 'refusee': return 'status-badge non-paye';
            case 'en_attente': return 'status-badge avance';
            default: return 'status-badge';
        }
    };

    const getStatutLabel = (statut) => {
        switch (statut) {
            case 'approuvee': return <><CheckCircle2 size={12} /> Approuvée</>;
            case 'refusee': return <><XCircle size={12} /> Refusée</>;
            case 'en_attente': return <><Clock size={12} /> En attente</>;
            default: return statut;
        }
    };

    const getPaymentBadgeClass = (status) => {
        switch (status) {
            case 'Payé': return 'status-badge paye';
            case 'Non Payé': return 'status-badge non-paye';
            case 'Avance': return 'status-badge avance';
            default: return 'status-badge';
        }
    };

    // Filtering
    const filteredInscriptions = (inscriptions || []).filter(ins => {
        const studentName = ins.etudiant
            ? `${ins.etudiant.firstName} ${ins.etudiant.lastName} ${ins.etudiant.email}`.toLowerCase()
            : '';
        const sessionName = ins.session?.nomSession?.toLowerCase() || '';
        const matchesSearch = !searchTerm ||
            studentName.includes(searchTerm.toLowerCase()) ||
            sessionName.includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatut === 'tous' || ins.statut === filterStatut;
        return matchesSearch && matchesFilter;
    });

    const counts = {
        tous: inscriptions?.length || 0,
        en_attente: inscriptions?.filter(i => i.statut === 'en_attente').length || 0,
        approuvee: inscriptions?.filter(i => i.statut === 'approuvee').length || 0,
        refusee: inscriptions?.filter(i => i.statut === 'refusee').length || 0,
    };

    return (
        <div className="inscriptions-dashboard-page">
            <CreateInscriptionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {/* Notification Toast */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    maxWidth: '420px',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{notification.text}</span>
                </div>
            )}

            <div className="inscriptions-header">
                <h1>Inscriptions Dashboard</h1>
                <p>Gérez et approuvez les inscriptions des étudiants</p>
            </div>

            <div className="inscriptions-quick-actions">
                <div className="action-card" onClick={() => setIsCreateModalOpen(true)}>
                    <div className="action-icon">
                        <Edit2 size={18} />
                    </div>
                    <div className="action-info">
                        <h3>Nouvelle Inscription</h3>
                        <p>Créer une inscription</p>
                    </div>
                </div>

                <div className="action-card">
                    <div className="action-icon">
                        <CreditCard size={18} />
                    </div>
                    <div className="action-info">
                        <h3>Paiements</h3>
                        <p>Sommaire de paiements</p>
                    </div>
                </div>

                <div className="action-card">
                    <div className="action-icon">
                        <BarChart2 size={18} />
                    </div>
                    <div className="action-info">
                        <h3>Rapports</h3>
                        <p>Sommaire des rapports</p>
                    </div>
                </div>
            </div>

            <div className="inscriptions-table-card">
                <div className="table-toolbar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {/* Search */}
                    <div className="modern-search-input" style={{ flex: 1, minWidth: '200px' }}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher par étudiant ou session..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter tabs */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                            { key: 'tous', label: 'Tous', count: counts.tous },
                            { key: 'en_attente', label: 'En attente', count: counts.en_attente },
                            { key: 'approuvee', label: 'Approuvées', count: counts.approuvee },
                            { key: 'refusee', label: 'Refusées', count: counts.refusee },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilterStatut(tab.key)}
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: '8px',
                                    border: filterStatut === tab.key
                                        ? '1.5px solid #10b981'
                                        : '1.5px solid rgba(255,255,255,0.1)',
                                    background: filterStatut === tab.key
                                        ? 'rgba(16,185,129,0.15)'
                                        : 'transparent',
                                    color: filterStatut === tab.key ? '#10b981' : 'rgba(255,255,255,0.6)',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span style={{
                                        background: filterStatut === tab.key ? '#10b981' : 'rgba(255,255,255,0.15)',
                                        color: filterStatut === tab.key ? '#fff' : 'rgba(255,255,255,0.7)',
                                        borderRadius: '999px',
                                        padding: '1px 7px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                    }}>{tab.count}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading-container" style={{ padding: '40px 0', textAlign: 'center' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                ) : (
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Étudiant</th>
                                <th>Session</th>
                                <th>Classe</th>
                                <th>Date</th>
                                <th>Statut Inscription</th>
                                <th>Paiement</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInscriptions && filteredInscriptions.length > 0 ? (
                                filteredInscriptions.map((inscription) => {
                                    const studentName = inscription.etudiant
                                        ? `${inscription.etudiant.firstName} ${inscription.etudiant.lastName}`
                                        : 'Utilisateur Supprimé';
                                    return (
                                        <tr key={inscription._id}>
                                            <td>
                                                <div className="student-cell">
                                                    <div className="student-avatar">
                                                        {inscription.etudiant ? inscription.etudiant.firstName.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div className="student-info">
                                                        <span className="student-name">{studentName}</span>
                                                        <span className="student-sub">
                                                            <Mail size={12} /> {inscription.etudiant ? inscription.etudiant.email : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="session-info">
                                                    <span className="session-name">
                                                        <Folder size={16} className="text-emerald-400" />
                                                        {inscription.session ? inscription.session.nomSession : 'Session Supprimée'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="session-info">
                                                    <span className="session-name">
                                                        <BookOpen size={16} className="text-emerald-400" />
                                                        {inscription.classe ? inscription.classe.nomClasse : '-'}
                                                    </span>
                                                    {inscription.classe && (
                                                        <div className="class-tags">
                                                            <span className="tag-mini green">Niv {inscription.classe.niveau}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                                {new Date(inscription.dateInscription).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td>
                                                <span className={getStatutBadgeClass(inscription.statut)}>
                                                    {getStatutLabel(inscription.statut)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getPaymentBadgeClass(inscription.statutPaiement)}>
                                                    {inscription.statutPaiement === 'Payé' ? (
                                                        <><CheckCircle2 size={12} /> Payé</>
                                                    ) : inscription.statutPaiement === 'Non Payé' ? (
                                                        <><XCircle size={12} /> Non Payé</>
                                                    ) : (
                                                        <><History size={12} /> Avance</>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="actions-cell">
                                                {inscription.statut === 'en_attente' && (
                                                    <>
                                                        <button
                                                            className="action-btn approve"
                                                            title="Approuver l'inscription — donne accès aux cours"
                                                            onClick={() => handleUpdateStatut(inscription._id, 'approuvee', studentName)}
                                                            style={{
                                                                background: 'rgba(16,185,129,0.15)',
                                                                color: '#10b981',
                                                                border: '1px solid rgba(16,185,129,0.3)',
                                                                borderRadius: '7px',
                                                                padding: '5px 10px',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                fontWeight: '600',
                                                                marginRight: '6px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <CheckCircle size={14} /> Approuver
                                                        </button>
                                                        <button
                                                            className="action-btn reject"
                                                            title="Refuser l'inscription"
                                                            onClick={() => handleUpdateStatut(inscription._id, 'refusee', studentName)}
                                                            style={{
                                                                background: 'rgba(239,68,68,0.12)',
                                                                color: '#ef4444',
                                                                border: '1px solid rgba(239,68,68,0.25)',
                                                                borderRadius: '7px',
                                                                padding: '5px 10px',
                                                                cursor: 'pointer',
                                                                fontSize: '13px',
                                                                fontWeight: '600',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <X size={14} /> Refuser
                                                        </button>
                                                    </>
                                                )}
                                                {inscription.statut === 'approuvee' && (
                                                    <button
                                                        className="action-btn reject"
                                                        title="Révoquer l'accès"
                                                        onClick={() => handleUpdateStatut(inscription._id, 'refusee', studentName)}
                                                        style={{
                                                            background: 'rgba(239,68,68,0.12)',
                                                            color: '#ef4444',
                                                            border: '1px solid rgba(239,68,68,0.25)',
                                                            borderRadius: '7px',
                                                            padding: '5px 10px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                        }}
                                                    >
                                                        <X size={14} /> Révoquer
                                                    </button>
                                                )}
                                                {inscription.statut === 'refusee' && (
                                                    <button
                                                        className="action-btn approve"
                                                        title="Réapprouver"
                                                        onClick={() => handleUpdateStatut(inscription._id, 'approuvee', studentName)}
                                                        style={{
                                                            background: 'rgba(16,185,129,0.15)',
                                                            color: '#10b981',
                                                            border: '1px solid rgba(16,185,129,0.3)',
                                                            borderRadius: '7px',
                                                            padding: '5px 10px',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                        }}
                                                    >
                                                        <CheckCircle size={14} /> Approuver
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-gray)' }}>
                                        <svg style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                        </svg>
                                        {searchTerm || filterStatut !== 'tous'
                                            ? 'Aucune inscription ne correspond à vos critères.'
                                            : 'Aucune inscription trouvée.'}
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

export default InscriptionsList;
