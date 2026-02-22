import React, { useState } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  IconButton, Avatar, Divider, Badge,
} from '@mui/material';
import {
  Notifications as NotifIcon, CheckCircle, Warning, Info,
  CalendarMonth, Science, LocalHospital, Favorite, Delete,
  DoneAll, NotificationsOff, MarkunreadMailbox, Circle,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const notifications = [
    { id: '1', type: 'appointment', title: 'Upcoming Appointment', message: 'You have an appointment with Dr. Sarah Smith tomorrow at 10:00 AM', time: '1 hour ago', read: false, icon: <CalendarMonth />, color: '#1565c0' },
    { id: '2', type: 'result', title: 'Blood Test Results Ready', message: 'Your blood test results from Feb 18 are now available. View them in Health Records.', time: '3 hours ago', read: false, icon: <Science />, color: '#7b1fa2' },
    { id: '3', type: 'medication', title: 'Medication Reminder', message: 'Time to take Atorvastatin 20mg (evening dose)', time: '5 hours ago', read: true, icon: <LocalHospital />, color: '#f57c00' },
    { id: '4', type: 'risk', title: 'AI Risk Update', message: 'Your cancer risk assessment has been updated. Overall risk remains Low.', time: '1 day ago', read: true, icon: <Warning />, color: '#c62828' },
    { id: '5', type: 'health', title: 'Health Score Improved', message: 'Congratulations! Your health score improved from 82 to 87 this week.', time: '1 day ago', read: true, icon: <Favorite />, color: '#4caf50' },
    { id: '6', type: 'system', title: 'Profile Update', message: 'Your emergency contact information has been updated successfully.', time: '2 days ago', read: true, icon: <Info />, color: '#616161' },
    { id: '7', type: 'goal', title: 'Goal Achievement! 🎉', message: 'You\'ve completed a 7-day walking streak! Keep it up!', time: '3 days ago', read: true, icon: <CheckCircle />, color: '#4caf50' },
    { id: '8', type: 'appointment', title: 'Appointment Confirmed', message: 'Your appointment with Dr. Emily Chen on Mar 10 has been confirmed.', time: '4 days ago', read: true, icon: <CalendarMonth />, color: '#1565c0' },
    { id: '9', type: 'screening', title: 'Screening Reminder', message: 'It\'s time for your annual colonoscopy screening. Schedule an appointment.', time: '5 days ago', read: true, icon: <LocalHospital />, color: '#c62828' },
    { id: '10', type: 'system', title: 'New Feature: AI Insights', message: 'Check out the new AI-powered health insights on your dashboard!', time: '1 week ago', read: true, icon: <Info />, color: '#1565c0' },
  ];

  const unread = notifications.filter(n => !n.read);
  const filtered = activeTab === 0 ? notifications : activeTab === 1 ? unread : notifications.filter(n => n.read);

  return (
    <AppLayout title="Notifications" subtitle={`${unread.length} unread notifications`} navItems={patientNavItems} portalType="patient">
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
          <Tab label={`All (${notifications.length})`} />
          <Tab label={<Badge badgeContent={unread.length} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10 } }}>Unread</Badge>} />
          <Tab label="Read" />
        </Tabs>
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<DoneAll />} sx={{ fontSize: 12 }}>Mark All Read</Button>
          <Button size="small" startIcon={<Delete />} sx={{ fontSize: 12 }} color="error">Clear All</Button>
        </Stack>
      </Stack>

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
              <IconButton size="small"><Delete sx={{ fontSize: 16 }} /></IconButton>
            </Stack>
          </Card>
        ))}
      </Stack>
    </AppLayout>
  );
};

export default NotificationsPage;
