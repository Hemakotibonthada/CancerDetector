// ============================================================================
// Feedback Components - Toast, Alerts, Loading, Error Boundary etc.
// ============================================================================
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  Box, Typography, Paper, IconButton, Alert, AlertTitle, Snackbar,
  CircularProgress, LinearProgress, Skeleton, Backdrop, Button,
  Fade, Slide, Grow, Collapse, Chip, Avatar, Stack, useTheme, alpha,
  Dialog, DialogTitle, DialogContent, DialogActions, Badge, Tooltip,
} from '@mui/material';
import {
  Close, CheckCircle, Error as ErrorIcon, Warning, Info,
  Refresh, WifiOff, CloudOff, BugReport, NotificationsActive,
  Celebration, NewReleases, Update, Security, Speed,
  SentimentDissatisfied, ArrowForward,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================
type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  severity: ToastSeverity;
  title?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  persistent?: boolean;
  icon?: React.ReactNode;
}

interface ToastContextType {
  showToast: (message: string, severity?: ToastSeverity, options?: Partial<ToastMessage>) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: () => {},
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
      showInfo: () => {},
      dismissToast: () => {},
      dismissAll: () => {},
    };
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode; maxToasts?: number }> = ({
  children, maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const showToast = useCallback((
    message: string,
    severity: ToastSeverity = 'info',
    options: Partial<ToastMessage> = {}
  ) => {
    const id = generateId();
    const toast: ToastMessage = { id, message, severity, duration: 5000, ...options };
    setToasts((prev) => [...prev.slice(-(maxToasts - 1)), toast]);

    if (!toast.persistent) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration || 5000);
    }
  }, [maxToasts]);

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast(message, 'success', { title });
  }, [showToast]);

  const showError = useCallback((message: string, title?: string) => {
    showToast(message, 'error', { title, duration: 8000 });
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string) => {
    showToast(message, 'warning', { title });
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string) => {
    showToast(message, 'info', { title });
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, dismissToast, dismissAll }}>
      {children}
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          maxWidth: 400,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{ pointerEvents: 'auto' }}
            >
              <Alert
                severity={toast.severity}
                onClose={() => dismissToast(toast.id)}
                icon={toast.icon}
                action={
                  toast.action ? (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={toast.action.onClick}
                      sx={{ fontWeight: 600 }}
                    >
                      {toast.action.label}
                    </Button>
                  ) : undefined
                }
                sx={{
                  borderRadius: 2,
                  boxShadow: 3,
                  '& .MuiAlert-message': { fontWeight: 500 },
                }}
              >
                {toast.title && <AlertTitle sx={{ fontWeight: 700 }}>{toast.title}</AlertTitle>}
                {toast.message}
              </Alert>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    </ToastContext.Provider>
  );
};

// ============================================================================
// LOADING OVERLAY
// ============================================================================
interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  variant?: 'spinner' | 'progress' | 'dots' | 'pulse';
  progress?: number;
  transparent?: boolean;
  blur?: boolean;
  sx?: any;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  open, message = 'Loading...', variant = 'spinner', progress,
  transparent = false, blur = true, sx,
}) => {
  const theme = useTheme();

  if (!open) return null;

  return (
    <Backdrop
      open={open}
      sx={{
        position: 'absolute',
        zIndex: 10,
        bgcolor: transparent ? 'transparent' : alpha(theme.palette.background.paper, blur ? 0.8 : 0.95),
        backdropFilter: blur ? 'blur(4px)' : undefined,
        borderRadius: 'inherit',
        ...sx,
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        {variant === 'spinner' && (
          <CircularProgress size={48} thickness={4} sx={{ mb: 2 }} />
        )}
        {variant === 'progress' && (
          <Box sx={{ width: 200, mb: 2 }}>
            <CircularProgress
              variant={progress !== undefined ? 'determinate' : 'indeterminate'}
              value={progress}
              size={64}
              thickness={4}
            />
            {progress !== undefined && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                {Math.round(progress)}%
              </Typography>
            )}
          </Box>
        )}
        {variant === 'dots' && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center' }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: theme.palette.primary.main,
                  }}
                />
              </motion.div>
            ))}
          </Box>
        )}
        {variant === 'pulse' && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
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
              <Speed sx={{ fontSize: 32 }} />
            </Avatar>
          </motion.div>
        )}
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {message}
        </Typography>
      </Box>
    </Backdrop>
  );
};

