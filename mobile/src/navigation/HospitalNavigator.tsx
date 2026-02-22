import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

import HospitalDashboard from '../screens/hospital/HospitalDashboard';
import PatientManagementScreen from '../screens/hospital/PatientManagementScreen';
import StaffScreen from '../screens/hospital/StaffScreen';
import LabsScreen from '../screens/hospital/LabsScreen';
import HospitalMoreScreen from '../screens/hospital/HospitalMoreScreen';

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
      <Stack.Screen name="DashboardHome" component={HospitalDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="BedManagement" component={HospitalMoreScreen} options={{ title: 'Bed Management' }} />
      <Stack.Screen name="Pharmacy" component={HospitalMoreScreen} options={{ title: 'Pharmacy' }} />
      <Stack.Screen name="Emergency" component={HospitalMoreScreen} options={{ title: 'Emergency' }} />
      <Stack.Screen name="Reports" component={HospitalMoreScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="Settings" component={HospitalMoreScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}

export default function HospitalNavigator() {
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
        tabBarActiveTintColor: colors.hospitalPortal,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          switch (route.name) {
            case 'Dashboard': iconName = 'view-dashboard'; break;
            case 'Patients': iconName = 'account-group'; break;
            case 'Staff': iconName = 'doctor'; break;
            case 'Labs': iconName = 'test-tube'; break;
            case 'More': iconName = 'dots-horizontal'; break;
          }
          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Patients" component={PatientManagementScreen} options={{
        ...screenOptions, headerShown: true, title: 'Patients',
      }} />
      <Tab.Screen name="Staff" component={StaffScreen} options={{
        ...screenOptions, headerShown: true, title: 'Staff',
      }} />
      <Tab.Screen name="Labs" component={LabsScreen} options={{
        ...screenOptions, headerShown: true, title: 'Lab Orders',
      }} />
      <Tab.Screen name="More" component={HospitalMoreScreen} options={{
        ...screenOptions, headerShown: true, title: 'More',
      }} />
    </Tab.Navigator>
  );
}
