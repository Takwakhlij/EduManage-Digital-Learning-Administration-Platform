import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import TeacherPlanning from '../../components/teacher/TeacherPlanning';
import StudentPlanning from '../../components/student/StudentPlanning';

export default function PlanningScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0d6645ff" />
      </View>
    );
  }

  if (user?.role === 'student') {
    return <StudentPlanning />;
  }

  // Default to Teacher 
  return <TeacherPlanning />;
}
