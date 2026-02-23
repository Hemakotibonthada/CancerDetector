import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  IconButton, Avatar, Divider, Badge, CircularProgress, Alert,
} from '@mui/material';
import {
  Notifications as NotifIcon, CheckCircle, Warning, Info,
  CalendarMonth, Science, LocalHospital, Favorite, Delete,
  DoneAll, NotificationsOff, MarkunreadMailbox, Circle,
  MedicalServices, MonitorHeart, TipsAndUpdates, Campaign,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { notificationsAPI } from '../../services/api';

const getNotifStyle = (type: string) => {
  const map: Record<string, { icon: React.ReactNode; color: string }> = {
    appointment_reminder: { icon: <CalendarMonth />, color: '#1565c0' },
    appointment_confirmation: { icon: <CalendarMonth />, color: '#1565c0' },
    lab_result: { icon: <Science />, color: '#7b1fa2' },
    medication_reminder: { icon: <MedicalServices />, color: '#f57c00' },
    cancer_risk_alert: { icon: <Warning />, color: '#c62828' },
    health_tip: { icon: <TipsAndUpdates />, color: '#4caf50' },
    screening_due: { icon: <LocalHospital />, color: '#c62828' },
    smartwatch_alert: { icon: <MonitorHeart />, color: '#2196f3' },
    prescription_refill: { icon: <MedicalServices />, color: '#f57c00' },
    system: { icon: <Info />, color: '#616161' },
  };
  return map[type] || { icon: <NotifIcon />, color: '#616161' };
};

const timeAgo = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  } catch { return dateStr; }
};

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.list();
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.notifications || []);
      setNotifications(items.map((n: any) => {
        const style = getNotifStyle(n.notification_type || n.type || 'system');
        return {
          id: n.id,
          type: n.notification_type || n.type || 'system',
          title: n.title,
          message: n.message || n.short_message || '',
          time: timeAgo(n.created_at),
          read: n.is_read || false,
          icon: style.icon,
          color: style.color,
          actionUrl: n.action_url,
          actionLabel: n.action_label,
        };
      }));
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError(err?.response?.data?.detail || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const unread = notifications.filter(n => !n.read);
  const filtered = activeTab === 0 ? notifications : activeTab === 1 ? unread : notifications.filter(n => n.read);

  if (loading) {
    return (
      <AppLayout title="Notifications" subtitle="Loading..." navItems={patientNavItems} portalType="patient">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Notifications" subtitle={`${unread.length} unread notifications`} navItems={patientNavItems} portalType="patient">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
          <Tab label={`All (${notifications.length})`} />
          <Tab label={<Badge badgeContent={unread.length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}>Unread</Badge>} />
          <Tab label="Read" />
        </Tabs>
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<DoneAll />} sx={{ fontSize: 12 }} onClick={handleMarkAllRead}>Mark All Read</Button>
        </Stack>
      </Stack>

      {filtered.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <NotificationsOff sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">No notifications</Typography>
          <Typography variant="body2" color="text.secondary">You're all caught up!</Typography>
        </Card>
      ) : (
      <Stack spacing={1}>
        {filtered.map((n) => (
          <Card
            key={n.id}
            sx={{
              p: 2, transition: 'all 0.2s', cursor: 'pointer',
              bgcolor: n.read ? 'background.paper' : '#f0f7ff',
              borderLeft: `4px solid ${n.color}`,
              '&:hover': { boxShadow: 3 },
            }}
            onClick={() => !n.read && handleMarkRead(n.id)}
          >
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: `${n.color}15`, color: n.color, width: 40, height: 40 }}>{n.icon}</Avatar>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: n.read ? 500 : 700, fontSize: 14 }}>{n.title}</Typography>
                    {!n.read && <Circle sx={{ fontSize: 8, color: '#1565c0' }} />}
                  </Stack>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{n.time}</Typography>
                </Stack>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>{n.message}</Typography>
              </Box>
            </Stack>
          </Card>
        ))}
      </Stack>
      )}
    </AppLayout>
  );
};

export default NotificationsPage;
