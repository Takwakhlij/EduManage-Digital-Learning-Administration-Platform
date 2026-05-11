import React, { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { API_ENDPOINTS } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// ── Translations ──
const TRANSLATIONS = {
  fr: {
    title: 'Créer un compte',
    subtitle: 'Rejoignez notre communauté d\'apprenants du Saint Coran',
    roleLabel: 'Choisissez votre espace',
    roles: { student: '🎓 Espace Étudiant', teacher: '👨‍🏫 Espace Enseignant', parent: '👨‍👩‍👧 Espace Parent' },
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Adresse Email',
    emailPlaceholder: 'votre.email@exemple.com',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    phone: 'Numéro de téléphone (optionnel)',
    dob: 'Date de naissance (JJ/MM/AAAA)',
    childName: 'Nom et prénom de l\'enfant',
    specialization: 'Spécialisation',
    experience: 'Années d\'expérience',
    registerBtn: 'Créer mon compte',
    hasAccount: 'Vous avez déjà un compte ?',
    login: 'Connectez-vous ici',
    errorEmpty: 'Veuillez remplir tous les champs obligatoires',
    errorPwdMatch: 'Les mots de passe ne correspondent pas',
    errorServer: 'Impossible de contacter le serveur.',
    success: 'Inscription réussie ! En attente de validation.',
    specOptions: { tajweed: 'Tajweed (Tajwid)', hifz: 'Mémorisation (Hifz)', arabic: 'Langue Arabe', fiqh: 'Fiqh (Jurisprudence)' },
    selectSpec: 'Choisissez votre spécialité',
  },
  ar: {
    title: 'إنشاء حساب',
    subtitle: 'انضم إلى مجتمع متعلمي القرآن الكريم',
    roleLabel: 'اختر مساحتك',
    roles: { student: '🎓 فضاء الطالب', teacher: '👨‍🏫 فضاء المعلم', parent: '👨‍👩‍👧 فضاء الولي' },
    firstName: 'الاسم',
    lastName: 'اللقب',
    email: 'البريد الإلكتروني',
    emailPlaceholder: 'بريدك@مثال.com',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    phone: 'رقم الهاتف (اختياري)',
    dob: 'تاريخ الميلاد (يوم/شهر/سنة)',
    childName: 'الاسم واللقب للطفل',
    specialization: 'التخصص',
    experience: 'سنوات الخبرة',
    registerBtn: 'إنشاء حسابي',
    hasAccount: 'لديك حساب بالفعل؟',
    login: 'سجل دخولك هنا',
    errorEmpty: 'الرجاء ملء جميع الحقول الإجبارية',
    errorPwdMatch: 'كلمتا المرور غير متطابقتين',
    errorServer: 'تعذّر الاتصال بالخادم.',
    success: 'تم التسجيل بنجاح! في انتظار التفعيل.',
    specOptions: { tajweed: 'تجويد', hifz: 'حفظ', arabic: 'لغة عربية', fiqh: 'فقه' },
    selectSpec: 'اختر تخصصك',
  },
  en: {
    title: 'Create an Account',
    subtitle: 'Join our community of Holy Quran learners',
    roleLabel: 'Choose your space',
    roles: { student: '🎓 Student Space', teacher: '👨‍🏫 Teacher Space', parent: '👨‍👩‍👧 Parent Space' },
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    emailPlaceholder: 'your.email@example.com',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    phone: 'Phone Number (optional)',
    dob: 'Date of Birth (DD/MM/YYYY)',
    childName: 'Child\'s full name',
    specialization: 'Specialization',
    experience: 'Years of Experience',
    registerBtn: 'Create my account',
    hasAccount: 'Already have an account?',
    login: 'Login here',
    errorEmpty: 'Please fill in all required fields',
    errorPwdMatch: 'Passwords do not match',
    errorServer: 'Unable to reach the server.',
    success: 'Registration successful! Pending validation.',
    specOptions: { tajweed: 'Tajweed', hifz: 'Memorization (Hifz)', arabic: 'Arabic Language', fiqh: 'Fiqh (Jurisprudence)' },
    selectSpec: 'Choose your specialty',
  },
};

const InputField = ({ label, icon, value, onChangeText, theme, isRTL, ...props }: any) => (
  <View style={[styles.inputGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
    <Text style={[styles.label, { color: theme.labelColor }]}>{label}</Text>
    <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }, isRTL && { flexDirection: 'row-reverse' }]}>
      {icon && <Ionicons name={icon} size={18} color={theme.placeholderColor} style={{ marginHorizontal: 8 }} />}
      <TextInput
        style={[styles.input, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}
        placeholderTextColor={theme.placeholderColor}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    </View>
  </View>
);

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
];

