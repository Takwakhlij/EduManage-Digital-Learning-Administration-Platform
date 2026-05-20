import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Platform, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../constants/api';

const darkTheme = {
  bg: '#090909ff',
  cardBg: '#6367632b',
  textColor: '#f0f0f0ff',
  mutedColor: '#e9eeecff',
  accent: '#38795fdb',
  border: 'rgba(235, 227, 227, 0.1)',
  itemBg: '#1a2622',
  statusBg: 'rgba(26, 138, 93, 0.1)',
};

const lightTheme = {
  bg: '#f8fdfa',
  cardBg: '#ffffff',
  textColor: '#09462aff',
  mutedColor: '#090b0aff',
  accent: '#0d6b48',
  border: 'rgba(0, 0, 0, 0.26)',
  itemBg: '#e8f5ef',
  statusBg: '#dbe7e2d0',
};

const TRANSLATIONS = {
  fr: { title: 'Mon Planning', subtitle: 'Emploi du temps hebdomadaire', empty: 'Aucune séance ce jour', loading: 'Chargement...', today: 'Aujourd\'hui' },
  ar: { title: 'جدول حصصي', subtitle: 'الجدول الأسبوعي للحصص', empty: 'لا توجد حصص في هذا اليوم', loading: 'جاري التحميل...', today: 'اليوم' },
  en: { title: 'My Planning', subtitle: 'Weekly schedule', empty: 'No sessions today', loading: 'Loading...', today: 'Today' },
};

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAYS_SHORT = {
  fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
};

