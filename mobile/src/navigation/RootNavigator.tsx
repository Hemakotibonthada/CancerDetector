import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../components/shared';

import AuthNavigator from './AuthNavigator';
import PatientNavigator from './PatientNavigator';
import HospitalNavigator from './HospitalNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user.role === 'hospital_admin' || user.role === 'doctor' ? (
        <Stack.Screen name="HospitalPortal" component={HospitalNavigator} />
      ) : user.role === 'admin' || user.role === 'super_admin' ? (
        <Stack.Screen name="AdminPortal" component={AdminNavigator} />
      ) : (
        <Stack.Screen name="PatientPortal" component={PatientNavigator} />
      )}
    </Stack.Navigator>
  );
}
