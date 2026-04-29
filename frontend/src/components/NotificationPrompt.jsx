import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { subscribeToPush } from '../features/notifications/notificationSlice';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import './NotificationPrompt.css';

function NotificationPrompt() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
        const alreadyAsked = localStorage.getItem('pushNotificationAsked');
        if (alreadyAsked || Notification.permission !== 'default') return;

        const timer = setTimeout(() => setShowPrompt(true), 2000);
        return () => clearTimeout(timer);
    }, [user]);

    const handleAccept = async () => {
        setIsLoading(true);
        try {
            await dispatch(subscribeToPush()).unwrap();
            toast.success('Notifications activées avec succès !');
            localStorage.setItem('pushNotificationAsked', 'granted');
            setShowPrompt(false);
        } catch (error) {
            toast.error(error || 'Impossible d\'activer les notifications.');
            localStorage.setItem('pushNotificationAsked', 'denied');
            setShowPrompt(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDecline = () => {
        localStorage.setItem('pushNotificationAsked', 'declined');
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="np-overlay">
            <div className="np-modal" role="dialog" aria-modal="true">
                <div className="np-modal-content">
                    <div className="np-logo-container">
                        <img src={logo} alt="Association Logo" className="np-logo" />
                    </div>
                    <h2 className="np-title">Activer les notifications</h2>
                    <p className="np-subtitle">
                        Soyez informé immédiatement des validations d'inscription, des paiements et des nouveautés de l'association.
                    </p>
                </div>
                
                <div className="np-actions">
                    <button 
                        className="np-btn-primary" 
                        onClick={handleAccept} 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Activation...' : 'Activer'}
                    </button>
                    <button 
                        className="np-btn-secondary" 
                        onClick={handleDecline} 
                        disabled={isLoading}
                    >
                        Plus tard
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NotificationPrompt;
