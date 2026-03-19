import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllInscriptions } from '../features/inscriptions/inscriptionSlice';
import CreateInscriptionModal from '../components/CreateInscriptionModal';
import { Plus, CreditCard, BarChart2, Search, MoreHorizontal, Edit2, CheckCircle2, XCircle, History, Mail, Folder, BookOpen, FileText } from 'lucide-react';
import './InscriptionsList.css';

const InscriptionsList = () => {
    const dispatch = useDispatch();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const { inscriptions, isLoading } = useSelector(
        (state) => state.inscriptions
    );

    useEffect(() => {
        dispatch(getAllInscriptions());
    }, [dispatch]);

    const getPaymentBadgeClass = (status) => {
        switch (status) {
            case 'Payé': return 'status-badge paye';
            case 'Non Payé': return 'status-badge non-paye';
            case 'Avance': return 'status-badge avance';
            default: return 'status-badge';
        }
    };

    return (
        <div className="inscriptions-dashboard-page">
            <CreateInscriptionModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
            />

            <div className="inscriptions-header">
                <h1>Inscriptions Dashboard</h1>
                <p>Gérez et suivez les inscriptions de vos étudiants</p>
            </div>

            <div className="inscriptions-quick-actions">
                <div className="action-card" onClick={() => setIsCreateModalOpen(true)}>
                    <div className="action-icon">
                        <Edit2 size={18} />
                    </div>
                    <div className="action-info">
                        <h3>Nouvelle Inscription</h3>
                        <p>Nouvelle une Inscription</p>
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
                <div className="table-toolbar">
                    <div className="modern-search-input">
                        <Search size={16} />
                        <input type="text" placeholder="Recherche" />
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
                                <th>Statut Paiement</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {inscriptions && inscriptions.length > 0 ? (
                                inscriptions.map((inscription) => (
                                    <tr key={inscription._id}>
                                        <td>
                                            <div className="student-cell">
                                                <div className="student-avatar">
                                                    {inscription.etudiant ? inscription.etudiant.firstName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div className="student-info">
                                                    <span className="student-name">
                                                        {inscription.etudiant ? `${inscription.etudiant.firstName} ${inscription.etudiant.lastName}` : 'Utilisateur Supprimé'}
                                                    </span>
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
                                                <span className="session-desc">
                                                    <FileText size={14} className="opacity-70" /> Documents: {inscription.session && inscription.session.documents ? inscription.session.documents.length : 0}
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
                                                        <span className="tag-mini purple">Prog</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                            {new Date(inscription.dateInscription).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${inscription.statutPaiement === 'Payé' ? 'paye' : inscription.statutPaiement === 'Non Payé' ? 'non-paye' : 'avance'}`}>
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
                                            <button className="btn-more">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-gray)' }}>
                                        <svg style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                        Aucune inscription trouvée.
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
