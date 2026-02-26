// ============================================================================
// Authentication Components - Login, Register, Password Reset, 2FA
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, IconButton, InputAdornment,
  Paper, Divider, Chip, Avatar, Alert, AlertTitle, CircularProgress,
  Link, Checkbox, FormControlLabel, Stack, useTheme, alpha,
  LinearProgress, Stepper, Step, StepLabel, Grid,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Google, Apple, GitHub,
  Email, Lock, Person, Phone, HealthAndSafety, ArrowForward,
  ArrowBack, CheckCircle, Security, Fingerprint, Key,
  Verified, Shield, LockReset, QrCode, ContentCopy,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// AUTH FORM WRAPPER
// ============================================================================
interface AuthFormWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  maxWidth?: number;
  sx?: any;
}

export const AuthFormWrapper: React.FC<AuthFormWrapperProps> = ({
  children, title, subtitle, showLogo = true, maxWidth = 440, sx,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
        py: 4,
        px: 2,
        ...sx,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
        style={{ width: '100%', maxWidth }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          }}
        >
          {showLogo && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: theme.palette.primary.main,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <HealthAndSafety sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="body2" color="primary" fontWeight={700} sx={{ letterSpacing: 1 }}>
                CANCERGUARD AI
              </Typography>
            </Box>
          )}
          <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          )}
          {children}
        </Paper>
      </motion.div>
    </Box>
  );
};

// ============================================================================
// SOCIAL LOGIN
// ============================================================================
interface SocialLoginProps {
  onGoogleLogin?: () => void;
  onAppleLogin?: () => void;
  onGithubLogin?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const SocialLogin: React.FC<SocialLoginProps> = ({
  onGoogleLogin, onAppleLogin, onGithubLogin, loading, disabled,
}) => {
  const theme = useTheme();

  return (
    <Box>
      <Divider sx={{ my: 3 }}>
        <Chip label="or continue with" size="small" sx={{ fontSize: '0.75rem' }} />
      </Divider>
      <Stack spacing={1.5}>
        {onGoogleLogin && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Google />}
            onClick={onGoogleLogin}
            disabled={loading || disabled}
            sx={{
              borderRadius: 2.5,
              py: 1.25,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
            }}
          >
            Continue with Google
          </Button>
        )}
        {onAppleLogin && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Apple />}
            onClick={onAppleLogin}
            disabled={loading || disabled}
            sx={{
              borderRadius: 2.5,
              py: 1.25,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
            }}
          >
            Continue with Apple
          </Button>
        )}
        {onGithubLogin && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GitHub />}
            onClick={onGithubLogin}
            disabled={loading || disabled}
            sx={{
              borderRadius: 2.5,
              py: 1.25,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
            }}
          >
            Continue with GitHub
          </Button>
        )}
      </Stack>
    </Box>
  );
};

