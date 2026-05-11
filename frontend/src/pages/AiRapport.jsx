import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { 
    BarChart2, ArrowLeft, Printer, TrendingUp, Award, 
    FileText, Download, PieChart as PieIcon 
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import html2pdf from 'html2pdf.js';
import logo from '../assets/logo.png';
import './AiRapport.css';

function AiRapport() {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const reportRef = useRef();
    const [rapport, setRapport] = useState(null);
    const [donnees, setDonnees] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const todayFr = new Date().toLocaleDateString('fr-FR');

    const genererRapport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/ai/rapport-financier', config);
            const rapportNettoye = data.rapport.replace(/\[Date du jour\]/gi, todayFr);
            setRapport(rapportNettoye);
            setDonnees(data.donnees);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la génération.');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadPDF = () => {
        const element = reportRef.current;
        const opt = {
            margin: 0.5,
            filename: `Rapport_Financier_${currentMonth.replace(' ', '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const formatMontant = (val) => `${(val || 0).toFixed(3)} TND`;

    // Data for Chart
    const getChartData = () => {
        if (!donnees) return [];
        return [
            { name: 'Payé', value: donnees.etudiantsPaids, color: '#10b981' },
            { name: 'Avance', value: donnees.etudiantsAvance, color: '#f59e0b' },
            { name: 'Non Payé', value: donnees.etudiantsNonPaids, color: '#ef4444' }
        ];
    };

    const markdownComponents = {
        h1: ({node, ...props}) => <h2 style={{color:'#1a472a', fontSize:'18px', fontWeight:'800', borderBottom:'1px solid #e2e8f0', paddingBottom:'6px', marginBottom:'10px', marginTop:'20px'}} {...props} />,
        h2: ({node, ...props}) => <h3 style={{color:'#1a472a', fontSize:'16px', fontWeight:'800', borderBottom:'1px solid #e2e8f0', paddingBottom:'4px', marginBottom:'8px', marginTop:'18px'}} {...props} />,
        h3: ({node, ...props}) => <h4 style={{color:'#1a472a', fontSize:'15px', fontWeight:'700', marginBottom:'6px', marginTop:'14px'}} {...props} />,
        p: ({node, ...props}) => <p style={{color:'#1e293b', fontSize:'14.5px', lineHeight:'1.7', marginBottom:'10px'}} {...props} />,
        strong: ({node, ...props}) => <strong style={{color:'#0f172a', fontWeight:'800'}} {...props} />,
        li: ({node, ...props}) => <li style={{color:'#1e293b', fontSize:'14.5px', lineHeight:'1.7', marginBottom:'4px'}} {...props} />,
        ul: ({node, ...props}) => <ul style={{paddingLeft:'20px', marginBottom:'12px'}} {...props} />,
        ol: ({node, ...props}) => <ol style={{paddingLeft:'20px', marginBottom:'12px'}} {...props} />,
        hr: () => <hr style={{border:'none', borderBottom:'1px solid #e2e8f0', margin:'16px 0'}} />,
    };

    return (
        <div className="ai-rapport-wrapper">
            <div className="ai-action-bar no-print">
                <button className="ai-back-btn" onClick={() => navigate('/admin/inscriptions')}>
                    <ArrowLeft size={18} /> Retour
                </button>
                {rapport && (
                    <div className="ai-actions-group">
                        <button className="ai-pdf-btn" onClick={downloadPDF}>
                            <Download size={18} /> Télécharger PDF
                        </button>
                        <button className="ai-print-btn" onClick={() => window.print()}>
                            <Printer size={18} /> Imprimer
                        </button>
                    </div>
                )}
            </div>

            {!rapport && !isLoading && (
                <div className="ai-empty-state no-print">
                    <BarChart2 size={48} color="#10b981" />
                    <h2>Rapport Financier IA</h2>
                    <p>Analyse experte de la gestion financière pour {currentMonth}</p>
                    <button className="ai-generate-btn" onClick={genererRapport}>
                        Générer le rapport de {currentMonth}
                    </button>
                    {error && <p style={{color:'#ef4444', marginTop:'12px'}}>{error}</p>}
                </div>
            )}

            {isLoading && (
                <div className="ai-loading-state no-print">
                    <div className="spinner"></div>
                    <h3>Analyse en cours par l'IA...</h3>
                    <p>Préparation du rapport d'expert comptable</p>
                </div>
            )}

            {rapport && donnees && (
                <div className="ai-official-report" ref={reportRef}>
                    {/* Header */}
                    <div className="ai-report-header-official">
                        <div className="ai-report-header-left">
                            <img src={logo} alt="Logo" className="ai-report-logo" />
                            <div>
                                <h1 className="ai-org-name-ar">الجمعية القرآنية نور طيبة</h1>
                                <h2 className="ai-org-name-fr">Association Coranique Nour Tayyiba</h2>
                                <p className="ai-org-meta">Enseignement & Gestion Administrative</p>
                            </div>
                        </div>
                        <div className="ai-report-title-block">
                            <span className="ai-report-type-badge">RAPPORT FINANCIER</span>
                            <div className="ai-report-period">{currentMonth.toUpperCase()}</div>
                            <div className="ai-report-date">Généré le: {todayFr}</div>
                        </div>
                    </div>

                    {/* KPIs & Chart Section */}
                    <div className="ai-report-section">
                        <h3 className="ai-section-title"><TrendingUp size={16} /> Synthèse et Répartition</h3>
                        <div className="ai-report-flex-layout">
                            <div className="ai-kpi-grid-compact">
                                <div className="ai-kpi-card-mini">
                                    <span className="label">Total Encaissé</span>
                                    <div className="val">{formatMontant(donnees.totalEncaisse)}</div>
                                </div>
                                <div className="ai-kpi-card-mini">
                                    <span className="label">Reste à Percevoir</span>
                                    <div className="val" style={{color:'#dc2626'}}>{formatMontant(donnees.totalRestant)}</div>
                                </div>
                                <div className="ai-kpi-card-mini">
                                    <span className="label">Recouvrement</span>
                                    <div className="val" style={{color:'#10b981'}}>{donnees.tauxRecouvrement}%</div>
                                </div>
                            </div>
                            
                            <div className="ai-report-chart-container">
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={getChartData()}
                                            innerRadius={45}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {getChartData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="middle" align="right" layout="vertical" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="ai-report-section">
                        <h3 className="ai-section-title"><FileText size={16} /> Détails Financiers par Session</h3>
                        <table className="ai-report-table">
                            <thead>
                                <tr>
                                    <th>Session</th>
                                    <th>Élèves</th>
                                    <th>Attendu</th>
                                    <th>Encaissé</th>
                                    <th>Taux</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(donnees.parSession).map(([nom, data]) => (
                                    <tr key={nom}>
                                        <td><strong>{nom}</strong></td>
                                        <td>{data.etudiants}</td>
                                        <td>{formatMontant(data.total)}</td>
                                        <td>{formatMontant(data.encaisse)}</td>
                                        <td>{Math.round((data.encaisse / data.total) * 100)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* AI Analysis */}
                    <div className="ai-report-section">
                        <h3 className="ai-section-title"><Award size={16} /> Analyse Financière Intelligente</h3>
                        <div className="ai-analysis-box">
                            <div className="ai-analysis-content">
                                <div className="ai-analysis-badge">CONSEIL STRATÉGIQUE</div>
                                <ReactMarkdown components={markdownComponents}>
                                    {rapport}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="ai-report-signature">
                        <div className="ai-signature-block">
                            <div className="ai-signature-title">L'Administration</div>
                            <div className="ai-signature-line"></div>
                            <div className="ai-signature-name">{user.firstName} {user.lastName}</div>
                        </div>
                        <div className="ai-signature-block">
                            <div className="ai-signature-title">Cachet de l'Association</div>
                            <div className="ai-signature-stamp">
                                Association<br/>Nour Tayyiba
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AiRapport;
