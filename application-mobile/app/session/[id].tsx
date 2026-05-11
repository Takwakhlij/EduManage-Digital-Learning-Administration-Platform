import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Platform, Linking, Alert, RefreshControl, ImageBackground, Image, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, BASE_URL, SERVER_URL } from '../../constants/api';
import * as DocumentPicker from 'expo-document-picker';

// --- Thèmes ---
const darkTheme = {
  bg: '#0a0b0bff',
  cardBg: '#121414',
  textColor: '#e8f5ef',
  mutedColor: '#8ab5a0',
  accent: '#1a8a5d',
  border: 'rgba(245, 241, 241, 0.05)',
  itemBg: '#1a2622',
};

const lightTheme = {
  bg: '#f8fdfa',
  cardBg: '#ffffff',
  textColor: '#0a2e1e',
  mutedColor: '#5a7a6a',
  accent: '#0d6b48',
  border: 'rgba(0,0,0,0.05)',
  itemBg: '#e8f5ef',
};

// --- Traductions ---
const TRANSLATIONS = {
  fr: {
    back: 'Retour aux sessions',
    program: 'Programme',
    students: 'Étudiants',
    call: 'Faire l\'Appel',
    chapterTitle: 'Programme des Chapitres',
    resources: 'ressources',
    open: 'Ouvrir',
    loading: 'Chargement des détails...',
    error: 'Erreur lors du chargement',
    complete: 'Terminer',
    completeTitle: 'Clôturer la session',
    completeConfirm: 'Voulez-vous vraiment marquer cette session comme terminée ? Cela générera les certificats pour les étudiants.',
    completeSuccess: 'Session clôturée avec succès',
    statusTerminee: 'Session Terminée',
  },
  ar: {
    back: 'العودة للدورات',
    program: 'البرنامج',
    students: 'الطلاب',
    call: 'تسجيل الحضور',
    chapterTitle: 'برنامج الفصول',
    resources: 'موارد',
    open: 'فتح',
    loading: 'جاري التحميل...',
    error: 'خطأ في التحميل',
    complete: 'إنهاء',
    completeTitle: 'إغلاق الدورة',
    completeConfirm: 'هل أنت متأكد من إنهاء هذه الدورة؟ سيتم إصدار الشهادات للطلاب.',
    completeSuccess: 'تم إغلاق الدورة بنجاح',
    statusTerminee: 'دورة منتهية',
  },
  en: {
    back: 'Back to sessions',
    program: 'Program',
    students: 'Students',
    call: 'Roll Call',
    chapterTitle: 'Chapters Program',
    resources: 'resources',
    open: 'Open',
    loading: 'Loading details...',
    error: 'Error loading details',
    complete: 'Finish',
    completeTitle: 'Close Session',
    completeConfirm: 'Are you sure you want to mark this session as finished? Certificates will be generated.',
    completeSuccess: 'Session closed successfully',
    statusTerminee: 'Session Finished',
  },
};