// ============================================================================
// PASSWORD STRENGTH INDICATOR
// ============================================================================
interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password, showRequirements = true,
}) => {
  const theme = useTheme();

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const strength = metCount === 0 ? 0 : (metCount / requirements.length) * 100;

  const getStrengthLabel = () => {
    if (strength === 0) return '';
    if (strength <= 20) return 'Very Weak';
    if (strength <= 40) return 'Weak';
    if (strength <= 60) return 'Fair';
    if (strength <= 80) return 'Strong';
    return 'Very Strong';
  };

  const getColor = () => {
    if (strength <= 20) return theme.palette.error.main;
    if (strength <= 40) return theme.palette.warning.main;
    if (strength <= 60) return '#ff9800';
    if (strength <= 80) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  if (!password) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Password Strength
        </Typography>
        <Typography variant="caption" fontWeight={600} sx={{ color: getColor() }}>
          {getStrengthLabel()}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={strength}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: alpha(getColor(), 0.15),
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
            bgcolor: getColor(),
          },
        }}
      />
      {showRequirements && (
        <Box sx={{ mt: 1.5 }}>
          {requirements.map((req) => (
            <Box key={req.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
              <CheckCircle
                sx={{
                  fontSize: 14,
                  color: req.met ? theme.palette.success.main : theme.palette.grey[300],
                  transition: 'color 0.3s',
                }}
              />
              <Typography
                variant="caption"
                color={req.met ? 'text.primary' : 'text.secondary'}
                sx={{ textDecoration: req.met ? 'none' : 'none' }}
              >
                {req.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

// ============================================================================
// LOGIN FORM
// ============================================================================
interface LoginFormProps {
  onLogin: (email: string, password: string, remember: boolean) => Promise<void>;
  onForgotPassword?: () => void;
  onRegister?: () => void;
  loading?: boolean;
  error?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin, onForgotPassword, onRegister, loading = false, error,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email, password, remember);
  };

  return (
    <AuthFormWrapper title="Welcome Back" subtitle="Sign in to access your healthcare dashboard">
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email color="action" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2">Remember me</Typography>}
          />
          {onForgotPassword && (
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={onForgotPassword}
              underline="hover"
              fontWeight={600}
            >
              Forgot Password?
            </Link>
          )}
        </Box>
        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={loading || !email || !password}
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
          sx={{
            borderRadius: 2.5,
            py: 1.5,
            fontWeight: 700,
            fontSize: '1rem',
            mb: 2,
          }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
        {onRegister && (
          <Typography variant="body2" textAlign="center" color="text.secondary">
            Don't have an account?{' '}
            <Link component="button" type="button" onClick={onRegister} fontWeight={600} underline="hover">
              Create Account
            </Link>
          </Typography>
        )}
        <SocialLogin onGoogleLogin={() => {}} onAppleLogin={() => {}} />
      </form>
    </AuthFormWrapper>
  );
};

// ============================================================================
// REGISTER FORM
// ============================================================================
interface RegisterFormProps {
  onRegister: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    role: string;
  }) => Promise<void>;
  onLogin?: () => void;
  loading?: boolean;
  error?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister, onLogin, loading = false, error,
}) => {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [role, setRole] = useState('patient');
  const theme = useTheme();

  const handleSubmit = async () => {
    await onRegister({ firstName, lastName, email, password, phone, role });
  };

  const steps = ['Personal Info', 'Account Setup', 'Verification'];

  return (
    <AuthFormWrapper title="Create Account" subtitle="Join CancerGuard AI healthcare platform" maxWidth={480}>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={step} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === 0 && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={loading}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={loading}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone color="action" /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Box>
                <Typography variant="body2" fontWeight={600} gutterBottom>I am a:</Typography>
                <Grid container spacing={1}>
                  {[
                    { value: 'patient', label: 'Patient', icon: <Person /> },
                    { value: 'doctor', label: 'Doctor', icon: <HealthAndSafety /> },
                  ].map((r) => (
                    <Grid item xs={6} key={r.value}>
                      <Paper
                        onClick={() => setRole(r.value)}
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          borderRadius: 2,
                          cursor: 'pointer',
                          border: `2px solid ${role === r.value ? theme.palette.primary.main : theme.palette.divider}`,
                          bgcolor: role === r.value ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Box sx={{ color: role === r.value ? theme.palette.primary.main : 'text.secondary' }}>
                          {r.icon}
                        </Box>
                        <Typography variant="body2" fontWeight={role === r.value ? 700 : 400} sx={{ mt: 0.5 }}>
                          {r.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Stack>
          )}

          {step === 1 && (
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <PasswordStrength password={password} />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                error={confirmPassword.length > 0 && password !== confirmPassword}
                helperText={confirmPassword.length > 0 && password !== confirmPassword ? 'Passwords do not match' : ''}
                disabled={loading}
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <FormControlLabel
                control={<Checkbox checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />}
                label={
                  <Typography variant="body2">
                    I agree to the{' '}
                    <Link href="#" underline="hover" fontWeight={600}>Terms of Service</Link> and{' '}
                    <Link href="#" underline="hover" fontWeight={600}>Privacy Policy</Link>
                  </Typography>
                }
              />
            </Stack>
          )}

          {step === 2 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Verified sx={{ fontSize: 40 }} />
                </Avatar>
              </motion.div>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Almost There!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                We'll send a verification email to <strong>{email}</strong>.
                Please verify your email to activate your account.
              </Typography>
              <Alert severity="info" sx={{ borderRadius: 2, textAlign: 'left' }}>
                <AlertTitle>Account Summary</AlertTitle>
                <Typography variant="body2">Name: {firstName} {lastName}</Typography>
                <Typography variant="body2">Email: {email}</Typography>
                <Typography variant="body2">Role: {role.charAt(0).toUpperCase() + role.slice(1)}</Typography>
              </Alert>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={step === 0 || loading}
          onClick={() => setStep(step - 1)}
          startIcon={<ArrowBack />}
          sx={{ borderRadius: 2 }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            if (step < steps.length - 1) setStep(step + 1);
            else handleSubmit();
          }}
          disabled={loading || (step === 1 && (!acceptTerms || password !== confirmPassword))}
          endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
          sx={{ borderRadius: 2 }}
        >
          {step === steps.length - 1 ? 'Create Account' : 'Continue'}
        </Button>
      </Box>

      {onLogin && (
        <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mt: 3 }}>
          Already have an account?{' '}
          <Link component="button" type="button" onClick={onLogin} fontWeight={600} underline="hover">
            Sign In
          </Link>
        </Typography>
      )}
    </AuthFormWrapper>
  );
};

// ============================================================================
// FORGOT PASSWORD
// ============================================================================
interface ForgotPasswordProps {
  onSubmit: (email: string) => Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
  success?: boolean;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  onSubmit, onBack, loading = false, error, success = false,
}) => {
  const [email, setEmail] = useState('');
  const theme = useTheme();

  return (
    <AuthFormWrapper title="Reset Password" subtitle="Enter your email to receive a reset link">
      {success ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                mx: 'auto',
                mb: 2,
              }}
            >
              <Email sx={{ fontSize: 36 }} />
            </Avatar>
          </motion.div>
          <Typography variant="h6" fontWeight={700} gutterBottom>Check Your Email</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We've sent a password reset link to <strong>{email}</strong>.
            The link will expire in 30 minutes.
          </Typography>
          <Button variant="outlined" onClick={onBack} sx={{ borderRadius: 2 }}>
            Back to Sign In
          </Button>
        </Box>
      ) : (
        <form onSubmit={async (e) => { e.preventDefault(); await onSubmit(email); }}>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment>,
            }}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || !email}
            endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
            sx={{ borderRadius: 2.5, py: 1.5, fontWeight: 700, mb: 2 }}
          >
            Send Reset Link
          </Button>
          {onBack && (
            <Button
              fullWidth
              variant="text"
              onClick={onBack}
              startIcon={<ArrowBack />}
              sx={{ borderRadius: 2 }}
            >
              Back to Sign In
            </Button>
          )}
        </form>
      )}
    </AuthFormWrapper>
  );
};

