import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Platform, Image, ImageBackground, RefreshControl, ActivityIndicator, Modal, TextInput, Alert, Animated, Linking
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
  modalBg: '#1a1a1a',
  inputBg: '#2a2a2a'
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
  modalBg: '#ffffff',
  inputBg: '#f8f8f8'
};

const T = {
  fr: {
    welcome: 'Bonjour,',
    readyLearn: 'Prêt à apprendre aujourd\'hui ?',
    stats: 'Aperçu Rapide',
    myCourses: 'Mes Cours',
    todaySessions: 'Mon Planning du Jour',
    noSeances: 'Aucune séance aujourd\'hui',
    availableSessions: 'Nouvelles Sessions Disponibles',
    enroll: 'S\'inscrire',
    news: 'Annonces & Actualités',
    noNews: 'Aucune annonce pour le moment',
    logout: 'Déconnexion',
    quranQuote: '« وَقُل رَّبِّ زِدْنِي عِلْمًا »',
    attendance: 'Présence',
    payment: 'Paiement',
    paid: 'Payé',
    unpaid: 'En attente',
    // Inscription / Modal
    paymentMethod: 'Mode de paiement',
    onlinePayment: 'En Ligne (Stripe)',
    cashPayment: 'Présentielle (Espèces)',
    cardNumber: 'Numéro de carte',
    expiry: 'MM/YY',
    cvc: 'CVC',
    confirmEnroll: 'Confirmer l\'inscription',
    cancel: 'Annuler',
    successMsg: 'Inscription réussie avec succès!',
    errorMsg: 'Une erreur est survenue lors de l\'inscription.',
    myCertificates: 'Mes Certificats & Diplômes',
    noCertificates: 'Aucun certificat disponible pour le moment',
    downloadCert: 'Télécharger',
  },
  ar: {
    welcome: 'صباح الخير،',
    readyLearn: 'هل أنت مستعد للتعلم اليوم؟',
    stats: 'نظرة سريعة',
    myCourses: 'دوراتي',
    todaySessions: 'جدول اليوم',
    noSeances: 'لا توجد حصص اليوم',
    availableSessions: 'دورات جديدة متاحة',
    enroll: 'سجل الآن',
    news: 'الإعلانات والأخبار',
    noNews: 'لا توجد إعلانات حالياً',
    logout: 'تسجيل الخروج',
    quranQuote: '« وَقُل رَّبِّ زِدْنِي عِلْمًا »',
    attendance: 'الحضور',
    payment: 'الدفع',
    paid: 'خالص',
    unpaid: 'في الانتظار',
    paymentMethod: 'طريقة الدفع',
    onlinePayment: 'الدفع عبر الإنترنت',
    cashPayment: 'الدفع نقداً بالمركز',
    cardNumber: 'رقم البطاقة',
    expiry: 'MM/YY',
    cvc: 'CVC',
    confirmEnroll: 'تأكيد التسجيل',
    cancel: 'إلغاء',
    successMsg: 'تم التسجيل بنجاح!',
    errorMsg: 'حدث خطأ أثناء التسجيل.',
    myCertificates: 'شهاداتي ودبلوماتي',
    noCertificates: 'لا توجد شهادات متاحة حالياً',
    downloadCert: 'تحميل',
  },
};

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function StudentHome() {
  const router = useRouter();
  const { user, token, isDark, lang, toggleTheme, changeLanguage, logout, refreshUser } = useAuth();
  const t = (T as any)[lang] || T.fr;
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = lang === 'ar';

  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [todaySeances, setTodaySeances] = useState<any[]>([]);
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [actualites, setActualites] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Modal & Inscription State ---
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [enrollStep, setEnrollStep] = useState<1 | 2>(1);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '' });

  const fetchAll = useCallback(async () => {
    if (!token) return;
    try {
      const todayName = DAYS_FR[new Date().getDay()];
      await refreshUser();

      // Fetch My Inscriptions
      const inscRes = await fetch(API_ENDPOINTS.GET_MY_INSCRIPTIONS, { headers: { Authorization: `Bearer ${token}` } });
      const inscData = await inscRes.json();
      const userInscriptions = inscData.inscriptions || [];
      setInscriptions(userInscriptions);

      // Fetch today's seances
      let seancesList: any[] = [];
      for (const insc of userInscriptions) {
        if (insc.session && insc.session._id && insc.statut === 'approuvee') {
          try {
            const seanceRes = await fetch(API_ENDPOINTS.GET_SESSION_SEANCES(insc.session._id), { headers: { Authorization: `Bearer ${token}` } });
            const seanceData = await seanceRes.json();
            if (Array.isArray(seanceData)) {
              const today = seanceData.filter((s: any) => s.jour === todayName);
              today.forEach((s: any) => { s.session = insc.session; });
              seancesList = [...seancesList, ...today];
            }
          } catch (err) {}
        }
      }
      setTodaySeances(seancesList);

      // Fetch all sessions (to show available ones)
      const sessionsRes = await fetch(API_ENDPOINTS.GET_ALL_SESSIONS, { headers: { Authorization: `Bearer ${token}` } });
      const sessionsData = await sessionsRes.json();
      if (sessionsData.success) {
        const enrolledIds = userInscriptions.map((i: any) => i.session?._id);
        const available = (sessionsData.sessions || []).filter((s: any) => !enrolledIds.includes(s._id) && s.statut === 'En cours');
        setAvailableSessions(available.slice(0, 3)); 
      }

      // Fetch Actualites
      const actRes = await fetch(API_ENDPOINTS.GET_ACTUALITES);
      const actData = await actRes.json();
      if (actData.success) {
        const now = new Date().getTime();
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        const filtered = (actData.data || []).filter((a: any) => {
          const actDate = new Date(a.dateEvenement || a.dateCreation || a.createdAt).getTime();
          return Math.abs(now - actDate) < ONE_DAY_MS;
        }).sort((a: any, b: any) => new Date(b.dateEvenement || b.dateCreation || b.createdAt).getTime() - new Date(a.dateEvenement || a.dateCreation || a.createdAt).getTime());
        setActualites(filtered.slice(0, 5));
      }

      // Fetch Notifications
      const notifRes = await fetch(API_ENDPOINTS.GET_NOTIFICATIONS, { headers: { Authorization: `Bearer ${token}` } });
      const notifData = await notifRes.json();
      if (Array.isArray(notifData)) setNotifications(notifData);

      // Fetch My Certificates
      try {
        const certRes = await fetch(API_ENDPOINTS.GET_MY_CERTIFICATES, { headers: { Authorization: `Bearer ${token}` } });
        const certData = await certRes.json();
        if (certData.success) {
          setCertificates(certData.data || []);
        }
      } catch (err) { console.error('Certificates fetch error:', err); }

    } catch (e) {
      console.error('Student Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const [greeting, setGreeting] = useState(t.welcome);

  useEffect(() => {
    const hour = new Date().getHours();
    if (lang === 'ar') setGreeting(hour < 12 ? 'صباح الخير،' : 'مساء الخير،');
    else if (lang === 'fr') setGreeting(hour < 12 ? 'Bonjour,' : 'Bonsoir,');
    else setGreeting(hour < 12 ? 'Good Morning,' : 'Good Evening,');
  }, [lang]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const handleDownloadCertificate = async (cert: any) => {
    if (!cert._id) return;
    setDownloadingCert(cert._id);
    try {
      const url = API_ENDPOINTS.DOWNLOAD_CERTIFICATE(cert._id);
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de télécharger le certificat.');
    } finally {
      setDownloadingCert(null);
    }
  };

  const handleOpenEnrollModal = (session: any) => {
    setSelectedSession(session);
    setPaymentMethod('stripe');
    setCardData({ number: '', expiry: '', cvc: '' });
    setEnrollStep(1);
    setEnrollModalVisible(true);
  };

  const handleConfirmEnroll = async () => {
    if (!selectedSession || !user?._id) return;
    setIsEnrolling(true);

    try {
      // 1. Create Inscription
      const inscResponse = await fetch(API_ENDPOINTS.CREATE_INSCRIPTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ etudiant: user._id, session: selectedSession._id })
      });
      const inscData = await inscResponse.json();

      if (!inscData.success) {
        Alert.alert('Erreur', inscData.message || t.errorMsg);
        setIsEnrolling(false);
        return;
      }

      const inscriptionId = inscData.inscription?._id;

      // 2. If Stripe simulated payment, call mobile-demo-stripe
      if (paymentMethod === 'stripe' && inscriptionId) {
        // Validation basique de la fausse carte
        if (cardData.number.length < 16) {
          Alert.alert('Erreur', 'Veuillez entrer un numéro de carte valide (16 chiffres).');
          setIsEnrolling(false);
          return;
        }

        const stripeRes = await fetch(API_ENDPOINTS.MOBILE_DEMO_STRIPE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ inscriptionId, montant: selectedSession.montant })
        });
        const stripeData = await stripeRes.json();
        
        if (!stripeData.success) {
           Alert.alert('Attention', 'L\'inscription a réussi mais le paiement simulé a échoué.');
        }
      }

      Alert.alert('Succès', t.successMsg, [
        {
          text: 'OK',
          onPress: () => {
            setEnrollModalVisible(false);
            onRefresh();
            router.push('/sessions' as any);
          }
        }
      ]);

    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', t.errorMsg);
    } finally {
      setIsEnrolling(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const nowStr = new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0');

  const isPaid = inscriptions.length > 0 && inscriptions.every(i => i.paiements && i.paiements.length > 0 && i.paiements[0].statut === 'Payé');
  const paymentColor = isPaid ? '#10b981' : '#ef4444';

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
            <Text style={[styles.roleTxt, { color: '#a7f3d0' }]}>{t.readyLearn}</Text>
          </View>

          <View style={styles.quotePill}>
            <Ionicons name="book" size={14} color="#e4b10be9" style={{ marginBottom: 4 }} />
            <Text style={styles.quoteTxt}>{t.quranQuote}</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>

          {/* ── STATS / KPIs ── */}
          <Text style={[styles.sectionTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>{t.stats}</Text>
          <View style={[styles.statsRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
              onPress={() => router.push('/sessions' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.statIcon, { backgroundColor: 'rgba(25, 210, 136, 0.12)' }]}>
                <Ionicons name="book-outline" size={22} color={theme.accent} />
              </View>
              <Text style={[styles.statVal, { color: theme.textColor }]}>{loading ? '–' : inscriptions.length}</Text>
              <Text style={[styles.statLbl, { color: theme.mutedColor }]}>{t.myCourses}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
              onPress={() => router.push('/presence' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.statIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                <Ionicons name="checkbox-outline" size={22} color="#818cf8" />
              </View>
              <Text style={[styles.statVal, { color: theme.textColor }]}>{loading ? '–' : '100%'}</Text>
              <Text style={[styles.statLbl, { color: theme.mutedColor }]}>{t.attendance}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
              onPress={() => router.push('/paiements' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.statIcon, { backgroundColor: `${paymentColor}15` }]}>
                <Ionicons name="wallet-outline" size={22} color={paymentColor} />
              </View>
              <Text style={[styles.statVal, { color: theme.textColor, fontSize: 16, marginTop: 4, marginBottom: 8 }]}>{loading ? '–' : (isPaid ? t.paid : t.unpaid)}</Text>
              <Text style={[styles.statLbl, { color: theme.mutedColor }]}>{t.payment}</Text>
            </TouchableOpacity>
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

                return (
                  <View key={seance._id || idx} style={[styles.seanceRow, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                    <View style={[styles.seanceTimeCol, { borderRightColor: theme.border }]}>
                      <Text style={[styles.seanceHour, { color: theme.textColor }]}>{seance.heureDebut}</Text>
                      {seance.heureFin && <Text style={[styles.seanceHourEnd, { color: theme.mutedColor }]}>{seance.heureFin}</Text>}
                    </View>
                    <View style={styles.seanceDotCol}>
                      <View style={[styles.seanceDot, { backgroundColor: statusColor }]} />
                      {idx < todaySeances.length - 1 && <View style={[styles.seanceLine, { backgroundColor: theme.border }]} />}
                    </View>
                    <View style={styles.seanceInfo}>
                      <Text style={[styles.seanceNameSm, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                        {seance.session?.nomSession || 'Session'}
                      </Text>
                      <Text style={[styles.seanceSubSm, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                        {seance.salle || 'Salle non assignée'}
                      </Text>
                    </View>
                    <View style={styles.seanceRight}>
                      <View style={[styles.statusPill, { backgroundColor: `${statusColor}18` }]}>
                        <Text style={[styles.statusPillTxt, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── MES CERTIFICATS & DIPLÔMES ── */}
          <Text style={[styles.sectionTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left', marginTop: 28 }]}>{t.myCertificates}</Text>
          
          {loading ? (
            <ActivityIndicator color={theme.accent} style={{ marginVertical: 16 }} />
          ) : certificates.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Ionicons name="ribbon-outline" size={32} color={theme.border} />
              <Text style={{ color: theme.mutedColor, marginTop: 8, fontSize: 13 }}>{t.noCertificates}</Text>
            </View>
          ) : (
            certificates.map((cert, idx) => (
              <View key={cert._id || idx} style={[styles.newsCard, { backgroundColor: theme.cardBg, borderWidth: 1, borderColor: '#D4AF3740' }]}>
                <View style={[styles.newsRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.statIcon, { backgroundColor: 'rgba(212, 175, 55, 0.15)', width: 50, height: 50, marginBottom: 0 }]}>
                    <Ionicons name="ribbon" size={24} color="#D4AF37" />
                  </View>
                  <View style={styles.newsContent}>
                    <Text style={[styles.newsTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                      {cert.session?.nomSession || 'Certificat de Réussite'}
                    </Text>
                    <Text style={[styles.newsDesc, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                      Délivré le : {new Date(cert.dateEmission || cert.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR')}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.enrollBtn, { backgroundColor: '#D4AF37', flexDirection: 'row', alignItems: 'center', gap: 4 }]}
                    onPress={() => handleDownloadCertificate(cert)}
                    disabled={downloadingCert === cert._id}
                  >
                    {downloadingCert === cert._id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={16} color="#000" />
                        <Text style={[styles.enrollBtnTxt, { color: '#000', fontWeight: 'bold' }]}>{t.downloadCert}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* ── NOUVELLES SESSIONS DISPONIBLES ── */}
          <Text style={[styles.sectionTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left', marginTop: 28 }]}>{t.availableSessions}</Text>
          
          {loading ? (
            <ActivityIndicator color={theme.accent} style={{ marginVertical: 16 }} />
          ) : availableSessions.length === 0 ? (
            <Text style={{ color: theme.mutedColor, fontSize: 13, textAlign: isRTL ? 'right' : 'left' }}>Aucune nouvelle session n'est disponible pour le moment.</Text>
          ) : (
            availableSessions.map((session, idx) => (
              <View key={session._id || idx} style={[styles.newsCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={[styles.newsRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.statIcon, { backgroundColor: `${theme.accent}15`, width: 50, height: 50, marginBottom: 0 }]}>
                    <Ionicons name="book" size={24} color={theme.accent} />
                  </View>
                  <View style={styles.newsContent}>
                    <Text style={[styles.newsTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{session.nomSession}</Text>
                    <Text style={[styles.newsDesc, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                      Durée: {session.duree} • {session.montant} TND
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.enrollBtn, { backgroundColor: theme.accent }]}
                    onPress={() => handleOpenEnrollModal(session)}
                  >
                    <Text style={styles.enrollBtnTxt}>{t.enroll}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
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

      {/* ── ENROLL MODAL ── */}
      <Modal visible={enrollModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: (theme as any).modalBg }]}>
            
            {enrollStep === 1 ? (
               <View>
                 <Text style={[styles.modalTitle, { color: theme.textColor }]}>
                   {selectedSession?.nomSession}
                 </Text>
                 <View style={{ backgroundColor: `${theme.accent}15`, padding: 12, borderRadius: 12, marginBottom: 20 }}>
                     <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                        ⏳ {selectedSession?.duree}   •   💰 {selectedSession?.montant} TND
                     </Text>
                 </View>
                 <Text style={[styles.modalSubtitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>
                   Détails de la session
                 </Text>
                 <Text style={{ color: theme.mutedColor, fontSize: 13, lineHeight: 20, marginBottom: 24, textAlign: isRTL ? 'right' : 'left' }}>
                   {selectedSession?.description || "Inscrivez-vous dès maintenant pour accéder au contenu complet, aux ressources pédagogiques et à l'emploi du temps de cette session."}
                 </Text>

                 <TouchableOpacity 
                   style={[styles.confirmBtn, { backgroundColor: theme.accent }]}
                   onPress={() => setEnrollStep(2)}
                 >
                   <Text style={styles.confirmBtnTxt}>Continuer vers le paiement</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={styles.cancelBtn}
                   onPress={() => setEnrollModalVisible(false)}
                 >
                   <Text style={[styles.cancelBtnTxt, { color: theme.mutedColor }]}>{t.cancel}</Text>
                 </TouchableOpacity>
               </View>
            ) : (
               <View>
                 <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 20 }}>
                    <TouchableOpacity onPress={() => setEnrollStep(1)} style={{ padding: 5, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0', borderRadius: 12 }}>
                        <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color={theme.textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: theme.textColor, flex: 1, textAlign: 'center', marginRight: 30, fontSize: 18 }]}>
                      {t.paymentMethod}
                    </Text>
                 </View>

                 <View style={{ alignItems: 'center', marginBottom: 24, backgroundColor: isDark ? 'rgba(17, 121, 73, 0.1)' : 'rgba(13, 102, 69, 0.05)', paddingVertical: 20, borderRadius: 20, borderWidth: 1, borderColor: `${theme.accent}30` }}>
                     <Ionicons name="wallet-outline" size={32} color={theme.accent} style={{ marginBottom: 8, opacity: 0.8 }} />
                     <Text style={{ color: theme.mutedColor, fontSize: 13, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Montant à Payer</Text>
                     <Text style={{ color: theme.textColor, fontSize: 36, fontWeight: '900' }}>{selectedSession?.montant} <Text style={{ fontSize: 16, color: theme.accent }}>TND</Text></Text>
                 </View>
                 
                 {/* Mode Selectors */}
                 <View style={styles.paymentMethods}>
                   <TouchableOpacity 
                     style={[styles.methodBtn, { borderColor: theme.border }, paymentMethod === 'stripe' && { borderColor: theme.accent, backgroundColor: `${theme.accent}10` }]}
                     onPress={() => setPaymentMethod('stripe')}
                   >
                     <View style={[styles.iconBtn, { backgroundColor: paymentMethod === 'stripe' ? theme.accent : isDark ? '#333' : '#eee', width: 44, height: 44, borderRadius: 22 }]}>
                         <Ionicons name="card" size={22} color={paymentMethod === 'stripe' ? '#fff' : theme.mutedColor} />
                     </View>
                     <Text style={[styles.methodTxt, { color: paymentMethod === 'stripe' ? theme.accent : theme.mutedColor, marginTop: 6 }]}>{t.onlinePayment}</Text>
                   </TouchableOpacity>
                   
                   <TouchableOpacity 
                     style={[styles.methodBtn, { borderColor: theme.border }, paymentMethod === 'cash' && { borderColor: theme.accent, backgroundColor: `${theme.accent}10` }]}
                     onPress={() => setPaymentMethod('cash')}
                   >
                     <View style={[styles.iconBtn, { backgroundColor: paymentMethod === 'cash' ? theme.accent : isDark ? '#333' : '#eee', width: 44, height: 44, borderRadius: 22 }]}>
                         <Ionicons name="cash" size={22} color={paymentMethod === 'cash' ? '#fff' : theme.mutedColor} />
                     </View>
                     <Text style={[styles.methodTxt, { color: paymentMethod === 'cash' ? theme.accent : theme.mutedColor, marginTop: 6 }]}>{t.cashPayment}</Text>
                   </TouchableOpacity>
                 </View>

                 {/* Fake Stripe Form */}
                 {paymentMethod === 'stripe' && (
                   <View style={{ marginBottom: 24 }}>
                     <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }]}>
                       <Ionicons name="card-outline" size={20} color={theme.mutedColor} style={{ marginRight: 10 }} />
                       <TextInput
                         style={[{ flex: 1, color: theme.textColor, fontSize: 15, fontWeight: '600', height: 48 }]}
                         placeholder={t.cardNumber}
                         placeholderTextColor={theme.mutedColor}
                         keyboardType="numeric"
                         maxLength={19}
                         value={cardData.number}
                         onChangeText={(text) => {
                            // Format with spaces
                            let formatted = text.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                            setCardData({ ...cardData, number: formatted });
                         }}
                       />
                     </View>
                     
                     <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                       <View style={[styles.inputWrapper, { flex: 1, borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }]}>
                         <Ionicons name="calendar-outline" size={20} color={theme.mutedColor} style={{ marginRight: 10 }} />
                         <TextInput
                           style={[{ flex: 1, color: theme.textColor, fontSize: 15, fontWeight: '600', height: 48 }]}
                           placeholder="MM/YY"
                           placeholderTextColor={theme.mutedColor}
                           maxLength={5}
                           value={cardData.expiry}
                           onChangeText={(text) => {
                               let formatted = text.replace(/\//g, '');
                               if (formatted.length > 2) {
                                   formatted = formatted.substring(0, 2) + '/' + formatted.substring(2);
                               }
                               setCardData({ ...cardData, expiry: formatted });
                           }}
                         />
                       </View>
                       
                       <View style={[styles.inputWrapper, { flex: 1, borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }]}>
                         <Ionicons name="lock-closed-outline" size={20} color={theme.mutedColor} style={{ marginRight: 10 }} />
                         <TextInput
                           style={[{ flex: 1, color: theme.textColor, fontSize: 15, fontWeight: '600', height: 48 }]}
                           placeholder="CVC"
                           placeholderTextColor={theme.mutedColor}
                           keyboardType="numeric"
                           maxLength={3}
                           secureTextEntry
                           value={cardData.cvc}
                           onChangeText={(text) => setCardData({ ...cardData, cvc: text })}
                         />
                       </View>
                     </View>
                     
                     <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18, gap: 6 }}>
                        <Ionicons name="shield-checkmark" size={16} color={theme.accent} />
                        <Text style={{ fontSize: 12, color: theme.mutedColor, fontWeight: '700', letterSpacing: 0.5 }}>Paiement 100% Sécurisé</Text>
                     </View>
                   </View>
                 )}

                 <TouchableOpacity 
                   style={[styles.confirmBtn, { backgroundColor: theme.accent, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: theme.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 }, isEnrolling && { opacity: 0.7 }]}
                   onPress={handleConfirmEnroll}
                   disabled={isEnrolling}
                 >
                   {isEnrolling ? <ActivityIndicator color="#fff" /> : (
                       <>
                         <Ionicons name="lock-closed" size={20} color="#fff" />
                         <Text style={styles.confirmBtnTxt}>Payer {selectedSession?.montant} TND</Text>
                       </>
                   )}
                 </TouchableOpacity>
               </View>
            )}
          </View>
        </View>
      </Modal>

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
  newsCard: { borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden', padding: 12 },
  newsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  newsThumb: { width: 72, height: 72, borderRadius: 12 },
  newsContent: { flex: 1 },
  newsBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  newsBadgeTxt: { fontSize: 10, fontWeight: '700' },
  newsTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  newsDesc: { fontSize: 12, lineHeight: 17 },
  enrollBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  enrollBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
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
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  modalPrice: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 24 },
  modalSubtitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  paymentMethods: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  methodBtn: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 8 },
  methodTxt: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  cardForm: { padding: 16, borderRadius: 16, marginBottom: 20, gap: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600' },
  confirmBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  confirmBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnTxt: { fontSize: 14, fontWeight: '600' }
});
