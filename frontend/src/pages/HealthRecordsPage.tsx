import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, AppBar, Toolbar, IconButton, Stack, Chip, Avatar, Badge, Button } from '@mui/material';
import { ArrowBack, Notifications as NotifIcon, HealthAndSafety as HealthIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { healthRecordsAPI } from '../services/api';
import { HealthRecord } from '../types';

const HealthRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const res = await healthRecordsAPI.getMyRecords();
      setRecords(res.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}><ArrowBack /></IconButton>
          <HealthIcon sx={{ color: '#1565c0', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', flex: 1 }}>Health Records</Typography>
          <Chip label={`Health ID: ${user?.health_id || 'N/A'}`} sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4 }}>Medical History</Typography>
        
        {records.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">No health records found</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Your medical records will appear here as you visit hospitals and receive care.
            </Typography>
          </Card>
        ) : (
          <Stack spacing={2}>
            {records.map((record) => (
              <Card key={record.id} sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{record.record_type.replace('_', ' ').toUpperCase()}</Typography>
                    <Typography variant="body2" color="text.secondary">{record.primary_diagnosis || 'No diagnosis'}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(record.encounter_date).toLocaleDateString()}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {record.is_cancer_related && <Chip label="Cancer Related" size="small" color="error" />}
                    {record.ai_risk_level && <Chip label={`AI Risk: ${record.ai_risk_level}`} size="small" color="warning" />}
                    <Chip label={record.status} size="small" variant="outlined" />
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default HealthRecordsPage;
