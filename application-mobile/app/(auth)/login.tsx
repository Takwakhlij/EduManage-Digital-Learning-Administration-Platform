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
  Image,
  StatusBar,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { API_ENDPOINTS } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const InputField = ({ label, icon, value, onChangeText, theme, isRTL, children, ...props }: any) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={[styles.inputGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
      <Text style={[styles.label, { color: theme.labelColor }]}>{label}</Text>
      <TouchableOpacity 
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputRow,
          { backgroundColor: theme.inputBg, borderColor: focused ? theme.accent : theme.border },
          focused && { shadowColor: theme.accent, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
          isRTL && { flexDirection: 'row-reverse' },
        ]}
      >
        {icon && <Text style={styles.inputIcon}>{icon}</Text>}
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}
          placeholderTextColor={theme.placeholderColor}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {children}
      </TouchableOpacity>
    </View>
  );
};

// ── Translations ──
const TRANSLATIONS = {
  fr: {
    title: 'Connexion',
    subtitle: 'Accédez à vos cours et ressources islamiques',
    emailLabel: 'ADRESSE EMAIL',
    emailPlaceholder: 'votre.email@exemple.com',
    passwordLabel: 'MOT DE PASSE',
    passwordPlaceholder: 'Entrez votre mot de passe',
    loginButton: 'Se connecter',
    noAccount: "Vous n'avez pas de compte ?",
    register: "S'inscrire",
    errorEmpty: 'Veuillez remplir tous les champs',
    errorServer: 'Impossible de contacter le serveur.',
    errorCreds: 'Identifiants incorrects',
    arabicName: 'الجمعية القرآنية',
    assocName: 'Association Coranique',
    slogan: "Pour l'apprentissage et la mémorisation du Saint Coran",
    quoteTranslation: "«Et dis : Ô mon Seigneur, accroît mes connaissances !»",
    quoteRef: '— Sourate Taha 20:114',
  },
  ar: {
    title: 'تسجيل الدخول',
    subtitle: 'ادخل إلى دروسك ومواردك الإسلامية',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'بريدك@مثال.com',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    loginButton: 'دخول',
    noAccount: 'ليس لديك حساب؟',
    register: 'سجّل هنا',
    errorEmpty: 'الرجاء ملء جميع الحقول',
    errorServer: 'تعذّر الاتصال بالخادم.',
    errorCreds: 'بيانات الدخول غير صحيحة',
    arabicName: 'الجمعية القرآنية',
    assocName: 'الجمعية القرآنية',
    slogan: 'لتعلم القرآن الكريم وحفظه',
    quoteTranslation: '«وَقُل رَّبِّ زِدْنِي عِلْمًا»',
    quoteRef: '— سورة طه ٢٠:١١٤',
  },
  en: {
    title: 'Login',
    subtitle: 'Access your Islamic courses and resources',
    emailLabel: 'EMAIL ADDRESS',
    emailPlaceholder: 'your.email@example.com',
    passwordLabel: 'PASSWORD',
    passwordPlaceholder: 'Enter your password',
    loginButton: 'Sign In',
    noAccount: "Don't have an account?",
    register: 'Register here',
    errorEmpty: 'Please fill in all fields',
    errorServer: 'Unable to reach the server.',
    errorCreds: 'Invalid credentials',
    arabicName: 'الجمعية القرآنية',
    assocName: 'Quranic Association',
    slogan: 'For the learning and memorization of the Holy Quran',
    quoteTranslation: '"And say: My Lord, increase me in knowledge!"',
    quoteRef: '— Surah Ta-Ha 20:114',
  },
};

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇩🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  const router = useRouter();
  const { login, isDark, toggleTheme, lang, changeLanguage } = useAuth();
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', t.errorEmpty);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        // Au lieu de juste rediriger, on sauvegarde l'utilisateur et le token
        // La redirection se fera automatiquement grace au _layout.tsx
        const userData = { ...data };
        delete userData.token; // Optionnel: enlever le token de l'objet user
        await login(userData, data.token);
      } else {
        Alert.alert('Erreur', data.message || t.errorCreds);
      }
    } catch {
      Alert.alert('Erreur', t.errorServer);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.bg }]}
      enabled={Platform.OS === 'ios'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Decorative rings - Temporairement désactivés pour test
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.ring1, { borderColor: theme.ringColor }]} />
        <View style={[styles.ring2, { borderColor: theme.ringColor }]} />
        <View style={[styles.ring3, { borderColor: theme.ringColor }]} />
      </View>
      */}

      {/* ── Top Bar: Language + Theme ── */}
      <View style={styles.topBar}>
        {/* Language Button */}
        <TouchableOpacity
          style={[styles.topBarBtn, { backgroundColor: theme.btnSurface, borderColor: theme.border }]}
          onPress={() => setShowLangModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="language-outline" size={16} color={theme.labelColor} />
          <Text style={[styles.topBarBtnText, { color: theme.labelColor }]}>
            {lang.toUpperCase()}
          </Text>
        </TouchableOpacity>

        {/* Dark / Light Toggle */}
        <TouchableOpacity
          style={[styles.topBarBtn, { backgroundColor: theme.btnSurface, borderColor: theme.border }]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Text style={styles.topBarFlag}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Language Modal ── */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLangModal(false)}
        >
          <View style={[styles.langModal, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.langModalTitle, { color: theme.titleColor }]}>
              Langue / اللغة / Language
            </Text>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[
                  styles.langItem,
                  lang === l.code && { backgroundColor: theme.accent + '22' },
                  { borderColor: lang === l.code ? theme.accent : 'transparent' },
                ]}
                onPress={() => { changeLanguage(l.code as 'fr' | 'ar' | 'en'); setShowLangModal(false); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.langLabel, { color: lang === l.code ? theme.accent : theme.textColor }]}>
                  {l.label}
                </Text>
                {lang === l.code && <Text style={[styles.langCheck, { color: theme.accent }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <View>

          {/* ── Logo + Identity ── */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.arabicName, { color: theme.titleColor }]}>
              {t.arabicName}
            </Text>
            <Text style={[styles.assocName, { color: theme.subtitleColor }]}>
              {t.assocName}
            </Text>
            <View style={styles.dividerRow}>
              <Text style={[styles.diamond, { color: theme.accent }]}>◆</Text>
              <View style={[styles.divLine, { backgroundColor: theme.accent + '80' }]} />
              <Text style={[styles.diamond, { color: theme.accent }]}>◆</Text>
            </View>
            <Text style={[styles.slogan, { color: theme.mutedColor }]}>{t.slogan}</Text>
          </View>

          {/* ── Quran Quote ── */}
          <View style={[styles.quoteCard, { backgroundColor: theme.quoteBg, borderColor: theme.accent + '33' }]}>
            <Text style={[styles.quoteArabic, { color: theme.quoteTextColor }]}>
              وَقُل رَّبِّ زِدْنِي عِلْمًا
            </Text>
            <Text style={[styles.quoteTranslation, { color: theme.mutedColor }]}>
              {t.quoteTranslation}
            </Text>
            <Text style={[styles.quoteRef, { color: theme.linkColor }]}>{t.quoteRef}</Text>
          </View>

          {/* ── Form Card ── */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.formTitle, { color: theme.titleColor, textAlign: isRTL ? 'right' : 'center' }]}>
              {t.title}
            </Text>
            <Text style={[styles.formSubtitle, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'center' }]}>
              {t.subtitle}
            </Text>
            <InputField 
              label={t.emailLabel} 
              icon="✉️" 
              value={email} 
              onChangeText={setEmail} 
              placeholder={t.emailPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              theme={theme}
              isRTL={isRTL}
            />

            <InputField 
              label={t.passwordLabel} 
              icon="🔒" 
              value={password} 
              onChangeText={setPassword} 
              placeholder={t.passwordPlaceholder}
              secureTextEntry={!showPassword}
              theme={theme}
              isRTL={isRTL}
            >
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)} 
                style={styles.eyeBtn}
              >
                <Text style={{ fontSize: 16, opacity: 0.6 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </InputField>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.accent }, loading && { opacity: 0.65 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>{t.loginButton}</Text>
              }
            </TouchableOpacity>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.footerText, { color: theme.mutedColor }]}>{t.noAccount} </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={[styles.footerLink, { color: theme.linkColor }]}>{t.register}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Themes ──
