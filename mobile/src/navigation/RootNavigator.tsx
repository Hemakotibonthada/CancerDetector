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
      ) : [
        'hospital_admin', 'doctor', 'nurse', 'oncologist', 'surgeon', 'radiologist', 'pathologist',
        'general_practitioner', 'specialist', 'cardiologist', 'neurologist', 'dermatologist',
        'emergency_physician', 'anesthesiologist', 'lab_technician', 'pharmacist', 'receptionist',
        'support_staff', 'researcher', 'data_analyst', 'insurance_agent',
      ].includes(user.role) ? (
        <Stack.Screen name="HospitalPortal" component={HospitalNavigator} />
      ) : user.role === 'system_admin' || user.role === 'super_admin' ? (
        <Stack.Screen name="AdminPortal" component={AdminNavigator} />
      ) : (
        <Stack.Screen name="PatientPortal" component={PatientNavigator} />
      )}
    </Stack.Navigator>
  );
}
