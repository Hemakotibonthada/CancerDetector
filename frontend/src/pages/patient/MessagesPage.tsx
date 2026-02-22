import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, TextField,
  InputAdornment, Avatar, Divider, Badge, IconButton, Tabs, Tab,
} from '@mui/material';
import {
  Send, AttachFile, Search, MoreVert, Phone, VideoCall,
  Circle, DoneAll, Done, Image, InsertDriveFile, Mic,
  EmojiEmotions,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [messageText, setMessageText] = useState('');

  const conversations = [
    { id: '1', name: 'Dr. Sarah Smith', specialization: 'Oncologist', lastMessage: 'Your latest test results look good. Keep up the healthy lifestyle.', time: '10:30 AM', unread: 2, online: true, avatar: 'SS' },
    { id: '2', name: 'Dr. James Lee', specialization: 'Cardiologist', lastMessage: 'I\'ve adjusted your medication dosage. Please pick up the new prescription.', time: 'Yesterday', unread: 0, online: false, avatar: 'JL' },
    { id: '3', name: 'Lab Support', specialization: 'Cancer Research Center', lastMessage: 'Your blood test results are ready. You can view them in your records.', time: 'Feb 18', unread: 1, online: true, avatar: 'LS' },
    { id: '4', name: 'Dr. Emily Chen', specialization: 'General Physician', lastMessage: 'Don\'t forget your annual checkup next week!', time: 'Feb 15', unread: 0, online: false, avatar: 'EC' },
    { id: '5', name: 'CancerGuard AI', specialization: 'AI Assistant', lastMessage: 'Based on your recent data, here are some personalized recommendations.', time: 'Feb 14', unread: 0, online: true, avatar: 'AI' },
  ];

  const messages: Record<string, Array<{ id: string; sender: 'me' | 'them'; text: string; time: string; read: boolean; type?: string }>> = {
    '1': [
      { id: 'm1', sender: 'them', text: 'Good morning! I\'ve reviewed your latest cancer screening results.', time: '9:00 AM', read: true },
      { id: 'm2', sender: 'them', text: 'Everything looks great. Your risk levels have decreased compared to last quarter.', time: '9:01 AM', read: true },
      { id: 'm3', sender: 'me', text: 'That\'s wonderful news, Dr. Smith! I\'ve been following the diet plan you recommended.', time: '9:15 AM', read: true },
      { id: 'm4', sender: 'them', text: 'That\'s excellent! The dietary changes are clearly making a positive impact. I can see improvements in your biomarkers.', time: '9:20 AM', read: true },
      { id: 'm5', sender: 'me', text: 'Should I continue with the same supplement regimen?', time: '9:30 AM', read: true },
      { id: 'm6', sender: 'them', text: 'Yes, please continue with Vitamin D3 and Omega-3. I\'d also like you to increase your fiber intake.', time: '10:00 AM', read: true },
      { id: 'm7', sender: 'them', text: 'Your latest test results look good. Keep up the healthy lifestyle. See you at your next appointment on March 10th!', time: '10:30 AM', read: false },
    ],
    '2': [
      { id: 'm1', sender: 'them', text: 'Hi, I wanted to discuss your recent ECG results.', time: 'Yesterday', read: true },
      { id: 'm2', sender: 'me', text: 'Of course, Dr. Lee. What did you find?', time: 'Yesterday', read: true },
      { id: 'm3', sender: 'them', text: 'Everything is within normal range. However, I\'d like to adjust your medication slightly.', time: 'Yesterday', read: true },
      { id: 'm4', sender: 'them', text: 'I\'ve adjusted your medication dosage. Please pick up the new prescription.', time: 'Yesterday', read: true },
    ],
  };

  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];
  const currentConv = conversations.find(c => c.id === selectedConversation);

  return (
    <AppLayout title="Messages" subtitle="Communicate with your healthcare team" navItems={patientNavItems} portalType="patient">
      <Card sx={{ height: 'calc(100vh - 200px)', display: 'flex', overflow: 'hidden' }}>
        {/* Conversations List */}
        <Box sx={{ width: 340, borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <TextField
              placeholder="Search conversations..."
              fullWidth size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
            />
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {conversations.map((conv) => (
              <Box
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                sx={{
                  p: 2, cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                  bgcolor: selectedConversation === conv.id ? '#e3f2fd' : 'transparent',
                  '&:hover': { bgcolor: selectedConversation === conv.id ? '#e3f2fd' : '#f8f9ff' },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={conv.online ? <Circle sx={{ fontSize: 10, color: '#4caf50' }} /> : null}
                  >
                    <Avatar sx={{ bgcolor: conv.id === '5' ? '#7c4dff' : '#1565c0', fontSize: 14, fontWeight: 700 }}>{conv.avatar}</Avatar>
                  </Badge>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{conv.name}</Typography>
                      <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{conv.time}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{conv.specialization}</Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 11, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                        {conv.lastMessage}
                      </Typography>
                      {conv.unread > 0 && (
                        <Box sx={{ minWidth: 18, height: 18, borderRadius: 9, bgcolor: '#1565c0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                          {conv.unread}
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {currentConv ? (
            <>
              {/* Chat Header */}
              <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent={currentConv.online ? <Circle sx={{ fontSize: 10, color: '#4caf50' }} /> : null}>
                      <Avatar sx={{ bgcolor: '#1565c0', fontWeight: 700, fontSize: 14 }}>{currentConv.avatar}</Avatar>
                    </Badge>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{currentConv.name}</Typography>
                      <Typography sx={{ fontSize: 11, color: currentConv.online ? '#4caf50' : 'text.secondary' }}>
                        {currentConv.online ? 'Online' : 'Offline'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small"><Phone sx={{ fontSize: 20 }} /></IconButton>
                    <IconButton size="small"><VideoCall sx={{ fontSize: 20 }} /></IconButton>
                    <IconButton size="small"><MoreVert sx={{ fontSize: 20 }} /></IconButton>
                  </Stack>
                </Stack>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
                {currentMessages.map((msg) => (
                  <Box key={msg.id} sx={{ display: 'flex', justifyContent: msg.sender === 'me' ? 'flex-end' : 'flex-start', mb: 1.5 }}>
                    <Box sx={{
                      maxWidth: '70%', p: 1.5, borderRadius: 2,
                      bgcolor: msg.sender === 'me' ? '#1565c0' : 'white',
                      color: msg.sender === 'me' ? 'white' : 'text.primary',
                      boxShadow: 1,
                    }}>
                      <Typography sx={{ fontSize: 13, lineHeight: 1.5 }}>{msg.text}</Typography>
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                        <Typography sx={{ fontSize: 10, opacity: 0.7 }}>{msg.time}</Typography>
                        {msg.sender === 'me' && (msg.read ? <DoneAll sx={{ fontSize: 12, opacity: 0.7 }} /> : <Done sx={{ fontSize: 12, opacity: 0.7 }} />)}
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Message Input */}
              <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: 'white' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton size="small"><EmojiEmotions sx={{ fontSize: 22, color: 'text.secondary' }} /></IconButton>
                  <IconButton size="small"><AttachFile sx={{ fontSize: 22, color: 'text.secondary' }} /></IconButton>
                  <IconButton size="small"><Image sx={{ fontSize: 22, color: 'text.secondary' }} /></IconButton>
                  <TextField
                    placeholder="Type a message..."
                    fullWidth size="small" value={messageText} onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') { setMessageText(''); } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                  <IconButton size="small"><Mic sx={{ fontSize: 22, color: 'text.secondary' }} /></IconButton>
                  <IconButton size="small" color="primary" onClick={() => setMessageText('')}><Send sx={{ fontSize: 22 }} /></IconButton>
                </Stack>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: 'text.secondary' }}>Select a conversation to start messaging</Typography>
            </Box>
          )}
        </Box>
      </Card>
    </AppLayout>
  );
};

export default MessagesPage;
