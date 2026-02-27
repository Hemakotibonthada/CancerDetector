import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Container, Typography, TextField, Button, Card, CardContent,
  Stack, Alert, InputAdornment, IconButton, CircularProgress, MenuItem, Grid, useTheme,
} from '@mui/material';
import {
  PersonAdd as PersonIcon, Email as EmailIcon, Lock as LockIcon,
  Visibility, VisibilityOff, HealthAndSafety as HealthIcon,
  Person as UserIcon, Phone as PhoneIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const [formData, setFormData] = useState({
    email: '', username: '', password: '', confirm_password: '',
    first_name: '', last_name: '', phone_number: '', role: 'patient',
    gender: '', date_of_birth: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4,
      background: isDark
        ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`
        : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
    }}>
      <Container maxWidth="md">
        <Card sx={{ p: 4, borderRadius: 4 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <HealthIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>CancerGuard AI</Typography>
              </Stack>
              <Typography variant="body1" color="text.secondary">Create your account and get your unique Health ID</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="First Name" required value={formData.first_name} onChange={handleChange('first_name')}
                    InputProps={{ startAdornment: <InputAdornment position="start"><UserIcon color="action" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Last Name" required value={formData.last_name} onChange={handleChange('last_name')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email" type="email" required value={formData.email} onChange={handleChange('email')}
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Username" required value={formData.username} onChange={handleChange('username')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone Number" value={formData.phone_number} onChange={handleChange('phone_number')}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Role" select value={formData.role} onChange={handleChange('role')}>
                    <MenuItem value="patient">User</MenuItem>
                    <MenuItem value="doctor">Doctor</MenuItem>
                    <MenuItem value="hospital_admin">Hospital Administrator</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Gender" select value={formData.gender} onChange={handleChange('gender')}>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="non_binary">Non-binary</MenuItem>
                    <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Date of Birth" type="date" InputLabelProps={{ shrink: true }}
                    value={formData.date_of_birth} onChange={handleChange('date_of_birth')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Password" required type={showPassword ? 'text' : 'password'}
                    value={formData.password} onChange={handleChange('password')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Min 8 chars, uppercase, lowercase, digit" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Confirm Password" required type="password"
                    value={formData.confirm_password} onChange={handleChange('confirm_password')} />
                </Grid>
              </Grid>

              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
                sx={{
                  mt: 3, mb: 2, py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account & Get Health ID'}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link to="/login" style={{ color: theme.palette.primary.main, fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default RegisterPage;
