import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../constants/api';

const darkTheme = {
  bg: '#090909ff',
  cardBg: '#171717b3',
  textColor: '#f1f1f1ff',
  mutedColor: '#9ca3af', 
  accent: '#117949', 
  border: 'rgba(255, 255, 255, 0.08)',
  tableHeader: '#1f1f1f',
  tableRowBg: '#121212'
};

const lightTheme = {
  bg: '#f8fdfa', 
  cardBg: '#FFFFFF',
  textColor: '#1a1a1a',
  mutedColor: '#71717a',
  accent: '#0d6645ff', 
  border: 'rgba(0,0,0,0.06)',
  tableHeader: '#eef2f0',
  tableRowBg: '#ffffff'
};

const TRANSLATIONS = {
  fr: {
    headerTitle: 'Mon Assiduité',
    presents: 'Présences',
    absents: 'Absences',
    retards: 'Retards',
    history: 'Historique des Séances',
    noHistory: 'Aucun historique pour le moment',
    colDate: 'Date',
    colSession: 'Séance',
    colStatut: 'Statut'
  },
  ar: {
    headerTitle: 'مواظبتي',
    presents: 'حضور',
    absents: 'غياب',
    retards: 'تأخير',
    history: 'سجل الحصص',
    noHistory: 'لا يوجد سجل حالياً',
    colDate: 'التاريخ',
    colSession: 'الحصة',
    colStatut: 'الحالة'
  },
};

export default function StudentPresence() {
  const { isDark, lang, token, user } = useAuth();
  const t = (TRANSLATIONS as any)[lang] || TRANSLATIONS.fr;
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = lang === 'ar';

  const [stats, setStats] = useState<any>({ total: 0, presents: 0, absents: 0, retards: 0, tauxAssiduité: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!token || !user?._id) return;
    try {
      const response = await fetch(API_ENDPOINTS.GET_MY_PRESENCE_STATS(user._id), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching presence stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const getStatusColor = (statut: string) => {
    if (statut === 'Present') return '#10b981';
    if (statut === 'Absent') return '#ef4444';
    return '#f59e0b'; // Retard
  };

  const getStatusLabel = (statut: string) => {
    if (statut === 'Present') return isRTL ? 'حاضر' : 'Présent';
    if (statut === 'Absent') return isRTL ? 'غائب' : 'Absent';
    return isRTL ? 'متأخر' : 'Retard';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.cardBg }]}>
        <View style={[styles.headerTop, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(13, 102, 69, 0.1)' }]}>
                <Ionicons name="shield-checkmark" size={24} color={theme.accent} />
            </View>
            <Text style={[styles.headerTitle, { color: theme.textColor }]}>
            {t.headerTitle}
            </Text>
        </View>

        {/* TOP STATS CARDS */}
        <View style={[styles.topStats, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.statBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.presents}</Text>
                <Text style={[styles.statLabel, { color: '#10b981' }]}>{t.presents}</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.absents}</Text>
                <Text style={[styles.statLabel, { color: '#ef4444' }]}>{t.absents}</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.retards}</Text>
                <Text style={[styles.statLabel, { color: '#f59e0b' }]}>{t.retards}</Text>
            </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} tintColor={theme.accent} />}
      >
        <Text style={[styles.sectionTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>
          {t.history}
        </Text>

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />
        ) : history.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
            <Ionicons name="document-text-outline" size={40} color={theme.border} />
            <Text style={{ color: theme.mutedColor, marginTop: 12, textAlign: 'center', fontSize: 14 }}>
              {t.noHistory}
            </Text>
          </View>
        ) : (
          <View style={[styles.tableContainer, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
            {/* TABLE HEADER */}
            <View style={[styles.tableHeader, { backgroundColor: theme.tableHeader, borderBottomColor: theme.border }, isRTL && { flexDirection: 'row-reverse' }]}>
                <Text style={[styles.thText, { color: theme.mutedColor, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{t.colDate}</Text>
                <Text style={[styles.thText, { color: theme.mutedColor, flex: 2, textAlign: isRTL ? 'right' : 'left' }]}>{t.colSession}</Text>
                <Text style={[styles.thText, { color: theme.mutedColor, flex: 1.2, textAlign: isRTL ? 'right' : 'left' }]}>{t.colStatut}</Text>
            </View>

            {/* TABLE BODY */}
            {history.map((h, idx) => {
              const stColor = getStatusColor(h.statut);
              const isLast = idx === history.length - 1;
              return (
                <View 
                    key={h._id || idx} 
                    style={[
                        styles.tableRow, 
                        { borderBottomColor: isLast ? 'transparent' : theme.border, backgroundColor: theme.tableRowBg },
                        isRTL && { flexDirection: 'row-reverse' }
                    ]}
                >
                    <Text style={[styles.tdText, { color: theme.textColor, flex: 1, fontWeight: '700', textAlign: isRTL ? 'right' : 'left' }]}>
                        {formatDate(h.date)}
                    </Text>
                    
                    <View style={{ flex: 2, paddingRight: isRTL ? 0 : 8, paddingLeft: isRTL ? 8 : 0, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                        <Text style={[styles.tdMainText, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                            {h.session}
                        </Text>
                        <Text style={[styles.tdSubText, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                            {h.seance?.matiere}
                        </Text>
                    </View>

                    <View style={{ flex: 1.2, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                        <View style={[styles.statusPill, { backgroundColor: `${stColor}15` }]}>
                            <View style={[styles.statusDot, { backgroundColor: stColor }]} />
                            <Text style={[styles.statusPillTxt, { color: stColor }]}>{getStatusLabel(h.statut)}</Text>
                        </View>
                    </View>
                </View>
              );
            })}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    marginLeft: 0,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  topStats: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  statBadge: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 16, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '700' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 16 },
  emptyBox: { padding: 40, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', marginTop: 10 },
  
  // Table Styles
  tableContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  thText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tdText: {
    fontSize: 13,
  },
  tdMainText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  tdSubText: {
    fontSize: 11,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillTxt: {
    fontSize: 11,
    fontWeight: '800',
  }
});
