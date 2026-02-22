import React from 'react';
import { Box, Card, Typography, Stack, Chip, LinearProgress, Tooltip, IconButton, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat, MoreVert, Info } from '@mui/icons-material';

// ============ STAT CARD ============
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: number | string;
  changeLabel?: string;
  color?: string;
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon, label, value, change, changeLabel, color = '#1565c0', onClick, loading, subtitle,
}) => (
  <Card
    onClick={onClick}
    sx={{
      p: 2.5, cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.25s ease',
      '&:hover': onClick ? { transform: 'translateY(-3px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' } : {},
      position: 'relative', overflow: 'hidden',
    }}
  >
    <Box sx={{
      position: 'absolute', top: -20, right: -20, width: 100, height: 100,
      borderRadius: '50%', background: `${color}08`,
    }} />
    {loading ? (
      <Box><Skeleton width={80} height={20} /><Skeleton width={60} height={36} sx={{ my: 0.5 }} /><Skeleton width={100} height={16} /></Box>
    ) : (
      <>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{
            width: 44, height: 44, borderRadius: 2.5,
            background: `linear-gradient(135deg, ${color}18, ${color}08)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color,
          }}>
            {icon}
          </Box>
          {change !== undefined && (
            <Chip
              icon={typeof change === 'string' ? (change.startsWith('+') || change.startsWith('-') ? (change.startsWith('+') ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />) : <TrendingFlat sx={{ fontSize: 14 }} />) : change > 0 ? <TrendingUp sx={{ fontSize: 14 }} /> : change < 0 ? <TrendingDown sx={{ fontSize: 14 }} /> : <TrendingFlat sx={{ fontSize: 14 }} />}
              label={typeof change === 'string' ? change : `${change > 0 ? '+' : ''}${change}%`}
              size="small"
              sx={{
                height: 24, fontSize: 11, fontWeight: 700,
                bgcolor: (typeof change === 'string' ? change.startsWith('+') : change > 0) ? '#e8f5e9' : (typeof change === 'string' ? change.startsWith('-') : change < 0) ? '#ffebee' : '#f5f5f5',
                color: (typeof change === 'string' ? change.startsWith('+') : change > 0) ? '#2e7d32' : (typeof change === 'string' ? change.startsWith('-') : change < 0) ? '#c62828' : '#757575',
              }}
            />
          )}
        </Stack>
        <Typography variant="h4" sx={{ fontWeight: 800, mt: 1.5, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 500 }}>
          {label}
        </Typography>
        {subtitle && <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>{subtitle}</Typography>}
      </>
    )}
  </Card>
);

// ============ PROGRESS CARD ============
interface ProgressCardProps {
  title: string;
  value: number;
  max?: number;
  color?: string;
  icon?: React.ReactNode;
  unit?: string;
  subtitle?: string;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title, value, max = 100, color = '#1565c0', icon, unit = '%', subtitle,
}) => {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon && <Box sx={{ color, display: 'flex' }}>{icon}</Box>}
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>{title}</Typography>
        </Stack>
        <Typography variant="h6" sx={{ fontWeight: 800, color }}>{value}{unit}</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 8, borderRadius: 4, bgcolor: `${color}15`,
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          },
        }}
      />
      {subtitle && <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>{subtitle}</Typography>}
    </Card>
  );
};

// ============ INFO ROW ============
interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon, color }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #f5f5f5' }}>
    <Stack direction="row" spacing={1} alignItems="center">
      {icon && <Box sx={{ color: color || 'text.secondary', display: 'flex' }}>{icon}</Box>}
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>{label}</Typography>
    </Stack>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
  </Box>
);

// ============ SECTION HEADER ============
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action, icon }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{subtitle}</Typography>}
      </Box>
    </Stack>
    {action}
  </Stack>
);

// ============ STATUS BADGE ============
interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

const statusColors: Record<string, { bg: string; color: string }> = {
  active: { bg: '#e8f5e9', color: '#2e7d32' },
  healthy: { bg: '#e8f5e9', color: '#2e7d32' },
  completed: { bg: '#e8f5e9', color: '#2e7d32' },
  connected: { bg: '#e8f5e9', color: '#2e7d32' },
  available: { bg: '#e8f5e9', color: '#2e7d32' },
  approved: { bg: '#e8f5e9', color: '#2e7d32' },
  normal: { bg: '#e8f5e9', color: '#2e7d32' },
  pending: { bg: '#fff3e0', color: '#e65100' },
  processing: { bg: '#fff3e0', color: '#e65100' },
  scheduled: { bg: '#e3f2fd', color: '#1565c0' },
  upcoming: { bg: '#e3f2fd', color: '#1565c0' },
  ordered: { bg: '#e3f2fd', color: '#1565c0' },
  reserved: { bg: '#e3f2fd', color: '#1565c0' },
  inactive: { bg: '#f5f5f5', color: '#757575' },
  disabled: { bg: '#f5f5f5', color: '#757575' },
  paused: { bg: '#f5f5f5', color: '#757575' },
  cancelled: { bg: '#ffebee', color: '#c62828' },
  critical: { bg: '#ffebee', color: '#c62828' },
  overdue: { bg: '#ffebee', color: '#c62828' },
  failed: { bg: '#ffebee', color: '#c62828' },
  high: { bg: '#ffebee', color: '#c62828' },
  very_high: { bg: '#ffcdd2', color: '#b71c1c' },
  moderate: { bg: '#fff3e0', color: '#e65100' },
  low: { bg: '#e8f5e9', color: '#2e7d32' },
  very_low: { bg: '#e8f5e9', color: '#2e7d32' },
  maintenance: { bg: '#fce4ec', color: '#c62828' },
  occupied: { bg: '#e3f2fd', color: '#1565c0' },
  on_leave: { bg: '#e8eaf6', color: '#3f51b5' },
  urgent: { bg: '#ffebee', color: '#c62828' },
  stat: { bg: '#ffcdd2', color: '#b71c1c' },
  routine: { bg: '#e8f5e9', color: '#2e7d32' },
  collected: { bg: '#e0f2f1', color: '#00695c' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  const s = status.toLowerCase().replace(/\s+/g, '_');
  const colors = statusColors[s] || { bg: '#f5f5f5', color: '#757575' };
  return (
    <Chip
      label={status.replace(/_/g, ' ').toUpperCase()}
      size={size}
      sx={{ bgcolor: colors.bg, color: colors.color, fontWeight: 700, fontSize: 11, letterSpacing: 0.3 }}
    />
  );
};

// ============ EMPTY STATE ============
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
    <Box sx={{ mb: 2, color: 'text.disabled', opacity: 0.4 }}>
      {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 64 } })}
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>{title}</Typography>
    {description && <Typography variant="body2" sx={{ color: 'text.disabled', mb: 2, maxWidth: 400, mx: 'auto' }}>{description}</Typography>}
    {action}
  </Box>
);

// ============ GLASS CARD ============
interface GlassCardProps {
  children: React.ReactNode;
  gradient?: string;
  sx?: any;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, gradient, sx }) => (
  <Box sx={{
    p: 3, borderRadius: 4,
    background: gradient || 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 4px 30px rgba(0,0,0,0.05)',
    ...sx,
  }}>
    {children}
  </Box>
);

// ============ METRIC GAUGE ============
interface MetricGaugeProps {
  value: number;
  max?: number;
  size?: number;
  color?: string;
  label?: string;
  unit?: string;
}

export const MetricGauge: React.FC<MetricGaugeProps> = ({ value, max = 100, size = 120, color = '#1565c0', label, unit = '%' }) => {
  const percent = Math.min((value / max) * 100, 100);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f0f0f0" strokeWidth="10" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <Box sx={{ position: 'absolute', textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 800, fontSize: size * 0.2, color, lineHeight: 1 }}>{value}</Typography>
        {unit && <Typography sx={{ fontSize: size * 0.1, color: 'text.secondary' }}>{unit}</Typography>}
      </Box>
    </Box>
  );
};

// ============ TIMELINE ITEM ============
interface TimelineItemProps {
  time: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  isLast?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ time, title, description, icon, color = '#1565c0', isLast }) => (
  <Box sx={{ display: 'flex', gap: 2 }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: '50%', bgcolor: `${color}15`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon || <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />}
      </Box>
      {!isLast && <Box sx={{ width: 2, flex: 1, bgcolor: '#f0f0f0', my: 0.5 }} />}
    </Box>
    <Box sx={{ pb: isLast ? 0 : 2.5, pt: 0.5 }}>
      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>{time}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{title}</Typography>
      {description && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{description}</Typography>}
    </Box>
  </Box>
);
