import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Platform, ImageBackground, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, SERVER_URL } from '../../constants/api';

const darkTheme = {
  bg: '#020202ff',
  cardBg: '#171717b3',
  textColor: '#f1f1f1ff',
  mutedColor: '#9ca3af', 
  accent: '#117949', 
  border: 'rgba(255, 255, 255, 0.08)',
};

const lightTheme = {
  bg: '#f8f9fa', 
  cardBg: '#FFFFFF',
  textColor: '#1a1a1a',
  mutedColor: '#71717a',
  accent: '#0d6645ff', 
  border: 'rgba(0,0,0,0.06)',
};

const TRANSLATIONS = {
  fr: {
    headerTitle: 'Espace Étudiant',
    mainTitle: 'Mes Inscriptions',
    subtitle: 'Consultez vos inscriptions et ressources pédagogiques.',
    allSessions: 'Toutes',
    inProgress: 'Actives',
    completed: 'Terminées',
    totalSessions: 'SESSIONS',
    resources: 'RESSOURCES',
    noSessions: 'Aucune inscription disponible',
    download: 'Ouvrir',
    status: {
        en_attente: 'En attente',
        approuvee: 'Approuvée',
        refusee: 'Refusée'
    },
    lockedResources: 'Ressources verrouillées (en attente d\'approbation)'
  },
  ar: {
    headerTitle: 'فضاء الطالب',
    mainTitle: 'تسجيلاتي',
    subtitle: 'تصفح تسجيلاتك ومواردك التعليمية.',
    allSessions: 'الكل',
    inProgress: 'النشطة',
    completed: 'المنتهية',
    totalSessions: 'الدورات',
    resources: 'الموارد',
    noSessions: 'لا توجد تسجيلات حالياً',
    download: 'فتح',
    status: {
        en_attente: 'قيد الانتظار',
        approuvee: 'مقبول',
        refusee: 'مرفوض'
    },
    lockedResources: 'الموارد مقفلة (في انتظار الموافقة)'
  },
};

