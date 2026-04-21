import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
import './PaymentModal.css';

// Remplacez par votre Clé Publique (Publishable Key) issue de Stripe Dashboard
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

export default function PaymentModal({ inscription, onClose, onSuccess }) {
    if (!inscription) return null;

    return (
        <div className="payment-modal-overlay" onClick={onClose}>
            <div className="payment-modal-content" onClick={e => e.stopPropagation()}>
                <Elements stripe={stripePromise}>
                    <CheckoutForm 
                        inscription={inscription} 
                        onSuccess={onSuccess} 
                        onCancel={onClose} 
                    />
                </Elements>
            </div>
        </div>
    );
}
