import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Edit2, 
  BookOpen, 
  Users, 
  Monitor, 
  MessageSquare,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import './AdminPresenceTable.css';

const AdminPresenceTable = ({ presences, onRefresh, selectedSessionId, selectedClass }) => {
  const [expandedRows, setExpandedRows] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Track active tab (Class+Subject) for each teacher row
  const [activeTabs, setActiveTabs] = useState({});

  // States for editing
  const [editingSeance, setEditingSeance] = useState(null);
  const [editForm, setEditForm] = useState({ statut: 'Present', cahierTexte: '', remarqueAdmin: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('enseignant'); // 'enseignant' or 'etudiants'
  const [studentPresences, setStudentPresences] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  const { user } = useSelector((state) => state.auth);

  const toggleRow = (id, groups) => {
    const isExpanding = !expandedRows.includes(id);
    setExpandedRows(prev =>
      isExpanding ? [...prev, id] : prev.filter(rowId => rowId !== id)
    );

    // Default to first group if expanding and no active tab
    if (isExpanding && !activeTabs[id] && groups.length > 0) {
      setActiveTabs(prev => ({ ...prev, [id]: groups[0].id }));
    }
  };

  const openEditModal = (seance, e) => {
    e.stopPropagation();
    setEditingSeance({ ...seance });
    setActiveModalTab('enseignant');
    setStudentPresences([]);
    setEditForm({
      statut: seance.status === 'absent' ? 'Absent' : 
              (seance.status === 'retard' ? 'Retard' : 'Present'),
      cahierTexte: seance.textLog || '',
      remarqueAdmin: seance.remarqueAdmin || ''
    });
  };

  const fetchStudentPresences = async (seanceId, date) => {
    try {
      setLoadingStudents(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const response = await axios.get(`http://localhost:5000/api/presences?seanceId=${seanceId}&date=${date}`, config);
      setStudentPresences(response.data.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentStatusChange = async (studentId, newStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        seanceId: editingSeance.seanceId,
        date: editingSeance.rawDate,
        presences: [{ inscriptionId: studentId, statut: newStatus }]
      };
      await axios.post('http://localhost:5000/api/presences', payload, config);
      setStudentPresences(prev => prev.map(p => 
        p.inscription._id === studentId ? { ...p, statut: newStatus } : p
      ));
      toast.success('Présence de l\'étudiant mise à jour !');
    } catch (error) {
      console.error('Error updating student status:', error);
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  React.useEffect(() => {
    if (editingSeance && activeModalTab === 'etudiants' && studentPresences.length === 0) {
      fetchStudentPresences(editingSeance.seanceId, editingSeance.rawDate);
    }
  }, [activeModalTab, editingSeance]);

  const handleSavePresence = async () => {
    if(!editingSeance) return;
    try {
      setIsSaving(true);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };
      const payload = {
        seanceId: editingSeance.seanceId,
        date: editingSeance.rawDate,
        statut: editForm.statut,
        remarqueAdmin: editForm.remarqueAdmin
      };
      await axios.post('http://localhost:5000/api/teacher-presences', payload, config);
      if (onRefresh) await onRefresh();
      toast.success('Séance validée avec succès !');
      setEditingSeance(null);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la validation.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return <span className="apt-badge apt-badge-present"><CheckCircle size={12} /> Présent</span>;
      case 'absent': return <span className="apt-badge apt-badge-absent"><XCircle size={12} /> Absent</span>;
      case 'retard': return <span className="apt-badge apt-badge-retard" style={{background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)'}}><Clock size={12} /> En retard</span>;
      default: return <span className="apt-badge apt-badge-pending">En attente</span>;
    }
  };

  if(!presences || !presences.length) return null;

  return (
    <div className="apt-wrapper">
      <div className="apt-table-container">
        <table className="apt-table">
          <thead>
            <tr>
              <th style={{paddingLeft: '30px', width: '35%'}}>Enseignant</th>
              <th style={{width: '20%'}}>Statut Global (Mois)</th>
              <th style={{width: '30%'}}>Assiduité</th>
              <th className="apt-text-right" style={{paddingRight: '30px'}}>Détails</th>
            </tr>
          </thead>
          <tbody>
            {presences.map((row) => {
              const isExpanded = expandedRows.includes(row.id);
              
              // Filter groups based on global filters
              let groupsToShow = row.groups;
              if (selectedSessionId !== 'all') {
                groupsToShow = groupsToShow.filter(g => g.sessionId === selectedSessionId);
              }
              if (selectedClass !== 'all') {
                groupsToShow = groupsToShow.filter(g => g.classe === selectedClass);
              }

              // Determine which groups to render in detail
              const useTabs = selectedSessionId === 'all' && selectedClass === 'all' && groupsToShow.length > 1;
              const finalGroupsToRender = useTabs
                ? groupsToShow.filter(g => g.id === (activeTabs[row.id] || groupsToShow[0]?.id))
                : groupsToShow;

              return (
                <React.Fragment key={row.id}>
                  {/* Main Teacher Row */}
                  <tr className={`apt-main-row ${isExpanded ? 'active' : ''}`} onClick={() => toggleRow(row.id, row.groups)}>
                    <td style={{paddingLeft: '30px'}}>
                      <div className="apt-teacher-info">
                        <div className="apt-avatar" style={{background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)', color: '#000', fontWeight: '800'}}>
                          {row.teacher?.avatar || '?'}
                        </div>
                        <div>
                          <div className="apt-teacher-name">{row.teacher?.name}</div>
                          <div className="apt-teacher-email" style={{opacity: 0.5}}>{row.teacher?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="apt-mini-stat" style={{display: 'inline-flex'}}>
                        <BookOpen size={14} style={{color: '#d4af37'}} />
                        <span style={{fontWeight: '600', marginLeft: '6px'}}>{row.groups.length} Cours / Matières</span>
                      </div>
                    </td>
                    <td>
                      <div className="apt-progress-container" style={{maxWidth: '200px'}}>
                        <div className="apt-progress-text">
                          <span style={{color: '#d4af37', fontWeight: 'bold'}}>{row.globalStats.completed}</span>
                          <span style={{opacity: 0.4}}> / {row.globalStats.total} séances</span>
                        </div>
                        <div className="apt-progress-bar" style={{height: '6px', background: 'rgba(255,255,255,0.05)'}}>
                          <div 
                            className="apt-progress-fill" 
                            style={{ 
                              width: `${(row.globalStats.completed / row.globalStats.total) * 100}%`,
                              background: 'linear-gradient(90deg, #d4af37, #fef08a)'
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="apt-action-cell" style={{paddingRight: '30px'}}>
                      <button className={`apt-toggle-btn ${isExpanded ? 'active' : ''}`}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded View */}
                  {isExpanded && (
                    <tr className="apt-expanded-row expanded">
                      <td colSpan="4" className="apt-expanded-cell" style={{padding: '0 30px 25px 30px'}}>
                        <div className="apt-expanded-content" style={{padding: '24px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0 0 16px 16px', borderTop:'none'}}>
                          
                          {/* Tabs for Class/Subject */}
                          {useTabs && (
                            <div className="apt-tabs-navbar" style={{display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', flexWrap: 'wrap'}}>
                              {groupsToShow.map((g) => (
                                <button 
                                  key={g.id}
                                  onClick={(e) => { e.stopPropagation(); setActiveTabs(prev => ({ ...prev, [row.id]: g.id })); }}
                                  style={{
                                    padding: '8px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s',
                                    background: activeTabs[row.id] === g.id ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                                    color: activeTabs[row.id] === g.id ? '#d4af37' : 'rgba(255,255,255,0.4)',
                                    border: activeTabs[row.id] === g.id ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid transparent',
                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                  }}
                                >
                                  {g.classe} · {g.subject}
                                </button>
                              ))}
                            </div>
                          )}

                          {finalGroupsToRender.map((group, gIdx) => (
                            <div key={gIdx} className="apt-drilldown-section" style={{animation: 'fadeIn 0.4s ease'}}>
                              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', padding: '12px 18px', background: 'rgba(212, 175, 55, 0.04)', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.1)'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                                  <div style={{width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <Monitor size={16} style={{color: '#d4af37'}} />
                                  </div>
                                  <div>
                                    <span style={{fontWeight: '700', fontSize: '14px', color: '#fff', display:'block'}}>{group.classe}</span>
                                    <span style={{fontSize: '11px', color: '#10b981', fontWeight: '700', textTransform: 'uppercase'}}>{group.subject}</span>
                                  </div>
                                </div>
                                <div style={{textAlign: 'right'}}>
                                  <span style={{fontSize: '10px', color: 'rgba(255,255,255,0.4)', display:'block', textTransform:'uppercase'}}>Complétion Cours</span>
                                  <span style={{color: '#fff', fontWeight: '900', fontSize:'16px'}}>{group.stats.total > 0 ? Math.round((group.stats.completed / group.stats.total) * 100) : 0}%</span>
                                </div>
                              </div>

                              <div style={{border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.1)'}}>
                                <table className="apt-sub-table" style={{width: '100%'}}>
                                  <thead>
                                    <tr style={{background: 'rgba(255,255,255,0.02)'}}>
                                      <th style={{padding: '14px 20px', color: 'rgba(255,255,255,0.3)', width: '22%', fontSize:'10px', textTransform:'uppercase'}}>Séance</th>
                                      <th style={{padding: '14px 20px', color: 'rgba(255,255,255,0.3)', width: '15%', fontSize:'10px', textTransform:'uppercase'}}>Statut</th>
                                      <th style={{padding: '14px 20px', color: 'rgba(255,255,255,0.3)', width: '12%', fontSize:'10px', textTransform:'uppercase'}}>Élèves</th>
                                      <th style={{padding: '14px 20px', color: 'rgba(255,255,255,0.3)', fontSize:'10px', textTransform:'uppercase'}}>Cahier de Texte / Remarques</th>
                                      <th style={{padding: '14px 20px', color: 'rgba(255,255,255,0.3)', width: '10%', fontSize:'10px', textTransform:'uppercase'}}>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    {group.seances.map((seance) => (
                                      <tr key={seance.id} className="hover:bg-white/[0.01]">
                                        <td style={{padding: '16px 20px'}}>
                                          <div style={{display: 'flex', flexDirection: 'column'}}>
                                            <span style={{fontWeight: '600', fontSize:'13px'}}>{seance.date}</span>
                                            <span style={{fontSize: '11px', opacity: 0.4}}>{seance.time}</span>
                                          </div>
                                        </td>
                                        <td style={{padding: '16px 20px'}}>{getStatusBadge(seance.status)}</td>
                                        <td style={{padding: '16px 20px'}}>
                                          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                            <Users size={12} style={{opacity: 0.4}} />
                                            <span style={{fontSize: '12px', fontWeight: 'bold'}}>{seance.studentStats.present}</span>
                                            <span style={{fontSize: '10px', opacity: 0.3}}>/ {seance.studentStats.total}</span>
                                          </div>
                                        </td>
                                        <td style={{padding: '16px 20px'}}>
                                          <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                            {seance.textLog ? (
                                              <button className="apt-btn-view-log" onClick={(e) => { e.stopPropagation(); setSelectedLog(seance.textLog); }} style={{width: 'fit-content'}}>
                                                <Eye size={12} /> Voir cahier de texte
                                              </button>
                                            ) : (
                                              <span style={{opacity: 0.2, fontSize: '11px', fontStyle: 'italic'}}>— Cahier non rempli —</span>
                                            )}
                                            {seance.remarqueAdmin && (
                                              <div style={{display: 'flex', gap: '6px', marginTop: '2px'}}>
                                                <MessageSquare size={10} style={{marginTop: '3px', color: '#d4af37'}} />
                                                <span style={{fontSize: '11px', color: '#d4af37', opacity: 0.8}}>{seance.remarqueAdmin}</span>
                                              </div>
                                            ) }
                                          </div>
                                        </td>
                                        <td style={{padding: '16px 20px'}}>
                                          <button className="apt-btn-edit" onClick={(e) => openEditModal(seance, e)}>
                                            <Edit2 size={12} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
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

      {/* Existing Modals (Cahier & Edit) with minor visual tweaks for parity */}
      {selectedLog && (
        <div className="apt-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="apt-modal" onClick={e => e.stopPropagation()}>
            <div className="apt-modal-header">
              <h3>Détails du Cahier de Texte</h3>
              <button className="apt-modal-close" onClick={() => setSelectedLog(null)}>&times;</button>
            </div>
            <div className="apt-modal-body" style={{whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14px', color: 'rgba(255,255,255,0.8)'}}>
              {selectedLog}
            </div>
          </div>
        </div>
      )}

      {editingSeance && (
        <div className="apt-modal-overlay" onClick={() => !isSaving && setEditingSeance(null)}>
          <div className="apt-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '600px'}}>
            <div className="apt-modal-header">
              <h3>Gestion Administrative de la Séance</h3>
              <button className="apt-modal-close" onClick={() => !isSaving && setEditingSeance(null)}>&times;</button>
              
              <div className="apt-modal-tabs">
                <button 
                  className={`apt-modal-tab-btn ${activeModalTab === 'enseignant' ? 'active' : ''}`}
                  onClick={() => setActiveModalTab('enseignant')}
                >
                  Présence Enseignant
                </button>
                <button 
                  className={`apt-modal-tab-btn ${activeModalTab === 'etudiants' ? 'active' : ''}`}
                  onClick={() => setActiveModalTab('etudiants')}
                >
                  Présence Étudiants
                </button>
              </div>
            </div>

            <div className="apt-modal-body">
              {activeModalTab === 'enseignant' ? (
                <div className="apt-edit-form">
                   <div className="apt-info-card">
                    <label>Informations Séance</label>
                    <div style={{fontWeight: '800', fontSize: '16px', color: '#fff'}}>{editingSeance.date} à {editingSeance.time}</div>
                   </div>

                  <div style={{marginBottom: '20px'}}>
                    <label>Statut de validité</label>
                    <select 
                      className="apt-modal-select"
                      value={editForm.statut} 
                      onChange={(e) => setEditForm({...editForm, statut: e.target.value})}
                    >
                      <option value="Present" style={{color: '#000'}}>Présent (Validé)</option>
                      <option value="Absent" style={{color: '#000'}}>Absent (Non justifié)</option>
                      <option value="Retard" style={{color: '#000'}}>En retard</option>
                      <option value="Absent certifie" style={{color: '#000'}}>Absent (Certifié / Justifié)</option>
                    </select>
                  </div>

                  <div style={{marginBottom: '25px'}}>
                    <label>Remarque Administrative (Interne)</label>
                    <textarea 
                      className="apt-modal-textarea"
                      placeholder="Note administrative sur cette séance..."
                      value={editForm.remarqueAdmin}
                      onChange={(e) => setEditForm({...editForm, remarqueAdmin: e.target.value})}
                      rows="4"
                    />
                  </div>

                  <div className="apt-modal-actions" style={{display:'flex', gap:'12px'}}>
                    <button className="apt-btn-edit" style={{flex:1, height: '48px', background: '#d4af37', color: '#000', border: 'none', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.2)'}} onClick={handleSavePresence} disabled={isSaving}>
                      {isSaving ? 'Enregistrement...' : 'Valider les modifications'}
                    </button>
                    <button className="apt-btn-edit" style={{flex:0.5, height: '48px', opacity: 0.7}} onClick={() => setEditingSeance(null)} disabled={isSaving}>
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="apt-students-presence">
                   {/* Edit Student-by-Student Presence */}
                   {loadingStudents ? (
                    <div style={{textAlign: 'center', padding: '40px', color: '#d4af37'}}>Synchronisation en cours...</div>
                  ) : studentPresences.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '40px', opacity: 0.4}}>Aucun étudiant trouvé.</div>
                  ) : (
                    <div className="apt-student-list">
                      {studentPresences.map((p) => (
                         <div key={p._id} className="apt-student-item">
                          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                            <div className="apt-student-avatar">
                               {p.inscription?.etudiant?.firstName?.[0]}{p.inscription?.etudiant?.lastName?.[0]}
                            </div>
                            <div>
                               <div style={{fontSize: '14px', fontWeight: '800', color: '#fff'}}>{p.inscription?.etudiant?.firstName} {p.inscription?.etudiant?.lastName}</div>
                               <div style={{fontSize: '12px', opacity: 0.4}}>{p.inscription?.etudiant?.email}</div>
                            </div>
                          </div>
                          <div style={{display: 'flex', gap: '8px'}}>
                            {['Present', 'Absent', 'Retard'].map(status => (
                              <button 
                                key={status}
                                onClick={() => handleStudentStatusChange(p.inscription._id, status)}
                                className={`apt-status-dot-btn ${p.statut === status ? `active ${status}` : ''}`}
                                title={status}
                              >
                                {status[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPresenceTable;
