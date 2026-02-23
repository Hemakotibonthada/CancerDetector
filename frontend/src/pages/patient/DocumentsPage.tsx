import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Stack, Chip, Button, IconButton,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Divider, Tooltip, InputAdornment, LinearProgress,
  Tab, Tabs, Badge, Paper,
} from '@mui/material';
import {
  CloudUpload, Description, Delete, Download, Search, FilterList,
  PictureAsPdf, Image as ImageIcon, Article, MedicalServices, Science,
  LocalPharmacy, HealthAndSafety, Folder, Visibility, Share,
  InsertDriveFile, Assignment, Vaccines,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { documentsAPI } from '../../services/api';

const CATEGORIES = [
  { value: 'medical_report', label: 'Medical Report', icon: <MedicalServices />, color: '#1565c0' },
  { value: 'lab_result', label: 'Lab Result', icon: <Science />, color: '#2e7d32' },
  { value: 'prescription', label: 'Prescription', icon: <LocalPharmacy />, color: '#7b1fa2' },
  { value: 'imaging', label: 'Imaging/Scan', icon: <ImageIcon />, color: '#e65100' },
  { value: 'discharge_summary', label: 'Discharge Summary', icon: <Assignment />, color: '#00695c' },
  { value: 'surgery_report', label: 'Surgery Report', icon: <HealthAndSafety />, color: '#c62828' },
  { value: 'insurance_card', label: 'Insurance Card', icon: <Article />, color: '#283593' },
  { value: 'insurance_claim', label: 'Insurance Claim', icon: <Description />, color: '#4527a0' },
  { value: 'vaccination', label: 'Vaccination Record', icon: <Vaccines />, color: '#00838f' },
  { value: 'pathology', label: 'Pathology Report', icon: <Science />, color: '#bf360c' },
  { value: 'referral', label: 'Referral', icon: <Share />, color: '#1b5e20' },
  { value: 'other', label: 'Other', icon: <InsertDriveFile />, color: '#546e7a' },
];

const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('medical_report');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadDoctorName, setUploadDoctorName] = useState('');
  const [uploadHospitalName, setUploadHospitalName] = useState('');
  const [uploadDocDate, setUploadDocDate] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;
      const res = await documentsAPI.getMyDocuments(params);
      const data = res.data;
      setDocuments(data.documents || data || []);
      setCategoryCounts(data.category_counts || {});
      setError('');
    } catch {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      setShowUploadDialog(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('category', uploadCategory);
    if (uploadDescription) formData.append('description', uploadDescription);
    if (uploadDoctorName) formData.append('doctor_name', uploadDoctorName);
    if (uploadHospitalName) formData.append('hospital_name', uploadHospitalName);
    if (uploadDocDate) formData.append('document_date', uploadDocDate);
    if (uploadNotes) formData.append('notes', uploadNotes);

    try {
      setUploading(true);
      setUploadProgress(30);
      await documentsAPI.upload(formData);
      setUploadProgress(100);
      setShowUploadDialog(false);
      resetUploadForm();
      loadDocuments();
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadCategory('medical_report');
    setUploadDescription('');
    setUploadDoctorName('');
    setUploadHospitalName('');
    setUploadDocDate('');
    setUploadNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (docId: string) => {
    try {
      await documentsAPI.deleteDocument(docId);
      loadDocuments();
    } catch {
      setError('Failed to delete document');
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      const res = await documentsAPI.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.file_name || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Download failed');
    }
  };

  const totalDocs = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  const filteredDocs = documents.filter(d => {
    if (activeTab === 1) return ['medical_report', 'lab_result', 'discharge_summary', 'surgery_report', 'pathology'].includes(d.category);
    if (activeTab === 2) return ['prescription'].includes(d.category);
    if (activeTab === 3) return ['imaging'].includes(d.category);
    if (activeTab === 4) return ['insurance_card', 'insurance_claim', 'insurance_eob'].includes(d.category);
    if (activeTab === 5) return ['vaccination', 'referral', 'consent_form', 'other'].includes(d.category);
    return true;
  });

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return <PictureAsPdf sx={{ color: '#d32f2f' }} />;
    if (fileType?.includes('image')) return <ImageIcon sx={{ color: '#1565c0' }} />;
    return <InsertDriveFile sx={{ color: '#546e7a' }} />;
  };

  return (
    <AppLayout title="My Documents" subtitle="Upload and manage your medical reports & documents" navItems={patientNavItems} portalType="patient">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Typography sx={{ fontSize: 28, fontWeight: 800 }}>{totalDocs}</Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.9 }}>Total Documents</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <Typography sx={{ fontSize: 28, fontWeight: 800 }}>{categoryCounts['medical_report'] || 0}</Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.9 }}>Medical Reports</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <Typography sx={{ fontSize: 28, fontWeight: 800 }}>{categoryCounts['insurance_card'] || 0}</Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.9 }}>Insurance Docs</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <Typography sx={{ fontSize: 28, fontWeight: 800 }}>{categoryCounts['lab_result'] || 0}</Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.9 }}>Lab Results</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Upload & Search Bar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Button variant="contained" startIcon={<CloudUpload />} onClick={() => fileInputRef.current?.click()}
          sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', fontWeight: 700, px: 3 }}>
          Upload Document
        </Button>
        <input ref={fileInputRef} type="file" hidden onChange={handleFileSelect}
          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt,.tiff,.dcm" />
        <TextField size="small" placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          sx={{ flex: 1 }} InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
        <TextField select size="small" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          sx={{ minWidth: 180 }} label="Category">
          <MenuItem value="">All Categories</MenuItem>
          {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
        </TextField>
      </Stack>

      {/* Tab Filters */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label={<Badge badgeContent={totalDocs} color="primary" max={999}>All</Badge>} />
        <Tab label="Medical Reports" />
        <Tab label="Prescriptions" />
        <Tab label="Imaging" />
        <Tab label="Insurance" />
        <Tab label="Others" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : filteredDocs.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No documents yet</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Upload your medical reports, prescriptions, insurance cards, and more</Typography>
          <Button variant="contained" startIcon={<CloudUpload />} onClick={() => fileInputRef.current?.click()}>Upload Your First Document</Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredDocs.map(doc => {
            const catInfo = getCategoryInfo(doc.category);
            return (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
                <Card sx={{ height: '100%', '&:hover': { boxShadow: 6 }, cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onClick={() => { setSelectedDoc(doc); setShowDetailDialog(true); }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                      {getFileIcon(doc.file_type)}
                      <Typography sx={{ fontSize: 14, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.title}
                      </Typography>
                    </Stack>
                    <Chip icon={catInfo.icon} label={catInfo.label} size="small"
                      sx={{ fontSize: 10, bgcolor: `${catInfo.color}15`, color: catInfo.color, mb: 1.5 }} />
                    {doc.description && (
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.description}
                      </Typography>
                    )}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                        {formatFileSize(doc.file_size || 0)} • {new Date(doc.created_at).toLocaleDateString()}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Download"><IconButton size="small" onClick={e => { e.stopPropagation(); handleDownload(doc); }}><Download sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}><Delete sx={{ fontSize: 16, color: '#f44336' }} /></IconButton></Tooltip>
                      </Stack>
                    </Stack>
                    {doc.doctor_name && <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>Dr. {doc.doctor_name}</Typography>}
                    {doc.hospital_name && <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{doc.hospital_name}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onClose={() => { setShowUploadDialog(false); resetUploadForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Upload Document</DialogTitle>
        <DialogContent>
          {uploading && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 2 }} />}
          <Stack spacing={2} sx={{ mt: 1 }}>
            {uploadFile && (
              <Alert severity="info" icon={<InsertDriveFile />}>
                {uploadFile.name} ({formatFileSize(uploadFile.size)})
              </Alert>
            )}
            <TextField label="Document Title" fullWidth required value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} />
            <TextField select label="Category" fullWidth value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
              {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </TextField>
            <TextField label="Description" fullWidth multiline rows={2} value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Doctor Name" fullWidth value={uploadDoctorName} onChange={e => setUploadDoctorName(e.target.value)} /></Grid>
              <Grid item xs={6}><TextField label="Hospital/Clinic" fullWidth value={uploadHospitalName} onChange={e => setUploadHospitalName(e.target.value)} /></Grid>
            </Grid>
            <TextField label="Document Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={uploadDocDate} onChange={e => setUploadDocDate(e.target.value)} />
            <TextField label="Notes" fullWidth multiline rows={2} value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowUploadDialog(false); resetUploadForm(); }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={!uploadFile || !uploadTitle || uploading} startIcon={<CloudUpload />}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onClose={() => setShowDetailDialog(false)} maxWidth="sm" fullWidth>
        {selectedDoc && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>{selectedDoc.title}</DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Chip icon={getCategoryInfo(selectedDoc.category).icon} label={getCategoryInfo(selectedDoc.category).label}
                  sx={{ alignSelf: 'flex-start', bgcolor: `${getCategoryInfo(selectedDoc.category).color}15`, color: getCategoryInfo(selectedDoc.category).color }} />
                {selectedDoc.description && <Typography>{selectedDoc.description}</Typography>}
                <Divider />
                <Grid container spacing={2}>
                  <Grid item xs={6}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>File Name</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedDoc.file_name}</Typography></Grid>
                  <Grid item xs={6}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>File Size</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{formatFileSize(selectedDoc.file_size || 0)}</Typography></Grid>
                  <Grid item xs={6}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>File Type</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedDoc.file_type}</Typography></Grid>
                  <Grid item xs={6}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Uploaded</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{new Date(selectedDoc.created_at).toLocaleDateString()}</Typography></Grid>
                  {selectedDoc.doctor_name && <Grid item xs={6}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Doctor</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>Dr. {selectedDoc.doctor_name}</Typography></Grid>}
                  {selectedDoc.hospital_name && <Grid item xs={6}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Hospital</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedDoc.hospital_name}</Typography></Grid>}
                  {selectedDoc.document_date && <Grid item xs={6}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Document Date</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{new Date(selectedDoc.document_date).toLocaleDateString()}</Typography></Grid>}
                </Grid>
                {selectedDoc.notes && (<><Divider /><Typography sx={{ fontSize: 13 }}><strong>Notes:</strong> {selectedDoc.notes}</Typography></>)}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
              <Button variant="outlined" startIcon={<Download />} onClick={() => handleDownload(selectedDoc)}>Download</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </AppLayout>
  );
};

export default DocumentsPage;
