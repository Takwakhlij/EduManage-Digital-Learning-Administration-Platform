import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, SERVER_URL } from '../../constants/api';
import * as ImagePicker from 'expo-image-picker';

// --- Thèmes ---
const darkTheme = {
  bg: '#0a0b0bff',
  cardBg: '#121414',
  textColor: '#e8f5ef',
  mutedColor: '#8ab5a0',
  accent: '#0c2f21c6',
  border: 'rgba(245, 241, 241, 0.05)',
  itemBg: '#1a2622',
};

const lightTheme = {
  bg: '#f8fdfa',
  cardBg: '#ffffff',
  textColor: '#0a2e1e',
  mutedColor: '#5a7a6a',
  accent: '#0d6b49b3',
  border: 'rgba(0,0,0,0.05)',
  itemBg: '#e8f5ef',
};

// --- Traductions ---
const TRANSLATIONS = {
  fr: {
    title: 'Mon Profil',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    specialization: 'Spécialisation',
    experience: 'Expérience (Années)',
    save: 'Enregistrer les modifications',
    loading: 'Chargement...',
    success: 'Profil mis à jour avec succès',
    error: 'Erreur lors de la mise à jour',
    pickPhoto: 'Changer la photo',
  },
  ar: {
    title: 'ملفي الشخصي',
    firstName: 'الاسم الأول',
    lastName: 'اللقب',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    specialization: 'التخصص',
    experience: 'الخبرة (سنوات)',
    save: 'حفظ التغييرات',
    loading: 'جاري التحميل...',
    success: 'تم تحديث الملف الشخصي بنجاح',
    error: 'خطأ في التحديث',
    pickPhoto: 'تغيير الصورة',
  },
  en: {
    title: 'My Profile',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    specialization: 'Specialization',
    experience: 'Experience (Years)',
    save: 'Save Changes',
    loading: 'Loading...',
    success: 'Profile updated successfully',
    error: 'Error updating profile',
    pickPhoto: 'Change Photo',
  },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, isDark, lang, login } = useAuth();
  const t = TRANSLATIONS[lang as keyof typeof TRANSLATIONS];
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = lang === 'ar';

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [specialization, setSpecialization] = useState(user?.specialization || '');
  const [experience, setExperience] = useState(user?.experience?.toString() || '');
  
  const [profileImage, setProfileImage] = useState<any>(user?.profileImage ? { uri: `${SERVER_URL}${user.profileImage}` } : null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Désolé, nous avons besoin de la permission pour accéder à vos photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `profile_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
        });
        setProfileImage({ uri: asset.uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir la galerie');
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('phoneNumber', phoneNumber);
      
      if (user?.role === 'teacher') {
        formData.append('specialization', specialization);
        formData.append('experience', experience);
      }

      if (selectedFile) {
        formData.append('profileImage', {
          uri: selectedFile.uri,
          name: selectedFile.name || 'profile.jpg',
          type: selectedFile.mimeType || 'image/jpeg',
        } as any);
      }

      const response = await fetch(API_ENDPOINTS.UPDATE_PROFILE, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = { ...user, ...data };
        delete updatedUser.token; 
        await login(updatedUser, token); 
        
        Alert.alert('Succès', t.success);
      } else {
        Alert.alert('Erreur', data.message || t.error);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Erreur', 'Une erreur réseau est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={[styles.avatarWrapper, { borderColor: theme.accent }]} onPress={handlePickImage}>
            {profileImage ? (
              <Image source={profileImage} style={styles.avatar} />
            ) : (
              <View style={[styles.initialsAvatar, { backgroundColor: theme.accent }]}>
                <Text style={styles.avatarText}>{firstName?.[0]}{lastName?.[0]}</Text>
              </View>
            )}
            <View style={[styles.editIcon, { backgroundColor: theme.accent }]}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickImage}>
            <Text style={[styles.pickPhotoText, { color: theme.accent }]}>{t.pickPhoto}</Text>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>{t.firstName}</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.cardBg, color: theme.textColor, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor={theme.mutedColor}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>{t.lastName}</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.cardBg, color: theme.textColor, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>{t.email}</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.cardBg, color: theme.mutedColor, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]}
              value={email}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>{t.phone}</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.cardBg, color: theme.textColor, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          {user?.role === 'teacher' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>{t.specialization}</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: theme.cardBg, color: theme.textColor, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]}
                  value={specialization}
                  onChangeText={setSpecialization}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>{t.experience}</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: theme.cardBg, color: theme.textColor, borderColor: theme.border, textAlign: isRTL ? 'right' : 'left' }]}
                  value={experience}
                  onChangeText={setExperience}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: theme.accent }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{t.save}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    padding: 3,
    marginBottom: 12,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  initialsAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  editIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickPhotoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  saveBtn: {
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
