import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

import AdminDashboard from '../screens/admin/AdminDashboard';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import HospitalManagementScreen from '../screens/admin/HospitalManagementScreen';
import SystemMonitoringScreen from '../screens/admin/SystemMonitoringScreen';
import AdminMoreScreen from '../screens/admin/AdminMoreScreen';

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
      <Stack.Screen name="DashboardHome" component={AdminDashboard} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function AdminNavigator() {
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
        tabBarActiveTintColor: colors.adminPortal,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          switch (route.name) {
            case 'Dashboard': iconName = 'view-dashboard'; break;
            case 'Users': iconName = 'account-group'; break;
            case 'Hospitals': iconName = 'hospital-building'; break;
            case 'System': iconName = 'monitor-dashboard'; break;
            case 'More': iconName = 'dots-horizontal'; break;
          }
          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Users" component={UserManagementScreen} options={{
        ...screenOptions, headerShown: true, title: 'User Management',
      }} />
      <Tab.Screen name="Hospitals" component={HospitalManagementScreen} options={{
        ...screenOptions, headerShown: true, title: 'Hospitals',
      }} />
      <Tab.Screen name="System" component={SystemMonitoringScreen} options={{
        ...screenOptions, headerShown: true, title: 'System Monitor',
      }} />
      <Tab.Screen name="More" component={AdminMoreScreen} options={{
        ...screenOptions, headerShown: true, title: 'More',
      }} />
    </Tab.Navigator>
  );
}
