import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllInscriptions, updateInscriptionStatut, deleteInscription } from '../features/inscriptions/inscriptionSlice';
import { useLocation } from 'react-router-dom';
import CreateInscriptionModal from '../components/CreateInscriptionModal';
import PaiementModal from '../components/PaiementModal';
import {
    Plus, CreditCard, BarChart2, Search, Edit2, CheckCircle2,
    XCircle, History, Mail, Folder, BookOpen, CheckCircle,
    Clock, X, Trash2, AlertTriangle, DollarSign, Users, TrendingUp, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import './InscriptionsList.css';

const InscriptionsList = () => {
    const dispatch = useDispatch();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isPaiementModalOpen, setIsPaiementModalOpen] = useState(false);
    const [selectedInscription, setSelectedInscription] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatut, setFilterStatut] = useState('tous');
    const [filterPaiement, setFilterPaiement] = useState('tous');
    const [filterSession, setFilterSession] = useState('toutes');
    const [filterClasse, setFilterClasse] = useState('toutes');
    const [showDebiteurs, setShowDebiteurs] = useState(false);

    const { inscriptions, isLoading } = useSelector((state) => state.inscriptions);
    const location = useLocation();

    useEffect(() => {
        dispatch(getAllInscriptions());
    }, [dispatch]);

    // ✅ AUTO-OPEN MODAL if selectedId is passed from notification
    useEffect(() => {
        if (location.state?.selectedId && inscriptions?.length > 0) {
            const ins = inscriptions.find(i => i._id === location.state.selectedId);
            if (ins) {
                setSelectedInscription(ins);
                setIsPaiementModalOpen(true);
                // On peut aussi filtrer pour ne voir que celui-là
                setSearchTerm(ins.etudiant?.firstName || '');
            }
        }
    }, [location.state, inscriptions]);



    const handleUpdateStatut = async (id, statut, studentName) => {
        const label = statut === 'approuvee' ? 'approuver' : 'refuser';
        if (!window.confirm(`Êtes-vous sûr de vouloir ${label} l'inscription de ${studentName} ?`)) return;
        const result = await dispatch(updateInscriptionStatut({ id, statut }));
        if (updateInscriptionStatut.fulfilled.match(result)) {
            const msg = statut === 'approuvee'
                ? `✅ Inscription de ${studentName} approuvée.`
                : `❌ Inscription de ${studentName} refusée.`;
            if (statut === 'approuvee') {
                toast.success(msg);
            } else {
                toast.error(msg);
            }
        }
    };

    const handleDelete = async (id, studentName) => {
        if (!window.confirm(`⚠️ Supprimer DÉFINITIVEMENT l'inscription de ${studentName} ?`)) return;
        const result = await dispatch(deleteInscription(id));
        if (deleteInscription.fulfilled.match(result)) {
            toast.success(`Inscription de ${studentName} supprimée.`);
        } else {
            toast.error(result.payload || "Erreur lors de la suppression.");
        }
    };

    const handleOpenPaiement = (inscription) => {
        setSelectedInscription(inscription);
        setIsPaiementModalOpen(true);
    };

    const handlePaiementSuccess = useCallback(() => {
        dispatch(getAllInscriptions());
    }, [dispatch]);

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

    const getProgressColor = (statut) => {
        if (statut === 'Payé') return 'linear-gradient(90deg, #10b981, #059669)';
        if (statut === 'Avance') return 'linear-gradient(90deg, #f59e0b, #d97706)';
        return 'linear-gradient(90deg, #ef4444, #dc2626)';
    };

    const uniqueSessions = [...new Set((inscriptions || []).map(ins => ins.session?.nomSession).filter(Boolean))];
    const uniqueClasses = [...new Set((inscriptions || []).map(ins => ins.classe?.nomClasse).filter(Boolean))];

    // ── KPIs ──
    const totalInscriptions = inscriptions?.length || 0;
    const totalDebiteurs = (inscriptions || []).filter(i => i.statutPaiement !== 'Payé' && i.statut === 'approuvee').length;
    const totalEncaisse = (inscriptions || []).reduce((sum, i) => sum + (i.montantVerseTotal || 0), 0);
    const totalReliquat = (inscriptions || []).reduce((sum, i) => sum + (i.resteAPayer || 0), 0);
    const payeCount = (inscriptions || []).filter(i => i.statutPaiement === 'Payé').length;
    const tauxPaiement = totalInscriptions > 0 ? Math.round((payeCount / totalInscriptions) * 100) : 0;

    // ── Filtrage ──
    const filteredInscriptions = (inscriptions || []).filter(ins => {
        const studentName = ins.etudiant
            ? `${ins.etudiant.firstName} ${ins.etudiant.lastName} ${ins.etudiant.email}`.toLowerCase()
            : '';
        const sessionName = ins.session?.nomSession?.toLowerCase() || '';
        const className = ins.classe?.nomClasse?.toLowerCase() || '';

        const matchesSearch = !searchTerm ||
            studentName.includes(searchTerm.toLowerCase()) ||
            sessionName.includes(searchTerm.toLowerCase()) ||
            className.includes(searchTerm.toLowerCase());

        const matchesFilter = filterStatut === 'tous' || ins.statut === filterStatut;
        const matchesSession = filterSession === 'toutes' || ins.session?.nomSession === filterSession;
        const matchesClasse = filterClasse === 'toutes' || ins.classe?.nomClasse === filterClasse;
        const matchesPaiement = filterPaiement === 'tous' || ins.statutPaiement === filterPaiement;
        const matchesDebiteurs = !showDebiteurs || (ins.statutPaiement !== 'Payé' && ins.statut === 'approuvee');

        return matchesSearch && matchesFilter && matchesSession && matchesClasse && matchesPaiement && matchesDebiteurs;
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

            <PaiementModal
                isOpen={isPaiementModalOpen}
                onClose={() => { setIsPaiementModalOpen(false); setSelectedInscription(null); }}
                inscription={selectedInscription}
                onPaiementSuccess={handlePaiementSuccess}
            />



            {/* Header */}
            <div className="inscriptions-header">
                <h1>Inscriptions & Paiements</h1>
                <p>Gérez les inscriptions et encaissez les paiements en temps réel</p>
            </div>

            {/* ── KPI Cards ── */}
            <div className="ins-kpi-grid">
                <div className="ins-kpi-card">
                    <div className="ins-kpi-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        <Users size={20} />
                    </div>
                    <div>
                        <div className="ins-kpi-value">{totalInscriptions}</div>
                        <div className="ins-kpi-label">Total Inscriptions</div>
                    </div>
                </div>
                <div className="ins-kpi-card">
                    <div className="ins-kpi-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <div className="ins-kpi-value">{totalEncaisse.toFixed(0)} <span style={{ fontSize: '13px', fontWeight: 500 }}>TND</span></div>
                        <div className="ins-kpi-label">Total Encaissé</div>
                    </div>
                </div>
                <div className="ins-kpi-card">
                    <div className="ins-kpi-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <div className="ins-kpi-value" style={{ color: '#f59e0b' }}>{totalDebiteurs}</div>
                        <div className="ins-kpi-label">Débiteurs</div>
                    </div>
                </div>
                <div className="ins-kpi-card">
                    <div className="ins-kpi-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <div className="ins-kpi-value" style={{ color: '#a78bfa' }}>{tauxPaiement}%</div>
                        <div className="ins-kpi-label">Taux de Paiement</div>
                        <div className="ins-kpi-bar-bg">
                            <div className="ins-kpi-bar-fill" style={{ width: `${tauxPaiement}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="inscriptions-quick-actions">
                <div className="action-card" onClick={() => setIsCreateModalOpen(true)}>
                    <div className="action-icon"><Edit2 size={18} /></div>
                    <div className="action-info">
                        <h3>Nouvelle Inscription</h3>
                        <p>Inscrire un étudiant</p>
                    </div>
                </div>

                <div className={`action-card ${showDebiteurs ? 'active-filter' : ''}`}
                    onClick={() => setShowDebiteurs(!showDebiteurs)}>
                    <div className="action-icon" style={showDebiteurs ? { background: 'rgba(245,158,11,0.2)', color: '#f59e0b' } : {}}>
                        <AlertTriangle size={18} />
                    </div>
                    <div className="action-info">
                        <h3>Débiteurs {totalDebiteurs > 0 && <span className="debiteur-count">{totalDebiteurs}</span>}</h3>
                        <p>{showDebiteurs ? 'Filtre actif — Cliquer pour désactiver' : 'Afficher les impayés'}</p>
                    </div>
                </div>

                <div className="action-card">
                    <div className="action-icon"><BarChart2 size={18} /></div>
                    <div className="action-info">
                        <h3>Reliquat Total</h3>
                        <p style={{ color: totalReliquat > 0 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                            {totalReliquat.toFixed(2)} TND
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="inscriptions-table-card">
                <div className="table-toolbar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {/* Search */}
                    <div className="modern-search-input" style={{ flex: 1, minWidth: '200px' }}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher par étudiant, session, classe..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter Session */}
                    <div className="modern-search-input" style={{ flex: '0 1 auto', padding: '0 12px', minWidth: '160px' }}>
                        <Folder size={16} />
                        <select value={filterSession} onChange={e => setFilterSession(e.target.value)}
                            style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', width: '100%', cursor: 'pointer', fontSize: '13px' }}>
                            <option value="toutes" style={{ color: 'black' }}>Toutes sessions</option>
                            {uniqueSessions.map(s => <option key={s} value={s} style={{ color: 'black' }}>{s}</option>)}
                        </select>
                    </div>

                    {/* Filter Paiement */}
                    <div className="modern-search-input" style={{ flex: '0 1 auto', padding: '0 12px', minWidth: '160px' }}>
                        <CreditCard size={16} />
                        <select value={filterPaiement} onChange={e => setFilterPaiement(e.target.value)}
                            style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', width: '100%', cursor: 'pointer', fontSize: '13px' }}>
                            <option value="tous" style={{ color: 'black' }}>Tous paiements</option>
                            <option value="Payé" style={{ color: 'black' }}>✅ Payé</option>
                            <option value="Avance" style={{ color: 'black' }}>🟡 Avance</option>
                            <option value="Non Payé" style={{ color: 'black' }}>🔴 Non Payé</option>
                        </select>
                    </div>

                    {/* Status Tabs */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                            { key: 'tous', label: 'Tous', count: counts.tous },
                            { key: 'en_attente', label: 'En attente', count: counts.en_attente },
                            { key: 'approuvee', label: 'Approuvées', count: counts.approuvee },
                            { key: 'refusee', label: 'Refusées', count: counts.refusee },
                        ].map(tab => (
                            <button key={tab.key} onClick={() => setFilterStatut(tab.key)}
                                style={{
                                    padding: '7px 14px', borderRadius: '8px',
                                    border: filterStatut === tab.key ? '1.5px solid #10b981' : '1.5px solid rgba(255,255,255,0.1)',
                                    background: filterStatut === tab.key ? 'rgba(16,185,129,0.15)' : 'transparent',
                                    color: filterStatut === tab.key ? '#10b981' : 'rgba(255,255,255,0.6)',
                                    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                                }}>
                                {tab.label}
                                {tab.count > 0 && (
                                    <span style={{
                                        background: filterStatut === tab.key ? '#10b981' : 'rgba(255,255,255,0.15)',
                                        color: filterStatut === tab.key ? '#fff' : 'rgba(255,255,255,0.7)',
                                        borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: '700'
                                    }}>{tab.count}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtre débiteurs actif */}
                {showDebiteurs && (
                    <div className="debiteurs-banner">
                        <AlertTriangle size={15} />
                        <span>Filtre Débiteurs actif — {filteredInscriptions.length} étudiant(s) avec un solde impayé</span>
                        <button onClick={() => setShowDebiteurs(false)}>✕ Effacer</button>
                    </div>
                )}

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

                                    const prixSession = inscription.session?.montant || 0;
                                    const montantVerse = inscription.montantVerseTotal || 0;
                                    const resteAPayer = inscription.resteAPayer ?? (prixSession - montantVerse);
                                    const pourcentage = prixSession > 0
                                        ? Math.min(100, Math.round((montantVerse / prixSession) * 100))
                                        : 0;

                                    return (
                                        <tr key={inscription._id}>
                                            {/* Étudiant */}
                                            <td>
                                                <div className="student-cell">
                                                    <div className="student-avatar">
                                                        {inscription.etudiant?.firstName ? inscription.etudiant.firstName.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div className="student-info">
                                                        <span className="student-name">{studentName}</span>
                                                        <span className="student-sub">
                                                            <Mail size={12} /> {inscription.etudiant?.email || ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Session */}
                                            <td>
                                                <div className="session-info">
                                                    <span className="session-name">
                                                        <Folder size={16} className="text-emerald-400" />
                                                        {inscription.session ? inscription.session.nomSession : 'Session Supprimée'}
                                                    </span>
                                                    {prixSession > 0 && (
                                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                                            {prixSession} TND
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Classe */}
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

                                            {/* Date */}
                                            <td style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                                {new Date(inscription.dateInscription).toLocaleDateString('fr-FR')}
                                            </td>

                                            {/* Statut Inscription */}
                                            <td>
                                                <span className={getStatutBadgeClass(inscription.statut)}>
                                                    {getStatutLabel(inscription.statut)}
                                                </span>
                                            </td>

                                            {/* Paiement enrichi */}
                                            <td>
                                                <div className="payment-cell">
                                                    <span className={getPaymentBadgeClass(inscription.statutPaiement)}>
                                                        {inscription.statutPaiement === 'Payé' ? (
                                                            <><CheckCircle2 size={12} /> Payé</>
                                                        ) : inscription.statutPaiement === 'Non Payé' ? (
                                                            <><XCircle size={12} /> Non Payé</>
                                                        ) : (
                                                            <><History size={12} /> Avance</>
                                                        )}
                                                    </span>

                                                    {/* Barre de progression */}
                                                    {prixSession > 0 && (
                                                        <div className="pay-progress-wrap">
                                                            <div className="pay-progress-bg">
                                                                <div className="pay-progress-fill"
                                                                    style={{ width: `${pourcentage}%`, background: getProgressColor(inscription.statutPaiement) }}
                                                                />
                                                            </div>
                                                            <div className="pay-progress-labels">
                                                                <span>{montantVerse.toFixed(0)} / {prixSession} TND</span>
                                                                {resteAPayer > 0 && (
                                                                    <span className="reliquat-badge">
                                                                        -{resteAPayer.toFixed(0)} TND
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="actions-cell">
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    {/* Bouton Encaisser */}
                                                    {inscription.statut === 'approuvee' && inscription.statutPaiement !== 'Payé' && (
                                                        <button
                                                            title="Enregistrer un paiement"
                                                            onClick={() => handleOpenPaiement(inscription)}
                                                            style={{
                                                                background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                                                                border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px',
                                                                width: '32px', height: '32px', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer', transition: 'all 0.2s'
                                                            }}>
                                                            <CreditCard size={15} />
                                                        </button>
                                                    )}
                                                    {/* Voir historique si déjà payé */}
                                                    {inscription.statutPaiement === 'Payé' && (
                                                        <button
                                                            title="Voir l'historique des versements"
                                                            onClick={() => handleOpenPaiement(inscription)}
                                                            style={{
                                                                background: 'rgba(16,185,129,0.12)', color: '#10b981',
                                                                border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px',
                                                                width: '32px', height: '32px', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer', transition: 'all 0.2s'
                                                            }}>
                                                            <History size={15} />
                                                        </button>
                                                    )}

                                                    {inscription.statut === 'en_attente' && (
                                                        <>
                                                            <button className="action-icon-btn approve" title="Approuver"
                                                                onClick={() => handleUpdateStatut(inscription._id, 'approuvee', studentName)}
                                                                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button className="action-icon-btn reject" title="Refuser"
                                                                onClick={() => handleUpdateStatut(inscription._id, 'refusee', studentName)}
                                                                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {inscription.statut === 'approuvee' && (
                                                        <button title="Révoquer l'accès"
                                                            onClick={() => handleUpdateStatut(inscription._id, 'refusee', studentName)}
                                                            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                    {inscription.statut === 'refusee' && (
                                                        <button title="Réapprouver"
                                                            onClick={() => handleUpdateStatut(inscription._id, 'approuvee', studentName)}
                                                            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    )}
                                                    <button title="Supprimer définitivement"
                                                        onClick={() => handleDelete(inscription._id, studentName)}
                                                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px dashed rgba(239,68,68,0.3)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
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
                                        </svg>
                                        {searchTerm || filterStatut !== 'tous' || showDebiteurs
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