const darkTheme = {
  bg: '#0a0b0bff',
  cardBg: 'rgba(21, 21, 21, 0.34)',
  inputBg: 'rgba(13, 14, 14, 0.15)',
  quoteBg: 'rgba(27, 74, 42, 0.15)',
  border: 'rgba(245, 241, 241, 0.05)',
  accent: 'rgba(99, 160, 134, 0.1)',
  titleColor: '#e8f5ef',
  subtitleColor: 'rgba(255,255,255,0.75)',
  textColor: '#e2e8f0',
  mutedColor: 'rgba(255,255,255,0.45)',
  labelColor: '#c7ccc9cf',
  placeholderColor: '#96989795',
  quoteTextColor: '#f0ead6',
  ringColor: 'rgba(26,138,94,0.12)',
  btnSurface: 'rgba(20, 40, 30, 0.33)',
  linkColor: '#aebfb4ff', // Vert clair pour les textes cliquables en dark mode
};

const lightTheme = {
  bg: '#f4f7f5',
  cardBg: '#ffffff',
  inputBg: '#f8faf9',
  quoteBg: 'rgba(13, 95, 71, 0.06)',
  border: 'rgba(0,0,0,0.09)',
  accent: '#113e2eba',
  titleColor: '#0a2e1e',
  subtitleColor: '#4b7a6a',
  textColor: '#111827',
  mutedColor: '#6b7280',
  labelColor: '#374151',
  placeholderColor: '#9ca3af',
  quoteTextColor: '#1a3a2a',
  ringColor: 'rgba(13,107,72,0.1)',
  btnSurface: 'rgba(240,248,244,0.95)',
  linkColor: '#113e2eba',
};

