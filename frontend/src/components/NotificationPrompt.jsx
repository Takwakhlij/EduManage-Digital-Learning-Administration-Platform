import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { subscribeToPush } from '../features/notifications/notificationSlice';
import toast from 'react-hot-toast';
import './NotificationPrompt.css';

function NotificationPrompt() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
        // const alreadyAsked = localStorage.getItem('pushNotificationAsked');
        // if (alreadyAsked) return;

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
        <div className="np-wrapper">
            <div className="np-card" role="dialog" aria-modal="true">

                {/* ── Bandeau supérieur ── */}
                <div className="np-top-banner">
                    <span className="np-top-icon">🕌</span>
                    <span>Autorisation par l'Association Coranique</span>
                </div>

                {/* ── Header ── */}
                <div className="np-header">
                    <div className="np-site-info">
                        <div className="np-site-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                        </div>
                        <span className="np-site-name">association-coranique.com</span>
                    </div>
                    <button className="np-close-btn" onClick={handleDecline} title="Fermer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* ── Corps ── */}
                <div className="np-body">
                    <p className="np-wants-to">
                        association-coranique.com veut
                    </p>
                    <div className="np-permission-row">
                        <span className="np-perm-icon">🔔</span>
                        <span className="np-perm-text">Afficher les notifications</span>
                    </div>
                </div>

                {/* ── Boutons ── */}
                <div className="np-buttons">
                    <button
                        className="np-pill-btn"
                        onClick={handleAccept}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Activation...' : 'Autoriser'}
                    </button>
                    <button
                        className="np-pill-btn"
                        onClick={handleDecline}
                        disabled={isLoading}
                    >
                        Ne pas autoriser
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NotificationPrompt;
