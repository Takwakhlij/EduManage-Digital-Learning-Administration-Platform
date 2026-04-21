import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Search, Calendar, UserCheck, BookOpen, Clock, FileText } from 'lucide-react';
import './AdminTeacherPresences.css';
import AdminPresenceTable from '../components/AdminPresenceTable';
function AdminTeacherPresences() {
    const [presences, setPresences] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState('all');
    const [selectedClass, setSelectedClass] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    
    // Default to current month (YYYY-MM)
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const [monthFilter, setMonthFilter] = useState(currentMonthStr);
    
    const dateInputRef = useRef(null);

    const handleIconClick = () => {
        if (dateInputRef.current) {
            try {
                dateInputRef.current.showPicker();
            } catch (err) {
                dateInputRef.current.focus();
            }
        }
    };

    const { user } = useSelector((state) => state.auth);

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            
            let url = 'http://localhost:5000/api/teacher-presences/all';
            if (monthFilter) {
                url += `?month=${monthFilter}`;
            }
            
            const { data } = await axios.get(url, config);
            setPresences(data.data || []);

            // Fetch Sessions for the filter dropdown
            const sessionsRes = await axios.get('http://localhost:5000/api/sessions', config);
            setSessions(sessionsRes.data.sessions || []);

            setInitialLoadDone(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la récupération des données');
        } finally {
            setLoading(false);
        }
    }, [user, monthFilter]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, monthFilter, fetchData]);

    // Filtering logic
    const filteredPresences = presences.filter(p => {
        // Search Filter (Name or Email)
        const nameMatch = p.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.teacher?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Session Filter Logic
        const sessionMatch = selectedSession === 'all' || 
                            p.groups.some(g => g.sessionId === selectedSession);

        // Class Filter Logic
        const classMatch = selectedClass === 'all' || 
                          p.groups.some(g => g.classe === selectedClass);

        return nameMatch && sessionMatch && classMatch;
    });

    // Get available classes based on selected session
    const availableClasses = React.useMemo(() => {
        const classSet = new Set();
        presences.forEach(p => {
            p.groups.forEach(g => {
                if (selectedSession === 'all' || g.sessionId === selectedSession) {
                    classSet.add(g.classe);
                }
            });
        });
        return Array.from(classSet);
    }, [presences, selectedSession]);

    return (
        <div className="ap-container">
            <div className="ap-header">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%'}}>
                    <div>
                        <h1 className="ap-title">Dashboard Présences Enseignants</h1>
                        <p className="ap-subtitle">Vue centralisée · Suivi des cours et cahiers de texte</p>
                    </div>
                    <div className="ap-stats-badge" style={{background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '10px 20px', borderRadius: '12px', textAlign:'right'}}>
                        <span style={{fontSize: '12px', color: 'rgba(255,255,255,0.6)', display:'block'}}>Total Enseignants</span>
                        <span style={{fontSize: '20px', fontWeight: 'bold', color: '#d4af37'}}>{filteredPresences.length}</span>
                    </div>
                </div>
            </div>

            <div className="ap-filters-bar" style={{display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '15px', alignItems: 'center'}}>
                <div className="ap-search-wrapper" style={{width: '100%'}}>
                    <Search className="ap-search-icon" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher un enseignant (nom, email)..." 
                        className="ap-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="ap-date-wrapper" style={{minWidth: '200px'}}>
                    <select 
                        className="ap-date-input" 
                        value={selectedSession} 
                        onChange={(e) => {
                            setSelectedSession(e.target.value);
                            setSelectedClass('all');
                        }}
                        style={{appearance: 'none', cursor: 'pointer', paddingRight: '15px'}}
                    >
                        <option value="all">Toutes les sessions</option>
                        {sessions.map(s => (
                            <option key={s._id} value={s._id}>{s.nomSession}</option>
                        ))}
                    </select>
                    <BookOpen size={16} style={{position:'absolute', right:'15px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', opacity:0.5}} />
                </div>

                <div className="ap-date-wrapper" style={{minWidth: '180px'}}>
                    <select 
                        className="ap-date-input" 
                        value={selectedClass} 
                        onChange={(e) => setSelectedClass(e.target.value)}
                        style={{appearance: 'none', cursor: 'pointer', paddingRight: '15px'}}
                    >
                        <option value="all">Toutes les classes</option>
                        {availableClasses.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <Clock size={16} style={{position:'absolute', right:'15px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', opacity:0.5}} />
                </div>

                <div className="ap-date-wrapper" onClick={handleIconClick} style={{minWidth: '180px'}}>
                    <Calendar className="ap-calendar-icon" size={18} />
                    <input 
                        type="month" 
                        ref={dateInputRef}
                        className="ap-date-input"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                    />
                </div>
            </div>

            {loading && !initialLoadDone ? (
                <div className="ap-loading">Analyse des cahiers de texte...</div>
            ) : error ? (
                <div className="ap-error">{error}</div>
            ) : filteredPresences.length === 0 ? (
                <div className="ap-empty">
                    <FileText size={48} className="ap-icon-mute" />
                    <h3>Aucun résultat</h3>
                    <p>Ajustez vos filtres pour voir les présences.</p>
                </div>
            ) : (
                <AdminPresenceTable 
                  presences={filteredPresences} 
                  onRefresh={fetchData} 
                  selectedSessionId={selectedSession}
                  selectedClass={selectedClass}
                />
            )}
        </div>
    );
}

export default AdminTeacherPresences;