export default function StudentPlanning() {
  const router = useRouter();
  const { isDark, lang, token } = useAuth();
  const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS] || TRANSLATIONS.fr;
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = lang === 'ar';

  const [seances, setSeances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay());

  const fetchPlanning = useCallback(async () => {
    if (!token) return;
    try {
      // 1. Fetch inscriptions to get session IDs
      const resInsc = await fetch(API_ENDPOINTS.GET_MY_INSCRIPTIONS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataInsc = await resInsc.json();
      
      if (dataInsc.success && dataInsc.inscriptions) {
        const activeSessions = dataInsc.inscriptions.filter((i: any) => i.statut === 'approuvee').map((i: any) => i.session?._id).filter(Boolean);
        
        // 2. Fetch seances for all active sessions
        let allSeances: any[] = [];
        for (const sessionId of activeSessions) {
          const resSeances = await fetch(API_ENDPOINTS.GET_SESSION_SEANCES(sessionId), {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const dataSeances = await resSeances.json();
          if (Array.isArray(dataSeances)) {
            allSeances = [...allSeances, ...dataSeances];
          }
        }
        
        setSeances(allSeances);
      }
    } catch (error) {
      console.error('Error fetching student planning:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPlanning();
  }, [fetchPlanning]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlanning();
  };

  const getFilteredSeances = () => {
    const dayName = DAYS_FR[selectedDayIndex];
    return seances.filter(s => s.jour === dayName).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
  };

  const filteredSeances = getFilteredSeances();

  const renderDaySelector = () => {
    const shortDays = DAYS_SHORT[lang as keyof typeof DAYS_SHORT] || DAYS_SHORT.fr;
    return (
      <View style={{ paddingBottom: 15 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.daySelector, isRTL && { flexDirection: 'row-reverse' }]}>
            {shortDays.map((day, index) => {
            const isSelected = selectedDayIndex === index;
            const isToday = new Date().getDay() === index;
            return (
                <TouchableOpacity 
                key={index} 
                style={[
                    styles.dayBtn, 
                    { backgroundColor: theme.cardBg, borderColor: theme.border },
                    isSelected && { backgroundColor: theme.accent, borderColor: theme.accent, elevation: 5, shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
                ]}
                onPress={() => setSelectedDayIndex(index)}
                >
                <Text style={[styles.dayName, { color: isSelected ? '#fff' : theme.mutedColor }]}>{day}</Text>
                {isToday && !isSelected && <View style={[styles.todayDot, { backgroundColor: theme.accent }]} />}
                </TouchableOpacity>
            );
            })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header Area */}
      <View style={[styles.header, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <View style={[styles.headerTop, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
            <Ionicons name="calendar" size={24} color="#D4AF37" />
          </View>
          <View style={{ flex: 1, marginHorizontal: 15 }}>
            <Text style={[styles.title, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>{t.title}</Text>
            <Text style={[styles.subtitle, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>{t.subtitle}</Text>
          </View>
        </View>
        {renderDaySelector()}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} tintColor={theme.accent} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 50 }} />
        ) : filteredSeances.length > 0 ? (
          <View style={styles.timelineContainer}>
            {filteredSeances.map((seance, index) => (
                <View key={seance._id || index} style={[styles.timelineItem, isRTL && { flexDirection: 'row-reverse' }]}>
                {/* Time Column */}
                <View style={styles.timeCol}>
                    <Text style={[styles.timeText, { color: theme.textColor }]}>{seance.heureDebut}</Text>
                    <View style={[styles.line, { backgroundColor: theme.border }]}>
                        <View style={[styles.lineDot, { backgroundColor: theme.accent }]} />
                    </View>
                    <Text style={[styles.timeText, { color: theme.mutedColor, fontSize: 10 }]}>{seance.heureFin}</Text>
                </View>

                {/* Card Column */}
                <View style={[styles.seanceCard, { backgroundColor: theme.cardBg, borderColor: theme.border, shadowColor: theme.textColor }]}>
                    <View style={[styles.cardHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sessionName, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                            {seance.session?.nomSession || 'Session'}
                        </Text>
                        <View style={[styles.classRow, isRTL && { flexDirection: 'row-reverse' }]}>
                           <View style={[styles.classIconWrap, { backgroundColor: `${theme.accent}15` }]}>
                              <Ionicons name="school" size={10} color={theme.accent} />
                           </View>
                           <Text style={[styles.className, { color: theme.mutedColor }]}>
                              {seance.classe?.nomClasse || seance.session?.classe?.nomClasse || 'Classe'}
                           </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={[styles.matiereBadge, { backgroundColor: `${theme.accent}15`, alignSelf: isRTL ? 'flex-end' : 'flex-start', marginBottom: 16 }]}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent, marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }} />
                        <Text style={[styles.matiereText, { color: theme.accent }]}>{seance.matiere?.nomMatiere || 'Cours'}</Text>
                    </View>

                    <View style={[styles.cardFooter, isRTL && { flexDirection: 'row-reverse' }, { borderTopColor: theme.border }]}>
                      <View style={[styles.footerInfo, isRTL && { flexDirection: 'row-reverse' }, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f4f4f5' }]}>
                          <Ionicons name="person" size={14} color={theme.accent} />
                          <Text style={[styles.footerText, { color: theme.textColor }]}>
                            {seance.enseignant?.firstName} {seance.enseignant?.lastName}
                          </Text>
                      </View>
                      <View style={[styles.footerInfo, isRTL && { flexDirection: 'row-reverse' }, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f4f4f5' }]}>
                          <Ionicons name="location" size={14} color="#f59e0b" />
                          <Text style={[styles.footerText, { color: theme.textColor }]}>{seance.salle || '---'}</Text>
                      </View>
                    </View>
                </View>
                </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: theme.cardBg }]}>
                <Ionicons name="calendar-outline" size={60} color={theme.border} />
            </View>
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
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 2 },
  daySelector: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 10,
  },
  dayBtn: {
    width: 60,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayName: { fontSize: 13, fontWeight: '600' },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  scrollContent: { padding: 20, paddingBottom: 60 },
  timelineContainer: {
    paddingLeft: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  timeCol: {
    width: 65,
    alignItems: 'center',
    paddingTop: 0,
  },
  timeText: { fontSize: 13, fontWeight: '800' },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    minHeight: 80,
    alignItems: 'center',
  },
  lineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 0,
  },
  seanceCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginLeft: 15,
    marginBottom: 25,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionName: { fontSize: 18, fontWeight: '800', lineHeight: 22, marginBottom: 6, letterSpacing: -0.2 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  classIconWrap: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  className: { fontSize: 12, fontWeight: '700' },
  matiereBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  matiereText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardFooter: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 16,
    flexWrap: 'wrap',
  },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  footerText: { fontSize: 12, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyIconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.1)',
  },
  emptyText: { fontSize: 16, fontWeight: '600' },
});
