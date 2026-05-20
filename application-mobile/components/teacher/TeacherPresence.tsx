import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Platform, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../constants/api';

const darkTheme = {
  bg: '#0a0b0bff',
  cardBg: '#121414',
  textColor: '#e8f5ef',
  mutedColor: '#ffffffff',
  accent: '#265341b6',
  border: 'rgba(239, 232, 232, 0.1)',
  itemBg: '#4855512f',
  statusBg: 'rgba(70, 98, 87, 0.14)',
};

const lightTheme = {
  bg: '#f8fdfa',
  cardBg: '#ffffff',
  textColor: '#0a2e1e',
  mutedColor: '#040404ff',
  accent: '#1d5e46d0',
  border: 'rgba(0, 0, 0, 0.23)',
  itemBg: '#dee9e4ff',
  statusBg: '#e8f5ef',
};

const TRANSLATIONS = {
  fr: {
    title: 'Gestion de Présence',
    subtitle: 'Suivi des présences et absences',
    today: 'Aujourd\'hui',
    all: 'Toutes les séances',
    markCall: 'Faire l\'appel',
    empty: 'Aucune séance prévue',
    loading: 'Chargement des séances...',
  },
  ar: {
    title: 'إدارة الحضور',
    subtitle: 'متابعة الحضور والغياب',
    today: 'اليوم',
    all: 'كل الحصص',
    markCall: 'تسجيل الحضور',
    empty: 'لا توجد حصص مجدولة',
    loading: 'جاري تحميل الحصص...',
  },
};

export default function TeacherPresence() {
  const router = useRouter();
  const { isDark, lang, token, user } = useAuth();
  const t = (TRANSLATIONS as any)[lang] || TRANSLATIONS.fr;
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = lang === 'ar';

  const [seances, setSeances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'today' | 'all'>('today');

  const fetchSeances = async () => {
    if (!token || !user?._id) return;
    try {
      const response = await fetch(API_ENDPOINTS.GET_TEACHER_SEANCES(user._id), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setSeances(data);
      }
    } catch (error) {
      console.error('Error fetching seances:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSeances();
  }, [token, user?._id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSeances();
  };

  const getFilteredSeances = () => {
    if (filter === 'all') return seances;
    
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const todayName = days[new Date().getDay()];
    return seances.filter(s => s.jour === todayName);
  };

  const filteredSeances = getFilteredSeances();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <View style={[styles.headerContent, isRTL && { flexDirection: 'row-reverse' }]}>
           <View style={[styles.iconBox, { backgroundColor: theme.statusBg }]}>
              <Ionicons name="checkbox" size={24} color={theme.accent} />
           </View>
           <View style={{ flex: 1, marginHorizontal: 15 }}>
              <Text style={[styles.title, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>{t.title}</Text>
              <Text style={[styles.subtitle, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>{t.subtitle}</Text>
           </View>
        </View>

        {/* Filter Tabs */}
        <View style={[styles.tabBar, isRTL && { flexDirection: 'row-reverse' }]}>
           <TouchableOpacity 
             style={[styles.tab, filter === 'today' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]}
             onPress={() => setFilter('today')}
           >
              <Text style={[styles.tabText, { color: filter === 'today' ? theme.accent : theme.mutedColor }]}>{t.today}</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.tab, filter === 'all' && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]}
             onPress={() => setFilter('all')}
           >
              <Text style={[styles.tabText, { color: filter === 'all' ? theme.accent : theme.mutedColor }]}>{t.all}</Text>
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} tintColor={theme.accent} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 50 }} />
        ) : filteredSeances.length > 0 ? (
          filteredSeances.map((seance) => (
            <TouchableOpacity 
              key={seance._id} 
              style={[styles.seanceCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
              onPress={() => router.push({ pathname: '/session/[id]', params: { id: seance.session?._id, tab: 'call' } } as any)}
            >
               <View style={[styles.cardTop, isRTL && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.sessionInfo, isRTL && { alignItems: 'flex-end' }]}>
                     <Text style={[styles.sessionName, { color: theme.textColor }]}>{seance.session?.nomSession}</Text>
                     <View style={[styles.tagRow, isRTL && { flexDirection: 'row-reverse' }]}>
                        <View style={[styles.tag, { backgroundColor: isDark ? 'rgba(212,175,55,0.1)' : '#fef9c3' }]}>
                           <Text style={[styles.tagText, { color: '#ca8a04' }]}>{seance.matiere?.nomMatiere || 'Cours'}</Text>
                        </View>
                        <View style={[styles.tag, { backgroundColor: theme.statusBg }]}>
                           <Text style={[styles.tagText, { color: theme.accent }]}>
                             {seance.session?.classe?.nomClasse || seance.classe?.nomClasse || 'Classe'}
                           </Text>
                        </View>
                     </View>
                  </View>
                  <View style={[styles.timeBox, { backgroundColor: theme.itemBg }]}>
                     <Ionicons name="time-outline" size={16} color={theme.accent} />
                     <Text style={[styles.timeText, { color: theme.textColor }]}>{seance.heureDebut}</Text>
                  </View>
               </View>

               <View style={[styles.cardBottom, { borderTopColor: theme.border }, isRTL && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.dayInfo, isRTL && { flexDirection: 'row-reverse' }]}>
                     <Ionicons name="calendar-outline" size={14} color={theme.mutedColor} />
                     <Text style={[styles.dayText, { color: theme.mutedColor }]}>{seance.jour}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: theme.accent }]}
                    onPress={() => router.push({ pathname: '/session/[id]', params: { id: seance.session?._id, tab: 'call' } } as any)}
                  >
                     <Text style={styles.actionBtnText}>{t.markCall}</Text>
                     <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={14} color="#fff" />
                  </TouchableOpacity>
               </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
             <Ionicons name="calendar-outline" size={60} color={theme.border} />
             <Text style={[styles.emptyText, { color: theme.mutedColor }]}>{t.empty}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 2 },
  tabBar: { flexDirection: 'row', gap: 30 },
  tab: { paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  seanceCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  sessionInfo: { flex: 1 },
  sessionName: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '600' },
  timeBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 5 },
  timeText: { fontSize: 13, fontWeight: 'bold' },
  cardBottom: { paddingTop: 15, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayText: { fontSize: 13 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, gap: 8 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, marginTop: 15 },
});
