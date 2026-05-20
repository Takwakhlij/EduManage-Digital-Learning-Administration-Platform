import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Platform, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../constants/api';

const darkTheme = {
  bg: '#020202ff',
  cardBg: '#171717b3',
  textColor: '#f1f1f1ff',
  mutedColor: '#9ca3af', 
  accent: '#25362b58', 
  border: 'rgba(255, 255, 255, 0.08)',
  statusBg: 'rgba(212, 175, 55, 0.15)',
};

const lightTheme = {
  bg: '#f8f9fa', 
  cardBg: '#FFFFFF',
  textColor: '#1a1a1a',
  mutedColor: '#71717a',
  accent: '#10281ad2', 
  border: 'rgba(0,0,0,0.06)',
  statusBg: 'rgba(212, 175, 55, 0.1)',
};

const TRANSLATIONS = {
  fr: {
    headerTitle: 'Gestion de Formation',
    mainTitle: 'Mes Sessions',
    subtitle: 'Suivi détaillé et gestion de vos groupes d\'apprentissage.',
    allSessions: 'Toutes',
    inProgress: 'Actives',
    completed: 'Terminées',
    totalSessions: 'COURS',
    students: 'TOTAL ÉLÈVES',
    studentsLabel: 'étudiants',
    chaptersLabel: 'matières',
    viewChapters: 'Gérer la session',
    noSessions: 'Aucune session active',
  },
  ar: {
    headerTitle: 'إدارة التدريب',
    mainTitle: 'دوراتي التعليمية',
    subtitle: 'متابعة دقيقة وإدارة لمجموعاتك التعليمية.',
    allSessions: 'الكل',
    inProgress: 'النشطة',
    completed: 'المنتهية',
    totalSessions: 'الدورات',
    students: 'إجمالي الطلاب',
    studentsLabel: 'طلاب',
    chaptersLabel: 'مواد',
    viewChapters: 'إدارة الدورة',
    noSessions: 'لا توجد دورات حالياً',
  },
};

export default function TeacherSessions() {
  const router = useRouter();
  const { isDark, lang, token } = useAuth();
  const t = (TRANSLATIONS as any)[lang] || TRANSLATIONS.fr;
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = lang === 'ar';

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'progress' | 'completed'>('all');

  useEffect(() => {
    fetchSessions();
  }, [token]);

  const fetchSessions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.GET_TEACHER_SESSIONS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (activeTab === 'progress') return s.statut === 'En cours';
    if (activeTab === 'completed') return s.statut === 'Terminée';
    return true;
  });

  const totalStudents = sessions.reduce((sum, s) => sum + (s.etudiantsCount || 0), 0);

  const renderSessionCard = ({ item }: { item: any }) => {
    const isCompleted = item.statut === 'Terminée';
    const statusColor = isCompleted ? '#4ba951' : theme.accent;

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => router.push(`/session/${item._id}` as any)}
        style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusTag, { backgroundColor: isCompleted ? 'rgba(75, 169, 81, 0.15)' : 'rgba(17, 121, 73, 0.15)' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.statut || 'En cours'}
            </Text>
          </View>
          <Ionicons name="ellipsis-horizontal" size={18} color={theme.mutedColor} />
        </View>

        <Text style={[styles.sessionName, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>
          {item.nomSession}
        </Text>
        
        {item.classe && (
          <View style={[styles.classRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.classBadge}>
               <Text style={[styles.classBadgeTxt, { color: theme.accent }]}>{item.classe.niveau}</Text>
            </View>
            <Text style={[styles.className, { color: theme.mutedColor }]}>
              {item.classe.nomClasse}
            </Text>
          </View>
        )}

        <View style={[styles.statsGrid, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={styles.miniStat}>
            <Ionicons name="people-outline" size={16} color="#D4AF37" />
            <Text style={[styles.miniStatVal, { color: theme.textColor }]}>{item.etudiantsCount || 0}</Text>
            <Text style={[styles.miniStatLbl, { color: theme.mutedColor }]}>{t.studentsLabel}</Text>
          </View>
          <View style={[styles.vDivider, { backgroundColor: theme.border }]} />
          <View style={styles.miniStat}>
            <Ionicons name="library-outline" size={16} color="#D4AF37" />
            <Text style={[styles.miniStatVal, { color: theme.textColor }]}>{item.programme?.length || 0}</Text>
            <Text style={[styles.miniStatLbl, { color: theme.mutedColor }]}>{t.chaptersLabel}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.manageBtn, { backgroundColor: theme.accent }]}
          onPress={() => router.push(`/session/${item._id}` as any)}
        >
          <Text style={styles.manageBtnTxt}>{t.viewChapters}</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" />
      
      <ImageBackground
        source={require('../../assets/images/sessions_premium_bg.png')}
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
              <Text style={styles.gStatVal}>{sessions.length}</Text>
              <Text style={styles.gStatLbl}>{t.totalSessions}</Text>
            </View>
            <View style={[styles.gStatDivider, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
            <View style={styles.gStatItem}>
              <Text style={styles.gStatVal}>{totalStudents}</Text>
              <Text style={styles.gStatLbl}>{t.students}</Text>
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
            data={filteredSessions}
            keyExtractor={(item) => item._id}
            renderItem={renderSessionCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-outline" size={54} color={theme.border} />
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
  listContent: { paddingHorizontal: 24, paddingBottom: 30 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 15,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  sessionName: { fontSize: 18, fontWeight: '700', marginBottom: 4, letterSpacing: -0.2 },
  classRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 6 },
  classBadge: { backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  classBadgeTxt: { fontSize: 10, fontWeight: '700' },
  className: { fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  miniStat: { alignItems: 'center', flex: 1 },
  miniStatVal: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  miniStatLbl: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  vDivider: { width: 1, height: 25 },
  manageBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 14, 
    gap: 6,
  },
  manageBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '700', marginTop: 15 },
});