// ── Styles ──
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Decorative rings
  ring1: { position: 'absolute', top: -90, right: -90, width: 280, height: 280, borderRadius: 140, borderWidth: 1 },
  ring2: { position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: 90, borderWidth: 1 },
  ring3: { position: 'absolute', bottom: -110, left: -110, width: 340, height: 340, borderRadius: 170, borderWidth: 1 },

  // Top bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: 4, zIndex: 10 },
  topBarBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  topBarFlag: { fontSize: 16 },
  topBarBtnText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  langModal: { width: width * 0.78, borderRadius: 18, borderWidth: 1, padding: 20, gap: 4 },
  langModalTitle: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 12, opacity: 0.7 },
  langItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, marginVertical: 3 },
  langFlag: { fontSize: 22 },
  langLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
  langCheck: { fontSize: 16, fontWeight: '800' },

  // Scroll
  scroll: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 36 },

  // Header
  header: { alignItems: 'center', marginBottom: 18 },
  logoWrapper: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  logo: { width: 100, height: 100 },
  arabicName: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 3, writingDirection: 'rtl' },
  assocName: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 10, letterSpacing: 0.4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: 130, marginBottom: 8 },
  divLine: { flex: 1, height: 1, marginHorizontal: 6 },
  diamond: { fontSize: 7 },
  slogan: { fontSize: 11, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 24, lineHeight: 17 },

  // Quote
  quoteCard: { borderRadius: 13, borderWidth: 1, padding: 14, marginBottom: 18, alignItems: 'center' },
  quoteArabic: { fontSize: 19, textAlign: 'center', writingDirection: 'rtl', lineHeight: 30, marginBottom: 6, fontWeight: '600' },
  quoteTranslation: { fontSize: 11, textAlign: 'center', fontStyle: 'italic', lineHeight: 17 },
  quoteRef: { fontSize: 10, textAlign: 'center', marginTop: 4, fontStyle: 'italic' },

  // Card
  card: { borderRadius: 20, borderWidth: 1, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10 },
  formTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4, letterSpacing: 0.2 },
  formSubtitle: { fontSize: 12, marginBottom: 22, lineHeight: 18 },

  // Input
  inputGroup: { marginBottom: 15, width: '100%' },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 7, letterSpacing: 0.6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, height: 50 },
  inputIcon: { fontSize: 16, marginRight: 8, opacity: 0.7 },
  input: { flex: 1, fontSize: 14, height: 50 },
  eyeBtn: { padding: 4, marginLeft: 6 },

  // Submit
  submitBtn: { borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 6, marginHorizontal: 50, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // Footer
  footer: { justifyContent: 'center', alignItems: 'center', marginTop: 18, paddingTop: 15, borderTopWidth: 1 },
  footerText: { fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '700' },
});
