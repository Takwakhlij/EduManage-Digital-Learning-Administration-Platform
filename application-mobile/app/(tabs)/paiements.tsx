import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import StudentPaymentHistory from '../../components/student/StudentPaymentHistory';

export default function PaiementsScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0d6645ff" />
      </View>
    );
  }

  // Seul l'étudiant a cet onglet pour l'instant
  if (user?.role === 'student') {
    return <StudentPaymentHistory />;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#0d6645ff" />
    </View>
  );
}
