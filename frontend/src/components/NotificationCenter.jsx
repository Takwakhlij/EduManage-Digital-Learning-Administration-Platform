import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, BookOpen, CreditCard, XCircle, Clock, UserPlus, Calendar, Megaphone } from 'lucide-react';
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
            
            // Rafraîchir toutes les 10 secondes
            const interval = setInterval(() => {
                dispatch(getMyNotifications());
            }, 10000);
            
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
        
        // Redirection logique basée sur le type ou l'URL
        let targetUrl = notif.url;

        // Corriger les anciennes URLs stockées en base
        if (targetUrl === '/student/cours') {
            targetUrl = '/inscriptions';
        } else if (targetUrl === '/admin/users') {
            targetUrl = '/admin/membres';
        }

        if (targetUrl) {
            if ((targetUrl === '/inscriptions' || targetUrl === '/admin/inscriptions' || targetUrl === '/admin/paiements') && notif.relatedId) {
                navigate(targetUrl, { state: { selectedId: notif.relatedId } });
            } else {
                navigate(targetUrl);
            }
        } else if (notif.type === 'cours') {
            if (notif.relatedId) {
                navigate(`/inscriptions`, { state: { selectedId: notif.relatedId } });
            } else {
                navigate(`/inscriptions`);
            }
        } else if (notif.type === 'inscription') {
            navigate('/admin/inscriptions');
        } else if (notif.type === 'paiement') {
            navigate('/paiements');
        } else if (notif.type === 'absence' || notif.type === 'retard') {
            navigate('/presence');
        } else if (notif.type === 'planning') {
            navigate(notif.url || '/planning');
        } else if (notif.type === 'actualite') {
            navigate('/');
        } else if (notif.type === 'systeme') {
            navigate('/dashboard');
        } else {
            navigate('/dashboard');
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'cours':       return <div className="notif-type-icon notif-icon-cours"><BookOpen size={16} /></div>;
            case 'paiement':    return <div className="notif-type-icon notif-icon-paiement"><CreditCard size={16} /></div>;
            case 'absence':     return <div className="notif-type-icon notif-icon-absence"><XCircle size={16} /></div>;
            case 'retard':      return <div className="notif-type-icon notif-icon-retard"><Clock size={16} /></div>;
            case 'inscription': return <div className="notif-type-icon notif-icon-inscription"><UserPlus size={16} /></div>;
            case 'planning':    return <div className="notif-type-icon notif-icon-planning" style={{background:'rgba(16,185,129,0.15)',color:'#10b981'}}><Calendar size={16} /></div>;
            case 'actualite':   return <div className="notif-type-icon" style={{background:'rgba(245,158,11,0.15)',color:'#f59e0b'}}><Megaphone size={16} /></div>;
            default:            return <div className="notif-type-icon notif-icon-default"><Bell size={16} /></div>;
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
                <Bell size={25} />
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
                            onClick={() => { setIsOpen(false); navigate('/dashboard'); }}
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
