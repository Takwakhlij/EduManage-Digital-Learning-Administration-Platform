import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Platform, Image, ImageBackground, RefreshControl, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, SERVER_URL } from '../../constants/api';

const darkTheme = {
  bg: '#020202ff',
  cardBg: '#1717178c',
  textColor: '#f2f1f1ff',
  mutedColor: '#e7f1ecff',
  accent: '#1179498f',
  border: 'rgba(255, 255, 255, 0.04)',
  itemBg: '#1a2622',
  upcoming: '#75787eff',
};

const lightTheme = {
  bg: '#f0f9f4ff',
  cardBg: 'rgba(255, 255, 255, 1)',
  textColor: '#0a2e1e',
  mutedColor: '#5a7a6a',
  accent: '#0d6645ff',
  border: 'rgba(0,0,0,0.06)',
  itemBg: '#e8f5ef',
  heroBg: '#e0f2ea',
  upcoming: '#737577ff',
};

const T = {
  fr: {
    welcome: 'Bonjour,', readyTeach: 'Prêt à enseigner aujourd\'hui ?',
    stats: 'Aperçu', activeSessions: 'Sessions', totalStudents: 'Étudiants',
    todaySessions: 'Mes séances aujourd\'hui', noSeances: 'Aucune séance aujourd\'hui',
    news: 'Annonces & Actualités', noNews: 'Aucune annonce pour le moment',
    markCall: 'Appel', logout: 'Déconnexion',
    quranQuote: '« إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ »',
  },
  ar: {
    welcome: 'صباح الخير،', readyTeach: 'هل أنت مستعد للتدريس؟',
    stats: 'نظرة عامة', activeSessions: 'الدورات', totalStudents: 'الطلاب',
    todaySessions: 'حصصي اليوم', noSeances: 'لا توجد حصص اليوم',
    news: 'الإعلانات والأخبار', noNews: 'لا توجد إعلانات حالياً',
    markCall: 'الحضور', logout: 'تسجيل الخروج',
    quranQuote: '« إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ »',
  },
  en: {
    welcome: 'Good morning,', readyTeach: 'Ready to teach today?',
    stats: 'Overview', activeSessions: 'Sessions', totalStudents: 'Students',
    todaySessions: 'My Sessions Today', noSeances: 'No sessions today',
    news: 'Announcements & News', noNews: 'No announcements yet',
    markCall: 'Attendance', logout: 'Logout',
    quranQuote: '« Verily, this Quran guides to what is most upright »',
  },
};

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function TeacherHome() {
  const router = useRouter();
  const { user, token, isDark, lang, toggleTheme, changeLanguage, logout, refreshUser } = useAuth();
  const t = T[lang as keyof typeof T] || T.fr;
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = lang === 'ar';

  const [sessions, setSessions] = useState<any[]>([]);
  const [todaySeances, setTodaySeances] = useState<any[]>([]);
  const [actualites, setActualites] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!token || !user?._id) return;
    try {
      const todayName = DAYS_FR[new Date().getDay()];
      await Promise.all([
        refreshUser(),
        fetch(API_ENDPOINTS.GET_TEACHER_SESSIONS, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(sessData => { if (sessData.success) setSessions(sessData.sessions || []); }),
        fetch(API_ENDPOINTS.GET_TEACHER_SEANCES(user._id), { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(seancesData => {
            if (Array.isArray(seancesData)) {
              setTodaySeances(seancesData.filter((s: any) => s.jour === todayName));
            }
          }),
        fetch(API_ENDPOINTS.GET_ACTUALITES)
          .then(res => res.json())
          .then(actData => {
            if (actData.success) {
              const now = new Date().getTime();
              const ONE_DAY_MS = 24 * 60 * 60 * 1000;
              const filtered = (actData.data || []).filter((a: any) => {
                const actDate = new Date(a.dateEvenement || a.dateCreation || a.createdAt).getTime();
                return Math.abs(now - actDate) < ONE_DAY_MS;
              }).sort((a: any, b: any) =>
                new Date(b.dateEvenement || b.dateCreation || b.createdAt).getTime() - new Date(a.dateEvenement || a.dateCreation || a.createdAt).getTime()
              );
              setActualites(filtered.slice(0, 5));
            }
          }),
        fetch(API_ENDPOINTS.GET_NOTIFICATIONS, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(notifData => {
            if (Array.isArray(notifData)) {
              setNotifications(notifData);
            }
          })
      ]);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?._id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const [greeting, setGreeting] = useState(t.welcome);

  useEffect(() => {
    const hour = new Date().getHours();
    if (lang === 'ar') setGreeting(hour < 12 ? 'صباح الخير،' : 'مساء الخير،');
    else if (lang === 'fr') setGreeting(hour < 12 ? 'Bonjour,' : 'Bonsoir,');
    else setGreeting(hour < 12 ? 'Good Morning,' : 'Good Evening,');
  }, [lang]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const totalStudents = sessions.reduce((s, sess) => s + (sess.etudiantsCount || 0), 0);
  const activeSessions = sessions.filter(s => s.statut === 'En cours').length;
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const nowStr = new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0');

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} tintColor={theme.accent} />}
      >
        {/* ── HERO ── */}
        <ImageBackground
          source={require('../../assets/images/premium_islamic_bg.png')}
          style={styles.hero}
          resizeMode="cover"
        >
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.52)' }} />
          </View>

          <View style={[styles.topBar, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.langPill, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              {(['fr', 'ar', 'en'] as const).map(l => (
                <TouchableOpacity
                  key={l}
                  onPress={() => changeLanguage(l)}
                  style={[styles.langBtn, lang === l && { backgroundColor: 'rgba(255,255,255,0.25)' }]}
                >
                  <Text style={[styles.langTxt, { color: '#fff' }]}>{l.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.topRight, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications' as any)}>
                <Ionicons name="notifications-outline" size={21} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={21} color={isDark ? '#D4AF37' : '#FFD700'} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/profile' as any)}>
                {user?.profileImage ? (
                  <Image
                    source={{ uri: `${SERVER_URL}${user.profileImage}?t=${new Date().getTime()}` }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <Ionicons name="person-circle-outline" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.greeting, isRTL && { alignItems: 'flex-end' }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                <Text style={[styles.greetTxt, { color: 'rgba(255,255,255,0.75)' }]}>{greeting}</Text>
                <Ionicons name="sparkles" size={16} color="#D4AF37" style={{ marginHorizontal: 6, marginBottom: 4 }} />
            </View>
            <Text style={[styles.nameTxt, { color: '#fff' }]}>{user?.firstName} {user?.lastName}</Text>
            <Text style={[styles.roleTxt, { color: '#a7f3d0' }]}>{t.readyTeach}</Text>
          </View>

          <View style={styles.quotePill}>
            <Ionicons name="book" size={14} color="#e4b10be9" style={{ marginBottom: 4 }} />
            <Text style={styles.quoteTxt}>{t.quranQuote}</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>

          {/* ── STATS ── */}
          <Text style={[styles.sectionTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>{t.stats}</Text>
          <View style={[styles.statsRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(25, 210, 136, 0.12)' }]}>
                <Ionicons name="book-outline" size={22} color={theme.accent} />
              </View>
              <Text style={[styles.statVal, { color: theme.textColor }]}>{loading ? '–' : activeSessions}</Text>
              <Text style={[styles.statLbl, { color: theme.mutedColor }]}>{t.activeSessions}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(212,175,55,0.12)' }]}>
                <Ionicons name="people-outline" size={22} color="#D4AF37" />
              </View>
              <Text style={[styles.statVal, { color: theme.textColor }]}>{loading ? '–' : totalStudents}</Text>
              <Text style={[styles.statLbl, { color: theme.mutedColor }]}>{t.totalStudents}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                <Ionicons name="calendar-outline" size={22} color="#818cf8" />
              </View>
              <Text style={[styles.statVal, { color: theme.textColor }]}>{loading ? '–' : todaySeances.length}</Text>
              <Text style={[styles.statLbl, { color: theme.mutedColor }]}>Aujourd'hui</Text>
            </View>
          </View>

          {/* ── SÉANCES DU JOUR ── */}
          <Text style={[styles.sectionTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left', marginTop: 28 }]}>{t.todaySessions}</Text>

          {loading ? (
            <ActivityIndicator color={theme.accent} style={{ marginVertical: 16 }} />
          ) : todaySeances.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Ionicons name="calendar-outline" size={32} color={theme.border} />
              <Text style={{ color: theme.mutedColor, marginTop: 8, fontSize: 13 }}>{t.noSeances}</Text>
            </View>
          ) : (
            <View style={styles.seanceList}>
              {todaySeances.map((seance, idx) => {
                const isPast = seance.heureFin && seance.heureFin < nowStr;
                const isCurrent = seance.heureDebut <= nowStr && (!seance.heureFin || seance.heureFin >= nowStr);

                const statusColor = isPast ? '#4ba951ff' : isCurrent ? theme.accent : (theme as any).upcoming;
                const statusLabel = isPast ? 'Terminée' : isCurrent ? 'En cours' : 'À venir';
                const statusIcon = isPast ? 'checkmark-circle' : isCurrent ? 'time' : 'calendar-outline';

                return (
                  <TouchableOpacity
                    key={seance._id || idx}
                    style={[styles.seanceRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                    onPress={() => router.push({ pathname: '/session/[id]', params: { id: seance.session?._id, tab: 'call' } })}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.seanceTimeCol, { borderRightColor: theme.border }]}>
                      <Text style={[styles.seanceHour, { color: theme.textColor }]}>{seance.heureDebut}</Text>
                      {seance.heureFin && <Text style={[styles.seanceHourEnd, { color: theme.mutedColor }]}>{seance.heureFin}</Text>}
                    </View>
                    <View style={styles.seanceDotCol}>
                      <View style={[styles.seanceDot, { backgroundColor: statusColor }]} />
                      {idx < todaySeances.length - 1 && <View style={[styles.seanceLine, { backgroundColor: theme.border }]} />}
                    </View>
                    <View style={styles.seanceInfo}>
                      <Text style={[styles.seanceNameSm, { color: theme.textColor }]} numberOfLines={1}>
                        {seance.session?.nomSession || 'Session'}
                      </Text>
                      <Text style={[styles.seanceSubSm, { color: theme.mutedColor }]} numberOfLines={1}>
                        {seance.matiere?.nomMatiere || 'Cours'}{seance.session?.classe?.nomClasse ? ` · ${seance.session.classe.nomClasse}` : ''}
                      </Text>
                    </View>
                    <View style={styles.seanceRight}>
                      <View style={[styles.statusPill, { backgroundColor: `${statusColor}18` }]}>
                        <Text style={[styles.statusPillTxt, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.callBtnSm, { backgroundColor: statusColor }]}
                        onPress={() => router.push({ pathname: '/session/[id]', params: { id: seance.session?._id, tab: 'call' } })}
                      >
                        <Ionicons name={statusIcon} size={14} color="#f1e6e6ff" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── ANNONCES ADMIN ── */}
          <Text style={[styles.sectionTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left', marginTop: 28 }]}>{t.news}</Text>

          {loading ? (
            <ActivityIndicator color={theme.accent} style={{ marginVertical: 16 }} />
          ) : actualites.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Ionicons name="megaphone-outline" size={32} color={theme.border} />
              <Text style={{ color: theme.mutedColor, marginTop: 8, fontSize: 13 }}>{t.noNews}</Text>
            </View>
          ) : (
            actualites.map((item, idx) => (
              <TouchableOpacity 
                key={item._id || idx} 
                style={[styles.newsCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                onPress={() => router.push('/notifications' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.newsRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  {item.image && (
                    <Image
                      source={{ uri: item.image.startsWith('http') ? item.image : `${SERVER_URL}${item.image}` }}
                      style={styles.newsThumb}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.newsContent}>
                    <View style={[styles.newsBadge, { backgroundColor: 'rgba(26,138,93,0.1)', alignSelf: isRTL ? 'flex-end' : 'flex-start', marginBottom: 6 }]}>
                      <Ionicons name="megaphone-outline" size={11} color={theme.accent} />
                      <Text style={[styles.newsBadgeTxt, { color: theme.accent }]}>Annonce du jour</Text>
                    </View>
                    <Text style={[styles.newsTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>{item.titre}</Text>
                    <Text style={[styles.newsDesc, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>{item.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* ── LOGOUT ── */}
          <TouchableOpacity style={[styles.logoutBtn, { borderColor: '#ef444440' }]} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            <Text style={styles.logoutTxt}>{t.logout}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 58 : 36,
    paddingBottom: 24,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    overflow: 'hidden',
    minHeight: 260,
    justifyContent: 'space-between',
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  langPill: { flexDirection: 'row', borderRadius: 14, padding: 3 },
  langBtn: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 11 },
  langTxt: { fontSize: 10, fontWeight: '700' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: '100%', height: '100%', borderRadius: 15 },
  greeting: { marginBottom: 20 },
  greetTxt: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  nameTxt: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  roleTxt: {
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  quotePill: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignSelf: 'center',
    marginBottom: 10
  },
  quoteTxt: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.4,
    color: 'rgba(255, 255, 255, 0.9)'
  },
  body: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 28 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 20, borderWidth: 1, padding: 16, alignItems: 'center' },
  statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statVal: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLbl: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  emptyBox: { borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', padding: 36, alignItems: 'center', marginBottom: 10 },
  seanceList: { gap: 2 },
  seanceRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, marginBottom: 8, paddingVertical: 10, paddingRight: 12, overflow: 'hidden' },
  seanceTimeCol: { width: 54, alignItems: 'center', paddingVertical: 2, borderRightWidth: 1, marginRight: 4 },
  seanceHour: { fontSize: 13, fontWeight: '800' },
  seanceHourEnd: { fontSize: 10, marginTop: 2 },
  seanceDotCol: { width: 18, alignItems: 'center', marginRight: 8 },
  seanceDot: { width: 10, height: 10, borderRadius: 5 },
  seanceLine: { width: 2, flex: 1, marginTop: 4 },
  seanceInfo: { flex: 1 },
  seanceNameSm: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  seanceSubSm: { fontSize: 11 },
  seanceRight: { alignItems: 'flex-end', gap: 6 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillTxt: { fontSize: 10, fontWeight: '700' },
  callBtnSm: { width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  newsCard: { borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden', padding: 12 },
  newsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  newsThumb: { width: 72, height: 72, borderRadius: 12 },
  newsContent: { flex: 1 },
  newsBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  newsBadgeTxt: { fontSize: 10, fontWeight: '700' },
  newsTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  newsDesc: { fontSize: 12, lineHeight: 17 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 18, borderWidth: 1, marginTop: 20, gap: 8 },
  logoutTxt: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FF0000',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    zIndex: 10,
  },
  bellBadgeTxt: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    includeFontPadding: false,
    textAlign: 'center'
  },
});
