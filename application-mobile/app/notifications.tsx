import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Platform, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../constants/api';

// --- Thèmes ---
const darkTheme = {
  bg: '#0a0b0b',
  cardBg: '#121414',
  textColor: '#e8f5ef',
  mutedColor: '#8ab5a0',
  accent: '#1a8a5d',
  border: 'rgba(255,255,255,0.06)',
  unreadBg: 'rgba(255,255,255,0.05)',
};

const lightTheme = {
  bg: '#f8fdfa',
  cardBg: '#ffffff',
  textColor: '#0a2e1e',
  mutedColor: '#5a7a6a',
  accent: '#0d6b48',
  border: 'rgba(0,0,0,0.05)',
  unreadBg: '#f0f0f0',
};

function formatTimeAgo(dateStr: string, lang: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);

  if (diffInMins < 1) return lang === 'ar' ? 'الآن' : 'À l\'instant';
  if (diffInMins < 60) return lang === 'ar' ? `منذ ${diffInMins} د` : `Il y a ${diffInMins} min`;
  if (diffInHours < 24) return lang === 'ar' ? `منذ ${diffInHours} سا` : `Il y a ${diffInHours} h`;
  return date.toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { isDark, lang, token } = useAuth();
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = lang === 'ar';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(API_ENDPOINTS.GET_NOTIFICATIONS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_ENDPOINTS.GET_NOTIFICATIONS}/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderNotifItem = ({ item }: { item: any }) => {
    const iconMap: any = {
      absence: { name: 'alert-circle', color: '#ef4444' },
      retard: { name: 'time', color: '#f59e0b' },
      cours: { name: 'book', color: '#10B981' },
      paiement: { name: 'cash', color: '#10B981' },
      systeme: { name: 'settings', color: '#6366f1' },
      default: { name: 'notifications', color: theme.accent }
    };

    const icon = iconMap[item.type] || iconMap.default;

    return (
      <TouchableOpacity 
        style={[
          styles.notifItem, 
          { borderBottomColor: theme.border },
          !item.isRead && { backgroundColor: theme.unreadBg }
        ]}
        onPress={() => {
          //1. mark as read via API 
          if (!item.isRead) markAsRead(item._id);
          //2. navigate to the correct page (Deep linking)
          if (item.url)
             router.push(item.url as any); // naviagte direct ll page 
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
          <Ionicons name={icon.name as any} size={22} color={icon.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={[styles.notifHeader, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.notifTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.timeText, { color: theme.mutedColor }]}>
              {formatTimeAgo(item.createdAt, lang)}
            </Text>
          </View>
          <Text style={[styles.notifMsg, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotifItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.mutedColor }]}>
                {lang === 'ar' ? 'لا توجد إشعارات' : 'Aucune notification'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: Platform.OS === 'ios' ? 100 : 80,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  notifItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notifContent: { flex: 1 },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: { fontSize: 14, fontWeight: 'bold', flex: 1 },
  timeText: { fontSize: 10, marginLeft: 8 },
  notifMsg: { fontSize: 13, lineHeight: 18 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
