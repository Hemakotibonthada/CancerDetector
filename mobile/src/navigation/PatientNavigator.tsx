import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

// Screens
import PatientDashboard from '../screens/patient/PatientDashboard';
import AppointmentsScreen from '../screens/patient/AppointmentsScreen';
import MessagesScreen from '../screens/patient/MessagesScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';
import MedicationsScreen from '../screens/patient/MedicationsScreen';
import VitalSignsScreen from '../screens/patient/VitalSignsScreen';
import HealthRecordsScreen from '../screens/patient/HealthRecordsScreen';
import SymptomsScreen from '../screens/patient/SymptomsScreen';
import BloodTestsScreen from '../screens/patient/BloodTestsScreen';
import CancerRiskScreen from '../screens/patient/CancerRiskScreen';
import TelehealthScreen from '../screens/patient/TelehealthScreen';
import NotificationsScreen from '../screens/patient/NotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#0a0a1a' },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' as const },
};

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="DashboardHome" component={PatientDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="Medications" component={MedicationsScreen} options={{ title: 'Medications' }} />
      <Stack.Screen name="VitalSigns" component={VitalSignsScreen} options={{ title: 'Vital Signs' }} />
      <Stack.Screen name="HealthRecords" component={HealthRecordsScreen} options={{ title: 'Health Records' }} />
      <Stack.Screen name="Symptoms" component={SymptomsScreen} options={{ title: 'Symptoms' }} />
      <Stack.Screen name="BloodTests" component={BloodTestsScreen} options={{ title: 'Blood Tests' }} />
      <Stack.Screen name="CancerRisk" component={CancerRiskScreen} options={{ title: 'Cancer Risk' }} />
      <Stack.Screen name="Telehealth" component={TelehealthScreen} options={{ title: 'Telehealth' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}

function HealthStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="VitalSignsHome" component={VitalSignsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BloodTests" component={BloodTestsScreen} options={{ title: 'Blood Tests' }} />
      <Stack.Screen name="Symptoms" component={SymptomsScreen} options={{ title: 'Symptoms' }} />
      <Stack.Screen name="CancerRisk" component={CancerRiskScreen} options={{ title: 'Cancer Risk' }} />
      <Stack.Screen name="HealthRecords" component={HealthRecordsScreen} options={{ title: 'Health Records' }} />
    </Stack.Navigator>
  );
}

export default function PatientNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d0d1f',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          switch (route.name) {
            case 'Dashboard': iconName = 'view-dashboard'; break;
            case 'Appointments': iconName = 'calendar-check'; break;
            case 'Health': iconName = 'heart-pulse'; break;
            case 'Messages': iconName = 'message-text'; break;
            case 'Profile': iconName = 'account-circle'; break;
          }
          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{
        ...screenOptions, headerShown: true, title: 'Appointments',
      }} />
      <Tab.Screen name="Health" component={HealthStack} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{
        ...screenOptions, headerShown: true, title: 'Messages',
      }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{
        ...screenOptions, headerShown: true, title: 'Profile',
      }} />
    </Tab.Navigator>
  );
}
