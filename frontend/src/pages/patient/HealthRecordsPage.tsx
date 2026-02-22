import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert,
  Pagination, Divider, Tooltip, Badge, LinearProgress, Switch,
} from '@mui/material';
import {
  FolderShared as RecordsIcon, Search as SearchIcon, FilterList,
  Add as AddIcon, Download as DownloadIcon, Upload as UploadIcon,
  Visibility, Share as ShareIcon, Print as PrintIcon,
  CalendarMonth, LocalHospital, Person, AssignmentInd,
  MedicalServices, Science, Warning, CheckCircle,
  ArrowForward, Timeline as TimelineIcon, Description,
  CloudUpload, Delete, Edit,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { SectionHeader, StatusBadge, StatCard, TimelineItem, EmptyState } from '../../components/common/SharedComponents';
import { healthRecordsAPI } from '../../services/api';

const HealthRecordsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showRecordDetail, setShowRecordDetail] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [loading, setLoading] = useState(false);

  const records = [
    { id: '1', record_number: 'HR-2026-001', record_type: 'lab_result', category: 'Blood Test', status: 'completed', encounter_date: '2026-02-20', primary_diagnosis: 'Annual CBC Panel', doctor_name: 'Dr. Sarah Smith', hospital_name: 'City General Hospital', department: 'Pathology', is_cancer_related: false, ai_risk_level: 'low', follow_up_required: false },
    { id: '2', record_number: 'HR-2026-002', record_type: 'consultation', category: 'Oncology', status: 'completed', encounter_date: '2026-02-15', primary_diagnosis: 'Cancer Risk Review', doctor_name: 'Dr. James Lee', hospital_name: 'Cancer Research Center', department: 'Oncology', is_cancer_related: true, ai_risk_level: 'moderate', follow_up_required: true, follow_up_date: '2026-03-15' },
    { id: '3', record_number: 'HR-2026-003', record_type: 'imaging', category: 'Radiology', status: 'completed', encounter_date: '2026-02-10', primary_diagnosis: 'Chest X-Ray - Normal', doctor_name: 'Dr. Emily Chen', hospital_name: 'City General Hospital', department: 'Radiology', is_cancer_related: false, ai_risk_level: 'very_low', follow_up_required: false },
    { id: '4', record_number: 'HR-2026-004', record_type: 'prescription', category: 'Medication', status: 'active', encounter_date: '2026-02-08', primary_diagnosis: 'Metformin 500mg - Diabetes Management', doctor_name: 'Dr. Robert Wilson', hospital_name: 'Community Health Center', department: 'Internal Medicine', is_cancer_related: false, ai_risk_level: 'low', follow_up_required: true, follow_up_date: '2026-05-08' },
    { id: '5', record_number: 'HR-2025-042', record_type: 'procedure', category: 'Surgery', status: 'completed', encounter_date: '2025-12-15', primary_diagnosis: 'Mole Removal - Biopsy Benign', doctor_name: 'Dr. Lisa Park', hospital_name: 'Dermatology Clinic', department: 'Dermatology', is_cancer_related: true, ai_risk_level: 'very_low', follow_up_required: false },
    { id: '6', record_number: 'HR-2025-041', record_type: 'lab_result', category: 'Blood Test', status: 'completed', encounter_date: '2025-11-20', primary_diagnosis: 'Tumor Marker Panel - All Normal', doctor_name: 'Dr. Sarah Smith', hospital_name: 'Cancer Research Center', department: 'Oncology', is_cancer_related: true, ai_risk_level: 'low', follow_up_required: false },
    { id: '7', record_number: 'HR-2025-040', record_type: 'vaccination', category: 'Preventive', status: 'completed', encounter_date: '2025-10-05', primary_diagnosis: 'HPV Vaccine - Dose 2', doctor_name: 'Dr. Maria Garcia', hospital_name: 'Community Health Center', department: 'Preventive Care', is_cancer_related: true, ai_risk_level: 'very_low', follow_up_required: true, follow_up_date: '2026-04-05' },
    { id: '8', record_number: 'HR-2025-039', record_type: 'consultation', category: 'General', status: 'completed', encounter_date: '2025-09-18', primary_diagnosis: 'Annual Physical Exam', doctor_name: 'Dr. Robert Wilson', hospital_name: 'Community Health Center', department: 'Internal Medicine', is_cancer_related: false, ai_risk_level: 'low', follow_up_required: false },
  ];

  const recordTypes = ['all', 'lab_result', 'consultation', 'imaging', 'prescription', 'procedure', 'vaccination'];

  const filteredRecords = records.filter(r => {
    if (filterType !== 'all' && r.record_type !== filterType) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchQuery && !r.primary_diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) && !r.record_number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const typeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      lab_result: <Science sx={{ fontSize: 18 }} />,
      consultation: <Person sx={{ fontSize: 18 }} />,
      imaging: <Description sx={{ fontSize: 18 }} />,
      prescription: <MedicalServices sx={{ fontSize: 18 }} />,
      procedure: <LocalHospital sx={{ fontSize: 18 }} />,
      vaccination: <MedicalServices sx={{ fontSize: 18 }} />,
    };
    return icons[type] || <RecordsIcon sx={{ fontSize: 18 }} />;
  };

  return (
    <AppLayout title="Health Records" subtitle={`${records.length} records found`} navItems={patientNavItems} portalType="patient">
      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<RecordsIcon />} label="Total Records" value={records.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Science />} label="Lab Results" value={records.filter(r => r.record_type === 'lab_result').length} color="#00897b" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Warning />} label="Cancer Related" value={records.filter(r => r.is_cancer_related).length} color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CalendarMonth />} label="Follow-ups Due" value={records.filter(r => r.follow_up_required).length} color="#d32f2f" /></Grid>
      </Grid>

      {/* Search & Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Search records by diagnosis or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20 }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Record Type</InputLabel>
            <Select value={filterType} label="Record Type" onChange={(e) => setFilterType(e.target.value)}>
              {recordTypes.map(t => <MenuItem key={t} value={t}>{t === 'all' ? 'All Types' : t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Toggle View">
              <IconButton onClick={() => setViewMode(viewMode === 'table' ? 'timeline' : 'table')} size="small" sx={{ border: '1px solid #e0e0e0' }}>
                <TimelineIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Button variant="outlined" startIcon={<DownloadIcon />} size="small">Export</Button>
            <Button variant="contained" startIcon={<UploadIcon />} size="small" onClick={() => setShowUploadDialog(true)}>Upload</Button>
          </Stack>
        </Stack>
      </Card>

      {/* Records View */}
      {viewMode === 'table' ? (
        <Card sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Record #</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Diagnosis/Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Doctor</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Hospital</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>AI Risk</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8f9ff' } }} onClick={() => { setSelectedRecord(record); setShowRecordDetail(true); }}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1565c0' }}>
                          {typeIcon(record.record_type)}
                        </Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }}>{record.record_type.replace(/_/g, ' ')}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{record.record_number}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{record.encounter_date}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontWeight: 500, maxWidth: 200 }}>{record.primary_diagnosis}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{record.doctor_name}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{record.hospital_name}</TableCell>
                    <TableCell><StatusBadge status={record.ai_risk_level || 'N/A'} /></TableCell>
                    <TableCell><StatusBadge status={record.status} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small"><Visibility sx={{ fontSize: 18 }} /></IconButton>
                        <IconButton size="small"><DownloadIcon sx={{ fontSize: 18 }} /></IconButton>
                        <IconButton size="small"><ShareIcon sx={{ fontSize: 18 }} /></IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={3} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        </Card>
      ) : (
        <Card sx={{ p: 3 }}>
          <SectionHeader title="Health Timeline" subtitle="Chronological view of your health events" icon={<TimelineIcon />} />
          {filteredRecords.map((record, i) => (
            <TimelineItem
              key={record.id}
              time={record.encounter_date}
              title={record.primary_diagnosis || record.record_type}
              description={`${record.doctor_name} at ${record.hospital_name} - ${record.department}`}
              icon={typeIcon(record.record_type)}
              color={record.is_cancer_related ? '#f57c00' : '#1565c0'}
              isLast={i === filteredRecords.length - 1}
            />
          ))}
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onClose={() => setShowUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Upload Health Record</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Record Type</InputLabel>
              <Select label="Record Type" defaultValue="">
                <MenuItem value="lab_result">Lab Result</MenuItem>
                <MenuItem value="imaging">Medical Imaging</MenuItem>
                <MenuItem value="prescription">Prescription</MenuItem>
                <MenuItem value="consultation">Consultation Notes</MenuItem>
                <MenuItem value="procedure">Procedure Report</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Description" multiline rows={2} size="small" />
            <TextField label="Doctor Name" size="small" />
            <TextField label="Hospital/Clinic" size="small" />
            <TextField label="Date" type="date" size="small" InputLabelProps={{ shrink: true }} />
            <Box sx={{
              p: 4, textAlign: 'center', border: '2px dashed #ccc', borderRadius: 3,
              bgcolor: '#fafafa', cursor: 'pointer',
              '&:hover': { borderColor: '#1565c0', bgcolor: '#f0f4ff' },
            }}>
              <CloudUpload sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
              <Typography sx={{ fontWeight: 600, color: 'text.secondary' }}>Drop files here or click to upload</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>PDF, JPEG, PNG, DICOM up to 25MB</Typography>
            </Box>
            <Alert severity="info">
              Uploaded records will be analyzed by our AI for cancer risk markers.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowUploadDialog(false)}>Upload Record</Button>
        </DialogActions>
      </Dialog>

      {/* Record Detail Dialog */}
      <Dialog open={showRecordDetail} onClose={() => setShowRecordDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Record Details - {selectedRecord?.record_number}</Typography>
            <Stack direction="row" spacing={1}>
              <IconButton size="small"><PrintIcon /></IconButton>
              <IconButton size="small"><DownloadIcon /></IconButton>
              <IconButton size="small"><ShareIcon /></IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Grid container spacing={3} sx={{ mt: 0 }}>
              <Grid item xs={12} md={6}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Record Type</Typography><Typography sx={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{selectedRecord.record_type.replace(/_/g, ' ')}</Typography></Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Date</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedRecord.encounter_date}</Typography></Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Doctor</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedRecord.doctor_name}</Typography></Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Hospital</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedRecord.hospital_name}</Typography></Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Department</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedRecord.department}</Typography></Box>
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Diagnosis</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedRecord.primary_diagnosis}</Typography></Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Status</Typography><StatusBadge status={selectedRecord.status} /></Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>AI Risk Level</Typography><StatusBadge status={selectedRecord.ai_risk_level} /></Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Cancer Related</Typography><Chip label={selectedRecord.is_cancer_related ? 'Yes' : 'No'} size="small" color={selectedRecord.is_cancer_related ? 'warning' : 'default'} /></Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Follow-up</Typography>{selectedRecord.follow_up_required ? <Chip label={`Due: ${selectedRecord.follow_up_date}`} size="small" color="info" /> : <Chip label="Not Required" size="small" />}</Box>
                </Stack>
              </Grid>
              {selectedRecord.is_cancer_related && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    This record has been flagged as cancer-related and has been included in your AI risk assessment analysis.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRecordDetail(false)}>Close</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />}>Download</Button>
          <Button variant="contained" startIcon={<ShareIcon />}>Share with Doctor</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default HealthRecordsPage;
