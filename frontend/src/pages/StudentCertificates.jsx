import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Award, Download, ArrowRight, ArrowLeft, Moon, Sun, Loader2, ShieldCheck, Calendar, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import logo from '../assets/logo.png';
import './StudentCertificates.css';

function StudentCertificates() {
    const { user: authUser } = useSelector((state) => state.auth);
    const { t, lang, setLang } = useLanguage();
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authUser?.token) {
            navigate('/login');
            return;
        }
        fetchCertificates();
    }, [authUser?.token]);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${authUser.token}` } };
            const res = await axios.get('/api/certificates/my', config);
            if (res.data.success) {
                setCertificates(res.data.certificates);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du chargement des certificats.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (cert) => {
        try {
            setDownloading(cert._id);
            const config = {
                headers: { Authorization: `Bearer ${authUser.token}` },
                responseType: 'blob'
            };
            const res = await axios.get(`/api/certificates/${cert._id}/download`, config);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `certificat-${cert.certificateId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Erreur téléchargement:', err);
        } finally {
            setDownloading(null);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    };


    return (
        <div className="cert-layout" dir={t.dir}>
            {/* ── Top Bar ── */}
            <header className="cert-topbar">
                <div className="cert-topbar-start">
                    <button className="cert-back-btn" onClick={() => navigate('/dashboard')}>
                        {t.dir === 'rtl' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                        <span>{t.myDashboard || 'Tableau de Bord'}</span>
                    </button>
                </div>
                <div className="cert-topbar-center">
                    <Award size={22} className="cert-topbar-icon" />
                    <h1>{t.myCertificates || 'Mes Certificats'}</h1>
                </div>
                <div className="cert-topbar-end">
                    <div className="cert-lang-pills">
                        {['ar', 'fr', 'en'].map(l => (
                            <button key={l} className={`cert-lang-btn ${lang === l ? 'active' : ''}`} onClick={() => setLang(l)}>
                                {l === 'ar' ? 'ع' : l === 'fr' ? 'Fr' : 'En'}
                            </button>
                        ))}
                    </div>
                    <button className="cert-icon-btn" onClick={toggleTheme}>
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </header>

            {/* ── Hero Banner ── */}
            <div className="cert-hero">
                <div className="cert-hero-overlay" />
                <div className="cert-hero-content">
                    <div className="cert-hero-icon">
                        <Award size={48} />
                    </div>
                    <h2>{t.myCertificates || 'Mes Certificats'}</h2>
                    <p>{t.certificatesSubtitle || 'Vos attestations de réussite pour les sessions complétées.'}</p>
                    <div className="cert-hero-stat">
                        <span className="cert-hero-count">{certificates.length}</span>
                        <span className="cert-hero-label">{certificates.length === 1 ? 'certificat obtenu' : 'certificats obtenus'}</span>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <main className="cert-main">
                {loading ? (
                    <div className="cert-loading">
                        <Loader2 size={40} className="cert-spinner" />
                        <p>{t.loading || 'Chargement...'}</p>
                    </div>
                ) : error ? (
                    <div className="cert-error">
                        <p>⚠️ {error}</p>
                    </div>
                ) : certificates.length === 0 ? (
                    <div className="cert-empty">
                        <div className="cert-empty-icon">🏅</div>
                        <h3>{t.noCertificates || 'Aucun certificat pour le moment'}</h3>
                        <p>{t.noCertificatesDesc || 'Vos certificats apparaîtront ici après avoir complété et réglé une session avec succès.'}</p>
                        <button className="cert-explore-btn" onClick={() => navigate('/inscriptions')}>
                            {t.myClasses || 'Mes Inscriptions'}
                        </button>
                    </div>
                ) : (
                    <div className="cert-grid">
                        {certificates.map((cert) => (
                            <div key={cert._id} className="cert-card">
                                {/* Card Header */}
                                <div className="cert-card-header">
                                    <div className="cert-card-seal">
                                        <ShieldCheck size={32} />
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="cert-card-body">
                                    <div className="cert-card-title-row">
                                        <span className="cert-card-label">{t.certSession || 'Session'}</span>
                                        <h3 className="cert-card-session">{cert.session?.nomSession}</h3>
                                    </div>
                                    {cert.session?.duree && (
                                        <div className="cert-card-meta">
                                            <Clock size={14} />
                                            <span>{cert.session.duree}</span>
                                        </div>
                                    )}
                                    <div className="cert-card-meta">
                                        <Calendar size={14} />
                                        <span>{formatDate(cert.dateEmission)}</span>
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="cert-card-footer">
                                    <div className="cert-card-id">
                                        <ShieldCheck size={12} />
                                        <span>{cert.certificateId}</span>
                                    </div>
                                    <button
                                        className="cert-download-btn"
                                        onClick={() => handleDownload(cert)}
                                        disabled={downloading === cert._id}
                                    >
                                        {downloading === cert._id ? (
                                            <Loader2 size={16} className="cert-spinner" />
                                        ) : (
                                            <Download size={16} />
                                        )}
                                        <span>{downloading === cert._id ? (t.loading || 'Chargement...') : (t.download || 'Télécharger')}</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default StudentCertificates;
