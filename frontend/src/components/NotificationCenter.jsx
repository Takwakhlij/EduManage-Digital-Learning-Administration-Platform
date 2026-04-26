import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, BookOpen, CreditCard, XCircle, Clock } from 'lucide-react';
import { getMyNotifications, markNotificationAsRead } from '../features/notifications/notificationSlice';
import './NotificationCenter.css';

const NotificationCenter = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    
    const { notifications } = useSelector((state) => state.notifications);
    const { user } = useSelector((state) => state.auth);

    // Calculer le nombre de non-lues
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        if (user) {
            dispatch(getMyNotifications());
            
            // Rafraîchir toutes les 30 secondes pendant les tests
            const interval = setInterval(() => {
                dispatch(getMyNotifications());
            }, 30000);
            
            return () => clearInterval(interval);
        }
    }, [dispatch, user]);

    // Fermer le dropdown si on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notif) => {
        if (!notif.isRead) {
            dispatch(markNotificationAsRead(notif._id));
        }
        setIsOpen(false);
        if (notif.url) {
            navigate(notif.url);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'cours': return <div className="notif-type-icon notif-icon-cours"><BookOpen size={16} /></div>;
            case 'paiement': return <div className="notif-type-icon notif-icon-paiement"><CreditCard size={16} /></div>;
            case 'absence': return <div className="notif-type-icon notif-icon-absence"><XCircle size={16} /></div>;
            default: return <div className="notif-type-icon notif-icon-default"><Bell size={16} /></div>;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / 60000);

        if (diffInMinutes < 1) return 'À l\'instant';
        if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
        if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notification-center" ref={dropdownRef}>
            <button 
                className="notif-bell-btn" 
                onClick={() => setIsOpen(!isOpen)}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notif-dropdown">
                    <div className="notif-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="notif-count-tag">{unreadCount} nouvelles</span>
                        )}
                    </div>

                    <div className="notif-list">
                        {notifications.length === 0 ? (
                            <div className="notif-empty">
                                <div className="notif-empty-icon">🔔</div>
                                <p>Aucune notification pour le moment</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div 
                                    key={notif._id} 
                                    className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    {getTypeIcon(notif.type)}
                                    <div className="notif-content">
                                        <span className="notif-title">{notif.title}</span>
                                        <p className="notif-message">{notif.message}</p>
                                        <span className="notif-time">
                                            <Clock size={10} style={{ marginRight: '4px' }} />
                                            {formatTime(notif.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="notif-footer">
                        <button 
                            className="notif-see-all" 
                            onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                            Voir toutes les notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
