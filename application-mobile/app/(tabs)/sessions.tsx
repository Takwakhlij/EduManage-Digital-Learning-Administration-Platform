import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import TeacherSessions from '../../components/teacher/TeacherSessions';
import StudentSessions from '../../components/student/StudentSessions';

export default function SessionsScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0d6645ff" />
      </View>
    );
  }

  if (user?.role === 'student') {
    return <StudentSessions />;
  }

  // Default to Teacher 
  return <TeacherSessions />;
}