export default function RegisterScreen() {
  const [role, setRole] = useState<'student' | 'teacher' | 'parent'>('student');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Role specific fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [childName, setChildName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [showLangModal, setShowLangModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);

  const router = useRouter();
  const { isDark, toggleTheme, lang, changeLanguage } = useAuth();
  const t = TRANSLATIONS[lang];
  const isRTL = lang === 'ar';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start();
  }, []);

  const theme = isDark ? darkTheme : lightTheme;

  const handleDateChange = (text: string) => {
    // Garde uniquement les chiffres
    let cleaned = text.replace(/\D/g, '');
    
    // Limite à 8 chiffres (JJMMAAAA)
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    
    // Formatte en JJ/MM/AAAA au fur et à mesure
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
    }
    
    setDateOfBirth(formatted);
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', t.errorEmpty);
      return;
    }
    
    if (role === 'student' && !dateOfBirth) { Alert.alert('Erreur', t.errorEmpty); return; }
    if (role === 'teacher' && (!specialization || !experience)) { Alert.alert('Erreur', t.errorEmpty); return; }
    if (role === 'parent' && !childName) { Alert.alert('Erreur', t.errorEmpty); return; }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', t.errorPwdMatch);
      return;
    }

    setLoading(true);
    try {
      const userData: any = {
        firstName,
        lastName,
        email,
        password,
        role,
        phoneNumber,
      };

      if (role === 'student') {
        const parts = dateOfBirth.split('/');
        if (parts.length === 3) {
          userData.dateOfBirth = `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert to YYYY-MM-DD
        } else {
          userData.dateOfBirth = dateOfBirth;
        }
      }
      if (role === 'teacher') {
        userData.specialization = specialization;
        userData.experience = experience;
      }
      if (role === 'parent') userData.childName = childName;

      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Succès', t.success);
        router.replace('/login');
      } else {
        Alert.alert('Erreur', data.message || 'Échec de l\'inscription');
      }
    } catch (error) {
      Alert.alert('Erreur', t.errorServer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: theme.bg }]} enabled={Platform.OS === 'ios'}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Decorative rings */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.ring1, { borderColor: theme.ringColor }]} />
        <View style={[styles.ring2, { borderColor: theme.ringColor }]} />
      </View>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={[styles.topBarBtn, { backgroundColor: theme.btnSurface, borderColor: theme.border }]} onPress={() => setShowLangModal(true)} activeOpacity={0.8}>
          <Ionicons name="language-outline" size={16} color={theme.labelColor} />
          <Text style={[styles.topBarBtnText, { color: theme.labelColor }]}>{LANGUAGES.find(l => l.code === lang)?.label}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topBarBtn, { backgroundColor: theme.btnSurface, borderColor: theme.border }]} onPress={toggleTheme} activeOpacity={0.8}>
          <Text style={styles.topBarFlag}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Language Modal ── */}
      <Modal visible={showLangModal} transparent animationType="fade" onRequestClose={() => setShowLangModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLangModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity key={l.code} style={[styles.modalItem, lang === l.code && { backgroundColor: theme.accent + '22' }]} onPress={() => { changeLanguage(l.code as 'fr' | 'ar' | 'en'); setShowLangModal(false); }}>
                <Text style={[styles.modalItemText, { color: lang === l.code ? theme.accent : theme.textColor }]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Role Modal ── */}
      <Modal visible={showRoleModal} transparent animationType="fade" onRequestClose={() => setShowRoleModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRoleModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {(['student', 'teacher', 'parent'] as const).map((r) => (
              <TouchableOpacity key={r} style={[styles.modalItem, role === r && { backgroundColor: theme.accent + '22' }]} onPress={() => { setRole(r); setShowRoleModal(false); }}>
                <Text style={[styles.modalItemText, { color: role === r ? theme.accent : theme.textColor }]}>{t.roles[r]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Specialization Modal ── */}
      <Modal visible={showSpecModal} transparent animationType="fade" onRequestClose={() => setShowSpecModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSpecModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {Object.entries(t.specOptions).map(([key, value]) => (
              <TouchableOpacity key={key} style={[styles.modalItem, specialization === key && { backgroundColor: theme.accent + '22' }]} onPress={() => { setSpecialization(key); setShowSpecModal(false); }}>
                <Text style={[styles.modalItemText, { color: specialization === key ? theme.accent : theme.textColor }]}>{value as string}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
        <View>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.titleColor }]}>{t.title}</Text>
            <Text style={[styles.subtitle, { color: theme.mutedColor }]}>{t.subtitle}</Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            
            {/* Role Selector */}
            <View style={[styles.inputGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.label, { color: theme.labelColor }]}>{t.roleLabel}</Text>
              <TouchableOpacity 
                style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border, justifyContent: 'space-between' }, isRTL && { flexDirection: 'row-reverse' }]} 
                onPress={() => setShowRoleModal(true)}
              >
                <Text style={[{ color: theme.textColor, paddingVertical: 12, paddingHorizontal: 8 }]}>{t.roles[role]}</Text>
                <Ionicons name="chevron-down" size={20} color={theme.placeholderColor} style={{ marginHorizontal: 8 }}/>
              </TouchableOpacity>
            </View>

            {/* Common Fields */}
            <View style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={{ flex: 1, marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }}>
                <InputField label={t.firstName} icon="person-outline" value={firstName} onChangeText={setFirstName} placeholder="Ex: Ahmed" theme={theme} isRTL={isRTL} />
              </View>
              <View style={{ flex: 1 }}>
                <InputField label={t.lastName} icon="person-outline" value={lastName} onChangeText={setLastName} placeholder="Ex: Ben Salah" theme={theme} isRTL={isRTL} />
              </View>
            </View>

            <InputField label={t.email} icon="mail-outline" value={email} onChangeText={setEmail} placeholder={t.emailPlaceholder} keyboardType="email-address" autoCapitalize="none" theme={theme} isRTL={isRTL} />
            
            <InputField label={t.phone} icon="call-outline" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="+216 12 345 678" keyboardType="phone-pad" theme={theme} isRTL={isRTL} />

            <View style={[styles.inputGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.label, { color: theme.labelColor }]}>{t.password}</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }, isRTL && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.placeholderColor} style={{ marginHorizontal: 8 }} />
                <TextInput style={[styles.input, { color: theme.textColor, flex: 1, textAlign: isRTL ? 'right' : 'left' }]} placeholder="******" placeholderTextColor={theme.placeholderColor} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 8 }}><Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.placeholderColor} /></TouchableOpacity>
              </View>
            </View>

            <View style={[styles.inputGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.label, { color: theme.labelColor }]}>{t.confirmPassword}</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }, isRTL && { flexDirection: 'row-reverse' }]}>
                <Ionicons name="lock-closed-outline" size={18} color={theme.placeholderColor} style={{ marginHorizontal: 8 }} />
                <TextInput style={[styles.input, { color: theme.textColor, flex: 1, textAlign: isRTL ? 'right' : 'left' }]} placeholder="******" placeholderTextColor={theme.placeholderColor} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 8 }}><Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.placeholderColor} /></TouchableOpacity>
              </View>
            </View>

            {/* Role Specific Fields */}
            {role === 'student' && (
              <InputField 
                label={t.dob} 
                icon="calendar-outline" 
                value={dateOfBirth} 
                onChangeText={handleDateChange} 
                placeholder="DD/MM/YYYY" 
                keyboardType="numeric"
                theme={theme} 
                isRTL={isRTL} 
              />
            )}

            {role === 'parent' && (
              <InputField label={t.childName} icon="people-outline" value={childName} onChangeText={setChildName} placeholder="Ex: Amine Ben Ali" theme={theme} isRTL={isRTL} />
            )}

            {role === 'teacher' && (
              <>
                <View style={[styles.inputGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.label, { color: theme.labelColor }]}>{t.specialization}</Text>
                  <TouchableOpacity 
                    style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border, justifyContent: 'space-between' }, isRTL && { flexDirection: 'row-reverse' }]} 
                    onPress={() => setShowSpecModal(true)}
                  >
                    <Text style={[{ color: specialization ? theme.textColor : theme.placeholderColor, paddingVertical: 12, paddingHorizontal: 8 }]}>
                      {specialization ? (t.specOptions as any)[specialization] : t.selectSpec}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={theme.placeholderColor} style={{ marginHorizontal: 8 }}/>
                  </TouchableOpacity>
                </View>
                <InputField label={t.experience} icon="briefcase-outline" value={experience} onChangeText={setExperience} placeholder="Ex: 5" keyboardType="numeric" theme={theme} isRTL={isRTL} />
              </>
            )}

            {/* Submit */}
            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.accent }, loading && { opacity: 0.65 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t.registerBtn}</Text>}
            </TouchableOpacity>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.footerText, { color: theme.mutedColor }]}>{t.hasAccount} </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={[styles.footerLink, { color: theme.linkColor }]}>{t.login}</Text>
                </TouchableOpacity>
              </Link>
            </View>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Themes (Same as Login) ──
const darkTheme = {
  bg: '#0a0b0bff',
  cardBg: 'rgba(21, 21, 21, 0.34)',
  inputBg: 'rgba(13, 14, 14, 0.15)',
  border: 'rgba(245, 241, 241, 0.05)',
  accent: 'rgba(99, 160, 134, 0.1)', // Adjusted back slightly so text is readable, you can adjust in file
  titleColor: '#e8f5ef',
  subtitleColor: 'rgba(255,255,255,0.75)',
  textColor: '#e2e8f0',
  mutedColor: 'rgba(255,255,255,0.45)',
  labelColor: '#cccfceff',
  placeholderColor: '#4d4e4eff',
  ringColor: 'rgba(26,138,94,0.12)',
  btnSurface: 'rgba(20, 40, 30, 0.26)',
  linkColor: '#aebfb4ff', // Vert clair pour les textes cliquables en dark mode
};

const lightTheme = {
  bg: '#f4f7f5',
  cardBg: '#ffffff',
  inputBg: '#f8faf9',
  border: 'rgba(0,0,0,0.09)',
  accent: '#113e2eba',
  titleColor: '#0a2e1e',
  subtitleColor: '#4b7a6a',
  textColor: '#111827',
  mutedColor: '#6b7280',
  labelColor: '#374151',
  placeholderColor: '#9ca3af',
  ringColor: 'rgba(13,107,72,0.1)',
  btnSurface: 'rgba(240,248,244,0.95)',
  linkColor: '#113e2eba',
};

// ── Styles ──
const styles = StyleSheet.create({
  container: { flex: 1 },
  ring1: { position: 'absolute', top: -90, right: -90, width: 280, height: 280, borderRadius: 140, borderWidth: 1 },
  ring2: { position: 'absolute', bottom: -110, left: -110, width: 340, height: 340, borderRadius: 170, borderWidth: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 4, zIndex: 10 },
  topBarBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  topBarFlag: { fontSize: 16 },
  topBarBtnText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.8, borderRadius: 18, borderWidth: 1, padding: 15, gap: 5 },
  modalItem: { paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10 },
  modalItemText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  scroll: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 36 },
  header: { alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 13, textAlign: 'center' },
  card: { borderRadius: 20, borderWidth: 1, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputGroup: { marginBottom: 15, width: '100%' },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 7, letterSpacing: 0.6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, height: 50 },
  input: { flex: 1, fontSize: 14, paddingHorizontal: 8, height: 50 },
  submitBtn: { borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 10, marginHorizontal: 50, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  footer: { justifyContent: 'center', alignItems: 'center', marginTop: 20, paddingTop: 15, borderTopWidth: 1 },
  footerText: { fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '700' },
});
