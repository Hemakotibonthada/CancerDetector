import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, FormControlLabel, Divider, Alert, Slider, Select,
  MenuItem, FormControl, InputLabel, Avatar, IconButton, useTheme, alpha,
} from '@mui/material';
import {
  Settings as SettingsIcon, Notifications, Lock, Palette, Language,
  Download, DeleteForever, Security, PrivacyTip, DarkMode,
  LightMode, Email, Sms, PhoneAndroid, VolumeUp, Visibility,
  VisibilityOff, Key, Smartphone, CloudDownload, Help,
  WaterDrop, Park, WbSunny, NightsStay, LocalHospital, ColorLens,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext, ThemeVariant, themeVariants } from '../../context/ThemeContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { SectionHeader } from '../../components/common/SharedComponents';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const { isDark, toggleTheme, mode, setMode, variant, setVariant } = useThemeContext();
  const [activeTab, setActiveTab] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const [notifications, setNotifications] = useState({
    emailAppointments: true, emailResults: true, emailReminders: true, emailNewsletter: false,
    smsAppointments: true, smsResults: false, smsReminders: true, smsMarketing: false,
    pushAll: true, pushMedications: true, pushGoals: true, pushInsights: true,
    soundEnabled: true, vibrationEnabled: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'doctors_only',
    shareDataResearch: false,
    showHealthScore: true,
    allowAnonymousAnalytics: true,
    showOnlineStatus: false,
    dataRetention: '5_years',
  });

  return (
    <AppLayout title="Settings" subtitle="Manage your account preferences" navItems={patientNavItems} portalType="patient">
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Notifications" icon={<Notifications sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Privacy" icon={<PrivacyTip sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Security" icon={<Security sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Appearance" icon={<Palette sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Data & Storage" icon={<CloudDownload sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Email Notifications" />
              <Stack spacing={1}>
                {[
                  { key: 'emailAppointments', label: 'Appointment Reminders', desc: 'Get email reminders before appointments' },
                  { key: 'emailResults', label: 'Test Results', desc: 'Receive notifications when results are ready' },
                  { key: 'emailReminders', label: 'Medication Reminders', desc: 'Daily medication schedule emails' },
                  { key: 'emailNewsletter', label: 'Health Newsletter', desc: 'Weekly health tips and cancer prevention info' },
                ].map(item => (
                  <Box key={item.key} sx={{ py: 1 }}>
                    <FormControlLabel
                      control={<Switch checked={(notifications as any)[item.key]} onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })} />}
                      label={<Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.label}</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.desc}</Typography></Box>}
                    />
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="SMS Notifications" />
              <Stack spacing={1}>
                {[
                  { key: 'smsAppointments', label: 'Appointment SMS', desc: 'Text message appointment reminders' },
                  { key: 'smsResults', label: 'Critical Results SMS', desc: 'Urgent test result notifications' },
                  { key: 'smsReminders', label: 'Medication SMS', desc: 'Text reminders for medications' },
                  { key: 'smsMarketing', label: 'Promotional SMS', desc: 'Special offers and promotions' },
                ].map(item => (
                  <Box key={item.key} sx={{ py: 1 }}>
                    <FormControlLabel
                      control={<Switch checked={(notifications as any)[item.key]} onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })} />}
                      label={<Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.label}</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.desc}</Typography></Box>}
                    />
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Push & Sound" />
              <Stack spacing={1}>
                {[
                  { key: 'pushAll', label: 'Push Notifications', desc: 'Browser and mobile push alerts' },
                  { key: 'pushMedications', label: 'Medication Alerts', desc: 'Push alerts for medication times' },
                  { key: 'pushGoals', label: 'Goal Progress', desc: 'Updates on health goal progress' },
                  { key: 'pushInsights', label: 'AI Insights', desc: 'AI-generated health recommendations' },
                  { key: 'soundEnabled', label: 'Sound Effects', desc: 'Play sounds for notifications' },
                  { key: 'vibrationEnabled', label: 'Vibration', desc: 'Vibrate on mobile notifications' },
                ].map(item => (
                  <Box key={item.key} sx={{ py: 1 }}>
                    <FormControlLabel
                      control={<Switch checked={(notifications as any)[item.key]} onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })} />}
                      label={<Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.label}</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.desc}</Typography></Box>}
                    />
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Privacy Controls" />
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Profile Visibility</InputLabel>
                  <Select value={privacy.profileVisibility} label="Profile Visibility" onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}>
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="doctors_only">My Doctors Only</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel control={<Switch checked={privacy.shareDataResearch} onChange={(e) => setPrivacy({ ...privacy, shareDataResearch: e.target.checked })} />}
                  label={<Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>Share Data for Research</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Contribute anonymized data to cancer research</Typography></Box>} />
                <FormControlLabel control={<Switch checked={privacy.showHealthScore} onChange={(e) => setPrivacy({ ...privacy, showHealthScore: e.target.checked })} />}
                  label={<Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>Show Health Score</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Display health score on your profile</Typography></Box>} />
                <FormControlLabel control={<Switch checked={privacy.allowAnonymousAnalytics} onChange={(e) => setPrivacy({ ...privacy, allowAnonymousAnalytics: e.target.checked })} />}
                  label={<Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>Anonymous Analytics</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Help improve the platform with usage analytics</Typography></Box>} />
                <FormControlLabel control={<Switch checked={privacy.showOnlineStatus} onChange={(e) => setPrivacy({ ...privacy, showOnlineStatus: e.target.checked })} />}
                  label={<Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>Show Online Status</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Let others see when you're online</Typography></Box>} />
                <FormControl fullWidth size="small">
                  <InputLabel>Data Retention</InputLabel>
                  <Select value={privacy.dataRetention} label="Data Retention" onChange={(e) => setPrivacy({ ...privacy, dataRetention: e.target.value })}>
                    <MenuItem value="1_year">1 Year</MenuItem>
                    <MenuItem value="3_years">3 Years</MenuItem>
                    <MenuItem value="5_years">5 Years</MenuItem>
                    <MenuItem value="forever">Forever</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <Button variant="contained" sx={{ mt: 3 }} fullWidth>Save Privacy Settings</Button>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, mb: 2 }}>
              <SectionHeader title="HIPAA & Compliance" />
              <Alert severity="success" sx={{ mb: 2 }}>Your data is protected under HIPAA regulations. All communications are encrypted end-to-end.</Alert>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: 13 }}>Data Encryption</Typography><Chip label="AES-256" size="small" color="success" sx={{ fontSize: 10 }} /></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: 13 }}>HIPAA Compliant</Typography><Chip label="Yes" size="small" color="success" sx={{ fontSize: 10 }} /></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: 13 }}>SOC 2 Type II</Typography><Chip label="Certified" size="small" color="success" sx={{ fontSize: 10 }} /></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: 13 }}>Last Audit</Typography><Chip label="Dec 2025" size="small" sx={{ fontSize: 10 }} /></Stack>
              </Stack>
            </Card>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Consent Management" />
              <Stack spacing={1}>
                {['Terms of Service', 'Privacy Policy', 'Data Processing Agreement', 'Research Consent'].map(item => (
                  <Stack key={item} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
                    <Typography sx={{ fontSize: 13 }}>{item}</Typography>
                    <Button size="small" sx={{ fontSize: 11 }}>View</Button>
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Password & Authentication" />
              <Stack spacing={2}>
                <Box sx={{ p: 2, bgcolor: '#f8f9ff', borderRadius: 2 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Password</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Last changed: January 5, 2026</Typography>
                  <Button variant="outlined" size="small" sx={{ mt: 1 }} startIcon={<Key />} onClick={() => setShowPasswordDialog(true)}>Change Password</Button>
                </Box>
                <Box sx={{ p: 2, bgcolor: '#f8f9ff', borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Two-Factor Authentication</Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Add an extra layer of security</Typography>
                    </Box>
                    <Chip label="Disabled" size="small" color="warning" sx={{ fontSize: 10 }} />
                  </Stack>
                  <Button variant="outlined" size="small" sx={{ mt: 1 }} startIcon={<Smartphone />} onClick={() => setShow2FADialog(true)}>Enable 2FA</Button>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, mb: 2 }}>
              <SectionHeader title="Active Sessions" />
              {[
                { device: 'Chrome on Windows', ip: '192.168.1.x', time: 'Active now', current: true },
                { device: 'Safari on iPhone', ip: '10.0.0.x', time: '2 hours ago', current: false },
                { device: 'Firefox on MacOS', ip: '172.16.0.x', time: '1 day ago', current: false },
              ].map((s, i) => (
                <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{s.device}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{s.ip} • {s.time}</Typography>
                  </Box>
                  {s.current ? <Chip label="Current" size="small" color="success" sx={{ fontSize: 10 }} /> : <Button size="small" color="error" sx={{ fontSize: 11 }}>Revoke</Button>}
                </Stack>
              ))}
              <Button color="error" fullWidth sx={{ mt: 2, fontSize: 12 }}>Revoke All Other Sessions</Button>
            </Card>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Login History" />
              {[
                { date: 'Feb 20, 2026 10:30 AM', device: 'Chrome', location: 'Medical City, MC', status: 'Success' },
                { date: 'Feb 19, 2026 8:15 AM', device: 'Safari', location: 'Medical City, MC', status: 'Success' },
                { date: 'Feb 18, 2026 11:00 PM', device: 'Unknown', location: 'New York, NY', status: 'Failed' },
              ].map((l, i) => (
                <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Box>
                    <Typography sx={{ fontSize: 12 }}>{l.date}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{l.device} • {l.location}</Typography>
                  </Box>
                  <Chip label={l.status} size="small" color={l.status === 'Success' ? 'success' : 'error'} sx={{ fontSize: 10 }} />
                </Stack>
              ))}
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Theme Mode" />
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Card sx={{ p: 2, flex: 1, cursor: 'pointer', border: !isDark ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`, textAlign: 'center' }} onClick={() => setMode('light')}>
                  <LightMode sx={{ fontSize: 32, color: theme.palette.warning.main }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mt: 1 }}>Light</Typography>
                </Card>
                <Card sx={{ p: 2, flex: 1, cursor: 'pointer', border: isDark ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`, textAlign: 'center' }} onClick={() => setMode('dark')}>
                  <DarkMode sx={{ fontSize: 32, color: isDark ? theme.palette.primary.main : 'text.secondary' }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mt: 1 }}>Dark</Typography>
                </Card>
              </Stack>
              <SectionHeader title="Theme Variant" />
              <Grid container spacing={1.5} sx={{ mb: 3 }}>
                {(Object.entries(themeVariants) as [ThemeVariant, typeof themeVariants[ThemeVariant]][]).map(([key, def]) => (
                  <Grid item xs={6} key={key}>
                    <Card sx={{
                      p: 1.5, cursor: 'pointer', textAlign: 'center',
                      border: variant === key ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                      bgcolor: variant === key ? alpha(theme.palette.primary.main, 0.08) : undefined,
                    }} onClick={() => setVariant(key)}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: def.light.primary.main, mx: 'auto', mb: 0.5, border: isDark ? '2px solid rgba(255,255,255,0.2)' : '2px solid rgba(0,0,0,0.1)' }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{def.label}</Typography>
                      <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{def.description}</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <SectionHeader title="Font Size" />
              <Slider defaultValue={14} min={12} max={20} step={1} marks valueLabelDisplay="auto" sx={{ mb: 3 }} />
              <SectionHeader title="Language" />
              <FormControl fullWidth size="small">
                <Select defaultValue="en">
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                  <MenuItem value="ja">日本語</MenuItem>
                </Select>
              </FormControl>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Dashboard Customization" />
              <Stack spacing={1.5}>
                {[
                  { label: 'Show Health Score Widget', defaultChecked: true },
                  { label: 'Show Vital Signs Strip', defaultChecked: true },
                  { label: 'Show Activity Timeline', defaultChecked: true },
                  { label: 'Show Quick Actions', defaultChecked: true },
                  { label: 'Show AI Insights', defaultChecked: true },
                  { label: 'Show Medication Tracker', defaultChecked: false },
                  { label: 'Show Water Intake', defaultChecked: true },
                  { label: 'Compact Mode', defaultChecked: false },
                ].map(item => (
                  <FormControlLabel key={item.label} control={<Switch defaultChecked={item.defaultChecked} />} label={<Typography sx={{ fontSize: 13 }}>{item.label}</Typography>} />
                ))}
              </Stack>
              <Button variant="contained" fullWidth sx={{ mt: 2 }}>Save Preferences</Button>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Export Your Data" />
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>Download a copy of all your health data stored on CancerGuard.</Typography>
              <Stack spacing={1.5}>
                {[
                  { label: 'Health Records', desc: '45 records', size: '2.3 MB' },
                  { label: 'Blood Test Results', desc: '12 tests', size: '1.1 MB' },
                  { label: 'Smartwatch Data', desc: '180 days', size: '15.4 MB' },
                  { label: 'Medications History', desc: '24 entries', size: '0.2 MB' },
                  { label: 'Appointment Records', desc: '8 appointments', size: '0.4 MB' },
                  { label: 'Symptom Logs', desc: '32 entries', size: '0.1 MB' },
                ].map(item => (
                  <Stack key={item.label} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, bgcolor: alpha(theme.palette.background.default, 0.6), borderRadius: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.desc} • {item.size}</Typography>
                    </Box>
                    <Button size="small" startIcon={<Download />} sx={{ fontSize: 11 }}>Export</Button>
                  </Stack>
                ))}
              </Stack>
              <Button variant="contained" fullWidth sx={{ mt: 2 }} startIcon={<Download />} onClick={() => setShowExportDialog(true)}>Export All Data</Button>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, mb: 2 }}>
              <SectionHeader title="Storage Usage" />
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>19.5 MB / 100 MB used</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>19.5%</Typography>
                </Stack>
                <Box sx={{ width: '100%', height: 12, borderRadius: 6, bgcolor: alpha(theme.palette.text.primary, 0.08), overflow: 'hidden', display: 'flex' }}>
                  <Box sx={{ width: '15%', height: '100%', bgcolor: theme.palette.primary.main }} />
                  <Box sx={{ width: '2%', height: '100%', bgcolor: theme.palette.success.main }} />
                  <Box sx={{ width: '1%', height: '100%', bgcolor: theme.palette.warning.main }} />
                  <Box sx={{ width: '1.5%', height: '100%', bgcolor: theme.palette.secondary.main }} />
                </Box>
              </Box>
              <Stack spacing={0.5}>
                {[
                  { label: 'Smartwatch Data', color: theme.palette.primary.main, size: '15.4 MB' },
                  { label: 'Health Records', color: theme.palette.success.main, size: '2.3 MB' },
                  { label: 'Blood Tests', color: theme.palette.warning.main, size: '1.1 MB' },
                  { label: 'Other', color: theme.palette.secondary.main, size: '0.7 MB' },
                ].map(s => (
                  <Stack key={s.label} direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} />
                    <Typography sx={{ fontSize: 12, flex: 1 }}>{s.label}</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{s.size}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
            <Card sx={{ p: 3, border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`, bgcolor: isDark ? alpha(theme.palette.error.dark, 0.1) : alpha(theme.palette.error.light, 0.08) }}>
              <SectionHeader title="Danger Zone" />
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>Permanent actions that cannot be undone.</Typography>
              <Stack spacing={1.5}>
                <Button variant="outlined" color="error" fullWidth onClick={() => setShowDeleteDialog(true)}>Delete All Health Data</Button>
                <Button variant="contained" color="error" fullWidth>Delete Account</Button>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Current Password" type="password" fullWidth size="small" />
            <TextField label="New Password" type="password" fullWidth size="small" />
            <TextField label="Confirm New Password" type="password" fullWidth size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowPasswordDialog(false)}>Update Password</Button>
        </DialogActions>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog open={show2FADialog} onClose={() => setShow2FADialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Enable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>
            Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </Typography>
          <Box sx={{ width: 150, height: 150, bgcolor: alpha(theme.palette.text.primary, 0.06), mx: 'auto', mb: 2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>[QR Code]</Typography>
          </Box>
          <TextField label="Enter Verification Code" fullWidth size="small" placeholder="000000" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShow2FADialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShow2FADialog(false)}>Verify & Enable</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Data Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#c62828' }}>Delete All Health Data?</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>This action is permanent and cannot be undone. All your health records, test results, and tracking data will be permanently deleted.</Alert>
          <TextField label='Type "DELETE" to confirm' fullWidth size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => setShowDeleteDialog(false)}>Delete All Data</Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Export All Data</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>Choose your export format:</Typography>
          <Stack spacing={1.5}>
            {['JSON', 'CSV', 'PDF', 'FHIR Bundle'].map(fmt => (
              <Button key={fmt} variant="outlined" fullWidth>{fmt}</Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default SettingsPage;
