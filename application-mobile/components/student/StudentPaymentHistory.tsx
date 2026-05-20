import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../constants/api';

const darkTheme = {
  bg: '#020202ff',
  cardBg: '#1717178c',
  textColor: '#f2f1f1ff',
  mutedColor: '#e7f1ecff',
  accent: '#1179498f',
  border: 'rgba(255, 255, 255, 0.04)',
};

const lightTheme = {
  bg: '#f0f9f4ff',
  cardBg: 'rgba(255, 255, 255, 1)',
  textColor: '#0a2e1e',
  mutedColor: '#5a7a6a',
  accent: '#0d6645ff',
  border: 'rgba(0,0,0,0.06)',
};

export default function StudentPaymentHistory() {
  const { token, isDark, lang } = useAuth();
  const theme = isDark ? darkTheme : lightTheme;
  const isRTL = lang === 'ar';

  const [paiements, setPaiements] = useState<any[]>([]);
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPaiements = useCallback(async () => {
    if (!token) return;
    try {
      // 1. Fetch payments
      const res = await fetch(API_ENDPOINTS.GET_MY_PAIEMENTS, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setPaiements(data.paiements);
      }

      // 2. Fetch inscriptions to get "reste a payer" globally
      const resInsc = await fetch(API_ENDPOINTS.GET_MY_INSCRIPTIONS, { headers: { Authorization: `Bearer ${token}` } });
      const dataInsc = await resInsc.json();
      if (dataInsc.success) {
        setInscriptions(dataInsc.inscriptions);
      }
    } catch (e) {
      console.error('Error fetching payments:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPaiements();
  }, [fetchPaiements]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaiements();
  };

  const totalPaye = paiements.reduce((sum, p) => sum + (p.montant || 0), 0);
  const totalReste = inscriptions.reduce((sum, ins) => sum + (ins.resteAPayer || 0), 0);
  const globalPayeStatus = totalReste === 0 && paiements.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          {isRTL ? 'تاريخ الدفوعات' : 'Historique des Paiements'}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} tintColor={theme.accent} />}
      >
        {/* -- SUMMARY CARDS -- */}
        <View style={[styles.summaryRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
             <Ionicons name="cash-outline" size={24} color="#10b981" style={{ marginBottom: 8 }} />
             <Text style={[styles.summaryVal, { color: theme.textColor }]}>{totalPaye.toFixed(3)}</Text>
             <Text style={[styles.summaryLbl, { color: theme.mutedColor }]}>{isRTL ? 'إجمالي المدفوع' : 'Total Payé (TND)'}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
             <Ionicons name="alert-circle-outline" size={24} color={totalReste > 0 ? '#ef4444' : '#10b981'} style={{ marginBottom: 8 }} />
             <Text style={[styles.summaryVal, { color: theme.textColor }]}>{totalReste.toFixed(3)}</Text>
             <Text style={[styles.summaryLbl, { color: theme.mutedColor }]}>{isRTL ? 'المتبقي للدفع' : 'Reste à Payer (TND)'}</Text>
          </View>
        </View>

        {/* -- SESSIONS STATUS -- */}
        {inscriptions.length > 0 && (
          <View style={styles.section}>
             <Text style={[styles.sectionTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>
               {isRTL ? 'حالة الدورات' : 'Statut par Session'}
             </Text>
             {inscriptions.map((ins, idx) => {
               const st = ins.statutPaiement;
               const stColor = st === 'Payé' ? '#10b981' : st === 'Avance' ? '#f59e0b' : '#ef4444';
               return (
                 <View key={ins._id || idx} style={[styles.sessionStatusRow, { backgroundColor: theme.cardBg, borderColor: theme.border }, isRTL && { flexDirection: 'row-reverse' }]}>
                    <View style={styles.sessionStatusLeft}>
                       <Text style={[styles.sessionName, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>{ins.session?.nomSession}</Text>
                       <Text style={[styles.sessionDet, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>Reste: {ins.resteAPayer?.toFixed(3)} TND</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: `${stColor}15` }]}>
                      <Text style={[styles.badgeTxt, { color: stColor }]}>{st}</Text>
                    </View>
                 </View>
               );
             })}
          </View>
        )}

        {/* -- HISTORY LIST -- */}
        <Text style={[styles.sectionTitle, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left', marginTop: 24 }]}>
          {isRTL ? 'التاريخ' : 'Historique des transactions'}
        </Text>
        
        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />
        ) : paiements.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: theme.border, backgroundColor: theme.cardBg }]}>
            <Ionicons name="receipt-outline" size={32} color={theme.border} />
            <Text style={{ color: theme.mutedColor, marginTop: 8, textAlign: 'center' }}>
              {isRTL ? 'لا توجد مدفوعات مسجلة بعد' : 'Aucun paiement enregistré pour le moment.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {paiements.map((p, idx) => (
              <View key={p._id || idx} style={[styles.paymentCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={[styles.paymentRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <View style={[styles.iconBox, { backgroundColor: `${theme.accent}15` }]}>
                    <Ionicons name={p.modePaiement === 'En Ligne' || p.modePaiement === 'Stripe' ? 'card' : 'cash'} size={20} color={theme.accent} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.sessionName, { color: theme.textColor, textAlign: isRTL ? 'right' : 'left' }]}>{p.session?.nomSession || 'Session'}</Text>
                    <Text style={[styles.paymentDate, { color: theme.mutedColor, textAlign: isRTL ? 'right' : 'left' }]}>
                      {new Date(p.datePaiement || p.createdAt).toLocaleDateString(isRTL ? 'ar' : 'fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                    <Text style={[styles.paymentAmount, { color: theme.textColor }]}>+{p.montant} TND</Text>
                    <Text style={[styles.paymentMode, { color: theme.mutedColor }]}>{p.modePaiement}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  summaryVal: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  summaryLbl: { fontSize: 11, fontWeight: '600' },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  sessionStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  sessionStatusLeft: { flex: 1 },
  sessionName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  sessionDet: { fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeTxt: { fontSize: 11, fontWeight: '800' },
  emptyBox: { padding: 30, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', marginTop: 10 },
  list: { gap: 10 },
  paymentCard: { padding: 14, borderRadius: 16, borderWidth: 1 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  paymentInfo: { flex: 1 },
  paymentDate: { fontSize: 11, marginTop: 4 },
  paymentAmount: { fontSize: 15, fontWeight: '800', color: '#10b981' },
  paymentMode: { fontSize: 11, fontWeight: '600', marginTop: 4 },
});
