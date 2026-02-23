import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, TextField,
  InputAdornment, Avatar, Divider, Badge, IconButton, Tabs, Tab,
  CircularProgress, Alert,
} from '@mui/material';
import {
  Send, AttachFile, Search, MoreVert, Phone, VideoCall,
  Circle, DoneAll, Done, Image, InsertDriveFile, Mic,
  EmojiEmotions, Inbox as InboxIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { communicationAPI } from '../../services/api';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const [inboxRes, sentRes] = await Promise.all([
        communicationAPI.getInbox(),
        communicationAPI.getSent(),
      ]);
      const inbox = Array.isArray(inboxRes.data) ? inboxRes.data : (inboxRes.data?.items || []);
      const sent = Array.isArray(sentRes.data) ? sentRes.data : (sentRes.data?.items || []);

      // Group messages into conversations by sender/recipient
      const convMap = new Map<string, { contact: any; msgs: any[] }>();
      [...inbox, ...sent].forEach((msg: any) => {
        const isIncoming = msg.recipient_id === user?.id || msg.to_user_id === user?.id;
        const contactId = isIncoming ? (msg.sender_id || msg.from_user_id) : (msg.recipient_id || msg.to_user_id);
        const contactName = isIncoming ? (msg.sender_name || msg.from_name || 'Unknown') : (msg.recipient_name || msg.to_name || 'Unknown');
        if (!convMap.has(contactId)) {
          convMap.set(contactId, { contact: { id: contactId, name: contactName, avatar: contactName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) }, msgs: [] });
        }
        convMap.get(contactId)!.msgs.push({
          id: msg.id,
          sender: isIncoming ? 'them' : 'me',
          text: msg.content || msg.message || msg.body || '',
          time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          read: msg.is_read ?? msg.read ?? true,
          timestamp: new Date(msg.created_at || 0).getTime(),
        });
      });

      const convList = Array.from(convMap.entries()).map(([id, { contact, msgs }]) => {
        msgs.sort((a, b) => a.timestamp - b.timestamp);
        const lastMsg = msgs[msgs.length - 1];
        return {
          id,
          name: contact.name,
          specialization: '',
          lastMessage: lastMsg?.text || '',
          time: lastMsg?.time || '',
          unread: msgs.filter(m => m.sender === 'them' && !m.read).length,
          online: false,
          avatar: contact.avatar,
        };
      });
      convList.sort((a, b) => b.unread - a.unread);

      setConversations(convList);
      const msgMap: Record<string, any[]> = {};
      convMap.forEach((v, k) => { msgMap[k] = v.msgs; });
      setMessages(msgMap);
      if (convList.length > 0 && !selectedConversation) setSelectedConversation(convList[0].id);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user, selectedConversation]);

  useEffect(() => { loadMessages(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;
    try {
      await communicationAPI.sendMessage({
        recipient_id: selectedConversation,
        content: messageText.trim(),
      });
      setMessageText('');
      loadMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];
  const currentConv = conversations.find(c => c.id === selectedConversation);

  return (
    <AppLayout title="Messages" subtitle="Communicate with your healthcare team" navItems={patientNavItems} portalType="patient">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box> : conversations.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No messages yet</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>Your conversations with healthcare providers will appear here</Typography>
        </Card>
      ) : (
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
                    onKeyPress={(e) => { if (e.key === 'Enter') { handleSendMessage(); } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                  <IconButton size="small"><Mic sx={{ fontSize: 22, color: 'text.secondary' }} /></IconButton>
                  <IconButton size="small" color="primary" onClick={handleSendMessage}><Send sx={{ fontSize: 22 }} /></IconButton>
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
      )}
    </AppLayout>
  );
};

export default MessagesPage;
