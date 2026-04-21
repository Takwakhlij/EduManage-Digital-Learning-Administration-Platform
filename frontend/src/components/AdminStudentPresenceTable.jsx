import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, BookOpen, Layers, MessageSquare, Calendar, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './AdminPresenceTable.css';

const AdminStudentPresenceTable = ({ presences, onRefresh, selectedSessionId, selectedClass }) => {
  const [expandedRows, setExpandedRows] = useState([]);
  // Track active tab session ID for each student row
  const [activeSessionTabs, setActiveSessionTabs] = useState({});

  const toggleRow = (id, sessions) => {
    const isExpanding = !expandedRows.includes(id);
    
    setExpandedRows(prev => 
      isExpanding ? [...prev, id] : prev.filter(rowId => rowId !== id)
    );

    // If expanding and not in filtered mode, set default active tab to first session
    if (isExpanding && selectedSessionId === 'all' && selectedClass === 'all' && sessions.length > 0) {
      if (!activeSessionTabs[id]) {
        setActiveSessionTabs(prev => ({ ...prev, [id]: sessions[0].sessionId }));
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': 
        return <span className="apt-badge apt-badge-present"><CheckCircle size={12} /> Présent</span>;
      case 'absent': 
        return <span className="apt-badge apt-badge-absent"><XCircle size={12} /> Absent</span>;
      case 'retard': 
        return <span className="apt-badge apt-badge-retard" style={{background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)'}}><Clock size={12} /> En retard</span>;
      default: 
        return <span className="apt-badge apt-badge-pending">Inconnu</span>;
    }
  };

  return (
    <div className="apt-wrapper">
      <div className="apt-table-container">
        <table className="apt-table">
          <thead>
            <tr>
              <th style={{paddingLeft: '30px', width: '35%'}}>Étudiant</th>
              <th style={{width: '20%'}}>Statut Global</th>
              <th style={{width: '30%'}}>Répartition (P / A / R)</th>
              <th className="apt-text-right" style={{paddingRight: '30px'}}>Détails</th>
            </tr>
          </thead>
          <tbody>
            {presences.map((studentRow) => {
              const isExpanded = expandedRows.includes(studentRow.id);
              
              // Filter sessions based on both global filters
              let sessionsToShow = studentRow.sessions;
              
              if (selectedSessionId !== 'all') {
                sessionsToShow = sessionsToShow.filter(s => s.sessionId === selectedSessionId);
              }
              
              if (selectedClass !== 'all') {
                sessionsToShow = sessionsToShow.filter(s => s.className === selectedClass);
              }

              // Determine which session to render in expanded view
              // If we are in "All Sessions" and "All Classes" mode, we use the tab system
              const useTabs = selectedSessionId === 'all' && selectedClass === 'all' && sessionsToShow.length > 1;
              
              const finalSessionToRender = useTabs
                ? sessionsToShow.filter(s => s.sessionId === (activeSessionTabs[studentRow.id] || sessionsToShow[0]?.sessionId))
                : sessionsToShow;

              return (
                <React.Fragment key={studentRow.id}>
                  {/* Main Student Row */}
                  <tr 
                    className={`apt-main-row ${isExpanded ? 'active' : ''}`} 
                    onClick={() => toggleRow(studentRow.id, studentRow.sessions)}
                  >
                    <td style={{paddingLeft: '30px'}}>
                      <div className="apt-teacher-info">
                        <div className="apt-avatar" style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                            color: '#fff', 
                            fontWeight: '800'
                        }}>
                          {studentRow.student.avatar}
                        </div>
                        <div>
                          <div className="apt-teacher-name">{studentRow.student.name}</div>
                          <div className="apt-teacher-email" style={{opacity: 0.5}}>{studentRow.student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="apt-mini-stat" style={{display: 'inline-flex'}}>
                        <Layers size={14} style={{color: '#d4af37'}} />
                        <span style={{fontWeight: '600', marginLeft: '6px'}}>{studentRow.sessions.length} Session(s)</span>
                      </div>
                    </td>
                    <td>
                      <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                        <div className="apt-stat-mini">
                          <span style={{color: '#10b981', fontWeight: 'bold'}}>{studentRow.globalStats.presents}</span>
                          <span style={{fontSize: '10px', opacity: 0.4, marginLeft: '3px', letterSpacing:'1px'}}>PRES</span>
                        </div>
                        <div className="apt-stat-mini">
                          <span style={{color: '#ef4444', fontWeight: 'bold'}}>{studentRow.globalStats.absents}</span>
                          <span style={{fontSize: '10px', opacity: 0.4, marginLeft: '3px', letterSpacing:'1px'}}>ABS</span>
                        </div>
                        <div className="apt-stat-mini">
                          <span style={{color: '#f59e0b', fontWeight: 'bold'}}>{studentRow.globalStats.retards}</span>
                          <span style={{fontSize: '10px', opacity: 0.4, marginLeft: '3px', letterSpacing:'1px'}}>RET</span>
                        </div>
                      </div>
                    </td>
                    <td className="apt-action-cell" style={{paddingRight: '30px'}}>
                      <button className={`apt-toggle-btn ${isExpanded ? 'active' : ''}`}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Drill-down View */}
                  {isExpanded && (
                    <tr className="apt-expanded-row expanded">
                      <td colSpan="4" className="apt-expanded-cell" style={{padding: '0 30px 25px 30px'}}>
                        <div className="apt-expanded-content" style={{padding: '24px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0 0 16px 16px', borderTop:'none'}}>
                          
                          {/* Tab Navigation (Only if global filters are "All") */}
                          {useTabs && (
                            <div className="apt-tabs-navbar" style={{display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', flexWrap: 'wrap'}}>
                               {sessionsToShow.map((s) => (
                                 <button 
                                   key={s.sessionId}
                                   onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveSessionTabs(prev => ({ ...prev, [studentRow.id]: s.sessionId }));
                                   }}
                                   style={{
                                     padding: '8px 16px',
                                     borderRadius: '8px',
                                     fontSize: '12px',
                                     fontWeight: '600',
                                     cursor: 'pointer',
                                     transition: 'all 0.3s',
                                     background: activeSessionTabs[studentRow.id] === s.sessionId ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                                     color: activeSessionTabs[studentRow.id] === s.sessionId ? '#d4af37' : 'rgba(255,255,255,0.4)',
                                     border: activeSessionTabs[studentRow.id] === s.sessionId ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid transparent',
                                     display: 'flex',
                                     alignItems: 'center',
                                     gap: '8px',
                                     marginBottom: '5px'
                                   }}
                                 >
                                   <Monitor size={14} />
                                   {s.sessionName}
                                 </button>
                               ))}
                            </div>
                          )}

                          {finalSessionToRender.map((session, sIdx) => (
                            <div key={sIdx} className="apt-drilldown-section" style={{animation: 'fadeIn 0.4s ease'}}>
                              {/* Session/Class Header */}
                              <div style={{
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                marginBottom: '15px',
                                padding: '12px 18px',
                                background: 'rgba(212, 175, 55, 0.04)',
                                borderRadius: '10px',
                                border: '1px solid rgba(212, 175, 55, 0.1)'
                              }}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                  <div style={{width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <BookOpen size={16} style={{color: '#d4af37'}} />
                                  </div>
                                  <div>
                                    <span style={{fontWeight: '700', fontSize: '14px', color: '#fff', display:'block'}}>{session.sessionName}</span>
                                    <span style={{fontSize: '11px', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing:'1px'}}>{session.className}</span>
                                  </div>
                                </div>
                                <div style={{textAlign: 'right'}}>
                                  <span style={{fontSize: '10px', color: 'rgba(255,255,255,0.4)', display:'block', textTransform:'uppercase', fontWeight:'bold'}}>Assiduité Session</span>
                                  <span style={{color: '#fff', fontWeight: '900', fontSize:'16px'}}>{session.stats.total > 0 ? Math.round((session.stats.presents / session.stats.total) * 100) : 0}%</span>
                                </div>
                              </div>

                              {/* Detailed History Table */}
                              {session.history && session.history.length > 0 ? (
                                <div style={{border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.1)'}}>
                                  <table className="apt-sub-table" style={{width: '100%'}}>
                                    <thead>
                                      <tr style={{background: 'rgba(255,255,255,0.02)'}}>
                                        <th style={{padding: '14px 20px', color: 'rgba(255,255,255,0.3)', width: '25%', fontSize:'10px', textTransform:'uppercase'}}>Date de la séance</th>
                                        <th style={{padding: '14px 20px', color: 'rgba(255,255,255,0.3)', width: '20%', fontSize:'10px', textTransform:'uppercase'}}>Statut</th>
                                        <th style={{padding: '14px 20px', color: 'rgba(255,255,255,0.3)', fontSize:'10px', textTransform:'uppercase'}}>Remarque de l'enseignant</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                      {session.history.sort((a,b) => new Date(b.date) - new Date(a.date)).map((record, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-white/[0.01]" style={{transition: 'background 0.2s'}}>
                                          <td style={{padding: '16px 20px'}}>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                              <Calendar size={14} style={{opacity: 0.3}} />
                                              <span style={{fontWeight: '500', fontSize:'13.5px'}}>
                                                {format(new Date(record.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                                              </span>
                                            </div>
                                          </td>
                                          <td style={{padding: '16px 20px'}}>
                                            {getStatusBadge(record.statut)}
                                          </td>
                                          <td style={{padding: '16px 20px'}}>
                                            {record.remarque ? (
                                              <div style={{display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(16, 185, 129, 0.03)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.05)'}}>
                                                <MessageSquare size={14} style={{marginTop: '2px', color: '#10b981', flexShrink: 0}} />
                                                <span style={{fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: '1.4'}}>
                                                  "{record.remarque}"
                                                </span>
                                              </div>
                                            ) : (
                                              <span style={{opacity: 0.2, fontSize: '12px', fontStyle: 'italic'}}>— Aucune observation particulière —</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div style={{padding: '30px', textAlign: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)'}}>
                                  <BookOpen size={24} style={{opacity: 0.1, marginBottom: '10px'}} />
                                  <p style={{opacity: 0.3, fontSize: '13px'}}>Aucun historique de présence pour cette session.</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminStudentPresenceTable;
