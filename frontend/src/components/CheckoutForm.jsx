import { useState } from 'react';
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { XCircle, Loader2, CreditCard, Calendar, Lock, User as UserIcon } from 'lucide-react';
import { useSelector } from 'react-redux';
import './PaymentModal.css';

const VisaLogo = () => (
    <svg width="36" height="22" viewBox="0 0 36 22">
        <rect width="36" height="22" rx="2" fill="white"/>
        <path fill="#101577ff" d="M12 15l1.5-9h2.2l-1.5 9h-2.2zM21 6.5c-0.6-0.2-1.5-0.4-2.5-0.4-2.5 0-4.3 1.3-4.3 3.3 0 1.4 1.3 2.2 2.2 2.7 1 0.5 1.3 0.8 1.3 1.2 0 0.6-0.8 0.9-1.5 0.9-1 0-1.8-0.2-2.7-0.6l-0.4-0.1-0.4 2.5c0.7 0.3 2.1 0.6 3.4 0.6 2.7 0 4.4-1.3 4.4-3.4 0-1.2-0.7-2-2.2-2.7-0.9-0.5-1.5-0.8-1.5-1.3 0-0.4 0.5-0.9 1.4-0.9 0.8 0 1.4 0.2 1.8 0.4l0.2 0.1 0.7-2.6z"/>
        <path fill="#f7b90eff" d="M4.5 14.5h3.5l1.1-6.2c0.1-0.1 0-0.2-0.1-0.3L6.3 6.5c-0.2-0.4-0.5-0.6-0.9-0.6H1.2l-0.1 0.2c0.8 0.2 1.6 0.6 2 1.3V14.5z"/>
        <path fill="#1A1F71" d="M10 6.5h2.2L10.7 15H8.5L10 6.5z"/>
    </svg>
);

const MastercardLogo = () => (
    <svg width="36" height="22" viewBox="0 0 36 22">
        <rect width="36" height="22" rx="2" fill="white"/>
        <circle cx="14" cy="11" r="7" fill="#EB001B" opacity="0.9"/>
        <circle cx="22" cy="11" r="7" fill="#F79E1B" opacity="0.9"/>
        <path d="M18 11a7 7 0 0 1 2.8-5.6 7 7 0 0 1 0 11.2 7 7 0 0 1-2.8-5.6z" fill="#FF5F00"/>
    </svg>
);

const PayPalLogo = () => (
    <svg width="36" height="22" viewBox="0 0 36 22">
        <rect width="36" height="22" rx="2" fill="white"/>
        <path fill="#253B80" d="M10 6h6c3 0 4 1.5 3.8 3.5l-0.8 4c-0.3 1.5-1.5 2.5-3 2.5h-2l-0.6 3h-3l2.4-13z"/>
        <path fill="#179BD7" d="M12 8h6c3 0 4 1.5 3.8 3.5l-0.8 4c-0.3 1.5-1.5 2.5-3 2.5h-2l-0.6 3h-3l2.4-13z" opacity="0.8"/>
    </svg>
);



