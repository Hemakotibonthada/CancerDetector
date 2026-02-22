import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, List, Divider, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../theme';
import { GradientCard, SectionHeader, StatCard, ListItemCard, EmptyState } from '../../components/shared';
import { bedsAPI, pharmacyAPI, emergencyAPI } from '../../services/api';

export default function HospitalMoreScreen({ navigation }: any) {
  const { logout } = useAuth();
  const [beds, setBeds] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await bedsAPI.getAll();
      setBeds(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const avail = beds.filter(b => b.status === 'available').length;
  const occupied = beds.filter(b => b.status === 'occupied').length;

  const menuItems = [
    { title: 'Bed Management', icon: 'bed', color: colors.warning, screen: 'BedManagement' },
    { title: 'Pharmacy', icon: 'pill', color: colors.success, screen: 'Pharmacy' },
    { title: 'Emergency', icon: 'ambulance', color: colors.error, screen: 'Emergency' },
    { title: 'Reports & Analytics', icon: 'chart-bar', color: colors.primary, screen: 'Reports' },
    { title: 'Settings', icon: 'cog', color: colors.textSecondary, screen: 'Settings' },
  ];

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <SectionHeader title="Bed Overview" icon="bed" />
        <View style={styles.row}>
          <StatCard label="Available" value={avail} icon="bed-empty" color={colors.success} />
          <StatCard label="Occupied" value={occupied} icon="bed" color={colors.error} />
        </View>

        <SectionHeader title="Hospital Management" icon="hospital-building" />
        <GradientCard>
          {menuItems.map((item, i) => (
            <React.Fragment key={i}>
              <List.Item title={item.title} titleStyle={{ color: colors.text }}
                left={() => <MaterialCommunityIcons name={item.icon as any} size={24}
                  color={item.color} style={{ marginLeft: spacing.md, alignSelf: 'center' }} />}
                right={() => <MaterialCommunityIcons name="chevron-right" size={24}
                  color={colors.textTertiary} style={{ alignSelf: 'center' }} />}
                onPress={() => navigation.navigate(item.screen)} />
              {i < menuItems.length - 1 && <Divider style={{ backgroundColor: colors.border }} />}
            </React.Fragment>
          ))}
        </GradientCard>

        <Button mode="contained" onPress={() => {
          Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
          ]);
        }} style={styles.logoutBtn} buttonColor={colors.error} textColor="#fff" icon="logout">
          Sign Out
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  logoutBtn: { marginTop: spacing.lg, borderRadius: 12 },
});
