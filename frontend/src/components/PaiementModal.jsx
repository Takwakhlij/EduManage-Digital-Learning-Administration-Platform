import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    enregistrerPaiement,
    getPaiementsParInscription,
    deletePaiement,
    clearPaiements,
    resetPaiement
} from '../features/paiements/paiementSlice';
import {
    X, CreditCard, DollarSign, Banknote, FileText, Clock,
    CheckCircle2, AlertTriangle, Trash2, TrendingUp, History, Download
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './PaiementModal.css';

const PaiementModal = ({ isOpen, onClose, inscription, onPaiementSuccess }) => {
    const dispatch = useDispatch();
    const { paiements, resume, isLoading } = useSelector(state => state.paiements);

    const [montant, setMontant] = useState('');
    const [modePaiement, setModePaiement] = useState('Espèces');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const prixSession = inscription?.session?.montant || 0;
    const montantVerseTotal = inscription?.montantVerseTotal || 0;
    const resteAPayer = inscription?.resteAPayer ?? (prixSession - montantVerseTotal);
    const pourcentage = prixSession > 0 ? Math.min(100, Math.round((montantVerseTotal / prixSession) * 100)) : 0;

    // Calculer le futur statut selon le montant saisi
    const getFutureStatus = () => {
        const val = parseFloat(montant) || 0;
        if (val <= 0) return null;
        const futurTotal = montantVerseTotal + val;
        const futurReste = prixSession - futurTotal;
        if (futurReste <= 0) return { label: 'PAYÉ', color: '#10b981', icon: <CheckCircle2 size={14} /> };
        if (futurTotal > 0) return { label: 'AVANCE', color: '#f59e0b', icon: <AlertTriangle size={14} /> };
        return { label: 'NON PAYÉ', color: '#ef4444' };
    };

    const futureStatus = getFutureStatus();

    useEffect(() => {
        if (isOpen && inscription?._id) {
            dispatch(getPaiementsParInscription(inscription._id));
        }
        return () => {
            if (!isOpen) {
                dispatch(clearPaiements());
            }
        };
    }, [isOpen, inscription?._id, dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!montant || parseFloat(montant) <= 0) {
            toast.error('Veuillez saisir un montant valide.');
            return;
        }
        setSubmitting(true);
        const result = await dispatch(enregistrerPaiement({
            inscriptionId: inscription._id,
            montant: parseFloat(montant),
            modePaiement,
            note
        }));

        if (enregistrerPaiement.fulfilled.match(result)) {
            toast.success(`✅ ${montant} TND enregistrés avec succès !`);
            setMontant('');
            setNote('');
            // Rafraîchir l'historique
            dispatch(getPaiementsParInscription(inscription._id));
            if (onPaiementSuccess) onPaiementSuccess(result.payload.inscription);
        } else {
            toast.error(result.payload || 'Erreur lors de l\'enregistrement.');
        }
        setSubmitting(false);
    };

    const handleDeletePaiement = async (paiementId) => {
        if (!window.confirm('Supprimer ce versement ? Le solde sera recalculé automatiquement.')) return;
        const result = await dispatch(deletePaiement(paiementId));
        if (deletePaiement.fulfilled.match(result)) {
            dispatch(getPaiementsParInscription(inscription._id));
            if (onPaiementSuccess) onPaiementSuccess(null);
        }
    };
    const handleDownloadReport = async () => {
        try {
            toast.success('📥 Génération du rapport...');
            const { token } = JSON.parse(localStorage.getItem('user'));
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const res = await axios.get(`/api/paiements/report/${inscription._id}`, config);
            
            if (res.data.success) {
                window.open(`http://localhost:5000${res.data.reportUrl}`, '_blank');
            }
        } catch (err) {
            console.error('Erreur téléch. rapport:', err);
            toast.error('Erreur lors de la génération du rapport.');
        }
    };

    const getStatutColor = (statut) => {
        if (statut === 'Payé') return '#10b981';
        if (statut === 'Avance') return '#f59e0b';
        return '#ef4444';
    };

    const getBarColor = () => {
        if (pourcentage >= 100) return 'linear-gradient(90deg, #10b981, #059669)';
        if (pourcentage > 0) return 'linear-gradient(90deg, #f59e0b, #d97706)';
        return 'linear-gradient(90deg, #ef4444, #dc2626)';
    };

    if (!isOpen || !inscription) return null;

    const studentName = inscription.etudiant
        ? `${inscription.etudiant.firstName} ${inscription.etudiant.lastName}`
        : 'Étudiant';

    const montantSaisi = parseFloat(montant) || 0;
    const futureTotal = montantVerseTotal + montantSaisi;
    const futureReste = Math.max(0, prixSession - futureTotal);

    return (
        <div className="pm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="pm-modal">
                {/* Header */}
                <div className="pm-header">
                    <div className="pm-header-left">
                        <div className="pm-icon-wrap">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h2 className="pm-title">Enregistrer un Versement</h2>
                            <p className="pm-subtitle">{studentName}</p>
                        </div>
                    </div>
                    <button className="pm-close" onClick={onClose}><X size={18} /></button>
                </div>



                <div className="pm-body">
                    {/* Résumé financier */}
                    <div className="pm-financial-summary">
                        <div className="pm-financial-header">
                            <TrendingUp size={16} />
                            <span>Résumé Financier — {inscription.session?.nomSession || 'Session'}</span>
                            <span className="pm-statut-badge" style={{ background: `${getStatutColor(inscription.statutPaiement)}22`, color: getStatutColor(inscription.statutPaiement), border: `1px solid ${getStatutColor(inscription.statutPaiement)}44` }}>
                                {inscription.statutPaiement}
                            </span>
                        </div>

                        <div className="pm-kpi-row">
                            <div className="pm-kpi">
                                <span className="pm-kpi-label">Prix Total</span>
                                <span className="pm-kpi-value white">{prixSession.toFixed(2)} TND</span>
                            </div>
                            <div className="pm-kpi">
                                <span className="pm-kpi-label">Déjà Versé</span>
                                <span className="pm-kpi-value green">{montantVerseTotal.toFixed(2)} TND</span>
                            </div>
                            <div className="pm-kpi">
                                <span className="pm-kpi-label">Reste à Payer</span>
                                <span className="pm-kpi-value" style={{ color: resteAPayer > 0 ? '#f59e0b' : '#10b981' }}>
                                    {resteAPayer.toFixed(2)} TND
                                </span>
                            </div>
                        </div>

                        {/* Barre de progression */}
                        <div className="pm-progress-wrap">
                            <div className="pm-progress-bar-bg">
                                <div
                                    className="pm-progress-bar-fill"
                                    style={{ width: `${pourcentage}%`, background: getBarColor() }}
                                />
                                {montantSaisi > 0 && (
                                    <div
                                        className="pm-progress-bar-preview"
                                        style={{
                                            width: `${Math.min(100, Math.round((futureTotal / prixSession) * 100)) - pourcentage}%`,
                                            left: `${pourcentage}%`
                                        }}
                                    />
                                )}
                            </div>
                            <div className="pm-progress-labels">
                                <span>{pourcentage}% réglé</span>
                                {montantSaisi > 0 && (
                                    <span className="pm-progress-preview-label">
                                        → {Math.min(100, Math.round((futureTotal / prixSession) * 100))}% après versement
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Formulaire de versement */}
                    <form onSubmit={handleSubmit} className="pm-form">
                        <div className="pm-form-title">
                            <Banknote size={16} />
                            <span>Nouveau Versement</span>
                        </div>

                        <div className="pm-form-row">
                            <div className="pm-field">
                                <label className="pm-label">Montant Reçu (TND) *</label>
                                <div className="pm-input-wrap">
                                    <DollarSign size={15} className="pm-input-icon" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={prixSession}
                                        value={montant}
                                        onChange={e => setMontant(e.target.value)}
                                        placeholder={`Max: ${resteAPayer.toFixed(2)} TND`}
                                        className="pm-input"
                                        required
                                    />
                                </div>
                                {montant && montantSaisi > resteAPayer && (
                                    <span className="pm-field-hint warning">⚠ Montant supérieur au reste dû ({resteAPayer.toFixed(2)} TND)</span>
                                )}
                            </div>

                            <div className="pm-field">
                                <label className="pm-label">Mode de Paiement *</label>
                                <div className="pm-select-wrap">
                                    <select
                                        value={modePaiement}
                                        onChange={e => setModePaiement(e.target.value)}
                                        className="pm-select"
                                    >
                                        <option value="Espèces">💵 Espèces</option>
                                        <option value="Chèque">🏦 Chèque</option>
                                        <option value="Virement">📲 Virement</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pm-field">
                            <label className="pm-label">Note (optionnel)</label>
                            <div className="pm-input-wrap">
                                <FileText size={15} className="pm-input-icon" />
                                <input
                                    type="text"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Ex: Chèque n°123456, versement mensuel..."
                                    className="pm-input"
                                />
                            </div>
                        </div>

                        {/* Aperçu futur statut */}
                        {futureStatus && (
                            <div className="pm-future-status" style={{ borderColor: `${futureStatus.color}44`, background: `${futureStatus.color}11` }}>
                                <span style={{ color: futureStatus.color, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
                                    {futureStatus.icon} Ce versement mettra le statut à : {futureStatus.label}
                                </span>
                                {futureReste > 0 && (
                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                                        Nouveau reste : <strong style={{ color: '#f59e0b' }}>{futureReste.toFixed(2)} TND</strong>
                                    </span>
                                )}
                            </div>
                        )}

                        <button type="submit" className="pm-submit" disabled={submitting || isLoading}>
                            {submitting ? (
                                <span className="pm-spinner" />
                            ) : (
                                <><CreditCard size={16} /> Valider le paiement</> 
                            )}
                        </button>
                    </form>

                    {/* Historique des versements */}
                    <div className="pm-historique">
                        <div className="pm-historique-header">
                            <History size={16} />
                            <span>Historique des Versements</span>
                            {paiements.length > 0 && (
                                <>
                                    <span className="pm-historique-count">{paiements.length}</span>
                                    <button 
                                        className="pm-h-report-btn" 
                                        onClick={handleDownloadReport}
                                        title="Télécharger l'historique complet (PDF)"
                                    >
                                        <Download size={14} /> EXPORTER
                                    </button>
                                </>
                            )}
                        </div>

                        {isLoading && paiements.length === 0 ? (
                            <div className="pm-historique-empty">
                                <div className="pm-spinner-sm" />
                            </div>
                        ) : paiements.length === 0 ? (
                            <div className="pm-historique-empty">
                                <Clock size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <p>Aucun versement enregistré pour l'instant.</p>
                            </div>
                        ) : (
                            <div className="pm-historique-list">
                                {paiements.map((p, idx) => (
                                    <div key={p._id} className="pm-historique-item">
                                        <div className="pm-h-left">
                                            <div className="pm-h-index">{idx + 1}</div>
                                            <div className="pm-h-info">
                                                <span className="pm-h-montant">{p.montant.toFixed(2)} TND</span>
                                                <span className="pm-h-meta">
                                                    <span className="pm-h-mode">{p.modePaiement}</span>
                                                    {p.note && <span>• {p.note}</span>}
                                                </span>
                                                {p.enregistrePar && (
                                                    <span className="pm-h-admin">
                                                        Par {p.enregistrePar.firstName} {p.enregistrePar.lastName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pm-h-right">
                                            <span className="pm-h-date">
                                                {new Date(p.datePaiement).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </span>
                                            <span className="pm-h-time">
                                                {new Date(p.datePaiement).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {p.receiptUrl && (
                                                <a 
                                                    href={`http://localhost:5000${p.receiptUrl}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="pm-h-receipt"
                                                    title="Voir le reçu"
                                                >
                                                    <FileText size={13} />
                                                </a>
                                            )}
                                            <button
                                                className="pm-h-delete"
                                                onClick={() => handleDeletePaiement(p._id)}
                                                title="Supprimer ce versement"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaiementModal;
