import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../constants/api';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as any),
});

// Definition des types pour l'utilisateur
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, authToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isDark: boolean;
  lang: 'fr' | 'ar' | 'en';
  toggleTheme: () => Promise<void>;
  changeLanguage: (newLang: 'fr' | 'ar' | 'en') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Expo Push Notifications (Safe implementation) ──
const registerAndSavePushToken = async (authToken: string) => {
  try {
    if (!Device.isDevice) {
      console.log('[Push] Must use physical device for Push Notifications');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Push] Failed to get push token for push notification!');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    console.log('[Push] Using Project ID:', projectId);

    if (!projectId) {
      console.warn('[Push] No projectId found. Push tokens will not work in Expo Go without a projectId in app.json.');
      // In development/Expo Go, you MUST have a projectId from EAS
      return;
    }

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({
      projectId
    });

    if (pushToken) {
      await fetch(`${SERVER_URL}/api/notifications/save-token`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: pushToken }),
      });
      console.log('[Push] Token saved successfully:', pushToken);
    }
  } catch (err) {
    console.warn('[Push] Registration error:', err);
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [lang, setLang] = useState<'fr' | 'ar' | 'en'>('fr');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${SERVER_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.user || data;
        setUser(updatedUser);
        await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement utilisateur:', error);
    }
  };

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@user');
        const storedToken = await AsyncStorage.getItem('@token');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          registerAndSavePushToken(storedToken);
        }

        const storedTheme = await AsyncStorage.getItem('@isDark');
        if (storedTheme !== null) setIsDark(JSON.parse(storedTheme));

        const storedLang = await AsyncStorage.getItem('@lang');
        if (storedLang) setLang(storedLang as 'fr' | 'ar' | 'en');
      } catch (error) {
        console.error('Erreur lors du chargement des données auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredData();
  }, []);

  const login = async (userData: User, authToken: string) => {
    try {
      await AsyncStorage.setItem('@user', JSON.stringify(userData));
      await AsyncStorage.setItem('@token', authToken);
      setUser(userData);
      setToken(authToken);
      registerForPushNotifications(authToken);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde auth:', error);
    }
  };

  const registerForPushNotifications = (authToken: string) => {
    // Delayed call to ensure everything is ready
    setTimeout(() => registerAndSavePushToken(authToken), 1000);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@user');
      await AsyncStorage.removeItem('@token');
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('@isDark', JSON.stringify(newTheme));
    } catch (error) {
      console.error('Erreur toggle theme:', error);
    }
  };

  const changeLanguage = async (newLang: 'fr' | 'ar' | 'en') => {
    try {
      setLang(newLang);
      await AsyncStorage.setItem('@lang', newLang);
    } catch (error) {
      console.error('Erreur change language:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        refreshUser,
        isDark,
        lang,
        toggleTheme,
        changeLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}
