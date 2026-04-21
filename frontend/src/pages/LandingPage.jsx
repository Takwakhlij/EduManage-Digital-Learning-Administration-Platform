import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import './LandingPage.css';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Book, FileText, User, Clock, ChevronLeft, ChevronRight, LayoutDashboard, UserCircle, LogOut, CalendarDays, Megaphone, GraduationCap, Calendar } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import PaymentMethodModal from '../components/PaymentMethodModal';


/* ── Animated counter hook ── */
function useCounter(target, duration = 2000, start = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, start]);
    return count;
}

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [statsVisible, setStatsVisible] = useState(false);
    const statsRef = useRef(null);
    const sliderRef = useRef(null);

    const scrollSlider = (direction) => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: direction === 'left' ? -380 : 380, behavior: 'smooth' });
        }
    };
    const { isDarkMode, toggleTheme } = useTheme();
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const students = useCounter(320, 2000, statsVisible);
    const teachers = useCounter(18, 2000, statsVisible);
    const years = useCounter(12, 2000, statsVisible);
    const classesCount = useCounter(45, 2000, statsVisible);

    // Dynamic Sessions State
    const [activeSessions, setActiveSessions] = useState([]);
    const [isSessionsLoading, setIsSessionsLoading] = useState(true);
    const [enrollMessage, setEnrollMessage] = useState(null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isCarouselPaused, setIsCarouselPaused] = useState(false);
    const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
    const avatarMenuRef = useRef(null);

    // Payment Method Selection Modal State
    const [methodModalOpen, setMethodModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);

    // Stripe Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentInscription, setPaymentInscription] = useState(null);

    // Current student's inscriptions to check for duplicates
    const [myInscriptions, setMyInscriptions] = useState([]);


    // Close avatar dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
                setAvatarMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-scroll carousel
    useEffect(() => {
        if (isCarouselPaused || isSessionsLoading || activeSessions.length === 0) return;

        const interval = setInterval(() => {
            if (sliderRef.current) {
                const { scrollLeft, clientWidth, scrollWidth } = sliderRef.current;
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    sliderRef.current.scrollBy({ left: 380, behavior: 'smooth' });
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isCarouselPaused, isSessionsLoading, activeSessions]);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await axios.get('/api/sessions/published');
                if (response.data.success) {
                    setActiveSessions(response.data.sessions);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des sessions :", error);
            } finally {
                setIsSessionsLoading(false);
            }
        };
        fetchSessions();
    }, []);

    useEffect(() => {
        const fetchMyInscriptions = async () => {
            if (!user) return;
            try {
                const response = await axios.get('/api/inscriptions/my', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                if (response.data.success) {
                    setMyInscriptions(response.data.inscriptions);
                }
            } catch (error) {
                console.error("Erreur récup inscriptions:", error.response?.data || error.message);
            }
        };
        fetchMyInscriptions();
    }, [user]);

    // Rediriger immédiatement les admins et les profs vers leurs espaces
    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                navigate('/admin');
            } else if (user.role === 'teacher') {
                navigate('/teacher');
            }
        }
    }, [user, navigate]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
            { threshold: 0.3 }
        );
        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, []);

    const scrollTo = (id) => {
        setMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/');
    };

    // ── Étape 1 : Ouvrir le modal de sélection du mode de paiement ──────────
    const handleEnroll = (sessionId, sessionData) => {
        if (!user) {
            navigate('/register', { state: { sessionId } });
            return;
        }
        if (user.role !== 'student' && user.role !== 'parent') {
            alert("Seuls les étudiants ou parents peuvent s'inscrire à une session.");
            return;
        }
        // Sauvegarder la session choisie et ouvrir le modal de choix
        setSelectedSession({ ...sessionData, _id: sessionId });
        setMethodModalOpen(true);
    };

    // ── Étape 2 : Traiter le choix du mode de paiement ───────────────────────
    const handleMethodSelect = async (method) => {
        if (!selectedSession) return;
        setIsEnrolling(true);
        try {
            const response = await axios.post('/api/inscriptions', {
                etudiant: user._id,
                session: selectedSession._id
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            if (response.data.success) {
                const inscription = response.data.inscription;
                // Enrichir l'objet inscription avec les données de la session
                inscription.session = selectedSession;

                setMethodModalOpen(false);

                if (method === 'stripe') {
                    // Option Carte : ouvrir IMMÉDIATEMENT le formulaire de paiement
                    setPaymentInscription(inscription);
                    setPaymentModalOpen(true);
                } else {
                    // Option Espèces : simple redirection avec message
                    setSelectedSession(null);
                    navigate('/inscriptions', {
                        state: { successMessage: '✅ Votre demande d\'inscription a été enregistrée ! Rendez-vous à l\'association pour régler votre inscription en espèces.' }
                    });
                }
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || "Erreur lors de l'inscription";
            setMethodModalOpen(false);
            setSelectedSession(null);
            if (errMsg.toLowerCase().includes('déjà inscrit') || errMsg.toLowerCase().includes('deja inscrit')) {
                navigate('/inscriptions');
            } else {
                alert(errMsg);
            }
        } finally {
            setIsEnrolling(false);
        }
    };

    // ── Fermeture du modal de choix sans action ───────────────────────────────
    const handleMethodClose = () => {
        if (isEnrolling) return; // Ne pas fermer pendant le traitement
        setMethodModalOpen(false);
        setSelectedSession(null);
    };

    // ── Callback succès Stripe ─────────────────────────────────────────────────
    const handlePaymentSuccess = async (data) => {
        setPaymentModalOpen(false);
        setPaymentInscription(null);
        setSelectedSession(null);
        
        // Rafraîchir les inscriptions pour mettre à jour les boutons "Déjà inscrit"
        try {
            const response = await axios.get('/api/inscriptions/my', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (response.data.success) {
                setMyInscriptions(response.data.inscriptions);
            }
        } catch (e) {
            console.error("Erreur refresh inscriptions after payment", e);
        }

        if (data.statutPaiement === 'Payé') {
            navigate('/inscriptions', {
                state: { successMessage: '🎉 Paiement complet ! Votre inscription est approuvée. Accédez à vos cours dès maintenant.' }
            });
        } else {
            navigate('/inscriptions', {
                state: { successMessage: "✅ Avance enregistrée. Votre inscription est en attente de validation par l'administrateur." }
            });
        }
    };

    // ── Fermeture Stripe sans payer ─────────────────────────────────────────────
    const handleSkipPayment = () => {
        setPaymentModalOpen(false);
        setPaymentInscription(null);
        setSelectedSession(null);
        navigate('/inscriptions', {
            state: { successMessage: "Inscription créée. Vous pouvez payer plus tard depuis votre espace 'Mes Inscriptions'." }
        });
    };


    const getDashboardPath = () => {
        if (!user) return '/dashboard';
        if (user.role === 'admin') return '/admin';
        if (user.role === 'teacher') return '/teacher';
        return '/dashboard';
    };

    return (
        <div className="lp-root">
            {/* ── Modal Sélection Mode de Paiement ── */}
            {methodModalOpen && selectedSession && (
                <PaymentMethodModal
                    session={selectedSession}
                    onClose={handleMethodClose}
                    onSelectMethod={handleMethodSelect}
                />
            )}

            {/* ── Modal Stripe (Carte Bancaire) ── */}
            {paymentModalOpen && paymentInscription && (
                <PaymentModal
                    inscription={paymentInscription}
                    onClose={handleSkipPayment}
                    onSuccess={handlePaymentSuccess}
                />
            )}

            {/* Modal/Toast de succès d'inscription */}
            {enrollMessage && (
                <div className="lp-enroll-toast">
                    <div className="lp-enroll-toast__content">
                        <span className="lp-enroll-toast__icon">✅</span>
                        <p>{enrollMessage}</p>
                        <button onClick={() => setEnrollMessage(null)}>×</button>
                    </div>
                </div>
            )}

            {/* ══════════ NAVBAR ══════════ */}
            <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
                <div className="lp-nav__inner">
                    <div className="lp-nav__brand">
                        <img src="/src/assets/logo.png" alt="Logo" className="lp-nav__logo" />
                        <span className="lp-nav__name">Association Coranique</span>
                    </div>
                    <ul className={`lp-nav__links ${menuOpen ? 'open' : ''}`}>
                        {user ? (
                            <>
                                <li><Link to="/dashboard">Mon Parcours</Link></li>
                                <li><Link to="/inscriptions">Mes Inscriptions</Link></li>
                                <li><Link to="/formations">Formations</Link></li>
                                <li><button onClick={() => scrollTo('actualites')}>Actualités</button></li>
                            </>
                        ) : (
                            <>
                                <li><button onClick={() => scrollTo('about')}>À propos</button></li>
                                <li><button onClick={() => scrollTo('formations')}>Formations</button></li>
                                <li><button onClick={() => scrollTo('stats')}>Chiffres</button></li>
                                <li><button onClick={() => scrollTo('contact')}>Contact</button></li>
                            </>
                        )}
                    </ul>
                    <div className="lp-nav__actions">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="lp-theme-toggle"
                            aria-label="Basculer le thème"
                            style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', marginRight: '1rem' }}
                        >
                            {isDarkMode ? '🌙' : '☀️'}
                        </button>
                        {user ? (
                            <>
                                {/* Avatar + Dropdown (Name + Image are now joined) */}
                                <div className="lp-avatar-wrapper" ref={avatarMenuRef}>
                                    <button
                                        className="lp-avatar-btn"
                                        onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                                        aria-label="Menu utilisateur"
                                    >
                                        <div className="lp-avatar-container">
                                            {user.profileImage ? (
                                                <img
                                                    src={user.profileImage.startsWith('http') ? user.profileImage : `http://localhost:5000${user.profileImage}`}
                                                    alt={user.firstName}
                                                    className="lp-avatar-img"
                                                />
                                            ) : (
                                                <div className="lp-avatar-placeholder">
                                                    {user.firstName?.charAt(0)?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <span className="lp-avatar-name">{user.firstName}</span>
                                    </button>
                                    {avatarMenuOpen && (
                                        <div className="lp-avatar-menu">
                                            <div className="lp-avatar-menu__header">
                                                <strong>{user.firstName} {user.lastName}</strong>
                                                <span>{user.email}</span>
                                            </div>
                                            <div className="lp-avatar-menu__divider" />
                                            <Link to={getDashboardPath()} className="lp-avatar-menu__item" onClick={() => setAvatarMenuOpen(false)}>
                                                <LayoutDashboard size={16} />
                                                Mon Tableau de bord
                                            </Link>
                                            <Link to="/profile" className="lp-avatar-menu__item" onClick={() => setAvatarMenuOpen(false)}>
                                                <UserCircle size={16} />
                                                Mon Profil
                                            </Link>
                                            <div className="lp-avatar-menu__divider" />
                                            <button className="lp-avatar-menu__item lp-avatar-menu__item--danger" onClick={() => { setAvatarMenuOpen(false); onLogout(); }}>
                                                <LogOut size={16} />
                                                Déconnexion
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="lp-btn lp-btn--outline">Connexion</Link>
                                <Link to="/register" className="lp-btn lp-btn--register">S'inscrire</Link>
                            </>
                        )}
                    </div>
                    <button className="lp-nav__burger" onClick={() => setMenuOpen(!menuOpen)}>
                        <span /><span /><span />
                    </button>
                </div>
            </nav>

            {/* ══════════ VISITOR CONTENT (NOT LOGGED IN) ══════════ */}
            {!user ? (
                <>
                    {/* ══════════ HERO ══════════ */}
                    <section className="lp-hero">
                        <div className="lp-hero__bg">
                            <img src="/hero-mosque.png" alt="Mosque" className="lp-hero__img" />
                            <div className="lp-hero__overlay" />
                        </div>
                        <div className="lp-hero__content">
                            <span className="lp-hero__badge">بسم الله الرحمن الرحيم</span>
                            <h1 className="lp-hero__title">
                                Bienvenue à l'Association<br />
                                <span className="lp-hero__title--gold">Coranique Noor Tayyiba</span>
                            </h1>
                            <p className="lp-hero__desc">
                                Un espace d'apprentissage et de mémorisation du Saint Coran,
                                guidé par des enseignants qualifiés dans un cadre bienveillant.
                            </p>
                            <div className="lp-hero__btns">
                                <Link to="/register" className="lp-btn lp-btn--join lp-btn--lg">
                                    Rejoindre l'association
                                </Link>
                                <button onClick={() => scrollTo('about')} className="lp-btn lp-btn--ghost lp-btn--lg">
                                    En savoir plus ↓
                                </button>
                            </div>
                        </div>
                        <div className="lp-hero__quote">
                            <p>خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ</p>
                            <small>Hadith du Prophète ﷺ — Al-Boukhâri</small>
                        </div>
                    </section>

                    {/* ══════════ ABOUT ══════════ */}
                    <section id="about" className="lp-about">
                        <div className="lp-container lp-about__grid">
                            <div className="lp-about__photo">
                                <img src="/quran-photo.png" alt="Le Saint Coran" />
                                <div className="lp-about__photo-badge">
                                    <span>🕌</span>
                                    <p>Fondée en 2012</p>
                                </div>
                            </div>
                            <div className="lp-about__text">
                                <span className="lp-section-tag">À propos de nous</span>
                                <h2 className="lp-section-title">Notre mission : transmettre le Coran de génération en génération</h2>
                                <p>
                                    L'Association Coranique Noor Tayyiba est un espace éducatif dédié à l'enseignement
                                    du Saint Coran selon les règles du Tajwid, la mémorisation (Hifz), et l'apprentissage
                                    de la langue arabe dans un environnement islamique bienveillant.
                                </p>
                                <p>
                                    Nous accueillons des étudiants de tous âges, des enfants aux adultes, dans un cadre
                                    familial et structuré, avec un suivi personnalisé par nos enseignants certifiés.
                                </p>
                                <div className="lp-about__values">
                                    <div className="lp-about__value">
                                        <span>📖</span>
                                        <div>
                                            <strong>Excellence</strong>
                                            <p>Enseignement de qualité basé sur les méthodes traditionnelles</p>
                                        </div>
                                    </div>
                                    <div className="lp-about__value">
                                        <span>🤲</span>
                                        <div>
                                            <strong>Bienveillance</strong>
                                            <p>Un cadre familial et spirituel pour chaque étudiant</p>
                                        </div>
                                    </div>
                                    <div className="lp-about__value">
                                        <span>🌟</span>
                                        <div>
                                            <strong>Progrès</strong>
                                            <p>Suivi individuel et plans de progression adaptés</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══════════ SESSIONS DYNAMIQUES ══════════ */}
                    <section id="formations" className="lp-formations">
                        <div className="lp-container">
                            <div className="lp-section-header">
                                <span className="lp-section-tag">Ce que nous enseignons</span>
                                <h2 className="lp-section-title">Nos sessions d'études</h2>
                                <p className="lp-section-sub">Un cheminement spirituel et académique structuré pour approfondir votre relation avec le Noble Coran.</p>
                            </div>
                            {/* ── Carousel Wrapper ── */}
                            <div className="lp-carousel-wrapper">
                                {/* Flèche Gauche */}
                                <button className="lp-carousel-arrow lp-carousel-arrow--left" onClick={() => scrollSlider('left')} aria-label="Défiler à gauche">
                                    <ChevronLeft size={24} />
                                </button>

                                {/* Slider Track */}
                                <div
                                    className="lp-carousel-track"
                                    ref={sliderRef}
                                    onMouseEnter={() => setIsCarouselPaused(true)}
                                    onMouseLeave={() => setIsCarouselPaused(false)}
                                >
                                    {isSessionsLoading ? (
                                        <div style={{ width: '100%', textAlign: 'center', padding: '60px' }}>
                                            <div style={{ border: '4px solid rgba(13,95,71,0.15)', borderTop: '4px solid #059669', borderRadius: '50%', width: '48px', height: '48px', animation: 'lp-spin 0.8s linear infinite', margin: '0 auto' }}></div>
                                            <style>{`@keyframes lp-spin { to { transform: rotate(360deg); } }`}</style>
                                            <p style={{ marginTop: '20px', color: '#6b7280', fontSize: '15px' }}>Chargement des sessions...</p>
                                        </div>
                                    ) : activeSessions.length > 0 ? (
                                        activeSessions.map((session, idx) => {
                                            // Déterminer l'icône selon le nom de la session (fallback si pas d'image)
                                            const getSessionIcon = (name = "") => {
                                                const low = name.toLowerCase();
                                                if (low.includes('memor') || low.includes('hifz')) return <Sparkles size={48} className="lp-card-icon" />;
                                                if (low.includes('tajwid') || low.includes('recit')) return <Book size={48} className="lp-card-icon" />;
                                                return <FileText size={48} className="lp-card-icon" />;
                                            };

                                            // Déterminer l'image par défaut selon le type de session
                                            const getSessionImage = (name = "", index = 0) => {
                                                const low = name.toLowerCase();
                                                if (low.includes('hifz') || low.includes('mémorisation')) return '/formation_hifz.png';
                                                if (low.includes('tajwid') || low.includes('récitation')) return '/formation_tajwid.png';
                                                if (low.includes('arabe')) return '/formation_arabic.png';
                                                if (low.includes('tafsir') || low.includes('sciences')) return '/formation_tafsir.png';
                                                if (low.includes('lecture')) return '/formation_lecture.png';
                                                if (low.includes('tarbiya') || low.includes('éducation')) return '/formation_tarbiya.png';

                                                // Diversification fallbacks (basé sur l'index pour éviter les doublons)
                                                const fallbacks = [
                                                    '/quran-photo.png',
                                                    '/students-learning.png',
                                                    '/tajweed-class.png',
                                                    '/formation_hifz.png'
                                                ];
                                                return fallbacks[index % fallbacks.length];
                                            };

                                            const isAlreadyEnrolled = myInscriptions.some(ins => {
                                                const enrolledSessionId = ins.session?._id?.toString() || ins.session?.toString();
                                                const currentSessionId = session._id?.toString();
                                                
                                                // Check by ID
                                                if (enrolledSessionId === currentSessionId) return true;
                                                
                                                // Check by Name (Fallback for extra safety)
                                                const enrolledSessionName = ins.session?.nomSession;
                                                if (enrolledSessionName && session.nomSession && enrolledSessionName === session.nomSession) return true;
                                                
                                                return false;
                                            });

                                            return (
                                                <div className={`lp-session-card-emerald ${isAlreadyEnrolled ? 'enrolled' : ''}`} key={session._id}>
                                                    {/* ── Top: Illustration ── */}
                                                    <div className="lp-session-card-emerald__top">
                                                        <img
                                                            src={session.imageCouverture || getSessionImage(session.nomSession, idx)}
                                                            alt={session.nomSession}
                                                            className="lp-card-exact-img"
                                                        />
                                                        {isAlreadyEnrolled && (
                                                            <div className="lp-enrolled-overlay">
                                                                <span>Déjà inscrit</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ── Content ── */}
                                                    <div className="lp-session-card-emerald__content">
                                                        {/* Badge Niveau */}
                                                        <span className="lp-session-card-emerald__badge">
                                                            {session.classe?.niveau || 'Tous niveaux'}
                                                        </span>

                                                        <h3 className="lp-session-card-emerald__title">{session.nomSession}</h3>

                                                        <div className="lp-session-card-emerald__meta">
                                                            <div className="lp-meta-row">
                                                                <User size={16} />
                                                                <span>
                                                                    {session.enseignants && session.enseignants.length > 0 
                                                                        ? session.enseignants.map(t => `${t.firstName} ${t.lastName}`).join(', ') 
                                                                        : 'En attente'}
                                                                </span>
                                                            </div>
                                                            {session.duree && (
                                                                <div className="lp-meta-row">
                                                                    <Clock size={16} />
                                                                    <span>{session.duree}</span>
                                                                </div>
                                                            )}
                                                            {session.dateDebut && session.dateFin && (
                                                                <div className="lp-meta-row" style={{ marginTop: '4px' }}>
                                                                    <Calendar size={16} />
                                                                    <span>
                                                                        {new Date(session.dateDebut).toLocaleDateString('fr-FR')} - {new Date(session.dateFin).toLocaleDateString('fr-FR')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <p className="lp-session-card-emerald__desc">
                                                            {session.description || "Un programme complet pour progresser sereinement dans l'apprentissage du Coran et des sciences islamiques."}
                                                        </p>

                                                        <button
                                                            onClick={() => isAlreadyEnrolled ? null : handleEnroll(session._id, session)}
                                                            className={`lp-session-card-emerald__btn ${isAlreadyEnrolled ? 'disabled' : ''}`}
                                                            disabled={isEnrolling || isAlreadyEnrolled}
                                                        >
                                                            {isEnrolling ? 'Envoi...' : isAlreadyEnrolled ? 'Déjà inscrit ✅' : session.montant ? `S'inscrire — ${session.montant} TND` : "S'inscrire"}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ width: '100%', textAlign: 'center', padding: '60px 40px', background: 'rgba(13,95,71,0.04)', borderRadius: '16px', border: '1px dashed rgba(13,95,71,0.2)' }}>
                                            <p style={{ fontSize: '20px', marginBottom: '8px' }}>🤲</p>
                                            <p style={{ fontSize: '16px', color: '#6b7280' }}>Aucune session disponible pour le moment.</p>
                                            <p style={{ fontSize: '14px', color: '#9ca3af' }}>Revenez bientôt pour découvrir nos prochaines sessions !</p>
                                        </div>
                                    )}
                                </div>

                                {/* Flèche Droite */}
                                <button className="lp-carousel-arrow lp-carousel-arrow--right" onClick={() => scrollSlider('right')} aria-label="Défiler à droite">
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ══════════ STATS ══════════ */}
                    <section id="stats" className="lp-stats" ref={statsRef}>
                        <div className="lp-stats__bg">
                            <img src="/students-learning.png" alt="students" />
                            <div className="lp-stats__overlay" />
                        </div>
                        <div className="lp-container lp-stats__content">
                            <div className="lp-section-header lp-section-header--light">
                                <span className="lp-section-tag lp-section-tag--light">Notre impact</span>
                                <h2 className="lp-section-title lp-section-title--light">Une communauté qui grandit</h2>
                            </div>
                            <div className="lp-stats__grid">
                                <div className="lp-stat-box">
                                    <span className="lp-stat-box__num">{students}+</span>
                                    <span className="lp-stat-box__label">Étudiants inscrits</span>
                                </div>
                                <div className="lp-stat-box">
                                    <span className="lp-stat-box__num">{teachers}</span>
                                    <span className="lp-stat-box__label">Enseignants qualifiés</span>
                                </div>
                                <div className="lp-stat-box">
                                    <span className="lp-stat-box__num">{years} ans</span>
                                    <span className="lp-stat-box__label">D'expérience</span>
                                </div>
                                <div className="lp-stat-box">
                                    <span className="lp-stat-box__num">{classesCount}+</span>
                                    <span className="lp-stat-box__label">Classes actives</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══════════ HOW IT WORKS ══════════ */}
                    <section className="lp-how">
                        <div className="lp-container">
                            <div className="lp-section-header">
                                <span className="lp-section-tag">Simple et rapide</span>
                                <h2 className="lp-section-title">Comment ça fonctionne ?</h2>
                            </div>
                            <div className="lp-how__steps">
                                <div className="lp-how__step">
                                    <div className="lp-how__step-num">01</div>
                                    <div className="lp-how__step-icon">📝</div>
                                    <h3>Créez votre compte</h3>
                                    <p>Inscrivez-vous en quelques minutes en choisissant votre espace (Étudiant, Parent ou Enseignant).</p>
                                </div>
                                <div className="lp-how__connector" />
                                <div className="lp-how__step">
                                    <div className="lp-how__step-num">02</div>
                                    <div className="lp-how__step-icon">✅</div>
                                    <h3>Validation du compte</h3>
                                    <p>Un administrateur valide votre inscription. Vous recevez une confirmation pour accéder à votre espace.</p>
                                </div>
                                <div className="lp-how__connector" />
                                <div className="lp-how__step">
                                    <div className="lp-how__step-num">03</div>
                                    <div className="lp-how__step-icon">🕌</div>
                                    <h3>Commencez à apprendre</h3>
                                    <p>Accédez à vos cours, suivez votre progression et connectez-vous à la communauté Coranique.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ══════════ TESTIMONIALS ══════════ */}
                    <section className="lp-testim">
                        <div className="lp-container">
                            <div className="lp-section-header">
                                <span className="lp-section-tag">Ce qu'ils disent</span>
                                <h2 className="lp-section-title">Témoignages de notre communauté</h2>
                            </div>
                            <div className="lp-testim__grid">
                                {[
                                    { name: 'Fatima Z.', role: 'Étudiante', text: 'Grâce à cette association, j\'ai mémorisé 5 juz en un an. L\'enseignement est excellent et les professeurs très patients.', avatar: '👩‍🎓' },
                                    { name: 'Ahmed B.', role: 'Parent d\'élève', text: 'Mon fils a beaucoup progressé dans la récitation du Coran. L\'ambiance est familiale et bienveillante. Je recommande vivement.', avatar: '👨' },
                                    { name: 'Youssef M.', role: 'Étudiant', text: 'Le programme de Tajwid est très structuré. J\'apprends à bien réciter et je comprends enfin les règles de la psalmodie.', avatar: '🧑‍🎓' },
                                ].map((t) => (
                                    <div className="lp-testim-card" key={t.name}>
                                        <div className="lp-testim-card__stars">★★★★★</div>
                                        <p className="lp-testim-card__text">"{t.text}"</p>
                                        <div className="lp-testim-card__author">
                                            <span className="lp-testim-card__avatar">{t.avatar}</span>
                                            <div>
                                                <strong>{t.name}</strong>
                                                <span>{t.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ══════════ CONTACT ══════════ */}
                    <section id="contact" className="lp-contact">
                        <div className="lp-container lp-contact__grid">
                            <div className="lp-contact__info">
                                <span className="lp-section-tag">Nous contacter</span>
                                <h2 className="lp-section-title">Une question ? Écrivez-nous</h2>
                                <div className="lp-contact__details">
                                    <div className="lp-contact__detail">
                                        <span>📍</span>
                                        <div>
                                            <strong>Adresse</strong>
                                            <p>123 Rue de la Mosquée, 75001 Paris, France</p>
                                        </div>
                                    </div>
                                    <div className="lp-contact__detail">
                                        <span>📞</span>
                                        <div>
                                            <strong>Téléphone</strong>
                                            <p>+33 1 23 45 67 89</p>
                                        </div>
                                    </div>
                                    <div className="lp-contact__detail">
                                        <span>✉️</span>
                                        <div>
                                            <strong>Email</strong>
                                            <p>contact@noor-tayyiba.fr</p>
                                        </div>
                                    </div>
                                    <div className="lp-contact__detail">
                                        <span>🕐</span>
                                        <div>
                                            <strong>Heures d'ouverture</strong>
                                            <p>Lun–Sam : 9h00 – 20h00</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <form className="lp-contact__form" onSubmit={(e) => { e.preventDefault(); alert('Message envoyé ! Nous vous répondrons sous 24h. بارك الله فيكم'); }}>
                                <div className="lp-form-row">
                                    <div className="lp-form-group">
                                        <label>Nom complet</label>
                                        <input type="text" placeholder="Ahmed Ben Ali" required />
                                    </div>
                                    <div className="lp-form-group">
                                        <label>Email</label>
                                        <input type="email" placeholder="votre@email.com" required />
                                    </div>
                                </div>
                                <div className="lp-form-group">
                                    <label>Sujet</label>
                                    <input type="text" placeholder="Sujet de votre message" required />
                                </div>
                                <div className="lp-form-group">
                                    <label>Message</label>
                                    <textarea rows="5" placeholder="Votre message..." required></textarea>
                                </div>
                                <button type="submit" className="lp-btn lp-btn--solid lp-btn--full">
                                    Envoyer le message 🤲
                                </button>
                            </form>
                        </div>
                    </section>
                </>
            ) : (
                /* ══════════ CONNECTED USER CONTENT ══════════ */
                <>
                    {/* ── Hero Section Connected (Centered Majestic Layout) ── */}
                    <section className="lp-hero lp-hero--connected">
                        <div className="lp-hero__bg">
                            <img src="/hero-mosque.png" alt="Mosque" className="lp-hero__img" />
                            <div className="lp-hero__overlay" />
                        </div>
                        <div className="lp-hero-connected__container">
                            <div className="lp-hero-connected__salaam">السلام عليكم</div>
                            <h1 className="lp-hero__title">
                                Bienvenue dans votre espace,<br />
                                <span className="lp-hero__title--gold">{user.firstName}</span>
                            </h1>
                            <p className="lp-hero-connected__desc">
                                Votre portail vers le savoir et l'excellence spirituelle. <br />
                                Explorez nos sessions et suivez votre progression.
                            </p>
                            <div className="lp-hero__btns">
                                <Link to={getDashboardPath()} className="lp-btn lp-btn--join lp-btn--lg">
                                    <LayoutDashboard size={18} style={{ marginRight: '8px' }} />
                                    Accéder à mon tableau de bord
                                </Link>
                                <button onClick={() => scrollTo('formations')} className="lp-btn lp-btn--ghost lp-btn--lg">
                                    Voir les sessions ↓
                                </button>
                            </div>

                            {/* Minimalist Hadith Line (Merged into flow) */}
                            <div className="lp-hero-connected__hadith-wrapper">
                                <div className="lp-hero-connected__divider" />
                                <p className="lp-hero-connected__hadith-text">خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ</p>
                                <div className="lp-hero-connected__divider" />
                            </div>
                        </div>
                    </section>

                    {/* ── Navigation Rapide Dashboard ── */}
                    <section className="lp-connected-section">
                        <div className="lp-container">
                            <div className="lp-section-header">
                                <span className="lp-section-tag">⚡ Accès rapide</span>
                                <h2 className="lp-section-title">Mon Espace</h2>
                                <p className="lp-section-sub">Accédez directement à vos différentes rubriques.</p>
                            </div>
                            <div className="lp-quicknav-grid">
                                <Link to="/dashboard" className="lp-quicknav-card">
                                    <div className="lp-quicknav-card__icon lp-quicknav-card__icon--emerald">
                                        <LayoutDashboard size={28} />
                                    </div>
                                    <div className="lp-quicknav-card__body">
                                        <h3>Mon Tableau de Bord</h3>
                                        <p>Vue d'ensemble de vos sessions et statistiques</p>
                                    </div>
                                    <ChevronRight size={20} className="lp-quicknav-card__arrow" />
                                </Link>
                                <Link to="/inscriptions" className="lp-quicknav-card">
                                    <div className="lp-quicknav-card__icon lp-quicknav-card__icon--purple">
                                        <GraduationCap size={28} />
                                    </div>
                                    <div className="lp-quicknav-card__body">
                                        <h3>Mes Inscriptions</h3>
                                        <p>Suivez l'état de vos inscriptions aux sessions</p>
                                    </div>
                                    <ChevronRight size={20} className="lp-quicknav-card__arrow" />
                                </Link>
                                <Link to="/formations" className="lp-quicknav-card">
                                    <div className="lp-quicknav-card__icon lp-quicknav-card__icon--amber">
                                        <Book size={28} />
                                    </div>
                                    <div className="lp-quicknav-card__body">
                                        <h3>Formations</h3>
                                        <p>Explorez les programmes d'enseignement</p>
                                    </div>
                                    <ChevronRight size={20} className="lp-quicknav-card__arrow" />
                                </Link>
                                <Link to="/profile" className="lp-quicknav-card">
                                    <div className="lp-quicknav-card__icon lp-quicknav-card__icon--blue">
                                        <UserCircle size={28} />
                                    </div>
                                    <div className="lp-quicknav-card__body">
                                        <h3>Mon Profil</h3>
                                        <p>Gérez vos informations personnelles</p>
                                    </div>
                                    <ChevronRight size={20} className="lp-quicknav-card__arrow" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* ── Actualités / Événements de la semaine ── */}
                    <section id="actualites" className="lp-connected-section">
                        <div className="lp-container">
                            <div className="lp-section-header">
                                <span className="lp-section-tag"><Megaphone size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Actualités</span>
                                <h2 className="lp-section-title">Événements de la semaine</h2>
                            </div>
                            <div className="lp-events-grid">
                                <div className="lp-event-card">
                                    <div className="lp-event-card__icon"><CalendarDays size={28} /></div>
                                    <div className="lp-event-card__body">
                                        <h3>Reprise des cours</h3>
                                        <p>Les cours reprennent normalement cette semaine. Consultez votre emploi du temps mis à jour.</p>
                                        <span className="lp-event-card__date">📅 Cette semaine</span>
                                    </div>
                                </div>
                                <div className="lp-event-card">
                                    <div className="lp-event-card__icon"><Megaphone size={28} /></div>
                                    <div className="lp-event-card__body">
                                        <h3>Concours de Tajwid</h3>
                                        <p>Préparez-vous pour le concours annuel de Tajwid. Inscriptions ouvertes dès maintenant !</p>
                                        <span className="lp-event-card__date">📅 Prochainement</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Sessions Disponibles (Catalogue) ── */}
                    <section id="formations" className="lp-formations">
                        <div className="lp-container">
                            <div className="lp-section-header">
                                <span className="lp-section-tag">📚 Catalogue</span>
                                <h2 className="lp-section-title">Nouvelles Sessions Disponibles</h2>
                                <p className="lp-section-sub">Découvrez nos programmes et demandez votre inscription directement.</p>
                            </div>
                            {/* Reuse the same carousel */}
                            <div className="lp-carousel-wrapper">
                                <button className="lp-carousel-arrow lp-carousel-arrow--left" onClick={() => scrollSlider('left')} aria-label="Défiler à gauche">
                                    <ChevronLeft size={24} />
                                </button>
                                <div
                                    className="lp-carousel-track"
                                    ref={sliderRef}
                                    onMouseEnter={() => setIsCarouselPaused(true)}
                                    onMouseLeave={() => setIsCarouselPaused(false)}
                                >
                                    {isSessionsLoading ? (
                                        <div style={{ width: '100%', textAlign: 'center', padding: '60px' }}>
                                            <div style={{ border: '4px solid rgba(13,95,71,0.15)', borderTop: '4px solid #059669', borderRadius: '50%', width: '48px', height: '48px', animation: 'lp-spin 0.8s linear infinite', margin: '0 auto' }}></div>
                                            <p style={{ marginTop: '20px', color: '#6b7280', fontSize: '15px' }}>Chargement des sessions...</p>
                                        </div>
                                    ) : activeSessions.length > 0 ? (
                                        activeSessions.map((session, idx) => {
                                            const getSessionImage = (name = "", index = 0) => {
                                                const low = name.toLowerCase();
                                                if (low.includes('hifz') || low.includes('mémorisation')) return '/formation_hifz.png';
                                                if (low.includes('tajwid') || low.includes('récitation')) return '/formation_tajwid.png';
                                                if (low.includes('arabe')) return '/formation_arabic.png';
                                                if (low.includes('tafsir') || low.includes('sciences')) return '/formation_tafsir.png';
                                                if (low.includes('lecture')) return '/formation_lecture.png';
                                                if (low.includes('tarbiya') || low.includes('éducation')) return '/formation_tarbiya.png';
                                                const fallbacks = ['/quran-photo.png', '/students-learning.png', '/tajweed-class.png', '/formation_hifz.png'];
                                                return fallbacks[index % fallbacks.length];
                                            };

                                            return (
                                                <div className="lp-session-card-emerald" key={session._id}>
                                                    <div className="lp-session-card-emerald__top">
                                                        <img
                                                            src={session.imageCouverture || getSessionImage(session.nomSession, idx)}
                                                            alt={session.nomSession}
                                                            className="lp-card-exact-img"
                                                        />
                                                    </div>
                                                    <div className="lp-session-card-emerald__content">
                                                        <span className="lp-session-card-emerald__badge">
                                                            {session.classe?.niveau || 'Tous niveaux'}
                                                        </span>
                                                        <h3 className="lp-session-card-emerald__title">{session.nomSession}</h3>
                                                        <div className="lp-session-card-emerald__meta">
                                                            <div className="lp-meta-row">
                                                                <User size={16} />
                                                                <span>
                                                                    {session.enseignants && session.enseignants.length > 0 
                                                                        ? session.enseignants.map(t => `${t.firstName} ${t.lastName}`).join(', ') 
                                                                        : 'En attente'}
                                                                </span>
                                                            </div>
                                                            {session.duree && (
                                                                <div className="lp-meta-row">
                                                                    <Clock size={16} />
                                                                    <span>{session.duree}</span>
                                                                </div>
                                                            )}
                                                            {session.dateDebut && session.dateFin && (
                                                                <div className="lp-meta-row" style={{ marginTop: '4px' }}>
                                                                    <Calendar size={16} />
                                                                    <span>
                                                                        {new Date(session.dateDebut).toLocaleDateString('fr-FR')} - {new Date(session.dateFin).toLocaleDateString('fr-FR')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="lp-session-card-emerald__desc">
                                                            {session.description || "Un programme complet pour progresser sereinement dans l'apprentissage du Coran."}
                                                        </p>
                                                        <button
                                                            onClick={() => handleEnroll(session._id, session)}
                                                            className="lp-session-card-emerald__btn"
                                                            disabled={isEnrolling}
                                                        >
                                                            {isEnrolling ? 'Envoi...' : session.montant ? `S'inscrire — ${session.montant} TND` : "S'inscrire"}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ width: '100%', textAlign: 'center', padding: '60px 40px', background: 'rgba(13,95,71,0.04)', borderRadius: '16px', border: '1px dashed rgba(13,95,71,0.2)' }}>
                                            <p style={{ fontSize: '20px', marginBottom: '8px' }}>🤲</p>
                                            <p style={{ fontSize: '16px', color: '#6b7280' }}>Aucune session disponible pour le moment.</p>
                                        </div>
                                    )}
                                </div>
                                <button className="lp-carousel-arrow lp-carousel-arrow--right" onClick={() => scrollSlider('right')} aria-label="Défiler à droite">
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* ══════════ FOOTER (always visible) ══════════ */}
            <footer className="lp-footer">
                <div className="lp-container lp-footer__inner">
                    <div className="lp-footer__brand">
                        <img src="/src/assets/logo.png" alt="Logo" />
                        <p>الجمعية القرآنية<br /><span>Noor Tayyiba</span></p>
                        <p className="lp-footer__slogan">Pour l'apprentissage et la mémorisation du Saint Coran</p>
                    </div>
                    <div className="lp-footer__links">
                        <h4>Navigation</h4>
                        <ul>
                            <li><button onClick={() => scrollTo('about')}>À propos</button></li>
                            <li><button onClick={() => scrollTo('formations')}>Formations</button></li>
                            <li><button onClick={() => scrollTo('stats')}>Statistiques</button></li>
                            <li><button onClick={() => scrollTo('contact')}>Contact</button></li>
                        </ul>
                    </div>
                    <div className="lp-footer__links">
                        <h4>Espaces</h4>
                        <ul>
                            <li><Link to="/login">Connexion</Link></li>
                            <li><Link to="/register">Inscription</Link></li>
                            <li><Link to="/admin/login">Espace Admin</Link></li>
                        </ul>
                    </div>
                    <div className="lp-footer__newsletter">
                        <h4>Suivez-nous</h4>
                        <div className="lp-footer__social">
                            <a href="#" className="lp-footer__social-btn">f</a>
                            <a href="#" className="lp-footer__social-btn">in</a>
                            <a href="#" className="lp-footer__social-btn">▶</a>
                        </div>
                    </div>
                </div>
                <div className="lp-footer__bottom">
                    <p>© 2024 Association Coranique Noor Tayyiba. Tous droits réservés.</p>
                    <p>جَعَلَنَا اللَّهُ وَإِيَّاكُمْ مِنْ أَهْلِ الْقُرْآنِ</p>
                </div>
            </footer>

        </div>
    );
}
