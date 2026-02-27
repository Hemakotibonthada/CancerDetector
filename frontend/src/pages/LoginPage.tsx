import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Container, Typography, TextField, Button, Card, CardContent,
  Stack, Alert, InputAdornment, IconButton, CircularProgress, useTheme, alpha,
} from '@mui/material';
import {
  Email as EmailIcon, Lock as LockIcon, Visibility, VisibilityOff,
  HealthAndSafety as HealthIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      background: isDark
        ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`
        : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
    }}>
      <Container maxWidth="sm">
        <Card sx={{ p: 4, borderRadius: 4 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <HealthIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>CancerGuard AI</Typography>
              </Stack>
              <Typography variant="body1" color="text.secondary">
                Sign in to access your health dashboard
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Email or Username" value={email}
                onChange={(e) => setEmail(e.target.value)} sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>,
                }}
              />
              <TextField
                fullWidth label="Password" type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit" fullWidth variant="contained" size="large"
                disabled={loading || !email || !password}
                sx={{
                  mb: 3, py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  '&:hover': { background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})` },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link to="/register" style={{ color: theme.palette.primary.main, fontWeight: 600, textDecoration: 'none' }}>
                  Sign Up
                </Link>
              </Typography>
            </Box>

            <Box sx={{ mt: 4, p: 2, bgcolor: isDark ? alpha(theme.palette.background.default, 0.5) : 'action.hover', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>Demo Accounts:</Typography>
              <Typography variant="body2" color="text.secondary">User: patient@cancerguard.ai / Patient@123456</Typography>
              <Typography variant="body2" color="text.secondary">Doctor: doctor@cancerguard.ai / Doctor@123456</Typography>
              <Typography variant="body2" color="text.secondary">Admin: admin@cancerguard.ai / Admin@123456</Typography>
              <Typography variant="body2" color="text.secondary">Hospital Admin: hospital.admin@cancerguard.ai / Hospital@123456</Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;
