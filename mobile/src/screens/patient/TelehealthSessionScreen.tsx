/**
 * TelehealthSessionScreen - Video/audio telehealth consultation
 * Features: call controls, chat sidebar, file sharing, vitals display, notes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Types
// ============================================================================

interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor' | 'system';
  text: string;
  timestamp: Date;
  type: 'text' | 'file' | 'prescription' | 'vital' | 'note';
  metadata?: Record<string, any>;
}

interface Participant {
  id: string;
  name: string;
  role: 'patient' | 'doctor' | 'nurse' | 'specialist';
  avatar?: string;
  isMuted: boolean;
  isVideoOn: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface VitalSign {
  name: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  icon: string;
  trend?: 'up' | 'down' | 'stable';
}

interface SharedFile {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'lab_result' | 'prescription';
  size: string;
  sharedBy: string;
  timestamp: Date;
}

type CallState = 'connecting' | 'connected' | 'reconnecting' | 'ended';
type SidePanel = 'none' | 'chat' | 'vitals' | 'files' | 'notes';

// ============================================================================
// Theme
// ============================================================================

const theme = {
  colors: {
    primary: '#1565c0',
    primaryDark: '#0d47a1',
    secondary: '#00897b',
    accent: '#7b1fa2',
    background: '#1a1a2e',
    surface: '#16213e',
    surfaceLight: '#0f3460',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    textDim: 'rgba(255,255,255,0.4)',
    border: 'rgba(255,255,255,0.15)',
    error: '#ef5350',
    warning: '#ff9800',
    success: '#66bb6a',
    callRed: '#d32f2f',
    callGreen: '#2e7d32',
    chatBubbleOwn: '#1565c0',
    chatBubbleOther: '#2a2a4a',
    overlay: 'rgba(0,0,0,0.6)',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 8, md: 12, lg: 16, xl: 24, full: 999 },
};

// ============================================================================
// Mock Data
// ============================================================================

const mockParticipants: Participant[] = [
  { id: 'p1', name: 'Dr. Sarah Johnson', role: 'doctor', isMuted: false, isVideoOn: true, connectionQuality: 'excellent' },
  { id: 'p2', name: 'You', role: 'patient', isMuted: false, isVideoOn: true, connectionQuality: 'good' },
];

const mockVitals: VitalSign[] = [
  { name: 'Heart Rate', value: '78', unit: 'bpm', status: 'normal', icon: '❤️', trend: 'stable' },
  { name: 'Blood Pressure', value: '128/84', unit: 'mmHg', status: 'warning', icon: '🩸', trend: 'up' },
  { name: 'SpO2', value: '98', unit: '%', status: 'normal', icon: '💨', trend: 'stable' },
  { name: 'Temperature', value: '98.6', unit: '°F', status: 'normal', icon: '🌡️', trend: 'stable' },
  { name: 'Respiratory Rate', value: '16', unit: '/min', status: 'normal', icon: '🫁', trend: 'stable' },
  { name: 'Blood Glucose', value: '142', unit: 'mg/dL', status: 'warning', icon: '🍬', trend: 'up' },
];

const mockFiles: SharedFile[] = [
  { id: 'f1', name: 'CBC_Results_Jan2024.pdf', type: 'lab_result', size: '245 KB', sharedBy: 'Dr. Johnson', timestamp: new Date() },
  { id: 'f2', name: 'MRI_Scan_Report.pdf', type: 'image', size: '1.2 MB', sharedBy: 'Dr. Johnson', timestamp: new Date() },
  { id: 'f3', name: 'Prescription_Update.pdf', type: 'prescription', size: '89 KB', sharedBy: 'Dr. Johnson', timestamp: new Date() },
];

const initialMessages: ChatMessage[] = [
  { id: 'm1', sender: 'system', text: 'Telehealth session started', timestamp: new Date(Date.now() - 300000), type: 'text' },
  { id: 'm2', sender: 'doctor', text: 'Good morning! How are you feeling today?', timestamp: new Date(Date.now() - 240000), type: 'text' },
  { id: 'm3', sender: 'patient', text: 'Good morning, Dr. Johnson. I\'ve been having some mild headaches this week.', timestamp: new Date(Date.now() - 180000), type: 'text' },
  { id: 'm4', sender: 'doctor', text: 'I see. Let me pull up your recent lab results. I\'m sharing them in the chat now.', timestamp: new Date(Date.now() - 120000), type: 'text' },
  { id: 'm5', sender: 'doctor', text: 'CBC Results - January 2024', timestamp: new Date(Date.now() - 60000), type: 'file', metadata: { fileName: 'CBC_Results_Jan2024.pdf', fileSize: '245 KB' } },
];

// ============================================================================
// Sub-Components
// ============================================================================

const CallTimer: React.FC<{ startTime: Date }> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const format = (n: number) => n.toString().padStart(2, '0');

  return (
    <Text style={styles.callTimer}>
      {hours > 0 ? `${format(hours)}:` : ''}{format(minutes)}:{format(seconds)}
    </Text>
  );
};

const ConnectionIndicator: React.FC<{ quality: string }> = ({ quality }) => {
  const colors: Record<string, string> = {
    excellent: theme.colors.success,
    good: theme.colors.success,
    fair: theme.colors.warning,
    poor: theme.colors.error,
  };

  const bars = { excellent: 4, good: 3, fair: 2, poor: 1 };

  return (
    <View style={styles.connectionIndicator}>
      {[1, 2, 3, 4].map((bar) => (
        <View
          key={bar}
          style={[
            styles.connectionBar,
            {
              height: 4 + bar * 3,
              backgroundColor: bar <= (bars[quality as keyof typeof bars] || 0)
                ? colors[quality] || theme.colors.textDim
                : theme.colors.textDim,
            },
          ]}
        />
      ))}
    </View>
  );
};

const VideoPlaceholder: React.FC<{ name: string; role: string; isMain?: boolean }> = ({
  name,
  role,
  isMain = false,
}) => {
  const initial = name.charAt(0).toUpperCase();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.videoPlaceholder, isMain && styles.mainVideoPlaceholder]}>
      <Animated.View
        style={[
          styles.avatarCircle,
          isMain && styles.mainAvatarCircle,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Text style={[styles.avatarText, isMain && styles.mainAvatarText]}>{initial}</Text>
      </Animated.View>
      <Text style={[styles.participantName, isMain && styles.mainParticipantName]}>{name}</Text>
      <Text style={styles.participantRole}>{role}</Text>
    </View>
  );
};

const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isOwn = message.sender === 'patient';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemMessageText}>{message.text}</Text>
      </View>
    );
  }

  if (message.type === 'file') {
    return (
      <View style={[styles.chatBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <View style={styles.fileBubbleContent}>
          <Text style={styles.fileIcon}>📄</Text>
          <View>
            <Text style={styles.fileName}>{message.metadata?.fileName || message.text}</Text>
            <Text style={styles.fileSize}>{message.metadata?.fileSize || ''}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.downloadButton}>
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.chatBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
      {!isOwn && <Text style={styles.senderName}>{message.sender === 'doctor' ? 'Dr. Johnson' : message.sender}</Text>}
      <Text style={styles.chatText}>{message.text}</Text>
      <Text style={styles.chatTime}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
};

const VitalCard: React.FC<{ vital: VitalSign }> = ({ vital }) => {
  const statusColors: Record<string, string> = {
    normal: theme.colors.success,
    warning: theme.colors.warning,
    critical: theme.colors.error,
  };

  const trendIcons: Record<string, string> = { up: '↑', down: '↓', stable: '→' };

  return (
    <View style={[styles.vitalCard, { borderLeftColor: statusColors[vital.status] || theme.colors.textDim }]}>
      <View style={styles.vitalHeader}>
        <Text style={styles.vitalIcon}>{vital.icon}</Text>
        <Text style={styles.vitalName}>{vital.name}</Text>
        {vital.trend && (
          <Text style={[styles.vitalTrend, { color: statusColors[vital.status] }]}>
            {trendIcons[vital.trend]}
          </Text>
        )}
      </View>
      <View style={styles.vitalValueRow}>
        <Text style={[styles.vitalValue, { color: statusColors[vital.status] }]}>{vital.value}</Text>
        <Text style={styles.vitalUnit}>{vital.unit}</Text>
      </View>
      <View style={[styles.vitalStatus, { backgroundColor: statusColors[vital.status] + '20' }]}>
        <Text style={[styles.vitalStatusText, { color: statusColors[vital.status] }]}>
          {vital.status.charAt(0).toUpperCase() + vital.status.slice(1)}
        </Text>
      </View>
    </View>
  );
};

const FileCard: React.FC<{ file: SharedFile }> = ({ file }) => {
  const typeIcons: Record<string, string> = {
    image: '🖼️',
    pdf: '📄',
    lab_result: '🧪',
    prescription: '💊',
  };

  return (
    <TouchableOpacity style={styles.fileCard} activeOpacity={0.7}>
      <Text style={styles.fileCardIcon}>{typeIcons[file.type] || '📁'}</Text>
      <View style={styles.fileCardContent}>
        <Text style={styles.fileCardName} numberOfLines={1}>{file.name}</Text>
        <Text style={styles.fileCardMeta}>{file.size} • {file.sharedBy}</Text>
      </View>
      <Text style={styles.fileCardAction}>⬇️</Text>
    </TouchableOpacity>
  );
};

// ============================================================================
// Main Screen
// ============================================================================

const TelehealthSessionScreen: React.FC<{ route?: any; navigation?: any }> = ({
  route,
  navigation,
}) => {
  const [callState, setCallState] = useState<CallState>('connecting');
  const [sidePanel, setSidePanel] = useState<SidePanel>('none');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [notes, setNotes] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callStartTime] = useState(new Date(Date.now() - 180000));

  const panelAnim = useRef(new Animated.Value(0)).current;
  const controlsAnim = useRef(new Animated.Value(1)).current;
  const connectingAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Connection animation
  useEffect(() => {
    if (callState === 'connecting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(connectingAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(connectingAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();

      const timer = setTimeout(() => setCallState('connected'), 2000);
      return () => clearTimeout(timer);
    }
  }, [callState]);

  // Panel animation
  useEffect(() => {
    Animated.spring(panelAnim, {
      toValue: sidePanel !== 'none' ? 1 : 0,
      useNativeDriver: true,
      friction: 10,
    }).start();
  }, [sidePanel]);

  const togglePanel = (panel: SidePanel) => {
    setSidePanel(sidePanel === panel ? 'none' : panel);
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: `m${Date.now()}`,
      sender: 'patient',
      text: inputText.trim(),
      timestamp: new Date(),
      type: 'text',
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const handleEndCall = () => {
    setShowEndConfirm(true);
  };

  const confirmEndCall = () => {
    setShowEndConfirm(false);
    setCallState('ended');
    setTimeout(() => navigation?.goBack?.(), 2000);
  };

  const panelTranslate = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH * 0.7, 0],
  });

  // Connecting State
  if (callState === 'connecting') {
    return (
      <View style={styles.connectingContainer}>
        <Animated.View style={[styles.connectingPulse, { opacity: connectingAnim }]}>
          <View style={styles.connectingInner} />
        </Animated.View>
        <View style={styles.connectingAvatar}>
          <Text style={styles.connectingAvatarText}>SJ</Text>
        </View>
        <Text style={styles.connectingName}>Dr. Sarah Johnson</Text>
        <Text style={styles.connectingStatus}>Connecting...</Text>
        <ActivityIndicator size="small" color={theme.colors.text} style={{ marginTop: 16 }} />
        <TouchableOpacity
          style={styles.cancelCallButton}
          onPress={() => {
            setCallState('ended');
            navigation?.goBack?.();
          }}
        >
          <Text style={styles.cancelCallText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Ended State
  if (callState === 'ended') {
    return (
      <View style={styles.endedContainer}>
        <Text style={styles.endedIcon}>📞</Text>
        <Text style={styles.endedTitle}>Session Ended</Text>
        <Text style={styles.endedSubtitle}>Your telehealth session has ended successfully.</Text>
        <View style={styles.endedStats}>
          <View style={styles.endedStatItem}>
            <Text style={styles.endedStatLabel}>Duration</Text>
            <Text style={styles.endedStatValue}>15:32</Text>
          </View>
          <View style={styles.endedStatDivider} />
          <View style={styles.endedStatItem}>
            <Text style={styles.endedStatLabel}>Messages</Text>
            <Text style={styles.endedStatValue}>{messages.length}</Text>
          </View>
          <View style={styles.endedStatDivider} />
          <View style={styles.endedStatItem}>
            <Text style={styles.endedStatLabel}>Files</Text>
            <Text style={styles.endedStatValue}>{mockFiles.length}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.endedButton}
          onPress={() => navigation?.goBack?.()}
        >
          <Text style={styles.endedButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Video Area */}
      <View style={styles.videoArea}>
        <VideoPlaceholder name="Dr. Sarah Johnson" role="Oncologist" isMain />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <CallTimer startTime={callStartTime} />
          </View>
          <View style={styles.topBarRight}>
            <ConnectionIndicator quality="good" />
            {isRecording && (
              <View style={styles.recordingBadge}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>REC</Text>
              </View>
            )}
          </View>
        </View>

        {/* Self View */}
        <View style={styles.selfView}>
          {isVideoOn ? (
            <VideoPlaceholder name="You" role="Patient" />
          ) : (
            <View style={styles.videoOffView}>
              <Text style={styles.videoOffText}>Camera Off</Text>
            </View>
          )}
          {isMuted && (
            <View style={styles.mutedBadge}>
              <Text style={styles.mutedIcon}>🔇</Text>
            </View>
          )}
        </View>

        {/* Encryption Notice */}
        <View style={styles.encryptionNotice}>
          <Text style={styles.encryptionText}>🔒 HIPAA-compliant end-to-end encryption</Text>
        </View>
      </View>

      {/* Side Panel */}
      {sidePanel !== 'none' && (
        <Animated.View
          style={[
            styles.sidePanel,
            { transform: [{ translateX: panelTranslate }] },
          ]}
        >
          <View style={styles.sidePanelHeader}>
            <Text style={styles.sidePanelTitle}>
              {sidePanel === 'chat' ? '💬 Chat' : sidePanel === 'vitals' ? '❤️ Vitals' : sidePanel === 'files' ? '📁 Files' : '📝 Notes'}
            </Text>
            <TouchableOpacity onPress={() => setSidePanel('none')}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {sidePanel === 'chat' && (
            <KeyboardAvoidingView
              style={styles.chatContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={100}
            >
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ChatBubble message={item} />}
                contentContainerStyle={styles.chatList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
              />
              <View style={styles.chatInputContainer}>
                <TouchableOpacity style={styles.attachButton}>
                  <Text style={styles.attachButtonText}>📎</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Type a message..."
                  placeholderTextColor={theme.colors.textDim}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={sendMessage}
                  returnKeyType="send"
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                  <Text style={styles.sendButtonText}>➤</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}

          {sidePanel === 'vitals' && (
            <ScrollView style={styles.vitalsContainer} contentContainerStyle={styles.vitalsContent}>
              <Text style={styles.vitalsSubtitle}>Real-time from wearable device</Text>
              {mockVitals.map((vital, i) => (
                <VitalCard key={i} vital={vital} />
              ))}
              <Text style={styles.vitalsLastUpdated}>Last updated: 30 seconds ago</Text>
            </ScrollView>
          )}

          {sidePanel === 'files' && (
            <ScrollView style={styles.filesContainer}>
              <TouchableOpacity style={styles.addFileButton}>
                <Text style={styles.addFileButtonText}>+ Share a File</Text>
              </TouchableOpacity>
              {mockFiles.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </ScrollView>
          )}

          {sidePanel === 'notes' && (
            <View style={styles.notesContainer}>
              <TextInput
                style={styles.notesInput}
                placeholder="Type session notes here..."
                placeholderTextColor={theme.colors.textDim}
                multiline
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
              <View style={styles.notesFooter}>
                <Text style={styles.notesCharCount}>{notes.length} characters</Text>
                <TouchableOpacity
                  style={styles.saveNotesButton}
                  onPress={() => Alert.alert('Saved', 'Notes saved successfully.')}
                >
                  <Text style={styles.saveNotesText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      )}

      {/* Bottom Controls */}
      <Animated.View style={[styles.controls, { opacity: controlsAnim }]}>
        {/* Tool Buttons */}
        <View style={styles.toolButtons}>
          <TouchableOpacity
            style={[styles.toolButton, sidePanel === 'chat' && styles.toolButtonActive]}
            onPress={() => togglePanel('chat')}
          >
            <Text style={styles.toolButtonIcon}>💬</Text>
            <Text style={styles.toolButtonLabel}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolButton, sidePanel === 'vitals' && styles.toolButtonActive]}
            onPress={() => togglePanel('vitals')}
          >
            <Text style={styles.toolButtonIcon}>❤️</Text>
            <Text style={styles.toolButtonLabel}>Vitals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolButton, sidePanel === 'files' && styles.toolButtonActive]}
            onPress={() => togglePanel('files')}
          >
            <Text style={styles.toolButtonIcon}>📁</Text>
            <Text style={styles.toolButtonLabel}>Files</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolButton, sidePanel === 'notes' && styles.toolButtonActive]}
            onPress={() => togglePanel('notes')}
          >
            <Text style={styles.toolButtonIcon}>📝</Text>
            <Text style={styles.toolButtonLabel}>Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolButton, isRecording && styles.toolButtonActive]}
            onPress={() => setIsRecording(!isRecording)}
          >
            <Text style={styles.toolButtonIcon}>{isRecording ? '⏹️' : '⏺️'}</Text>
            <Text style={styles.toolButtonLabel}>{isRecording ? 'Stop' : 'Record'}</Text>
          </TouchableOpacity>
        </View>

        {/* Call Controls */}
        <View style={styles.callControls}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎙️'}</Text>
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !isVideoOn && styles.controlButtonActive]}
            onPress={() => setIsVideoOn(!isVideoOn)}
          >
            <Text style={styles.controlIcon}>{isVideoOn ? '📹' : '📷'}</Text>
            <Text style={styles.controlLabel}>{isVideoOn ? 'Video' : 'Video Off'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
            <Text style={styles.endCallIcon}>📞</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !isSpeakerOn && styles.controlButtonActive]}
            onPress={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            <Text style={styles.controlIcon}>{isSpeakerOn ? '🔊' : '🔈'}</Text>
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => Alert.alert('Camera Switch', 'Camera switched to rear.')}
          >
            <Text style={styles.controlIcon}>🔄</Text>
            <Text style={styles.controlLabel}>Flip</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* End Call Confirmation Modal */}
      <Modal visible={showEndConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Session?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to end this telehealth session?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setShowEndConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={confirmEndCall}
              >
                <Text style={styles.modalConfirmText}>End Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Connecting
  connectingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingPulse: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary + '20',
  },
  connectingAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  connectingAvatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  connectingName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  connectingStatus: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  cancelCallButton: {
    marginTop: 40,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.callRed,
  },
  cancelCallText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Ended
  endedContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  endedIcon: {
    fontSize: 48,
    marginBottom: 24,
  },
  endedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  endedSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  endedStats: {
    flexDirection: 'row',
    marginTop: 32,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
  },
  endedStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  endedStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  endedStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 4,
  },
  endedStatDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  endedButton: {
    marginTop: 32,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.full,
  },
  endedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Video Area
  videoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  mainVideoPlaceholder: {},
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainAvatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  mainAvatarText: {
    fontSize: 40,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 8,
  },
  mainParticipantName: {
    fontSize: 18,
    marginTop: 12,
  },
  participantRole: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.callRed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  callTimer: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  connectionBar: {
    width: 4,
    borderRadius: 2,
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.callRed + '40',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.callRed,
  },
  recordingText: {
    color: theme.colors.callRed,
    fontSize: 10,
    fontWeight: '700',
  },

  // Self View
  selfView: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  videoOffView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  videoOffText: {
    color: theme.colors.textDim,
    fontSize: 12,
  },
  mutedBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: theme.colors.callRed,
    borderRadius: theme.borderRadius.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutedIcon: {
    fontSize: 12,
  },

  // Encryption
  encryptionNotice: {
    position: 'absolute',
    bottom: 8,
    left: 16,
  },
  encryptionText: {
    fontSize: 10,
    color: theme.colors.textDim,
  },

  // Side Panel
  sidePanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
    zIndex: 10,
  },
  sidePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sidePanelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    padding: 4,
  },

  // Chat
  chatContainer: {
    flex: 1,
  },
  chatList: {
    padding: 12,
  },
  chatBubble: {
    maxWidth: '80%',
    marginBottom: 8,
    padding: 12,
    borderRadius: theme.borderRadius.md,
  },
  ownBubble: {
    backgroundColor: theme.colors.chatBubbleOwn,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: theme.colors.chatBubbleOther,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  chatText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  chatTime: {
    fontSize: 10,
    color: theme.colors.textDim,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 11,
    color: theme.colors.textDim,
    fontStyle: 'italic',
  },
  fileBubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileIcon: {
    fontSize: 24,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  fileSize: {
    fontSize: 11,
    color: theme.colors.textDim,
  },
  downloadButton: {
    marginTop: 8,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.sm,
  },
  downloadButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButtonText: {
    fontSize: 20,
  },
  chatInput: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 16,
    color: theme.colors.text,
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    color: '#fff',
  },

  // Vitals
  vitalsContainer: {
    flex: 1,
  },
  vitalsContent: {
    padding: 12,
  },
  vitalsSubtitle: {
    fontSize: 12,
    color: theme.colors.textDim,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  vitalCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  vitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vitalIcon: {
    fontSize: 16,
  },
  vitalName: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  vitalTrend: {
    fontSize: 16,
    fontWeight: '700',
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 4,
  },
  vitalValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  vitalUnit: {
    fontSize: 12,
    color: theme.colors.textDim,
  },
  vitalStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginTop: 4,
  },
  vitalStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  vitalsLastUpdated: {
    fontSize: 11,
    color: theme.colors.textDim,
    textAlign: 'center',
    marginTop: 8,
  },

  // Files
  filesContainer: {
    flex: 1,
    padding: 12,
  },
  addFileButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  addFileButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  fileCardIcon: {
    fontSize: 24,
  },
  fileCardContent: {
    flex: 1,
  },
  fileCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  fileCardMeta: {
    fontSize: 11,
    color: theme.colors.textDim,
    marginTop: 2,
  },
  fileCardAction: {
    fontSize: 16,
  },

  // Notes
  notesContainer: {
    flex: 1,
    padding: 12,
  },
  notesInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  notesFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  notesCharCount: {
    fontSize: 12,
    color: theme.colors.textDim,
  },
  saveNotesButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
  },
  saveNotesText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Controls
  controls: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    paddingTop: 8,
  },
  toolButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 12,
  },
  toolButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: theme.borderRadius.sm,
  },
  toolButtonActive: {
    backgroundColor: theme.colors.primary + '20',
  },
  toolButtonIcon: {
    fontSize: 18,
  },
  toolButtonLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 16,
  },
  controlButton: {
    alignItems: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  controlButtonActive: {
    backgroundColor: theme.colors.warning + '30',
  },
  controlIcon: {
    fontSize: 20,
  },
  controlLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.callRed,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: theme.colors.callRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  endCallIcon: {
    fontSize: 28,
    transform: [{ rotate: '135deg' }],
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 24,
    width: SCREEN_WIDTH * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: theme.colors.surfaceLight,
  },
  modalCancelText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  modalConfirm: {
    backgroundColor: theme.colors.callRed,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TelehealthSessionScreen;