// ============================================================================
// TWO FACTOR AUTH
// ============================================================================
interface TwoFactorAuthProps {
  onVerify: (code: string) => Promise<void>;
  onResend?: () => void;
  method?: 'app' | 'sms' | 'email';
  loading?: boolean;
  error?: string;
  phone?: string;
  email?: string;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({
  onVerify, onResend, method = 'app', loading = false, error,
  phone, email: userEmail,
}) => {
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const theme = useTheme();
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = code.split('');
    newCode[index] = value;
    const joined = newCode.join('');
    setCode(joined);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (joined.length === 6) {
      onVerify(joined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    onResend?.();
    setCountdown(60);
  };

  const methodConfig = {
    app: { icon: <Key />, title: 'Authenticator App', desc: 'Enter the 6-digit code from your authenticator app' },
    sms: { icon: <Phone />, title: 'SMS Verification', desc: `Enter the code sent to ${phone || 'your phone'}` },
    email: { icon: <Email />, title: 'Email Verification', desc: `Enter the code sent to ${userEmail || 'your email'}` },
  };

  const config = methodConfig[method];

  return (
    <AuthFormWrapper title="Two-Factor Authentication" subtitle={config.desc}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            mx: 'auto',
            mb: 2,
          }}
        >
          {config.icon}
        </Avatar>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* OTP Input */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3 }}>
        {Array.from({ length: 6 }).map((_, index) => (
          <TextField
            key={index}
            inputRef={(el) => { inputRefs.current[index] = el; }}
            value={code[index] || ''}
            onChange={(e) => handleCodeChange(index, e.target.value.slice(-1))}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={loading}
            autoFocus={index === 0}
            inputProps={{
              maxLength: 1,
              style: {
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                width: '2rem',
                padding: '12px',
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                ...(code[index] && {
                  borderColor: theme.palette.primary.main,
                }),
              },
            }}
          />
        ))}
      </Box>

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={() => onVerify(code)}
        disabled={loading || code.length < 6}
        endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Verified />}
        sx={{ borderRadius: 2.5, py: 1.5, fontWeight: 700, mb: 2 }}
      >
        {loading ? 'Verifying...' : 'Verify Code'}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        {countdown > 0 ? (
          <Typography variant="body2" color="text.secondary">
            Resend code in {countdown}s
          </Typography>
        ) : (
          <Button variant="text" onClick={handleResend} disabled={loading}>
            Resend Code
          </Button>
        )}
      </Box>
    </AuthFormWrapper>
  );
};

// ============================================================================
// EXPORT ALL
// ============================================================================
export default {
  AuthFormWrapper,
  SocialLogin,
  PasswordStrength,
  LoginForm,
  RegisterForm,
  ForgotPassword,
  TwoFactorAuth,
};
