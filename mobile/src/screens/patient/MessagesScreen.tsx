import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, FAB, Badge } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../../theme';
import { ListItemCard, EmptyState, SectionHeader, StatCard } from '../../components/shared';
import { messagesAPI } from '../../services/api';

export default function MessagesScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await messagesAPI.getInbox();
      setMessages(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const unread = messages.filter(m => !m.is_read).length;

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}>

        <View style={styles.statsRow}>
          <StatCard label="Inbox" value={messages.length} icon="inbox" color={colors.info} />
          <StatCard label="Unread" value={unread} icon="email-alert" color={colors.warning} />
        </View>

        <SectionHeader title="Messages" icon="email" />

        {messages.length > 0 ? messages.map((m, i) => (
          <ListItemCard key={m.id || i}
            title={m.sender_name || 'Healthcare Team'}
            subtitle={m.subject}
            description={m.content?.substring(0, 80) + '...'}
            icon={m.is_urgent ? 'email-alert' : m.is_read ? 'email-open' : 'email'}
            iconColor={m.is_urgent ? colors.error : m.is_read ? colors.textTertiary : colors.primary}
            onPress={async () => {
              if (!m.is_read) await messagesAPI.markRead(m.id).catch(() => {});
              loadData();
            }}
          />
        )) : (
          <EmptyState icon="email-off" title="No Messages" message="Your inbox is empty." />
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB icon="email-plus" style={styles.fab} onPress={() => {}} color="#000" customSize={56} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, backgroundColor: colors.primary },
});