export default function StudentSessions() {
  const { isDark, lang, token } = useAuth();
  const t = (TRANSLATIONS as any)[lang] || TRANSLATIONS.fr;
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = lang === 'ar';

  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [coursList, setCoursList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'progress' | 'completed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchInscriptions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.GET_MY_INSCRIPTIONS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setInscriptions(data.inscriptions || []);
      }

      // Fetch Global Published Courses
      const coursRes = await fetch(API_ENDPOINTS.GET_MY_COURS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const coursData = await coursRes.json();
      if (coursData.success) {
        setCoursList(coursData.data || []);
      }
    } catch (error) {
      console.error('Error fetching student sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInscriptions();
  }, [fetchInscriptions]);

  const filteredInscriptions = inscriptions.filter(ins => {
    const s = ins.session;
    if (!s) return false;
    if (activeTab === 'progress') return s.statut === 'En cours';
    if (activeTab === 'completed') return s.statut === 'Terminée';
    return true;
  });

  const totalResources = inscriptions.reduce((sum, ins) => sum + (ins.session?.coursPublies?.length || 0), 0);

  const handleOpenResource = (url: string) => {
    let finalUrl = url;
    if (url.startsWith('/uploads')) {
      finalUrl = `${SERVER_URL}${url}`;
    }
    Linking.openURL(finalUrl).catch(err => console.error("Couldn't load page", err));
  };

  const getInsStatusColor = (statut: string) => {
    if (statut === 'approuvee') return '#10b981';
    if (statut === 'refusee') return '#ef4444';
    return '#f59e0b'; // en_attente
  };

  const renderCard = ({ item }: { item: any }) => {
    const session = item.session;
    if (!session) return null;
    
    const isCompleted = session.statut === 'Terminée';
    const insStatus = item.statut || 'en_attente';
    const isExpanded = expandedId === item._id;
    
    // Combine standalone Cours and legacy coursPublies
    const mappedCours = coursList
      .filter(c => c.session?._id === session._id)
      .map(c => {
         let fileType = 'autre';
         const filename = c.fichier || (c.materiel && c.materiel.length > 0 ? c.materiel[0].url : '');
         const nameLower = filename.toLowerCase();
         if (nameLower.endsWith('.pdf')) fileType = 'pdf';
         else if (nameLower.match(/\.(mp4|mkv|avi)$/)) fileType = 'video';
         else if (nameLower.match(/\.(mp3|wav|ogg)$/)) fileType = 'audio';
         else if (nameLower.startsWith('http')) fileType = 'lien';
         
         return {
            _id: c._id,
            titreCours: c.titre,
            typeFichier: fileType,
            urlFichier: filename,
            matiere: c.matiere,
            chapitreRef: c.chapitreRef
         };
      });
    const resources = [...(session.coursPublies || []), ...mappedCours];

    const insStatusColor = getInsStatusColor(insStatus);
    const isApproved = insStatus === 'approuvee';

    return (
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border, shadowColor: theme.textColor, opacity: isApproved ? 1 : 0.9 }]}>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => setExpandedId(isExpanded ? null : item._id)}
          style={{ padding: 20 }}
        >
          {/* Header Row: Session Status & Inscription Status */}
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <View style={[styles.statusTag, { backgroundColor: `${insStatusColor}15`, borderWidth: 1, borderColor: `${insStatusColor}30` }]}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: insStatusColor, marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }} />
                    <Text style={[styles.statusText, { color: insStatusColor }]}>
                        {t.status[insStatus as keyof typeof t.status] || insStatus}
                    </Text>
                </View>
                {isCompleted && (
                    <View style={[styles.statusTag, { backgroundColor: 'rgba(75, 169, 81, 0.1)', borderWidth: 1, borderColor: 'rgba(75, 169, 81, 0.3)' }]}>
                        <Ionicons name="checkmark-done" size={12} color="#4ba951" style={{ marginRight: isRTL ? 0 : 4, marginLeft: isRTL ? 4 : 0 }} />
                        <Text style={[styles.statusText, { color: '#4ba951' }]}>Terminée</Text>
                    </View>
                )}
            </View>
            <View style={[styles.expandBtn, { backgroundColor: isExpanded ? theme.accent : 'transparent' }]}>
              <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={isExpanded ? '#fff' : theme.mutedColor} />
            </View>
          </View>

          <Text style={[styles.sessionName, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>
            {session.nomSession}
          </Text>
          
          <View style={[styles.classRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.classIconWrap, { backgroundColor: `${theme.accent}15` }]}>
               <Ionicons name="school" size={12} color={theme.accent} />
            </View>
            <Text style={[styles.className, { color: theme.mutedColor }]}>
              {(item.classe || session.classe)?.nomClasse || 'Classe'}
            </Text>
          </View>

          <View style={[styles.statsRow, isRTL && { flexDirection: 'row-reverse' }]}>
             <View style={[styles.statPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f4f4f5' }]}>
                <Ionicons name="document-text" size={14} color={theme.accent} />
                <Text style={[styles.statPillTxt, { color: theme.textColor }]}>{resources.length} {t.resources.toLowerCase()}</Text>
             </View>
             <View style={[styles.statPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f4f4f5' }]}>
                <Ionicons name="time" size={14} color={theme.accent} />
                <Text style={[styles.statPillTxt, { color: theme.textColor }]}>{session.duree || 'N/A'}</Text>
             </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.expandedArea, { borderTopColor: theme.border, backgroundColor: isDark ? '#080808' : '#fcfcfc' }]}>
            {!isApproved ? (
               <View style={styles.lockedBox}>
                   <View style={styles.lockedIconWrapper}>
                      <Ionicons name="lock-closed" size={28} color="#f59e0b" />
                   </View>
                   <Text style={{ color: theme.mutedColor, textAlign: 'center', fontSize: 13, fontWeight: '500', lineHeight: 20 }}>{t.lockedResources}</Text>
               </View>
            ) : resources.length === 0 && (!item.classe?.matieres || item.classe.matieres.length === 0) ? (
              <View style={styles.emptyResBox}>
                 <Ionicons name="folder-open-outline" size={32} color={theme.mutedColor} style={{ opacity: 0.5, marginBottom: 8 }} />
                 <Text style={{ color: theme.mutedColor, textAlign: 'center', fontSize: 13 }}>Aucune ressource pour le moment</Text>
              </View>
            ) : (
              (() => {
                 const classe = item.classe || session.classe;
                 const skeletonMatieres = classe?.matieres || [];
                 const matchedResources = new Set();
                 
                 const renderResourceItem = (res: any, rIdx: number) => {
                    const isPdf = res.typeFichier?.toLowerCase() === 'pdf';
                    const isVideo = res.typeFichier?.toLowerCase() === 'video';
                    const isAudio = res.typeFichier?.toLowerCase() === 'audio';
                    const iconName = isPdf ? 'document-text' : isVideo ? 'play-circle' : isAudio ? 'headset' : 'link';
                    const iconColor = isPdf ? '#ef4444' : isVideo ? '#3b82f6' : isAudio ? '#f59e0b' : '#10b981';

                    return (
                      <View key={res._id || rIdx} style={[styles.resourceRow, isRTL && { flexDirection: 'row-reverse' }, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', borderColor: theme.border }]}>
                        <View style={[styles.resIcon, { backgroundColor: `${iconColor}15` }]}>
                           <Ionicons name={iconName as any} size={20} color={iconColor} />
                        </View>
                        <View style={{ flex: 1, paddingHorizontal: 12 }}>
                           <Text style={[styles.resTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{res.titreCours}</Text>
                           <Text style={[styles.resType, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>{res.typeFichier.toUpperCase()}</Text>
                        </View>
                        <TouchableOpacity 
                          style={[styles.dlBtn, { backgroundColor: `${theme.accent}15` }]}
                          onPress={() => handleOpenResource(res.urlFichier)}
                        >
                           <Ionicons name="cloud-download-outline" size={16} color={theme.accent} />
                        </TouchableOpacity>
                      </View>
                    );
                 };

                 const renderedSkeleton = skeletonMatieres.map((matiere: any, mIdx: number) => {
                    const matiereId = matiere._id;
                    const matiereName = matiere.nomMatiere;
                    const programme = matiere.programme || [];
                    
                    return (
                      <View key={`mat-${matiereId || mIdx}`} style={{ marginBottom: 24 }}>
                        <View style={[styles.matiereHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                            <View style={styles.matiereIndicator} />
                            <Text style={[styles.matiereTitle, { color: theme.textColor }]}>{matiereName}</Text>
                        </View>
                        
                        {programme.length > 0 && (
                          <View style={styles.timelineContainer}>
                            {programme.map((chap: any, cIdx: number) => {
                               const chapRes = resources.filter((r: any) => {
                                   if (r.chapitreRef === chap._id) {
                                       matchedResources.add(r._id);
                                       return true;
                                   }
                                   return false;
                               });
                               const isLast = cIdx === programme.length - 1;
                               
                               return (
                                 <View key={`chap-${chap._id || cIdx}`} style={styles.timelineNode}>
                                    {/* Timeline Line */}
                                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />}
                                    
                                    {/* Timeline Dot */}
                                    <View style={[styles.timelineDot, { borderColor: theme.accent, backgroundColor: theme.cardBg }]} />
                                    
                                    {/* Chapter Content */}
                                    <View style={styles.timelineContent}>
                                        <Text style={[styles.chapTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>
                                           Chapitre {cIdx + 1}: {chap.titre}
                                        </Text>
                                        {chap.description ? <Text style={[styles.chapDesc, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>{chap.description}</Text> : null}
                                        
                                        <View style={{ marginTop: 10 }}>
                                            {chapRes.length === 0 ? (
                                               <View style={[styles.emptyChapBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb', borderColor: theme.border }]}>
                                                  <Ionicons name="time-outline" size={14} color={theme.mutedColor} style={{ marginRight: 6 }} />
                                                  <Text style={{ color: theme.mutedColor, fontSize: 11, fontStyle: 'italic' }}>En attente de publication</Text>
                                               </View>
                                            ) : (
                                               chapRes.map((res: any, rIdx: number) => renderResourceItem(res, rIdx))
                                            )}
                                        </View>
                                    </View>
                                 </View>
                               );
                            })}
                          </View>
                        )}
                        
                        {(() => {
                           const unmatchedForMatiere = resources.filter((r: any) => {
                              if (matchedResources.has(r._id)) return false;
                              const rMatId = typeof r.matiere === 'object' ? r.matiere?._id : r.matiere;
                              if (rMatId === matiereId || (r.matiere?.nomMatiere === matiereName)) {
                                  matchedResources.add(r._id);
                                  return true;
                              }
                              return false;
                           });
                           
                           if (unmatchedForMatiere.length === 0) return null;
                           
                           return (
                              <View style={styles.unmatchedBox}>
                                 <View style={[styles.unmatchedDivider, { backgroundColor: theme.border }]} />
                                 <Text style={[styles.unmatchedTitle, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>
                                    {t.headerTitle === 'Espace Étudiant' ? 'Autres supports' : 'Other resources'} ({matiereName})
                                 </Text>
                                 {unmatchedForMatiere.map((res: any, rIdx: number) => renderResourceItem(res, rIdx))}
                              </View>
                           );
                        })()}
                      </View>
                    );
                 });
                 
                 const globalUnmatched = resources.filter((r: any) => !matchedResources.has(r._id));
                 
                 return (
                    <View style={{ paddingTop: 8 }}>
                      {renderedSkeleton}
                      {globalUnmatched.length > 0 && (
                         <View style={styles.globalUnmatchedBox}>
                            <View style={[styles.matiereHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                                <View style={[styles.matiereIndicator, { backgroundColor: theme.mutedColor }]} />
                                <Text style={[styles.matiereTitle, { color: theme.textColor }]}>
                                   {t.headerTitle === 'Espace Étudiant' ? 'Ressources globales' : 'Global resources'}
                                </Text>
                            </View>
                            {globalUnmatched.map((res: any, rIdx: number) => renderResourceItem(res, rIdx))}
                         </View>
                      )}
                    </View>
                 );
              })()
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" />
      
      <ImageBackground
        source={require('../../assets/images/premium_islamic_bg.png')}
        style={styles.hero}
        resizeMode="cover"
      >
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }} />
        </View>

        <View style={styles.heroContent}>
          <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t.headerTitle.toUpperCase()}
          </Text>
          <Text style={[styles.mainTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t.mainTitle}
          </Text>

          <View style={[styles.globalStats, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.gStatItem}>
              <Text style={styles.gStatVal}>{inscriptions.length}</Text>
              <Text style={styles.gStatLbl}>{t.totalSessions}</Text>
            </View>
            <View style={[styles.gStatDivider, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
            <View style={styles.gStatItem}>
              <Text style={styles.gStatVal}>{totalResources}</Text>
              <Text style={styles.gStatLbl}>{t.resources}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.body}>
        <View style={[styles.tabsContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }, isRTL && { flexDirection: 'row-reverse' }]}>
          {(['all', 'progress', 'completed'] as const).map((tab) => (
            <TouchableOpacity 
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && { backgroundColor: theme.accent }]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : theme.mutedColor }]}>
                {tab === 'all' ? t.allSessions : tab === 'progress' ? t.inProgress : t.completed}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredInscriptions}
            keyExtractor={(item) => item._id}
            renderItem={renderCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={54} color={theme.border} />
                <Text style={[styles.emptyText, { color: theme.mutedColor }]}>{t.noSessions}</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 40,
    paddingHorizontal: 26,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    overflow: 'hidden',
  },
  heroContent: { zIndex: 1 },
  headerTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2, marginBottom: 8 },
  mainTitle: { fontSize: 30, fontWeight: '800', color: '#fff', marginBottom: 20, letterSpacing: -0.5 },
  globalStats: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  gStatItem: { alignItems: 'center', paddingHorizontal: 12 },
  gStatVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  gStatLbl: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: 2, letterSpacing: 0.5 },
  gStatDivider: { width: 1, height: 25 },
  body: { flex: 1, marginTop: -25 },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 15,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabText: { fontSize: 12, fontWeight: '700' },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  expandBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sessionName: { fontSize: 20, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  classRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  classIconWrap: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  className: { fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statPillTxt: { fontSize: 12, fontWeight: '700' },
  
  expandedArea: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
  },
  lockedBox: { padding: 30, alignItems: 'center' },
  lockedIconWrapper: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyResBox: { padding: 30, alignItems: 'center' },

  matiereHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  matiereIndicator: { width: 4, height: 16, borderRadius: 2, backgroundColor: '#10b981', marginHorizontal: 6 },
  matiereTitle: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  timelineContainer: { paddingLeft: 12, marginTop: 4 },
  timelineNode: { position: 'relative', paddingLeft: 20, paddingBottom: 24 },
  timelineDot: { position: 'absolute', left: -4, top: 2, width: 10, height: 10, borderRadius: 5, borderWidth: 2, zIndex: 2 },
  timelineLine: { position: 'absolute', left: 0, top: 12, bottom: 0, width: 2, zIndex: 1, opacity: 0.5 },
  timelineContent: { marginTop: -4 },
  
  chapTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  chapDesc: { fontSize: 12, lineHeight: 18 },
  emptyChapBox: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed' },
  
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  resIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  resTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  resType: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  dlBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  
  unmatchedBox: { marginTop: 8, paddingLeft: 12 },
  unmatchedDivider: { height: 1, width: '40%', marginBottom: 12, opacity: 0.5 },
  unmatchedTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  globalUnmatchedBox: { marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '700', marginTop: 15 },
});
