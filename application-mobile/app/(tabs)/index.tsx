import React from 'react';
import { useAuth } from '../../context/AuthContext';
import TeacherHome from '../../components/teacher/TeacherHome';
import StudentHome from '../../components/student/StudentHome';
import { ActivityIndicator, View } from 'react-native';

export default function HomeScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0d6645ff" />
      </View>
    );
  }

  // Render the appropriate dashboard based on role
  if (user?.role === 'student') {
    return <StudentHome />;
  }

  // Default to Teacher Home (could also add conditions for admin/parent later)
  return <TeacherHome />;
}