export default function CheckoutForm({ inscription, onSuccess, onCancel }) {
    const stripe = useStripe();
    const elements = useElements();
    const { user } = useSelector(state => state.auth);

    const prixSession = inscription.session?.montant || 0;
    const resteInitial = Math.max(0, prixSession - (inscription.montantVerseTotal || 0));

    const [montant, setMontant] = useState(resteInitial);
    const [email, setEmail] = useState(user.email || '');
    const [country, setCountry] = useState('Tunisie');
    const [zip, setZip] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) return;
        if (montant <= 0 || montant > resteInitial) {
            setError(`Le montant doit être valide et ne pas dépasser le reste à payer (${resteInitial} TND).`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            
            // 1. Créer le PaymentIntent interactif
            const { data: intentData } = await axios.post('/api/paiements/create-payment-intent', {
                inscriptionId: inscription._id,
                montant: parseFloat(montant)
            }, config);

            if (!intentData.success || !intentData.clientSecret) {
                throw new Error("Erreur lors de l'initialisation du paiement.");
            }

            // 2. Confirmer le paiement côté Stripe avec la carte (Split Elements)
            const cardNumberElement = elements.getElement(CardNumberElement);
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(intentData.clientSecret, {
                payment_method: {
                    card: cardNumberElement,
                    billing_details: {
                        name: `${user.firstName} ${user.lastName}`,
                        email: email,
                        address: {
                            country: country === 'Tunisie' ? 'TN' : 'FR', // Simplified for demo
                            postal_code: zip
                        }
                    }
                }
            });

            if (stripeError) {
                throw new Error(stripeError.message);
            }

            if (paymentIntent.status === 'succeeded') {
                // 3. Informer le serveur du succès pour vérification et enregistrement direct
                const { data: confirmData } = await axios.post('/api/paiements/confirm-stripe-payment', {
                    inscriptionId: inscription._id,
                    montant: parseFloat(montant),
                    paymentIntentId: paymentIntent.id
                }, config);

                if (confirmData.success) {
                    onSuccess(confirmData); // Callback for UI update
                } else {
                    throw new Error("Erreur lors de l'enregistrement final du paiement.");
                }
            }

        } catch (err) {
            setError(err.response?.data?.message || err.message || "Une erreur inattendue s'est produite.");
        } finally {
            setLoading(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: '"Inter", sans-serif',
                fontSmoothing: 'antialiased',
                '::placeholder': { color: '#64748b' },
                iconColor: '#10b981'
            },
            invalid: { color: '#ef4444', iconColor: '#ef4444' }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="checkout-form">
            <h3 className="checkout-title">Régler l'inscription</h3>
            <p className="checkout-subtitle">{inscription.session?.nomSession}</p>

            <div className="checkout-details">
                <div className="checkout-detail-row">
                    <span>Prix total:</span>
                    <span>{prixSession} TND</span>
                </div>
                <div className="checkout-detail-row">
                    <span>Avance déjà payée:</span>
                    <span>{inscription.montantVerseTotal || 0} TND</span>
                </div>
                <div className="checkout-detail-row highlight-row">
                    <span>Reste à payer:</span>
                    <span>{resteInitial} TND</span>
                </div>
            </div>

            <div className="checkout-input-group">
                <label>Montant à payer aujourd'hui (TND)</label>
                <input 
                    type="number" 
                    step="0.001" 
                    min="1" 
                    max={resteInitial} 
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    required
                    className="checkout-amount-input"
                />
            </div>

            <div className="checkout-input-group">
                <label>E-mail</label>
                <div className="stripe-input-wrapper">
                    <input 
                        type="email"
                        placeholder="email@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="checkout-amount-input transparent-input"
                        required
                    />
                </div>
            </div>

            <div className="checkout-input-group">
                <label>Informations de la carte</label>
                <div className="card-info-box">
                    <div className="card-info-row top-row">
                        <CreditCard size={18} />
                        <div className="stripe-element-field">
                            <CardNumberElement options={cardElementOptions} />
                        </div>
                        <div className="card-brands">
                            <div className="brand-logo-card"><VisaLogo /></div>
                            <div className="brand-logo-card"><MastercardLogo /></div>
                            <div className="brand-logo-card"><PayPalLogo /></div>
                        </div>
                    </div>
                    <div className="card-info-row bottom-row">
                        <div className="stripe-element-field border-right">
                            <CardExpiryElement options={cardElementOptions} />
                        </div>
                        <div className="stripe-element-field">
                            <CardCvcElement options={cardElementOptions} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="checkout-input-group">
                <label>Pays ou région</label>
                <div className="location-box">
                    <select 
                        value={country} 
                        onChange={(e) => setCountry(e.target.value)}
                        className="location-select"
                    >
                        <option value="Tunisie">Tunisie</option>
                        <option value="France">France</option>
                        <option value="Autre">Autre</option>
                    </select>
                    <input 
                        type="text"
                        placeholder="Code postal"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        className="zip-input"
                    />
                </div>
            </div>

            <div style={{ marginBottom: '24px' }}></div>

            {error && (
                <div className="checkout-error">
                    <XCircle size={16} /> {error}
                </div>
            )}

            <div className="checkout-actions">
                <button type="button" className="btn-cancel-pay" onClick={onCancel} disabled={loading}>
                    Annuler
                </button>
                <button type="submit" className="btn-submit-pay" disabled={!stripe || loading}>
                    {loading ? <Loader2 className="spinner" size={16} /> : `Payer ${montant} TND`}
                </button>
            </div>
        </form>
    );
}
