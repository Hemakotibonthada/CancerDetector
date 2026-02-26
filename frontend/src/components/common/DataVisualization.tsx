// ============================================================
// Data Visualization Components
// Reusable chart & data visualization components using Recharts
// ============================================================

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  useTheme,
  alpha,
  Tooltip as MuiTooltip,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Skeleton,
  Grid,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  FullscreenOutlined,
  DownloadOutlined,
  MoreVert,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart as RechartsRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
} from 'recharts';
import { keyframes } from '../../utils/animations';

// ==================== SHARED TYPES ====================

interface BaseChartProps {
  sx?: SxProps<Theme>;
  className?: string;
  height?: number;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

interface DataPoint {
  [key: string]: string | number;
}

interface SeriesConfig {
  dataKey: string;
  name?: string;
  color?: string;
  type?: 'monotone' | 'linear' | 'step';
  strokeWidth?: number;
  dot?: boolean;
  dashed?: boolean;
}

// ==================== COLOR PALETTES ====================

const CHART_COLORS = [
  '#1565c0', '#00897b', '#7b1fa2', '#f57c00', '#d32f2f',
  '#388e3c', '#0288d1', '#c2185b', '#5d4037', '#455a64',
  '#1e88e5', '#43a047', '#e53935', '#8e24aa', '#fb8c00',
];

const getColor = (index: number): string => CHART_COLORS[index % CHART_COLORS.length];

// ==================== CUSTOM TOOLTIP ====================

interface CustomTooltipPayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

const CustomChartTooltip: React.FC<{
  active?: boolean;
  payload?: CustomTooltipPayload[];
  label?: string;
  formatter?: (value: number, name: string) => string;
}> = ({ active, payload, label, formatter }) => {
  const theme = useTheme();

  if (!active || !payload?.length) return null;

  return (
    <Box
      sx={{
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(19,47,76,0.95)' : 'rgba(255,255,255,0.97)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: 1.5,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        backdropFilter: 'blur(8px)',
        minWidth: 140,
      }}
    >
      {label && (
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>
          {label}
        </Typography>
      )}
      {payload.map((entry, i) => (
        <Stack key={i} direction="row" alignItems="center" spacing={1} sx={{ py: 0.25 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
            {entry.name}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {formatter ? formatter(entry.value, entry.name) : entry.value?.toLocaleString()}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
};

// ==================== CHART HEADER ====================

const ChartHeader: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => {
  if (!title && !subtitle) return null;
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
      <Box>
        {title && (
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16 }}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12, mt: 0.25 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
};

// ==================== CHART SKELETON ====================

const ChartSkeleton: React.FC<{ height: number }> = ({ height }) => (
  <Box sx={{ height, display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
    <Skeleton width={160} height={24} />
    <Skeleton width={100} height={16} />
    <Skeleton variant="rectangular" height={height - 80} sx={{ borderRadius: 2, mt: 1 }} />
  </Box>
);

// ==================== ENHANCED LINE CHART ====================

export interface EnhancedLineChartProps extends BaseChartProps {
  data: DataPoint[];
  series: SeriesConfig[];
  xAxisKey?: string;
  /** Show gradient fill under lines */
  gradientFill?: boolean;
  /** Show reference line at value */
  referenceLine?: { value: number; label?: string; color?: string };
  /** Value formatter for tooltip */
  valueFormatter?: (value: number, name: string) => string;
  /** Show brush for selection */
  showBrush?: boolean;
}

export const EnhancedLineChart = forwardRef<HTMLDivElement, EnhancedLineChartProps>(
  (
    {
      data,
      series,
      xAxisKey = 'name',
      height = 350,
      gradientFill = true,
      referenceLine,
      valueFormatter,
      showBrush = false,
      loading,
      title,
      subtitle,
      sx,
    },
    ref
  ) => {
    const theme = useTheme();

    if (loading) return <ChartSkeleton height={height} />;

    return (
      <Box ref={ref} sx={[{ width: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        <ChartHeader title={title} subtitle={subtitle} />
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              {gradientFill &&
                series.map((s, i) => (
                  <linearGradient key={s.dataKey} id={`lineGrad-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color || getColor(i)} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={s.color || getColor(i)} stopOpacity={0.02} />
                  </linearGradient>
                ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <YAxis
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomChartTooltip formatter={valueFormatter} />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            {referenceLine && (
              <ReferenceLine
                y={referenceLine.value}
                label={referenceLine.label}
                stroke={referenceLine.color || theme.palette.warning.main}
                strokeDasharray="6 4"
              />
            )}
            {series.map((s, i) => (
              <Line
                key={s.dataKey}
                type={s.type || 'monotone'}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                stroke={s.color || getColor(i)}
                strokeWidth={s.strokeWidth || 2.5}
                dot={s.dot !== false ? { r: 3, strokeWidth: 2, fill: theme.palette.background.paper } : false}
                activeDot={{ r: 6, strokeWidth: 0, fill: s.color || getColor(i) }}
                strokeDasharray={s.dashed ? '6 4' : undefined}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            ))}
            {showBrush && (
              <Brush
                dataKey={xAxisKey}
                height={30}
                stroke={theme.palette.primary.main}
                fill={alpha(theme.palette.primary.main, 0.05)}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  }
);
EnhancedLineChart.displayName = 'EnhancedLineChart';

// ==================== ENHANCED BAR CHART ====================

export interface EnhancedBarChartProps extends BaseChartProps {
  data: DataPoint[];
  series: SeriesConfig[];
  xAxisKey?: string;
  /** Horizontal layout */
  horizontal?: boolean;
  /** Stack bars */
  stacked?: boolean;
  /** Rounded bar corners */
  rounded?: boolean;
  /** Gradient bars */
  gradient?: boolean;
  /** Value formatter */
  valueFormatter?: (value: number, name: string) => string;
  /** Bar gap */
  barGap?: number;
}

export const EnhancedBarChart = forwardRef<HTMLDivElement, EnhancedBarChartProps>(
  (
    {
      data,
      series,
      xAxisKey = 'name',
      height = 350,
      horizontal = false,
      stacked = false,
      rounded = true,
      gradient = true,
      valueFormatter,
      barGap = 4,
      loading,
      title,
      subtitle,
      sx,
    },
    ref
  ) => {
    const theme = useTheme();

    if (loading) return <ChartSkeleton height={height} />;

    return (
      <Box ref={ref} sx={[{ width: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        <ChartHeader title={title} subtitle={subtitle} />
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 5, right: 20, left: horizontal ? 60 : 0, bottom: 5 }}
            barGap={barGap}
          >
            <defs>
              {gradient &&
                series.map((s, i) => (
                  <linearGradient key={s.dataKey} id={`barGrad-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color || getColor(i)} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={s.color || getColor(i)} stopOpacity={0.6} />
                  </linearGradient>
                ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            {horizontal ? (
              <>
                <XAxis type="number" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey={xAxisKey} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
              </>
            ) : (
              <>
                <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} tickLine={false} axisLine={{ stroke: theme.palette.divider }} />
                <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} tickLine={false} axisLine={false} />
              </>
            )}
            <Tooltip content={<CustomChartTooltip formatter={valueFormatter} />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
            {series.map((s, i) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                fill={gradient ? `url(#barGrad-${s.dataKey})` : (s.color || getColor(i))}
                stackId={stacked ? 'stack' : undefined}
                radius={rounded ? [4, 4, 0, 0] : undefined}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  }
);
EnhancedBarChart.displayName = 'EnhancedBarChart';

// ==================== ENHANCED PIE CHART ====================

export interface PieDataItem {
  name: string;
  value: number;
  color?: string;
}

export interface EnhancedPieChartProps extends BaseChartProps {
  data: PieDataItem[];
  /** Inner radius for donut chart */
  innerRadius?: number;
  /** Outer radius */
  outerRadius?: number;
  /** Show labels */
  showLabels?: boolean;
  /** Center label */
  centerLabel?: string;
  /** Center value */
  centerValue?: string | number;
  /** Value formatter */
  valueFormatter?: (value: number) => string;
}

export const EnhancedPieChart = forwardRef<HTMLDivElement, EnhancedPieChartProps>(
  (
    {
      data,
      height = 300,
      innerRadius = 60,
      outerRadius = 100,
      showLabels = true,
      centerLabel,
      centerValue,
      valueFormatter,
      loading,
      title,
      subtitle,
      sx,
    },
    ref
  ) => {
    const theme = useTheme();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    if (loading) return <ChartSkeleton height={height} />;

    const total = data.reduce((s, d) => s + d.value, 0);

    const renderLabel = ({
      cx,
      cy,
      midAngle,
      innerRadius: ir,
      outerRadius: or,
      percent,
      name,
    }: any) => {
      const RADIAN = Math.PI / 180;
      const radius = or + 20;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      if (percent < 0.05) return null;
      return (
        <text
          x={x}
          y={y}
          fill={theme.palette.text.secondary}
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={11}
          fontWeight={600}
        >
          {name} ({(percent * 100).toFixed(0)}%)
        </text>
      );
    };

    return (
      <Box ref={ref} sx={[{ width: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        <ChartHeader title={title} subtitle={subtitle} />
        <Box sx={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey="value"
                label={showLabels ? renderLabel : false}
                onMouseEnter={(_, i) => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={800}
                animationEasing="ease-in-out"
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color || getColor(i)}
                    stroke={theme.palette.background.paper}
                    strokeWidth={2}
                    style={{
                      transform: activeIndex === i ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: 'center',
                      transition: 'transform 0.2s ease',
                      filter: activeIndex === i ? 'brightness(1.1)' : 'none',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={
                  <CustomChartTooltip
                    formatter={(v) =>
                      valueFormatter ? valueFormatter(v) : `${v.toLocaleString()} (${((v / total) * 100).toFixed(1)}%)`
                    }
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
          {(centerLabel || centerValue) && innerRadius > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              {centerValue && (
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                  {centerValue}
                </Typography>
              )}
              {centerLabel && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {centerLabel}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        {/* Legend */}
        <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1} sx={{ mt: 1 }}>
          {data.map((d, i) => (
            <Chip
              key={d.name}
              size="small"
              icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color || getColor(i) }} />}
              label={`${d.name}: ${valueFormatter ? valueFormatter(d.value) : d.value.toLocaleString()}`}
              variant="outlined"
              sx={{ fontSize: 11, fontWeight: 600, borderColor: 'divider' }}
            />
          ))}
        </Stack>
      </Box>
    );
  }
);
EnhancedPieChart.displayName = 'EnhancedPieChart';

// ==================== ENHANCED AREA CHART ====================

export interface EnhancedAreaChartProps extends BaseChartProps {
  data: DataPoint[];
  series: SeriesConfig[];
  xAxisKey?: string;
  stacked?: boolean;
  gradientFill?: boolean;
  showBrush?: boolean;
  valueFormatter?: (value: number, name: string) => string;
}

export const EnhancedAreaChart = forwardRef<HTMLDivElement, EnhancedAreaChartProps>(
  (
    {
      data,
      series,
      xAxisKey = 'name',
      height = 350,
      stacked = false,
      gradientFill = true,
      showBrush = false,
      valueFormatter,
      loading,
      title,
      subtitle,
      sx,
    },
    ref
  ) => {
    const theme = useTheme();

    if (loading) return <ChartSkeleton height={height} />;

    return (
      <Box ref={ref} sx={[{ width: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        <ChartHeader title={title} subtitle={subtitle} />
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.dataKey} id={`areaGrad-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color || getColor(i)} stopOpacity={gradientFill ? 0.4 : 0.2} />
                  <stop offset="100%" stopColor={s.color || getColor(i)} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} tickLine={false} axisLine={{ stroke: theme.palette.divider }} />
            <YAxis tick={{ fontSize: 12, fill: theme.palette.text.secondary }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomChartTooltip formatter={valueFormatter} />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
            {series.map((s, i) => (
              <Area
                key={s.dataKey}
                type={s.type || 'monotone'}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                stroke={s.color || getColor(i)}
                strokeWidth={s.strokeWidth || 2}
                fill={`url(#areaGrad-${s.dataKey})`}
                stackId={stacked ? 'stack' : undefined}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
                animationDuration={800}
              />
            ))}
            {showBrush && <Brush dataKey={xAxisKey} height={30} stroke={theme.palette.primary.main} />}
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    );
  }
);
EnhancedAreaChart.displayName = 'EnhancedAreaChart';

// ==================== RADAR CHART ====================

export interface RadarChartProps extends BaseChartProps {
  data: DataPoint[];
  /** Data keys to render as radar series */
  dataKeys: { key: string; name?: string; color?: string }[];
  /** Category key for angle axis */
  categoryKey?: string;
  /** Show dots */
  showDots?: boolean;
  /** Fill opacity */
  fillOpacity?: number;
}

export const EnhancedRadarChart = forwardRef<HTMLDivElement, RadarChartProps>(
  (
    {
      data,
      dataKeys,
      categoryKey = 'subject',
      height = 350,
      showDots = true,
      fillOpacity = 0.2,
      loading,
      title,
      subtitle,
      sx,
    },
    ref
  ) => {
    const theme = useTheme();

    if (loading) return <ChartSkeleton height={height} />;

    return (
      <Box ref={ref} sx={[{ width: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        <ChartHeader title={title} subtitle={subtitle} />
        <ResponsiveContainer width="100%" height={height}>
          <RechartsRadarChart data={data} cx="50%" cy="50%">
            <PolarGrid stroke={alpha(theme.palette.divider, 0.6)} />
            <PolarAngleAxis
              dataKey={categoryKey}
              tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis tick={{ fontSize: 10, fill: theme.palette.text.disabled }} />
            {dataKeys.map((dk, i) => (
              <Radar
                key={dk.key}
                name={dk.name || dk.key}
                dataKey={dk.key}
                stroke={dk.color || getColor(i)}
                fill={dk.color || getColor(i)}
                fillOpacity={fillOpacity}
                strokeWidth={2}
                dot={showDots ? { r: 3, fill: dk.color || getColor(i) } : false}
                animationDuration={800}
              />
            ))}
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
            <Tooltip content={<CustomChartTooltip />} />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </Box>
    );
  }
);
EnhancedRadarChart.displayName = 'EnhancedRadarChart';

// ==================== HEAT MAP CHART ====================

export interface HeatMapData {
  row: string;
  col: string;
  value: number;
}

export interface HeatMapChartProps extends BaseChartProps {
  data: HeatMapData[];
  /** Color scale [low, high] */
  colorScale?: [string, string];
  /** Cell size */
  cellSize?: number;
  /** Show values in cells */
  showValues?: boolean;
  /** Value formatter */
  valueFormatter?: (value: number) => string;
}

export const HeatMapChart = forwardRef<HTMLDivElement, HeatMapChartProps>(
  (
    {
      data,
      colorScale = ['#e3f2fd', '#0d47a1'],
      cellSize = 48,
      showValues = true,
      valueFormatter = (v) => v.toString(),
      height,
      loading,
      title,
      subtitle,
      sx,
    },
    ref
  ) => {
    const theme = useTheme();

    if (loading) return <ChartSkeleton height={height || 300} />;

    const rows = [...new Set(data.map((d) => d.row))];
    const cols = [...new Set(data.map((d) => d.col))];
    const vals = data.map((d) => d.value);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);

    const interpolateColor = (value: number): string => {
      const t = maxVal === minVal ? 0.5 : (value - minVal) / (maxVal - minVal);
      const r1 = parseInt(colorScale[0].slice(1, 3), 16);
      const g1 = parseInt(colorScale[0].slice(3, 5), 16);
      const b1 = parseInt(colorScale[0].slice(5, 7), 16);
      const r2 = parseInt(colorScale[1].slice(1, 3), 16);
      const g2 = parseInt(colorScale[1].slice(3, 5), 16);
      const b2 = parseInt(colorScale[1].slice(5, 7), 16);
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      return `rgb(${r},${g},${b})`;
    };

    const getVal = (row: string, col: string): number => {
      const found = data.find((d) => d.row === row && d.col === col);
      return found ? found.value : 0;
    };

    return (
      <Box ref={ref} sx={[{ width: '100%', overflowX: 'auto' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        <ChartHeader title={title} subtitle={subtitle} />
        <Box sx={{ display: 'inline-block' }}>
          {/* Column headers */}
          <Box sx={{ display: 'flex', pl: `${cellSize + 8}px` }}>
            {cols.map((col) => (
              <Box
                key={col}
                sx={{
                  width: cellSize,
                  textAlign: 'center',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'text.secondary',
                  pb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {col}
              </Box>
            ))}
          </Box>
          {/* Rows */}
          {rows.map((row) => (
            <Box key={row} sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <Box
                sx={{
                  width: cellSize,
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'text.secondary',
                  textAlign: 'right',
                  pr: 1,
                  flexShrink: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row}
              </Box>
              {cols.map((col) => {
                const val = getVal(row, col);
                const bg = interpolateColor(val);
                const lum =
                  0.299 * parseInt(bg.slice(4).split(',')[0]) +
                  0.587 * parseInt(bg.split(',')[1]) +
                  0.114 * parseInt(bg.split(',')[2]);
                return (
                  <MuiTooltip key={col} title={`${row} × ${col}: ${valueFormatter(val)}`} arrow>
                    <Box
                      sx={{
                        width: cellSize - 2,
                        height: cellSize - 2,
                        m: '1px',
                        borderRadius: 1,
                        bgcolor: bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        '&:hover': {
                          transform: 'scale(1.08)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 1,
                        },
                      }}
                    >
                      {showValues && (
                        <Typography
                          sx={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: lum > 128 ? '#333' : '#fff',
                          }}
                        >
                          {valueFormatter(val)}
                        </Typography>
                      )}
                    </Box>
                  </MuiTooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }
);
HeatMapChart.displayName = 'HeatMapChart';

// ==================== GAUGE CHART ====================

export interface GaugeChartProps extends BaseChartProps {
  /** Current value */
  value: number;
  /** Max value */
  max?: number;
  /** Min value */
  min?: number;
  /** Color ranges: [{min, max, color}] */
  ranges?: { min: number; max: number; color: string }[];
  /** Single color (if not using ranges) */
  color?: string;
  /** Size of gauge */
  size?: number;
  /** Label text */
  label?: string;
  /** Unit suffix */
  unit?: string;
  /** Thickness of arc */
  thickness?: number;
}

export const GaugeChart = forwardRef<HTMLDivElement, GaugeChartProps>(
  (
    {
      value,
      max = 100,
      min = 0,
      ranges,
      color = '#1565c0',
      size = 180,
      label,
      unit = '',
      thickness = 16,
      loading,
      title,
      subtitle,
      sx,
    },
    ref
  ) => {
    const theme = useTheme();

    if (loading) return <ChartSkeleton height={size} />;

    const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const angle = percentage * 180;
    const radius = (size - thickness) / 2;
    const cx = size / 2;
    const cy = size / 2 + 10;

    const getArcColor = (): string => {
      if (ranges) {
        const range = ranges.find((r) => value >= r.min && value <= r.max);
        return range?.color || color;
      }
      return color;
    };
    const arcColor = getArcColor();

    const describeArc = (startAngle: number, endAngle: number): string => {
      const startRad = ((180 + startAngle) * Math.PI) / 180;
      const endRad = ((180 + endAngle) * Math.PI) / 180;
      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    };

    return (
      <Box
        ref={ref}
        sx={[
          { width: size, textAlign: 'center', mx: 'auto' },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {title && <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>}
        <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
          {/* Background arc */}
          <path
            d={describeArc(0, 180)}
            fill="none"
            stroke={alpha(theme.palette.divider, 0.3)}
            strokeWidth={thickness}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d={describeArc(0, angle)}
            fill="none"
            stroke={arcColor}
            strokeWidth={thickness}
            strokeLinecap="round"
            style={{
              transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
              filter: `drop-shadow(0 0 6px ${arcColor}40)`,
            }}
          />
          {/* Needle indicator */}
          {(() => {
            const needleRad = ((180 + angle) * Math.PI) / 180;
            const nx = cx + (radius - thickness) * Math.cos(needleRad);
            const ny = cy + (radius - thickness) * Math.sin(needleRad);
            return (
              <circle
                cx={nx}
                cy={ny}
                r={4}
                fill={arcColor}
                style={{ transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
            );
          })()}
        </svg>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, mt: -2, color: arcColor, letterSpacing: '-0.02em' }}
        >
          {value}
          {unit && (
            <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, ml: 0.5 }}>
              {unit}
            </Typography>
          )}
        </Typography>
        {label && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {label}
          </Typography>
        )}
      </Box>
    );
  }
);
GaugeChart.displayName = 'GaugeChart';

// ==================== TIME SERIES CHART ====================

export interface TimeSeriesChartProps extends BaseChartProps {
  data: DataPoint[];
  series: SeriesConfig[];
  xAxisKey?: string;
  /** Time ranges to toggle */
  timeRanges?: { label: string; value: string }[];
  /** Active time range */
  activeRange?: string;
  /** On range change */
  onRangeChange?: (range: string) => void;
  showBrush?: boolean;
  valueFormatter?: (value: number, name: string) => string;
}

export const TimeSeriesChart = forwardRef<HTMLDivElement, TimeSeriesChartProps>(
  (
    {
      data,
      series,
      xAxisKey = 'date',
      height = 380,
      timeRanges = [
        { label: '1W', value: '1w' },
        { label: '1M', value: '1m' },
        { label: '3M', value: '3m' },
        { label: '1Y', value: '1y' },
        { label: 'All', value: 'all' },
      ],
      activeRange = '1m',
      onRangeChange,
      showBrush = true,
      valueFormatter,
      loading,
      title,
      subtitle,
      sx,
    },
    ref
  ) => {
    const theme = useTheme();
    const [range, setRange] = useState(activeRange);

    const handleRangeChange = (_: any, val: string | null) => {
      if (val) {
        setRange(val);
        onRangeChange?.(val);
      }
    };

    if (loading) return <ChartSkeleton height={height} />;

    return (
      <Box ref={ref} sx={[{ width: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        <ChartHeader
          title={title}
          subtitle={subtitle}
          action={
            <ToggleButtonGroup size="small" value={range} exclusive onChange={handleRangeChange}>
              {timeRanges.map((tr) => (
                <ToggleButton
                  key={tr.value}
                  value={tr.value}
                  sx={{ px: 1.5, py: 0.25, fontSize: 11, fontWeight: 700, borderRadius: '8px !important' }}
                >
                  {tr.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          }
        />
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.dataKey} id={`tsGrad-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color || getColor(i)} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={s.color || getColor(i)} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.4)} />
            <XAxis dataKey={xAxisKey} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} tickLine={false} axisLine={{ stroke: theme.palette.divider }} />
            <YAxis tick={{ fontSize: 11, fill: theme.palette.text.secondary }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomChartTooltip formatter={valueFormatter} />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
            {series.map((s, i) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                stroke={s.color || getColor(i)}
                strokeWidth={2}
                fill={`url(#tsGrad-${s.dataKey})`}
                dot={false}
                activeDot={{ r: 5 }}
                animationDuration={600}
              />
            ))}
            {showBrush && <Brush dataKey={xAxisKey} height={28} stroke={theme.palette.primary.main} fill={alpha(theme.palette.primary.main, 0.04)} />}
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    );
  }
);
TimeSeriesChart.displayName = 'TimeSeriesChart';

// ==================== DISTRIBUTION CHART ====================

export interface DistributionChartProps extends BaseChartProps {
  data: { range: string; count: number; color?: string }[];
  color?: string;
  /** Show normal distribution curve */
  showCurve?: boolean;
  valueFormatter?: (value: number) => string;
}

export const DistributionChart = forwardRef<HTMLDivElement, DistributionChartProps>(
  ({ data, color = '#1565c0', showCurve, height = 300, valueFormatter, loading, title, subtitle, sx }, ref) => {
    const theme = useTheme();

    if (loading) return <ChartSkeleton height={height} />;

    return (
      <Box ref={ref} sx={[{ width: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        <ChartHeader title={title} subtitle={subtitle} />
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.85} />
                <stop offset="100%" stopColor={color} stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.4)} />
            <XAxis dataKey="range" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: theme.palette.text.secondary }} tickLine={false} axisLine={false} />
            <Tooltip
              content={
                <CustomChartTooltip
                  formatter={(v) => (valueFormatter ? valueFormatter(v) : v.toLocaleString())}
                />
              }
            />
            <Bar dataKey="count" fill="url(#distGrad)" radius={[4, 4, 0, 0]} animationDuration={800}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color || color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  }
);
DistributionChart.displayName = 'DistributionChart';

// ==================== COMPARISON CHART ====================

export interface ComparisonChartProps extends BaseChartProps {
  data: { label: string; valueA: number; valueB: number; [key: string]: any }[];
  labelA?: string;
  labelB?: string;
  colorA?: string;
  colorB?: string;
  valueFormatter?: (value: number) => string;
}

export const ComparisonChart = forwardRef<HTMLDivElement, ComparisonChartProps>(
  (
    {
      data,
      labelA = 'Group A',
      labelB = 'Group B',
      colorA = '#1565c0',
      colorB = '#00897b',
      height = 300,
      valueFormatter,
      loading,
      title,
      subtitle,
      sx,
    },
    ref
  ) => {
    const theme = useTheme();

    if (loading) return <ChartSkeleton height={height} />;

    return (
      <Box ref={ref} sx={[{ width: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        <ChartHeader title={title} subtitle={subtitle} />
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.4)} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: theme.palette.text.secondary, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomChartTooltip formatter={(v) => (valueFormatter ? valueFormatter(v) : v.toLocaleString())} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
            <Bar dataKey="valueA" name={labelA} fill={colorA} radius={[0, 4, 4, 0]} barSize={14} animationDuration={800} />
            <Bar dataKey="valueB" name={labelB} fill={colorB} radius={[0, 4, 4, 0]} barSize={14} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  }
);
ComparisonChart.displayName = 'ComparisonChart';

// ==================== TREND INDICATOR ====================

export interface TrendIndicatorProps {
  value: number;
  label?: string;
  suffix?: string;
  inverse?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = React.memo(
  ({ value, label, suffix = '%', inverse = false, size = 'medium', sx }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    const isNeutral = value === 0;

    const color = isNeutral ? 'text.secondary' : isPositive ? '#2e7d32' : '#c62828';
    const bgcolor = isNeutral ? 'action.hover' : isPositive ? '#e8f5e9' : '#ffebee';
    const Icon = isNeutral ? TrendingFlat : value > 0 ? TrendingUp : TrendingDown;

    return (
      <Chip
        size={size === 'small' ? 'small' : 'medium'}
        icon={<Icon sx={{ fontSize: size === 'small' ? 14 : 16, color: `${color} !important` }} />}
        label={
          <span>
            {value > 0 ? '+' : ''}{value}{suffix}
            {label && <span style={{ opacity: 0.7, marginLeft: 4 }}>{label}</span>}
          </span>
        }
        sx={[
          {
            fontWeight: 700,
            fontSize: size === 'small' ? 11 : 12,
            bgcolor,
            color,
            height: size === 'small' ? 24 : 28,
            borderRadius: 2,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      />
    );
  }
);
(TrendIndicator as any).displayName = 'TrendIndicator';

// ==================== SPARKLINE CHART ====================

export interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  sx?: SxProps<Theme>;
}

export const SparklineChart: React.FC<SparklineChartProps> = React.memo(
  ({ data, width = 120, height = 36, color = '#1565c0', showArea = true, sx }) => {
    const chartData = data.map((v, i) => ({ x: i, y: v }));

    return (
      <Box sx={[{ display: 'inline-block' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        <ResponsiveContainer width={width} height={height}>
          <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <defs>
              <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={showArea ? 0.3 : 0} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="y"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#sparkGrad-${color.replace('#', '')})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    );
  }
);
(SparklineChart as any).displayName = 'SparklineChart';

// ==================== STATISTICS CARD ====================

export interface StatisticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  chartData?: number[];
  chartType?: 'sparkline' | 'bar';
  loading?: boolean;
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = React.memo(
  ({
    title,
    value,
    change,
    changeLabel,
    icon,
    color = '#1565c0',
    chartData,
    chartType = 'sparkline',
    loading,
    onClick,
    sx,
  }) => {
    const theme = useTheme();

    if (loading) {
      return (
        <Card sx={[{ p: 2.5 }, ...(Array.isArray(sx) ? sx : [sx])]}>
          <Skeleton width={80} height={20} />
          <Skeleton width={60} height={36} sx={{ my: 0.5 }} />
          <Skeleton width={100} height={16} />
        </Card>
      );
    }

    return (
      <Card
        onClick={onClick}
        sx={[
          {
            p: 2.5,
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 0.25s ease',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': onClick
              ? { transform: 'translateY(-3px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }
              : {},
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `${color}08`,
          }}
        />
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          {icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color,
              }}
            >
              {icon}
            </Box>
          )}
          {chartData && (
            <SparklineChart data={chartData} color={color} width={80} height={32} />
          )}
        </Stack>
        <Typography variant="h4" sx={{ fontWeight: 800, mt: 1.5, letterSpacing: '-0.02em' }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 500 }}>
          {title}
        </Typography>
        {change !== undefined && (
          <Box sx={{ mt: 0.5 }}>
            <TrendIndicator value={change} label={changeLabel} size="small" />
          </Box>
        )}
      </Card>
    );
  }
);
(StatisticsCard as any).displayName = 'StatisticsCard';

// ==================== METRICS DASHBOARD ====================

export interface MetricItem {
  title: string;
  value: string | number;
  change?: number;
  color?: string;
  icon?: React.ReactNode;
  chartData?: number[];
}

export interface MetricsDashboardProps {
  metrics: MetricItem[];
  columns?: { xs?: number; sm?: number; md?: number; lg?: number };
  loading?: boolean;
  sx?: SxProps<Theme>;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = React.memo(
  ({
    metrics,
    columns = { xs: 12, sm: 6, md: 4, lg: 3 },
    loading,
    sx,
  }) => (
    <Grid container spacing={2} sx={sx}>
      {metrics.map((m, i) => (
        <Grid item key={i} {...columns}>
          <StatisticsCard
            title={m.title}
            value={m.value}
            change={m.change}
            color={m.color}
            icon={m.icon}
            chartData={m.chartData}
            loading={loading}
            sx={{
              ...keyframes.slideFadeUp,
              animation: `slideFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * 80}ms both`,
            }}
          />
        </Grid>
      ))}
    </Grid>
  )
);
(MetricsDashboard as any).displayName = 'MetricsDashboard';

// ==================== HEALTH SCORE RING ====================

export interface HealthScoreRingProps {
  /** Score 0-100 */
  score: number;
  /** Ring size */
  size?: number;
  /** Ring thickness */
  thickness?: number;
  /** Label */
  label?: string;
  /** Color ranges */
  ranges?: { min: number; max: number; color: string; label: string }[];
  /** Animated entrance */
  animated?: boolean;
  sx?: SxProps<Theme>;
}

export const HealthScoreRing: React.FC<HealthScoreRingProps> = React.memo(
  ({
    score,
    size = 160,
    thickness = 12,
    label = 'Health Score',
    ranges = [
      { min: 0, max: 30, color: '#d32f2f', label: 'Poor' },
      { min: 31, max: 50, color: '#f57c00', label: 'Fair' },
      { min: 51, max: 70, color: '#ffc107', label: 'Good' },
      { min: 71, max: 85, color: '#66bb6a', label: 'Very Good' },
      { min: 86, max: 100, color: '#2e7d32', label: 'Excellent' },
    ],
    animated = true,
    sx,
  }) => {
    const [animatedScore, setAnimatedScore] = useState(animated ? 0 : score);
    const theme = useTheme();

    React.useEffect(() => {
      if (!animated) {
        setAnimatedScore(score);
        return;
      }
      const start = performance.now();
      const dur = 1200;
      let raf: number;
      const tick = (now: number) => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setAnimatedScore(score * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [score, animated]);

    const range = ranges.find((r) => score >= r.min && score <= r.max) || ranges[ranges.length - 1];
    const activeColor = range.color;

    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;

    return (
      <Box
        sx={[
          { display: 'inline-flex', flexDirection: 'column', alignItems: 'center' },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Box sx={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={alpha(theme.palette.divider, 0.2)}
              strokeWidth={thickness}
            />
            {/* Value */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={activeColor}
              strokeWidth={thickness}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: animated ? 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
                filter: `drop-shadow(0 0 8px ${activeColor}40)`,
              }}
            />
          </svg>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 800, color: activeColor, lineHeight: 1 }}>
              {Math.round(animatedScore)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.25 }}>
              {range.label}
            </Typography>
          </Box>
        </Box>
        {label && (
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mt: 1 }}>
            {label}
          </Typography>
        )}
      </Box>
    );
  }
);
(HealthScoreRing as any).displayName = 'HealthScoreRing';