// ============================================================================
// INLINE LOADING
// ============================================================================
interface InlineLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  skeleton?: 'text' | 'rectangular' | 'circular' | 'rounded';
  skeletonHeight?: number;
  skeletonWidth?: number | string;
  skeletonLines?: number;
  message?: string;
  sx?: any;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  loading, children, skeleton = 'rectangular', skeletonHeight,
  skeletonWidth = '100%', skeletonLines = 3, message, sx,
}) => {
  if (!loading) return <>{children}</>;

  if (skeleton === 'text') {
    return (
      <Box sx={sx}>
        {Array.from({ length: skeletonLines }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={i === skeletonLines - 1 ? '60%' : skeletonWidth}
            height={skeletonHeight || 20}
            animation="wave"
            sx={{ mb: 0.5 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <Skeleton
        variant={skeleton}
        width={skeletonWidth}
        height={skeletonHeight || 120}
        animation="wave"
        sx={{ borderRadius: skeleton === 'rounded' ? 2 : undefined }}
      />
      {message && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 1 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

// ============================================================================
// ERROR BOUNDARY
// ============================================================================
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
  resetKey?: any;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'error.light',
                mx: 'auto',
                mb: 2,
              }}
            >
              <BugReport sx={{ fontSize: 40 }} />
            </Avatar>
          </motion.div>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleReset}
              sx={{ borderRadius: 2 }}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              sx={{ borderRadius: 2 }}
            >
              Refresh Page
            </Button>
          </Stack>
          {this.props.showDetails && this.state.error && (
            <Collapse in={true}>
              <Paper
                elevation={0}
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  textAlign: 'left',
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                <Typography variant="caption" fontWeight={600} color="error" gutterBottom>
                  Error Details:
                </Typography>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Paper>
            </Collapse>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// STATUS INDICATOR
// ============================================================================
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'error' | 'maintenance';
  label?: string;
  showDot?: boolean;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
  sx?: any;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status, label, showDot = true, animated = true, size = 'medium', sx,
}) => {
  const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    online: { color: '#4caf50', label: 'Online', icon: <CheckCircle /> },
    offline: { color: '#9e9e9e', label: 'Offline', icon: <WifiOff /> },
    busy: { color: '#f44336', label: 'Busy', icon: <ErrorIcon /> },
    away: { color: '#ff9800', label: 'Away', icon: <Warning /> },
    error: { color: '#f44336', label: 'Error', icon: <ErrorIcon /> },
    maintenance: { color: '#ff9800', label: 'Maintenance', icon: <Warning /> },
  };

  const config = statusConfig[status];
  const dotSize = size === 'large' ? 14 : size === 'medium' ? 10 : 8;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, ...sx }}>
      {showDot && (
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              bgcolor: config.color,
            }}
          />
          {animated && (status === 'online' || status === 'busy') && (
            <Box
              component={motion.div}
              animate={{ scale: [1, 2], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                bgcolor: config.color,
              }}
            />
          )}
        </Box>
      )}
      {label !== undefined ? (
        <Typography variant={size === 'large' ? 'body1' : 'body2'} sx={{ color: config.color, fontWeight: 500 }}>
          {label || config.label}
        </Typography>
      ) : null}
    </Box>
  );
};

