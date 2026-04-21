import React, { useState } from 'react';
import { CreditCard, Banknote, X } from 'lucide-react';
import './PaymentMethodModal.css';

export default function PaymentMethodModal({ session, onClose, onSelectMethod }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSelect = async (method) => {
        setIsProcessing(true);
        // onSelectMethod devrait retourner une promesse
        try {
            await onSelectMethod(method);
        } catch (error) {
            setIsProcessing(false);
        }
        // Si tout se passe bien, le parent fermera le modal
    };

    if (!session) return null;

    return (
        <div className="payment-method-overlay" onClick={isProcessing ? undefined : onClose}>
            <div className="payment-method-content" onClick={e => e.stopPropagation()}>
                
                {isProcessing && (
                    <div className="pm-loading-overlay">
                        <div className="pm-spinner"></div>
                        <p>Création de l'inscription...</p>
                    </div>
                )}

                <h3 className="payment-method-title">Comment souhaitez-vous payer ?</h3>
                <p className="payment-method-subtitle">Sélectionnez votre mode de règlement préféré.</p>

                <div className="session-summary-box">
                    <span className="session-name">{session.nomSession}</span>
                    <span className="session-price">Frais d'inscription : <strong>{session.montant ? `${session.montant} TND` : 'Non défini'}</strong></span>
                </div>

                <div className="payment-options">
                    {/* Option 1: Carte (Stripe) */}
                    <button 
                        className="pm-option-btn pm-option-btn--stripe" 
                        onClick={() => handleSelect('stripe')}
                        disabled={isProcessing}
                    >
                        <div className="pm-option-icon">
                            <CreditCard size={24} />
                        </div>
                        <div className="pm-option-text">
                            <h4>Paiement par Carte</h4>
                            <p>Accès immédiat aux cours si vous réglez la totalité en ligne.</p>
                        </div>
                    </button>

                    {/* Option 2: Espèces */}
                    <button 
                        className="pm-option-btn pm-option-btn--cash" 
                        onClick={() => handleSelect('cash')}
                        disabled={isProcessing}
                    >
                        <div className="pm-option-icon">
                            <Banknote size={24} />
                        </div>
                        <div className="pm-option-text">
                            <h4>Paiement sur place (Espèces)</h4>
                            <p>Réglez directement à l'association. Votre inscription sera en attente de validation.</p>
                        </div>
                    </button>
                </div>

                <button 
                    className="pm-cancel-btn" 
                    onClick={onClose}
                    disabled={isProcessing}
                >
                    Annuler l'inscription
                </button>
            </div>
        </div>
    );
}
