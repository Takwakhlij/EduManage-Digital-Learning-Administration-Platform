import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useAuth } from '../../context/AuthContext';

// --- Thèmes des onglets ---
const darkTheme = {
  activeTint: '#1a8a5d', // Vert accentué
  inactiveTint: '#8ab5a0',
  bg: '#0a0b0bff',
  border: 'rgba(245, 241, 241, 0.05)',
};

const lightTheme = {
  activeTint: '#0d6b48',
  inactiveTint: '#8ab5a0',
  bg: '#ffffff',
  border: 'rgba(0,0,0,0.09)',
};

const TAB_TRANSLATIONS = {
  fr: { home: 'Accueil', sessions: 'Sessions', planning: 'Planning', presence: 'Présence', profile: 'Profil' },
  ar: { home: 'الرئيسية', sessions: 'الدورات', planning: 'الجدول', presence: 'الحضور', profile: 'ملفي' },
  en: { home: 'Home', sessions: 'Sessions', planning: 'Planning', presence: 'Attendance', profile: 'Profile' },
};

export default function TabLayout() {
  const { isDark, lang } = useAuth();
  const theme = isDark ? darkTheme : lightTheme;
  const t = (TAB_TRANSLATIONS as any)[lang] || TAB_TRANSLATIONS.fr;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.activeTint,
        tabBarInactiveTintColor: theme.inactiveTint,
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.bg,
          borderBottomColor: theme.border,
        },
        headerTitleStyle: {
          color: isDark ? '#e8f5ef' : '#0a2e1e',
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t.home,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: t.sessions,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: t.planning,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="presence"
        options={{
          title: t.presence,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="checkbox" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.profile,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