export default function SessionDetailScreen() {
  const { id, tab } = useLocalSearchParams();
  const router = useRouter();
  const { isDark, lang, token, user } = useAuth();
  const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS];
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = lang === 'ar';

  const [session, setSession] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [activeNav, setActiveNav] = useState<'program' | 'students' | 'call'>((tab as any) || 'program');

  // Attendance & Students States
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [seances, setSeances] = useState<any[]>([]);
  const [selectedSeance, setSelectedSeance] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [attendance, setAttendance] = useState<Record<string, { statut: string; remarque: string }>>({});
  const [savingPresence, setSavingPresence] = useState(false);
  const [isEditable, setIsEditable] = useState(true);
  const [cahierTexte, setCahierTexte] = useState('');
  const SMART_TAGS = ['حفظ جديد', 'مراجعة', 'تسميع', 'أحكام تجويد', 'اختبار'];

  const handleSmartTag = (tag: string) => {
    if (!isEditable) return;
    const separator = cahierTexte.length > 0 && !cahierTexte.endsWith(' ') && !cahierTexte.endsWith('\n') ? ' ' : '';
    setCahierTexte(prev => prev + separator + tag + ' ');
  };

  useEffect(() => {
    fetchSessionDetails();
  }, [id, token]);

  useEffect(() => {
    if (activeNav === 'call' || activeNav === 'students') {
      fetchEnrolledStudents();
    }
    if (activeNav === 'call') {
      fetchSeances();
    }
  }, [activeNav]);

  useEffect(() => {
    if (selectedSeance && selectedDate) {
      fetchExistingPresence();
    }
  }, [selectedSeance, selectedDate]);

  // Generate Occurrences (Combined Date + Seance)
  const getOccurrences = () => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const occurrences: any[] = [];
    
    // Check last 10 days
    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayName = days[d.getDay()];
      
      // Find seances that happen on this day
      const dailySeances = seances.filter(s => s.jour === dayName);
      dailySeances.forEach(s => {
        occurrences.push({
          date: dateStr,
          seance: s,
          label: i === 0 ? (lang === 'ar' ? 'اليوم' : 'Aujourd\'hui') : 
                 i === 1 ? (lang === 'ar' ? 'أمس' : 'Hier') : 
                 d.toLocaleDateString(lang === 'ar' ? 'ar-TN' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
        });
      });
    }
    return occurrences;
  };

  const fetchSessionDetails = async (isRefreshing = false) => {
    if (!token || !id) return;
    if (!isRefreshing) setLoading(true);
    try {
      const [sessionRes, coursesRes] = await Promise.all([
        fetch(API_ENDPOINTS.GET_SESSION_DETAILS(id as string), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(API_ENDPOINTS.GET_SESSION_COURS(id as string), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      const sessionData = await sessionRes.json();
      const coursesData = await coursesRes.json();
      
      if (sessionData.success) {
        setSession(sessionData.session);
      }
      if (coursesData.success) {
        setCourses(coursesData.data);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const [fetchingStudents, setFetchingStudents] = useState(false);

  const fetchEnrolledStudents = async () => {
    if (!token || !id) return;
    setFetchingStudents(true);
    try {
      const res = await fetch(API_ENDPOINTS.GET_SESSION_STUDENTS(id as string), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEnrolledStudents(data.inscriptions || []);
      } else {
        Alert.alert('Erreur', data.message || 'Impossible de charger les étudiants');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Erreur', 'Erreur réseau lors du chargement des étudiants');
    } finally {
      setFetchingStudents(false);
    }
  };

  const fetchSeances = async () => {
    if (!token || seances.length > 0) return;
    try {
      const res = await fetch(API_ENDPOINTS.GET_SESSION_SEANCES(id as string), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSeances(data);
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const todayName = days[new Date().getDay()];
        const todaySeance = data.find(s => s.jour === todayName);
        if (todaySeance) setSelectedSeance(todaySeance);
        else if (data.length > 0) setSelectedSeance(data[0]);
      }
    } catch (error) {
      console.error('Error fetching seances:', error);
    }
  };

  const fetchExistingPresence = async () => {
    if (!token || !selectedSeance) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_PRESENCE}?seanceId=${selectedSeance._id}&date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const newAttendance: Record<string, any> = {};
        data.data.forEach((p: any) => {
          newAttendance[p.inscription._id] = { statut: p.statut, remarque: p.remarque };
        });
        setAttendance(newAttendance);
        setIsEditable(data.editable);
      }
    } catch (error) {
      console.error('Error fetching existing presence:', error);
    }
    
    // Fetch Cahier de texte
    try {
      const res = await fetch(`${BASE_URL}/teacher-presences?seanceId=${selectedSeance._id}&date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCahierTexte(data.data.cahierTexte || '');
      } else {
        setCahierTexte('');
      }
    } catch (error) {
      console.error('Error fetching cahier texte:', error);
    }
  };

  const handleAttendanceChange = (studentId: string, statut: string) => {
    if (!isEditable) return;
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], statut }
    }));
  };

  const handleRemarqueChange = (studentId: string, remarque: string) => {
    if (!isEditable) return;
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarque }
    }));
  };

  const saveAttendance = async () => {
    if (!token || !selectedSeance || !isEditable) return;
    setSavingPresence(true);
    try {
      const payload = {
        seanceId: selectedSeance._id,
        date: selectedDate,
        presences: enrolledStudents.map(s => ({
          inscriptionId: s._id,
          statut: attendance[s._id]?.statut || 'Present',
          remarque: attendance[s._id]?.remarque || ''
        }))
      };

      const res = await fetch(API_ENDPOINTS.SAVE_PRESENCE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Save Cahier de texte
      await fetch(`${BASE_URL}/teacher-presences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          seanceId: selectedSeance._id,
          date: selectedDate,
          cahierTexte: cahierTexte
        })
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert('Succès', lang === 'ar' ? 'تم تسجيل الحضور بنجاح' : 'Appel enregistré avec succès !');
        fetchExistingPresence();
      } else {
        Alert.alert('Erreur', data.message || 'Impossible d\'enregistrer l\'appel');
      }
    } catch (error) {
      console.error('Error saving presence:', error);
      Alert.alert('Erreur', 'Erreur réseau');
    } finally {
      setSavingPresence(false);
    }
  };

  const handleCompleteSession = async () => {
    Alert.alert(
      t.completeTitle,
      t.completeConfirm,
      [
        { text: lang === 'ar' ? 'إلغاء' : 'Annuler', style: 'cancel' },
        { 
          text: t.complete, 
          style: 'destructive',
          onPress: async () => {
            setIsCompleting(true);
            try {
              const res = await fetch(API_ENDPOINTS.COMPLETE_SESSION(id as string), {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (data.success) {
                Alert.alert('Succès', t.completeSuccess);
                fetchSessionDetails(true); // Re-fetch to update status
              } else {
                Alert.alert('Erreur', data.message || 'Erreur lors de la clôture');
              }
            } catch (error) {
              console.error('Complete session error:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            } finally {
              setIsCompleting(false);
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessionDetails(true);
  };

  const handleUpload = async (chapitreId: string, chapitreTitre: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];

      setUploading(chapitreId);

      const formData = new FormData();
      formData.append('fichier', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);

      formData.append('titre', `${file.name}`);
      formData.append('sessionId', id as string);
      if (chapitreId) formData.append('chapitreId', chapitreId);
      formData.append('statut', 'Publié');

      const response = await fetch(API_ENDPOINTS.UPLOAD_COURS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Succès', 'Le fichier a été uploadé avec succès');
        // Rafraîchir les cours
        const coursesRes = await fetch(API_ENDPOINTS.GET_SESSION_COURS(id as string), { headers: { 'Authorization': `Bearer ${token}` } });
        const coursesData = await coursesRes.json();
        if (coursesData.success) setCourses(coursesData.data);
      } else {
        Alert.alert('Erreur', data.message || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue pendant l\'upload');
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={{ color: theme.mutedColor, marginTop: 16 }}>{t.loading}</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.textColor }}>{t.error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.accent }}>{t.back}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderChapter = (chapitre: any, index: number) => {
    const isOdd = index % 2 !== 0;
    const chapitreId = chapitre._id?.toString() || (chapitre.matiere?._id || chapitre.matiere)?.toString();
    const chapitreTitre = chapitre.titre || chapitre.nomMatiere || 'Chapitre';
    
    const chapterCourses = [
      ...courses.filter(c => {
        const courseChapRef = c.chapitreRef?.toString();
        const courseMatId = (c.matiere?._id || c.matiere)?.toString();
        const targetChapId = chapitre._id?.toString();
        const targetMatId = (chapitre.matiere?._id || chapitre.matiere)?.toString();
        return (courseChapRef && courseChapRef === targetChapId) || 
               (courseMatId && courseMatId === targetMatId);
      }),
      ...(session.coursPublies || [])
        .filter((cp: any) => cp.titreCours.toLowerCase().includes(chapitreTitre.toLowerCase()))
        .map((cp: any) => ({
          titre: cp.titreCours,
          fichier: cp.urlFichier,
          isLegacy: true
        }))
    ];

    return (
      <View key={index} style={[styles.chapterBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={[styles.chapterHeader, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.chapterBadge, { backgroundColor: isOdd ? theme.accent : theme.itemBg }]}>
            <Text style={{ color: isOdd ? '#fff' : theme.accent, fontWeight: 'bold' }}>{index + 1}</Text>
          </View>
          <Text style={[styles.chapterTitle, { color: theme.textColor, flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
            {chapitreTitre}
          </Text>
        </View>

        {chapterCourses.length > 0 && (
          <View style={styles.filesContainer}>
            {chapterCourses.map((cours, idx) => (
               <TouchableOpacity 
                 key={idx} 
                 style={[styles.fileRow, isRTL && { flexDirection: 'row-reverse' }, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}
                 onPress={() => {
                   const rawPath = cours.fichier || (cours.materiel && cours.materiel[0]?.url);
                   if (!rawPath) {
                     Alert.alert('Info', 'Aucun fichier associé à ce document');
                     return;
                   }
                   const fileUrl = rawPath.startsWith('http') ? rawPath : `${SERVER_URL}${rawPath}`;
                   Linking.openURL(fileUrl).catch(err => {
                     console.error('Failed to open URL:', fileUrl, err);
                     Alert.alert('Erreur', 'Impossible d\'ouvrir le fichier');
                   });
                 }}
               >
                 <Ionicons name="document-text-outline" size={20} color={theme.accent} />
                 <Text style={[styles.fileName, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                   {cours.titre || 'Document'}
                 </Text>
               </TouchableOpacity>
            ))}
          </View>
        )}
        
        <View style={styles.resourcesContainer}>
          <Text style={[styles.resourceCount, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>
            {chapterCourses.length} {t.resources}
          </Text>
          
          <TouchableOpacity 
            style={[styles.uploadBtn, isRTL && { flexDirection: 'row-reverse' }]}
            onPress={() => handleUpload(chapitreId, chapitreTitre)}
            disabled={uploading === chapitreId}
          >
            {uploading === chapitreId ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={16} color={theme.accent} />
                <Text style={[styles.uploadBtnText, { color: theme.accent }]}>Upload</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.heroHeader}>
        <ImageBackground 
          source={session.imageCouverture ? { uri: `${SERVER_URL}${session.imageCouverture}` } : require('../../assets/images/quran_header.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', backgroundColor: 'rgba(0,0,0,0.4)' }} />
        </ImageBackground>
        
        <TouchableOpacity 
          style={[styles.backBtn, isRTL && { flexDirection: 'row-reverse', right: 20, left: undefined }]}
          onPress={() => router.back()}
        >
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color="#fff" />
          <Text style={styles.backBtnText}>{t.back}</Text>
        </TouchableOpacity>

        {(user?.role === 'teacher' || user?.role === 'admin') && session.statut !== 'Terminée' && (
          <TouchableOpacity 
            style={[styles.completeBtn, isRTL && { flexDirection: 'row-reverse', left: 20, right: undefined }]}
            onPress={handleCompleteSession}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator size="small" color="#D4AF37" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle-outline" size={20} color="#D4AF37" />
                <Text style={[styles.backBtnText, { color: '#D4AF37', marginLeft: 6, marginRight: 6 }]}>{t.complete}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {session.statut === 'Terminée' && (
          <View style={[styles.statusBadge, isRTL ? { left: 16 } : { right: 16 }, { top: Platform.OS === 'ios' ? 50 : 30 }]}>
             <Ionicons name="checkmark-circle" size={14} color="#D4AF37" />
             <Text style={styles.statusBadgeText}>{t.statusTerminee}</Text>
          </View>
        )}

        <View style={styles.heroContent}>
          <View style={styles.titleContainer}>
             <Text style={styles.heroTitle}>{session.nomSession}</Text>
          </View>

          <View style={styles.heroTags}>
            {session.classe && (
              <View style={styles.heroTag}>
                <Ionicons name="school-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.heroTagText}>
                  {Array.isArray(session.classe) ? session.classe[0].nomClasse : session.classe.nomClasse}
                </Text>
              </View>
            )}
            <View style={styles.heroTag}>
              <Ionicons name="time-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.heroTagText}>{session.duree}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.contentWrapper, { backgroundColor: theme.bg }]}>
        <View style={[styles.navRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity 
            onPress={() => setActiveNav('program')}
            style={[styles.navItem, activeNav === 'program' && { borderBottomColor: theme.accent }]}
          >
            <Ionicons name="book-outline" size={16} color={activeNav === 'program' ? theme.accent : theme.mutedColor} />
            <Text style={[styles.navText, { color: activeNav === 'program' ? theme.accent : theme.mutedColor }]}>{t.program}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveNav('students')}
            style={[styles.navItem, activeNav === 'students' && { borderBottomColor: theme.accent }]}
          >
            <Ionicons name="people-outline" size={16} color={activeNav === 'students' ? theme.accent : theme.mutedColor} />
            <Text style={[styles.navText, { color: activeNav === 'students' ? theme.accent : theme.mutedColor }]}>{t.students}</Text>
          </TouchableOpacity>
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <TouchableOpacity 
              onPress={() => setActiveNav('call')}
              style={[styles.navItem, activeNav === 'call' && { borderBottomColor: theme.accent }]}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color={activeNav === 'call' ? theme.accent : theme.mutedColor} />
              <Text style={[styles.navText, { color: activeNav === 'call' ? theme.accent : theme.mutedColor }]}>{t.call}</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} tintColor={theme.accent} />
          }
        >
          {activeNav === 'program' && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>
                {t.chapterTitle}
              </Text>

              {session.programme && session.programme.length > 0 ? (
                session.programme.map((chap: any, idx: number) => renderChapter(chap, idx))
              ) : (
                <Text style={{ color: theme.mutedColor, textAlign: 'center', marginTop: 40 }}>
                  Aucun chapitre disponible.
                </Text>
              )}
            </>
          )}

          {activeNav === 'students' && (
            <View>
               <Text style={[styles.sectionTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>
                  {t.students} ({enrolledStudents.length})
               </Text>
               {enrolledStudents.map((item) => (
                 <View key={item._id} style={[styles.studentCard, { backgroundColor: theme.cardBg, borderColor: theme.border }, isRTL && { flexDirection: 'row-reverse' }]}>
                    <View style={[styles.miniAvatar, { backgroundColor: theme.itemBg }]}>
                       {item.etudiant?.profileImage ? (
                         <Image source={{ uri: `${SERVER_URL}${item.etudiant.profileImage}` }} style={styles.miniAvatarImg} />
                       ) : (
                         <Text style={[styles.miniAvatarText, { color: theme.accent }]}>{item.etudiant?.firstName?.[0]}{item.etudiant?.lastName?.[0]}</Text>
                       )}
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                       <Text style={[styles.studentName, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>
                         {item.etudiant?.firstName} {item.etudiant?.lastName}
                       </Text>
                       <Text style={[styles.studentEmail, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>
                         {item.etudiant?.email}
                       </Text>
                    </View>
                    <Ionicons name="chatbubble-outline" size={20} color={theme.accent} />
                 </View>
               ))}
               {enrolledStudents.length === 0 && (
                 <Text style={{ textAlign: 'center', color: theme.mutedColor, marginTop: 40 }}>Aucun étudiant inscrit.</Text>
               )}
            </View>
          )}

          {activeNav === 'call' && (
            <View>
                {/* Smart Occurrence Picker (Combined Date + Seance) */}
                <View style={styles.datePickerContainer}>
                   <Text style={[styles.pickerLabel, { color: theme.mutedColor, marginBottom: 12 }]}>
                     {lang === 'ar' ? 'اختر الحصة' : 'Choisir la séance'}
                   </Text>
                   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.dateRow, isRTL && { flexDirection: 'row-reverse' }]}>
                      {getOccurrences().map((occ, i) => {
                        const isSelected = selectedDate === occ.date && selectedSeance?._id === occ.seance._id;
                        
                        return (
                          <TouchableOpacity 
                            key={`${occ.date}-${occ.seance._id}`}
                            onPress={() => {
                              setSelectedDate(occ.date);
                              setSelectedSeance(occ.seance);
                            }}
                            style={[
                              styles.occBtn, 
                              { borderColor: theme.border }, 
                              isSelected && { backgroundColor: theme.accent, borderColor: theme.accent }
                            ]}
                          >
                            <Text style={[styles.occLabel, { color: isSelected ? '#fff' : theme.mutedColor }]}>{occ.label}</Text>
                            <Text style={[styles.occTime, { color: isSelected ? '#fff' : theme.textColor }]}>{occ.seance.heureDebut}</Text>
                            <Text style={[styles.occMatiere, { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.mutedColor }]} numberOfLines={1}>
                              {occ.seance.matiere?.nomMatiere || (lang === 'ar' ? 'حصة' : 'Séance')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                   </ScrollView>
                </View>

                {/* Status Bar for 48h Lock */}
                {selectedSeance && (
                    <View style={[
                        styles.statusBanner, 
                        { backgroundColor: isEditable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                    ]}>
                        <Ionicons 
                            name={isEditable ? "checkmark-circle" : "key"} 
                            size={16} 
                            color={isEditable ? "#10B981" : "#ef4444"} 
                        />
                        <Text style={[styles.statusBannerTxt, { color: isEditable ? "#10B981" : "#ef4444" }]}>
                            {isEditable 
                                ? (lang === 'ar' ? 'يمكنك تعديل الحضور (48 ساعة)' : 'Modifiable — Fenêtre de 48h active')
                                : (lang === 'ar' ? 'مغلق (تجاوزت 48 ساعة)' : 'Verrouillé — Délai de 48h dépassé')}
                        </Text>
                    </View>
                )}

                {fetchingStudents ? (
                   <ActivityIndicator size="small" color={theme.accent} style={{ marginVertical: 30 }} />
                ) : (
                  <View style={[styles.callTable, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                     {/* Table Header */}
                     <View style={[styles.tableHeader, { borderBottomColor: theme.border }, isRTL && { flexDirection: 'row-reverse' }]}>
                       <Text style={[styles.headerCol, { flex: 1, color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>
                         {lang === 'ar' ? 'اسم الطالب' : 'Étudiant'}
                       </Text>
                       <Text style={[styles.headerCol, { width: 120, color: theme.mutedColor, textAlign: 'center' }]}>
                         {lang === 'ar' ? 'الحالة' : 'Statut'}
                       </Text>
                     </View>

                     {enrolledStudents.map((s, idx) => (
                       <View key={s._id} style={[styles.tableRow, { borderBottomColor: idx === enrolledStudents.length - 1 ? 'transparent' : theme.border, opacity: isEditable ? 1 : 0.5 }]}>
                         <View style={[styles.rowMain, isRTL && { flexDirection: 'row-reverse' }]}>
                           <View style={{ flex: 1.2 }}>
                               <Text style={[styles.studentName, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>
                                 {s.etudiant?.firstName} {s.etudiant?.lastName}
                               </Text>
                           </View>

                           <View style={{ flex: 2, marginHorizontal: 8 }}>
                             <TextInput 
                               style={[styles.remarqueTableInputInline, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}
                               placeholder={lang === 'ar' ? 'ملاحظة...' : 'Note...'}
                               placeholderTextColor={theme.mutedColor}
                               value={attendance[s._id]?.remarque || ''}
                               onChangeText={(text) => handleRemarqueChange(s._id, text)}
                               editable={isEditable}
                             />
                           </View>
                           
                           <View style={[styles.callActions, { width: 110 }, isRTL && { flexDirection: 'row-reverse' }]}>
                               <TouchableOpacity 
                                 onPress={() => handleAttendanceChange(s._id, 'Present')}
                                 disabled={!isEditable}
                                 style={[styles.callBtn, { borderColor: isEditable ? '#10B981' : '#ccc' }, attendance[s._id]?.statut === 'Present' && { backgroundColor: isEditable ? '#10B981' : '#888' }]}
                               >
                                 <Text style={[styles.callBtnText, { color: attendance[s._id]?.statut === 'Present' ? '#fff' : (isEditable ? '#10B981' : '#888') }]}>P</Text>
                               </TouchableOpacity>
                               <TouchableOpacity 
                                 onPress={() => handleAttendanceChange(s._id, 'Absent')}
                                 disabled={!isEditable}
                                 style={[styles.callBtn, { borderColor: isEditable ? '#ef4444' : '#ccc' }, (attendance[s._id]?.statut === 'Absent' || !attendance[s._id]?.statut) && { backgroundColor: isEditable ? '#ef4444' : '#888' }]}
                               >
                                 <Text style={[styles.callBtnText, { color: (attendance[s._id]?.statut === 'Absent' || !attendance[s._id]?.statut) ? '#fff' : (isEditable ? '#ef4444' : '#888') }]}>A</Text>
                               </TouchableOpacity>
                               <TouchableOpacity 
                                 onPress={() => handleAttendanceChange(s._id, 'Retard')}
                                 disabled={!isEditable}
                                 style={[styles.callBtn, { borderColor: isEditable ? '#f59e0b' : '#ccc' }, attendance[s._id]?.statut === 'Retard' && { backgroundColor: isEditable ? '#f59e0b' : '#888' }]}
                               >
                                 <Text style={[styles.callBtnText, { color: attendance[s._id]?.statut === 'Retard' ? '#fff' : (isEditable ? '#f59e0b' : '#888') }]}>R</Text>
                               </TouchableOpacity>
                           </View>
                         </View>
                       </View>
                     ))}
                  </View>
                )}

                {/* Cahier de Texte Section */}
                <View style={[styles.cahierContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <Text style={[styles.sectionTitle, { color: theme.textColor, marginBottom: 12, fontSize: 16 }]}>
                    {lang === 'ar' ? 'دفتر النصوص' : 'Cahier de Texte'}
                  </Text>
                  
                  {/* Smart Tags */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tagsRow, isRTL && { flexDirection: 'row-reverse' }]}>
                    {SMART_TAGS.map((tag) => (
                      <TouchableOpacity 
                        key={tag} 
                        style={[styles.tagBtn, { backgroundColor: theme.itemBg }]}
                        onPress={() => handleSmartTag(tag)}
                      >
                        <Text style={[styles.tagBtnText, { color: theme.accent }]}>{tag}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TextInput
                    style={[styles.cahierInput, { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', 
                      color: theme.textColor,
                      textAlign: isRTL ? 'right' : 'left'
                    }]}
                    placeholder={lang === 'ar' ? 'ماذا درّست اليوم؟' : 'Qu\'avez-vous enseigné aujourd\'hui ?'}
                    placeholderTextColor={theme.mutedColor}
                    multiline
                    numberOfLines={4}
                    value={cahierTexte}
                    onChangeText={setCahierTexte}
                    editable={isEditable}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.saveCallBtn, { backgroundColor: theme.accent, opacity: (!isEditable || savingPresence) ? 0.4 : 1 }]} 
                  onPress={saveAttendance}
                  disabled={!isEditable || savingPresence}
                >
                   {savingPresence ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveCallBtnText}>{t.call}</Text>}
                </TouchableOpacity>

                {!isEditable && (
                  <View style={styles.lockInfo}>
                     <Ionicons name="lock-closed" size={14} color="#ef4444" />
                     <Text style={styles.lockText}>Modification verrouillée après 48h</Text>
                  </View>
                )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroHeader: {
    height: 340,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  backBtnText: {
    color: '#fff',
    marginLeft: 4,
    marginRight: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  heroContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 60,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    lineHeight: 36,
  },
  heroTags: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  heroTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  completeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },
  statusBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4AF37',
    zIndex: 10,
  },
  statusBadgeText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  contentWrapper: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 8,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  chapterBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chapterBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  resourcesContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceCount: {
    fontSize: 13,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 138, 93, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 6,
  },
  filesContainer: {
    paddingVertical: 8,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
    fontSize: 14,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  miniAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniAvatarImg: {
    width: '100%',
    height: '100%',
  },
  miniAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  studentName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  studentEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  datePickerContainer: {
    marginBottom: 24,
  },
  dateRow: {
    paddingRight: 20,
  },
  occBtn: {
    width: 100,
    height: 90,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  occLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  occTime: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  occMatiere: {
    fontSize: 9,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
    gap: 8,
  },
  statusBannerTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  callTable: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderBottomWidth: 1,
  },
  headerCol: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  callActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  remarqueTableInputInline: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '600',
    minWidth: 100,
  },
  saveCallBtn: {
    height: 55,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  saveCallBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  cahierContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  tagsRow: {
    paddingBottom: 12,
    gap: 8,
  },
  tagBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cahierInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