// ============================================================================
// PROGRESS TRACKER
// ============================================================================
interface ProgressStep {
  label: string;
  completed: boolean;
  active?: boolean;
  error?: boolean;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  variant?: 'linear' | 'circular' | 'dots';
  showLabels?: boolean;
  size?: 'small' | 'medium';
  sx?: any;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps, variant = 'linear', showLabels = true, size = 'medium', sx,
}) => {
  const theme = useTheme();
  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  if (variant === 'circular') {
    return (
      <Box sx={{ textAlign: 'center', ...sx }}>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={progress}
            size={size === 'medium' ? 80 : 60}
            thickness={4}
            sx={{ color: theme.palette.primary.main }}
          />
          <CircularProgress
            variant="determinate"
            value={100}
            size={size === 'medium' ? 80 : 60}
            thickness={4}
            sx={{
              color: alpha(theme.palette.primary.main, 0.1),
              position: 'absolute',
              left: 0,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant={size === 'medium' ? 'h6' : 'body1'} fontWeight={700}>
              {completedCount}/{steps.length}
            </Typography>
          </Box>
        </Box>
        {showLabels && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {Math.round(progress)}% Complete
          </Typography>
        )}
      </Box>
    );
  }

  if (variant === 'dots') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ...sx }}>
        {steps.map((step, index) => (
          <Tooltip key={index} title={step.label}>
            <Box
              sx={{
                width: size === 'medium' ? 12 : 8,
                height: size === 'medium' ? 12 : 8,
                borderRadius: '50%',
                bgcolor: step.error
                  ? theme.palette.error.main
                  : step.completed
                  ? theme.palette.success.main
                  : step.active
                  ? theme.palette.primary.main
                  : theme.palette.grey[300],
                transition: 'all 0.3s ease',
              }}
            />
          </Tooltip>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={sx}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="caption" fontWeight={600}>
          {completedCount} of {steps.length} completed
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {Math.round(progress)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: size === 'medium' ? 8 : 4,
          borderRadius: 4,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          '& .MuiLinearProgress-bar': { borderRadius: 4 },
        }}
      />
      {showLabels && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
          {steps.map((step, index) => (
            <Chip
              key={index}
              label={step.label}
              size="small"
              color={step.error ? 'error' : step.completed ? 'success' : step.active ? 'primary' : 'default'}
              variant={step.completed || step.active ? 'filled' : 'outlined'}
              icon={step.completed ? <CheckCircle /> : step.error ? <ErrorIcon /> : undefined}
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

// ============================================================================
// NOTIFICATION BANNER
// ============================================================================
interface NotificationBannerProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'update' | 'security';
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
  onDismiss?: () => void;
  animated?: boolean;
  sx?: any;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message, type = 'info', action, dismissible = true, onDismiss,
  animated = true, sx,
}) => {
  const [visible, setVisible] = useState(true);
  const theme = useTheme();

  const typeConfig: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
    info: { color: theme.palette.info.main, icon: <Info />, bg: theme.palette.info.light },
    success: { color: theme.palette.success.main, icon: <Celebration />, bg: theme.palette.success.light },
    warning: { color: theme.palette.warning.main, icon: <Warning />, bg: theme.palette.warning.light },
    error: { color: theme.palette.error.main, icon: <ErrorIcon />, bg: theme.palette.error.light },
    update: { color: theme.palette.info.main, icon: <Update />, bg: theme.palette.info.light },
    security: { color: theme.palette.warning.main, icon: <Security />, bg: theme.palette.warning.light },
  };

  const config = typeConfig[type];

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  if (!visible) return null;

  const content = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1,
        px: 2,
        bgcolor: alpha(config.color, 0.08),
        borderLeft: `4px solid ${config.color}`,
        borderRadius: 2,
        ...sx,
      }}
    >
      <Box sx={{ color: config.color }}>{config.icon}</Box>
      <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
        {message}
      </Typography>
      {action && (
        <Button
          size="small"
          onClick={action.onClick}
          endIcon={<ArrowForward />}
          sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          {action.label}
        </Button>
      )}
      {dismissible && (
        <IconButton size="small" onClick={handleDismiss}>
          <Close fontSize="small" />
        </IconButton>
      )}
    </Box>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

// ============================================================================
// CONFIRMATION DIALOG
// ============================================================================
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'info' | 'warning' | 'error';
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  severity = 'warning', loading = false, maxWidth = 'xs',
}) => {
  const severityColors: Record<string, 'primary' | 'warning' | 'error'> = {
    info: 'primary',
    warning: 'warning',
    error: 'error',
  };

  const severityIcons: Record<string, React.ReactNode> = {
    info: <Info sx={{ fontSize: 48 }} />,
    warning: <Warning sx={{ fontSize: 48 }} />,
    error: <ErrorIcon sx={{ fontSize: 48 }} />,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
        <Box sx={{ color: `${severityColors[severity]}.main`, mb: 1 }}>
          {severityIcons[severity]}
        </Box>
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2, minWidth: 100 }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={severityColors[severity]}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ borderRadius: 2, minWidth: 100 }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================================
// CONNECTION STATUS
// ============================================================================
interface ConnectionStatusProps {
  isOnline?: boolean;
  showBanner?: boolean;
  sx?: any;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOnline: controlledOnline, showBanner = true, sx,
}) => {
  const [online, setOnline] = useState(controlledOnline ?? navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (controlledOnline !== undefined) {
      setOnline(controlledOnline);
      return;
    }

    const handleOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [controlledOnline]);

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <NotificationBanner
            message="You are currently offline. Some features may be unavailable."
            type="warning"
            dismissible={false}
            sx={sx}
          />
        </motion.div>
      )}
      {showReconnected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <NotificationBanner
            message="Connection restored!"
            type="success"
            sx={sx}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// RESULT FEEDBACK
// ============================================================================
interface ResultFeedbackProps {
  type: 'success' | 'error' | 'pending';
  title: string;
  message?: string;
  action?: React.ReactNode;
  animated?: boolean;
  sx?: any;
}

export const ResultFeedback: React.FC<ResultFeedbackProps> = ({
  type, title, message, action, animated = true, sx,
}) => {
  const theme = useTheme();

  const configs: Record<string, { icon: React.ReactNode; color: string }> = {
    success: { icon: <CheckCircle sx={{ fontSize: 64 }} />, color: theme.palette.success.main },
    error: { icon: <SentimentDissatisfied sx={{ fontSize: 64 }} />, color: theme.palette.error.main },
    pending: { icon: <CircularProgress size={64} />, color: theme.palette.primary.main },
  };

  const config = configs[type];

  const iconElement = animated ? (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
    >
      <Box sx={{ color: config.color }}>{config.icon}</Box>
    </motion.div>
  ) : (
    <Box sx={{ color: config.color }}>{config.icon}</Box>
  );

  return (
    <Box sx={{ textAlign: 'center', py: 4, ...sx }}>
      {iconElement}
      <Typography variant="h5" fontWeight={700} sx={{ mt: 2 }}>{title}</Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 400, mx: 'auto' }}>
          {message}
        </Typography>
      )}
      {action && <Box sx={{ mt: 3 }}>{action}</Box>}
    </Box>
  );
};

// ============================================================================
// EXPORT ALL
// ============================================================================
export default {
  ToastProvider,
  useToast,
  LoadingOverlay,
  InlineLoading,
  ErrorBoundary,
  StatusIndicator,
  ProgressTracker,
  NotificationBanner,
  ConfirmDialog,
  ConnectionStatus,
  ResultFeedback,
};
