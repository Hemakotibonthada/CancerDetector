import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon, Star as StarIcon,
  Whatshot as StreakIcon, Group as GroupIcon,
  SportsScore as ChallengeIcon, CardGiftcard as RewardIcon,
  Leaderboard as LeaderboardIcon, MilitaryTech as BadgeIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { patientEngagementAPI } from '../../services/api';

const PatientEngagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [myBadges, setMyBadges] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prof, bdg, myBdg, ch, str, lb, grp, rw, st] = await Promise.all([
        patientEngagementAPI.getGamificationProfile().catch(() => ({ data: null })),
        patientEngagementAPI.getBadges().catch(() => ({ data: [] })),
        patientEngagementAPI.getMyBadges().catch(() => ({ data: [] })),
        patientEngagementAPI.getChallenges().catch(() => ({ data: [] })),
        patientEngagementAPI.getStreaks().catch(() => ({ data: [] })),
        patientEngagementAPI.getLeaderboard().catch(() => ({ data: [] })),
        patientEngagementAPI.getSupportGroups().catch(() => ({ data: [] })),
        patientEngagementAPI.getRewards().catch(() => ({ data: [] })),
        patientEngagementAPI.getDashboardStats().catch(() => ({ data: {} })),
      ]);
      setProfile(prof.data);
      setBadges(bdg.data || []);
      setMyBadges(myBdg.data || []);
      setChallenges(ch.data || []);
      setStreaks(str.data || []);
      setLeaderboard(lb.data || []);
      setGroups(grp.data || []);
      setRewards(rw.data || []);
      setStats(st.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const joinChallenge = async (id: string) => {
    try {
      await patientEngagementAPI.joinChallenge(id);
      loadData();
    } catch (e) { console.error(e); }
  };

  const redeemReward = async (id: string) => {
    try {
      await patientEngagementAPI.redeemReward(id);
      loadData();
    } catch (e) { console.error(e); }
  };

  const levelProgress = profile ? ((profile.total_points % 1000) / 1000) * 100 : 0;

  return (
    <AppLayout title="Health Engagement & Gamification" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Profile Card */}
        {profile && (
          <Card sx={{ background: 'linear-gradient(135deg, #1a237e 0%, #4a148c 100%)', border: '1px solid rgba(255,255,255,0.2)', mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
                  <Typography variant="h1" sx={{ color: '#ffd700', fontWeight: 900 }}>L{profile.level}</Typography>
                  <LinearProgress variant="determinate" value={levelProgress} sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#ffd700' } }} />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{Math.round(levelProgress)}% to Level {profile.level + 1}</Typography>
                </Grid>
                <Grid item xs={6} md={2} sx={{ textAlign: 'center' }}>
                  <TrophyIcon sx={{ color: '#ffd700', fontSize: 32 }} />
                  <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{profile.total_points}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Total Points</Typography>
                </Grid>
                <Grid item xs={6} md={2} sx={{ textAlign: 'center' }}>
                  <StreakIcon sx={{ color: '#ff5722', fontSize: 32 }} />
                  <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{profile.current_streak_days}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Day Streak</Typography>
                </Grid>
                <Grid item xs={6} md={2} sx={{ textAlign: 'center' }}>
                  <BadgeIcon sx={{ color: '#e91e63', fontSize: 32 }} />
                  <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{profile.badges_earned}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Badges</Typography>
                </Grid>
                <Grid item xs={6} md={3} sx={{ textAlign: 'center' }}>
                  <ChallengeIcon sx={{ color: '#4caf50', fontSize: 32 }} />
                  <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>{profile.challenges_completed}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Challenges Done</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' }, '& .Mui-selected': { color: '#ffd700' } }}>
          <Tab label="Challenges" icon={<ChallengeIcon />} iconPosition="start" />
          <Tab label="Badges" icon={<BadgeIcon />} iconPosition="start" />
          <Tab label="Leaderboard" icon={<LeaderboardIcon />} iconPosition="start" />
          <Tab label="Support Groups" icon={<GroupIcon />} iconPosition="start" />
          <Tab label="Rewards" icon={<RewardIcon />} iconPosition="start" />
        </Tabs>

        {/* Challenges */}
        {activeTab === 0 && (
          <Grid container spacing={2}>
            {challenges.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No active challenges. Check back later!</Alert></Grid>
            ) : challenges.map((c: any) => (
              <Grid item xs={12} md={6} lg={4} key={c.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{c.name}</Typography>
                      <Chip label={`+${c.points_reward} pts`} size="small" sx={{ bgcolor: 'rgba(255,215,0,0.3)', color: '#ffd700' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>{c.description}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={c.difficulty} size="small" sx={{ bgcolor: c.difficulty === 'hard' ? 'rgba(244,67,54,0.3)' : c.difficulty === 'medium' ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)', color: c.difficulty === 'hard' ? '#ef5350' : c.difficulty === 'medium' ? '#ffb74d' : '#81c784' }} />
                      <Chip label={`${c.duration_days} days`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      {c.participants_count && <Chip label={`${c.participants_count} joined`} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />}
                    </Stack>
                    <Button fullWidth variant="outlined" sx={{ mt: 2, color: '#ffd700', borderColor: '#ffd700' }} onClick={() => joinChallenge(c.id)}>
                      Join Challenge
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Badges */}
        {activeTab === 1 && (
          <Grid container spacing={2}>
            {badges.map((b: any) => {
              const earned = myBadges.some((mb: any) => mb.badge_id === b.id);
              return (
                <Grid item xs={6} md={4} lg={3} key={b.id}>
                  <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: `1px solid ${earned ? '#ffd700' : 'rgba(255,255,255,0.1)'}`, opacity: earned ? 1 : 0.5, textAlign: 'center' }}>
                    <CardContent>
                      <BadgeIcon sx={{ fontSize: 48, color: earned ? '#ffd700' : '#9e9e9e' }} />
                      <Typography variant="h6" sx={{ color: earned ? '#ffd700' : '#9e9e9e', mt: 1 }}>{b.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{b.description}</Typography>
                      <Chip label={earned ? 'Earned!' : 'Locked'} size="small" sx={{ mt: 1, bgcolor: earned ? 'rgba(255,215,0,0.3)' : 'rgba(158,158,158,0.3)', color: earned ? '#ffd700' : '#9e9e9e' }} />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Leaderboard */}
        {activeTab === 2 && (
          <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#ffd700', mb: 2 }}>🏆 Health Champions Leaderboard</Typography>
              {leaderboard.length === 0 ? (
                <Alert severity="info">Leaderboard is empty. Be the first to earn points!</Alert>
              ) : leaderboard.map((entry: any, i: number) => (
                <Stack key={i} direction="row" alignItems="center" spacing={2} sx={{ py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <Typography variant="h5" sx={{ color: i < 3 ? '#ffd700' : 'rgba(255,255,255,0.7)', fontWeight: 700, width: 40 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${entry.rank}`}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: '#fff' }}>{entry.display_name}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Level {entry.level} • {entry.badges_count} badges</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ color: '#ffd700', fontWeight: 700 }}>{entry.total_points} pts</Typography>
                </Stack>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Support Groups */}
        {activeTab === 3 && (
          <Grid container spacing={2}>
            {groups.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No support groups available yet.</Alert></Grid>
            ) : groups.map((g: any) => (
              <Grid item xs={12} md={6} key={g.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{g.name}</Typography>
                      <Chip label={`${g.member_count} members`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>{g.description}</Typography>
                    {g.cancer_type && <Chip label={g.cancer_type} size="small" sx={{ mt: 1, bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />}
                    <Button fullWidth variant="outlined" sx={{ mt: 2, color: '#90caf9', borderColor: '#90caf9' }}>Join Group</Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Rewards */}
        {activeTab === 4 && (
          <Grid container spacing={2}>
            {rewards.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No rewards available yet. Keep earning points!</Alert></Grid>
            ) : rewards.map((r: any) => (
              <Grid item xs={12} md={6} lg={4} key={r.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <RewardIcon sx={{ fontSize: 48, color: '#ffd700', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#fff' }}>{r.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>{r.description}</Typography>
                    <Chip label={`${r.points_cost} pts`} sx={{ mt: 1, bgcolor: 'rgba(255,215,0,0.3)', color: '#ffd700' }} />
                    <Button fullWidth variant="contained" sx={{ mt: 2, bgcolor: '#ffd700', color: '#000', '&:hover': { bgcolor: '#ffb300' } }}
                      disabled={!r.is_available || (profile && profile.total_points < r.points_cost)}
                      onClick={() => redeemReward(r.id)}>
                      Redeem
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </AppLayout>
  );
};

export default PatientEngagementPage;
