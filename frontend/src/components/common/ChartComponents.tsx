import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Chip, IconButton, Tooltip, Select, MenuItem,
  FormControl, InputLabel, Button, Fade, Grow, Divider, Avatar,
  useTheme, alpha, LinearProgress, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, BarChart, PieChart, ShowChart, BubbleChart,
  Timeline, CalendarToday, FilterList, Download, Fullscreen, MoreVert,
  Circle, ArrowUpward, ArrowDownward, Refresh,
} from '@mui/icons-material';
import { keyframes, styled } from '@mui/system';

// ==================== Animations ====================
const drawLine = keyframes`
  0% { stroke-dashoffset: 1000; }
  100% { stroke-dashoffset: 0; }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const growBar = keyframes`
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
`;

const rotatePie = keyframes`
  from { transform: rotate(-90deg); opacity: 0; }
  to { transform: rotate(0deg); opacity: 1; }
`;

const pulseGlow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 3px rgba(102, 126, 234, 0.3)); }
  50% { filter: drop-shadow(0 0 8px rgba(102, 126, 234, 0.6)); }
`;

// ==================== Types ====================
interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

interface MultiSeriesData {
  name: string;
  data: number[];
  color: string;
}

interface LineChartProps {
  data: TimeSeriesPoint[];
  title: string;
  subtitle?: string;
  color?: string;
  height?: number;
  showArea?: boolean;
  showDots?: boolean;
  showGrid?: boolean;
  animate?: boolean;
  gradient?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

interface BarChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  horizontal?: boolean;
  stacked?: boolean;
  height?: number;
  animate?: boolean;
  showValues?: boolean;
  maxValue?: number;
}

interface PieChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  donut?: boolean;
  size?: number;
  showLegend?: boolean;
  animate?: boolean;
  showLabels?: boolean;
}

interface AreaChartProps {
  data: TimeSeriesPoint[];
  series?: MultiSeriesData[];
  title: string;
  subtitle?: string;
  height?: number;
  stacked?: boolean;
  gradient?: boolean;
}

interface GaugeChartProps {
  value: number;
  maxValue?: number;
  title: string;
  subtitle?: string;
  size?: number;
  color?: string;
  thresholds?: { value: number; color: string; label: string }[];
}

interface HeatmapProps {
  data: number[][];
  xLabels: string[];
  yLabels: string[];
  title: string;
  subtitle?: string;
  colorScale?: string[];
}

interface RadarChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  size?: number;
  color?: string;
  fillOpacity?: number;
}

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  showArea?: boolean;
}

// ==================== Styled Components ====================
const ChartContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  background: '#fff',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  },
}));

const ChartHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 24,
});

const SVGContainer = styled(Box)<{ chartHeight?: number }>(({ chartHeight }) => ({
  width: '100%',
  height: chartHeight || 280,
  position: 'relative',
}));

// ==================== Helper Functions ====================
const defaultColors = [
  '#667eea', '#E91E63', '#4CAF50', '#FF9800', '#2196F3',
  '#9C27B0', '#00BCD4', '#F44336', '#8BC34A', '#FF5722',
  '#3F51B5', '#009688', '#FFC107', '#795548', '#607D8B',
];

const normalizeData = (data: number[], targetHeight: number): number[] => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return data.map(v => ((v - min) / range) * targetHeight);
};

const generatePath = (points: { x: number; y: number }[], smooth: boolean = true): string => {
  if (points.length < 2) return '';
  
  if (!smooth) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX1 = current.x + (next.x - current.x) / 3;
    const controlX2 = current.x + (2 * (next.x - current.x)) / 3;
    path += ` C ${controlX1} ${current.y}, ${controlX2} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
};

// ==================== Line Chart Component ====================
export const LineChart: React.FC<LineChartProps> = ({
  data, title, subtitle, color = '#667eea', height = 280,
  showArea = false, showDots = true, showGrid = true, animate = true,
  gradient = true, yAxisLabel, xAxisLabel,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(!animate);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = 600;
  const chartHeight = height - padding.top - padding.bottom;

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values) * 1.1;
  const minValue = Math.min(0, Math.min(...values));

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * (chartWidth - padding.left - padding.right),
    y: padding.top + chartHeight - ((d.value - minValue) / (maxValue - minValue)) * chartHeight,
  }));

  const linePath = generatePath(points, true);
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = padding.top + (i / 4) * chartHeight;
    const value = maxValue - (i / 4) * (maxValue - minValue);
    return { y, value: Math.round(value) };
  });

  return (
    <Fade in timeout={800}>
      <ChartContainer elevation={0}>
        <ChartHeader>
          <Box>
            <Typography variant="h6" fontWeight={700}>{title}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small"><Download /></IconButton>
            <IconButton size="small"><Fullscreen /></IconButton>
          </Box>
        </ChartHeader>

        <SVGContainer chartHeight={height}>
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="xMidYMid meet" ref={svgRef}>
            <defs>
              <linearGradient id={`lineGrad_${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* Grid */}
            {showGrid && gridLines.map((line, i) => (
              <g key={i}>
                <line x1={padding.left} y1={line.y} x2={chartWidth - padding.right} y2={line.y}
                  stroke="#E0E0E0" strokeWidth={1} strokeDasharray="4,4" />
                <text x={padding.left - 10} y={line.y + 4} textAnchor="end"
                  fill="#9E9E9E" fontSize={11} fontFamily="Inter, sans-serif">
                  {line.value}
                </text>
              </g>
            ))}

            {/* X-axis labels */}
            {data.map((d, i) => {
              if (data.length > 12 && i % Math.ceil(data.length / 12) !== 0) return null;
              return (
                <text key={i} x={points[i].x} y={height - 5} textAnchor="middle"
                  fill="#9E9E9E" fontSize={10} fontFamily="Inter, sans-serif">
                  {d.date || d.label}
                </text>
              );
            })}

            {/* Area */}
            {showArea && isVisible && (
              <path d={areaPath} fill={gradient ? `url(#lineGrad_${title.replace(/\s/g, '')})` : `${color}20`}
                style={{ animation: animate ? `${fadeInUp} 1s ease-out` : undefined }} />
            )}

            {/* Line */}
            {isVisible && (
              <path d={linePath} fill="none" stroke={color} strokeWidth={2.5}
                strokeLinecap="round" strokeLinejoin="round"
                style={{
                  strokeDasharray: animate ? 1000 : undefined,
                  animation: animate ? `${drawLine} 2s ease-out forwards` : undefined,
                }} />
            )}

            {/* Data points */}
            {showDots && isVisible && points.map((point, i) => (
              <g key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}>
                <circle cx={point.x} cy={point.y} r={hoveredIndex === i ? 6 : 4}
                  fill="#fff" stroke={color} strokeWidth={2}
                  style={{
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    filter: hoveredIndex === i ? `drop-shadow(0 0 6px ${color})` : undefined,
                  }} />
                {hoveredIndex === i && (
                  <g>
                    <rect x={point.x - 35} y={point.y - 30} width={70} height={22}
                      rx={6} fill="rgba(0,0,0,0.8)" />
                    <text x={point.x} y={point.y - 15} textAnchor="middle"
                      fill="#fff" fontSize={11} fontWeight={600} fontFamily="Inter, sans-serif">
                      {data[i].value.toLocaleString()}
                    </text>
                  </g>
                )}
              </g>
            ))}

            {/* Axis Labels */}
            {yAxisLabel && (
              <text x={12} y={height / 2} textAnchor="middle" fill="#9E9E9E"
                fontSize={11} fontFamily="Inter, sans-serif" transform={`rotate(-90, 12, ${height / 2})`}>
                {yAxisLabel}
              </text>
            )}
            {xAxisLabel && (
              <text x={chartWidth / 2} y={height - 2} textAnchor="middle"
                fill="#9E9E9E" fontSize={11} fontFamily="Inter, sans-serif">
                {xAxisLabel}
              </text>
            )}
          </svg>
        </SVGContainer>
      </ChartContainer>
    </Fade>
  );
};

// ==================== Bar Chart Component ====================
export const BarChartComponent: React.FC<BarChartProps> = ({
  data, title, subtitle, horizontal = false, height = 280,
  animate = true, showValues = true, maxValue: propMax,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(!animate);
  const padding = { top: 20, right: 30, bottom: 50, left: 60 };
  const chartWidth = 600;
  const chartHeight = height - padding.top - padding.bottom;

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 200);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  const maxValue = propMax || Math.max(...data.map(d => d.value)) * 1.15;
  const barWidth = Math.min(40, ((chartWidth - padding.left - padding.right) / data.length) * 0.6);
  const barGap = ((chartWidth - padding.left - padding.right) / data.length);

  const gridLines = Array.from({ length: 5 }, (_, i) => ({
    y: padding.top + (i / 4) * chartHeight,
    value: Math.round(maxValue - (i / 4) * maxValue),
  }));

  return (
    <Fade in timeout={800}>
      <ChartContainer elevation={0}>
        <ChartHeader>
          <Box>
            <Typography variant="h6" fontWeight={700}>{title}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small"><Download /></IconButton>
            <IconButton size="small"><FilterList /></IconButton>
          </Box>
        </ChartHeader>

        <SVGContainer chartHeight={height}>
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
            <defs>
              {data.map((d, i) => (
                <linearGradient key={i} id={`barGrad_${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={d.color || defaultColors[i % defaultColors.length]} stopOpacity={1} />
                  <stop offset="100%" stopColor={d.color || defaultColors[i % defaultColors.length]} stopOpacity={0.7} />
                </linearGradient>
              ))}
            </defs>

            {/* Grid lines */}
            {gridLines.map((line, i) => (
              <g key={i}>
                <line x1={padding.left} y1={line.y} x2={chartWidth - padding.right} y2={line.y}
                  stroke="#E0E0E0" strokeWidth={1} strokeDasharray="4,4" />
                <text x={padding.left - 10} y={line.y + 4} textAnchor="end"
                  fill="#9E9E9E" fontSize={11} fontFamily="Inter, sans-serif">
                  {line.value.toLocaleString()}
                </text>
              </g>
            ))}

            {/* Bars */}
            {data.map((d, i) => {
              const barHeight = (d.value / maxValue) * chartHeight;
              const x = padding.left + i * barGap + (barGap - barWidth) / 2;
              const y = padding.top + chartHeight - barHeight;
              const barColor = d.color || defaultColors[i % defaultColors.length];

              return (
                <g key={i}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}>
                  {/* Bar */}
                  <rect x={x} y={isVisible ? y : padding.top + chartHeight}
                    width={barWidth} height={isVisible ? barHeight : 0}
                    rx={4} ry={4}
                    fill={`url(#barGrad_${i})`}
                    style={{
                      transition: animate ? `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.1}s` : undefined,
                      cursor: 'pointer',
                      opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.5 : 1,
                      filter: hoveredIndex === i ? `drop-shadow(0 4px 8px ${barColor}60)` : undefined,
                    }} />
                  
                  {/* Value label */}
                  {showValues && isVisible && (
                    <text x={x + barWidth / 2} y={y - 8} textAnchor="middle"
                      fill={barColor} fontSize={11} fontWeight={600} fontFamily="Inter, sans-serif"
                      style={{
                        opacity: hoveredIndex === i || hoveredIndex === null ? 1 : 0.3,
                        transition: 'opacity 0.2s',
                      }}>
                      {d.value.toLocaleString()}
                    </text>
                  )}

                  {/* X-axis label */}
                  <text x={x + barWidth / 2} y={padding.top + chartHeight + 18}
                    textAnchor="middle" fill="#9E9E9E" fontSize={10}
                    fontFamily="Inter, sans-serif">
                    {d.label.length > 8 ? d.label.substring(0, 8) + '...' : d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </SVGContainer>
      </ChartContainer>
    </Fade>
  );
};

// ==================== Pie/Donut Chart Component ====================
export const PieChartComponent: React.FC<PieChartProps> = ({
  data, title, subtitle, donut = false, size = 200,
  showLegend = true, animate = true, showLabels = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(!animate);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const center = size / 2;
  const radius = (size / 2) - 10;
  const innerRadius = donut ? radius * 0.6 : 0;

  let currentAngle = -90;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
    const labelX = center + (radius * 0.75) * Math.cos(midAngle);
    const labelY = center + (radius * 0.75) * Math.sin(midAngle);

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const ix1 = center + innerRadius * Math.cos(startRad);
    const iy1 = center + innerRadius * Math.sin(startRad);
    const ix2 = center + innerRadius * Math.cos(endRad);
    const iy2 = center + innerRadius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    let path: string;
    if (donut) {
      path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
    } else {
      path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }

    return {
      ...d,
      path,
      color: d.color || defaultColors[i % defaultColors.length],
      percentage: ((d.value / total) * 100).toFixed(1),
      labelX,
      labelY,
    };
  });

  return (
    <Fade in timeout={800}>
      <ChartContainer elevation={0}>
        <ChartHeader>
          <Box>
            <Typography variant="h6" fontWeight={700}>{title}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
          </Box>
        </ChartHeader>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
            style={{
              transform: isVisible ? 'rotate(0deg)' : 'rotate(-90deg)',
              opacity: isVisible ? 1 : 0,
              transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
            {slices.map((slice, i) => (
              <g key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}>
                <path d={slice.path} fill={slice.color}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: hoveredIndex === i ? `translate(${Math.cos(((slices.reduce((sum, s, idx) => idx < i ? sum + (s.value / total) * 360 : sum, 0) + (slice.value / total) * 180 - 90) * Math.PI / 180)) * 8}px, ${Math.sin(((slices.reduce((sum, s, idx) => idx < i ? sum + (s.value / total) * 360 : sum, 0) + (slice.value / total) * 180 - 90) * Math.PI / 180)) * 8}px)` : undefined,
                    opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.7 : 1,
                    filter: hoveredIndex === i ? `drop-shadow(0 4px 12px ${slice.color}60)` : undefined,
                  }}
                  strokeWidth={hoveredIndex === i ? 2 : 0}
                  stroke="#fff" />
                
                {showLabels && parseFloat(slice.percentage) > 5 && (
                  <text x={slice.labelX} y={slice.labelY} textAnchor="middle"
                    dominantBaseline="middle" fill="#fff" fontSize={11}
                    fontWeight={600} fontFamily="Inter, sans-serif"
                    style={{ pointerEvents: 'none' }}>
                    {slice.percentage}%
                  </text>
                )}
              </g>
            ))}

            {donut && (
              <g>
                <text x={center} y={center - 8} textAnchor="middle" fill="#333"
                  fontSize={20} fontWeight={800} fontFamily="Inter, sans-serif">
                  {total.toLocaleString()}
                </text>
                <text x={center} y={center + 12} textAnchor="middle" fill="#9E9E9E"
                  fontSize={11} fontFamily="Inter, sans-serif">
                  Total
                </text>
              </g>
            )}
          </svg>

          {showLegend && (
            <Box>
              {slices.map((slice, i) => (
                <Box key={i} sx={{
                  display: 'flex', alignItems: 'center', gap: 1, mb: 1,
                  cursor: 'pointer', opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: slice.color }} />
                  <Typography variant="body2" fontWeight={500}>{slice.label}</Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {slice.percentage}%
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </ChartContainer>
    </Fade>
  );
};

// ==================== Gauge Chart Component ====================
export const GaugeChart: React.FC<GaugeChartProps> = ({
  value, maxValue = 100, title, subtitle, size = 180,
  color = '#667eea', thresholds,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const center = size / 2;
  const radius = (size / 2) - 15;
  const strokeWidth = 14;
  const circumference = Math.PI * radius;
  const percentage = (value / maxValue) * 100;

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setAnimatedValue(value);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.round(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  const getColor = () => {
    if (!thresholds) return color;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i].value) return thresholds[i].color;
    }
    return color;
  };

  const displayColor = getColor();
  const dashOffset = circumference - (circumference * Math.min(percentage, 100)) / 100;

  return (
    <Fade in timeout={800}>
      <ChartContainer elevation={0} sx={{ textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{title}</Typography>
        
        <Box sx={{ display: 'inline-block', position: 'relative' }}>
          <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
            {/* Background arc */}
            <path
              d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
              fill="none" stroke="#F0F0F0" strokeWidth={strokeWidth}
              strokeLinecap="round" />

            {/* Value arc */}
            <path
              d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
              fill="none" stroke={displayColor} strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />

            {/* Threshold markers */}
            {thresholds?.map((t, i) => {
              const angle = (t.value / maxValue) * 180;
              const rad = (angle * Math.PI) / 180;
              const x = center - radius * Math.cos(rad);
              const y = center - radius * Math.sin(rad);
              return (
                <circle key={i} cx={x} cy={y} r={3} fill={t.color} />
              );
            })}

            {/* Center value */}
            <text x={center} y={center - 8} textAnchor="middle" fill="#333"
              fontSize={28} fontWeight={800} fontFamily="Inter, sans-serif">
              {animatedValue}
            </text>
            <text x={center} y={center + 10} textAnchor="middle" fill="#9E9E9E"
              fontSize={12} fontFamily="Inter, sans-serif">
              / {maxValue}
            </text>
          </svg>
        </Box>

        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        )}

        {thresholds && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            {thresholds.map((t, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: t.color }} />
                <Typography variant="caption" color="text.secondary">{t.label}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </ChartContainer>
    </Fade>
  );
};

// ==================== Sparkline Component ====================
export const Sparkline: React.FC<SparklineProps> = ({
  data, color = '#667eea', width = 120, height = 40, showArea = true,
}) => {
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * chartWidth,
    y: padding + chartHeight - ((v - minVal) / range) * chartHeight,
  }));

  const linePath = generatePath(points, true);
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;
  const isPositive = data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={`spark_${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isPositive ? '#4CAF50' : '#F44336'} stopOpacity={0.3} />
          <stop offset="100%" stopColor={isPositive ? '#4CAF50' : '#F44336'} stopOpacity={0} />
        </linearGradient>
      </defs>
      {showArea && <path d={areaPath} fill={`url(#spark_${color.replace('#', '')})`} />}
      <path d={linePath} fill="none" stroke={isPositive ? '#4CAF50' : '#F44336'}
        strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y}
        r={2.5} fill={isPositive ? '#4CAF50' : '#F44336'} />
    </svg>
  );
};

// ==================== Radar Chart Component ====================
export const RadarChart: React.FC<RadarChartProps> = ({
  data, title, subtitle, size = 250, color = '#667eea', fillOpacity = 0.2,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const center = size / 2;
  const radius = (size / 2) - 30;
  const numAxes = data.length;
  const angleStep = (2 * Math.PI) / numAxes;
  const maxValue = Math.max(...data.map(d => d.value));
  const levels = 5;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const getPoint = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const dataPoints = data.map((d, i) => getPoint(d.value, i));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <Fade in timeout={800}>
      <ChartContainer elevation={0}>
        <ChartHeader>
          <Box>
            <Typography variant="h6" fontWeight={700}>{title}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
          </Box>
        </ChartHeader>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Level rings */}
            {Array.from({ length: levels }).map((_, level) => {
              const levelRadius = (radius / levels) * (level + 1);
              const points = Array.from({ length: numAxes }).map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                return `${center + levelRadius * Math.cos(angle)},${center + levelRadius * Math.sin(angle)}`;
              }).join(' ');
              return (
                <polygon key={level} points={points} fill="none"
                  stroke="#E0E0E0" strokeWidth={1} strokeDasharray={level < levels - 1 ? '2,4' : undefined} />
              );
            })}

            {/* Axis lines */}
            {data.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const endX = center + radius * Math.cos(angle);
              const endY = center + radius * Math.sin(angle);
              return <line key={i} x1={center} y1={center} x2={endX} y2={endY} stroke="#E0E0E0" strokeWidth={1} />;
            })}

            {/* Data polygon */}
            <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill={color} fillOpacity={isVisible ? fillOpacity : 0}
              stroke={color} strokeWidth={2}
              style={{
                transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isVisible ? 1 : 0,
              }} />

            {/* Data points */}
            {dataPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={color} strokeWidth={2}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transition: `all 0.5s ease ${i * 0.1}s`,
                }} />
            ))}

            {/* Labels */}
            {data.map((d, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const labelRadius = radius + 20;
              const x = center + labelRadius * Math.cos(angle);
              const y = center + labelRadius * Math.sin(angle);
              return (
                <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                  fill="#666" fontSize={10} fontWeight={500} fontFamily="Inter, sans-serif">
                  {d.label}
                </text>
              );
            })}
          </svg>
        </Box>
      </ChartContainer>
    </Fade>
  );
};

// ==================== Heatmap Component ====================
export const HeatmapChart: React.FC<HeatmapProps> = ({
  data, xLabels, yLabels, title, subtitle,
  colorScale = ['#F3E5F5', '#CE93D8', '#AB47BC', '#8E24AA', '#4A148C'],
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const cellSize = 36;
  const padding = { top: 10, left: 80, right: 20, bottom: 40 };
  const chartWidth = padding.left + xLabels.length * cellSize + padding.right;
  const chartHeight = padding.top + yLabels.length * cellSize + padding.bottom;

  const allValues = data.flat();
  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues);

  const getColor = (value: number) => {
    const ratio = (value - minVal) / (maxVal - minVal || 1);
    const index = Math.min(Math.floor(ratio * (colorScale.length - 1)), colorScale.length - 1);
    return colorScale[index];
  };

  return (
    <Fade in timeout={800}>
      <ChartContainer elevation={0}>
        <ChartHeader>
          <Box>
            <Typography variant="h6" fontWeight={700}>{title}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
          </Box>
        </ChartHeader>

        <Box sx={{ overflowX: 'auto' }}>
          <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            {/* Y-axis labels */}
            {yLabels.map((label, i) => (
              <text key={i} x={padding.left - 8} y={padding.top + i * cellSize + cellSize / 2 + 4}
                textAnchor="end" fill="#666" fontSize={10} fontFamily="Inter, sans-serif">
                {label}
              </text>
            ))}

            {/* X-axis labels */}
            {xLabels.map((label, i) => (
              <text key={i} x={padding.left + i * cellSize + cellSize / 2}
                y={padding.top + yLabels.length * cellSize + 16}
                textAnchor="middle" fill="#666" fontSize={10} fontFamily="Inter, sans-serif">
                {label}
              </text>
            ))}

            {/* Cells */}
            {data.map((row, rowIdx) =>
              row.map((value, colIdx) => (
                <g key={`${rowIdx}-${colIdx}`}
                  onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                  onMouseLeave={() => setHoveredCell(null)}>
                  <rect
                    x={padding.left + colIdx * cellSize + 1}
                    y={padding.top + rowIdx * cellSize + 1}
                    width={cellSize - 2}
                    height={cellSize - 2}
                    rx={4}
                    fill={getColor(value)}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: hoveredCell && (hoveredCell.row !== rowIdx || hoveredCell.col !== colIdx) ? 0.5 : 1,
                      stroke: hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx ? '#333' : 'none',
                      strokeWidth: 2,
                    }}
                  />
                  {hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx && (
                    <g>
                      <rect x={padding.left + colIdx * cellSize - 10}
                        y={padding.top + rowIdx * cellSize - 25}
                        width={cellSize + 20} height={22}
                        rx={6} fill="rgba(0,0,0,0.8)" />
                      <text x={padding.left + colIdx * cellSize + cellSize / 2}
                        y={padding.top + rowIdx * cellSize - 10}
                        textAnchor="middle" fill="#fff" fontSize={11}
                        fontWeight={600} fontFamily="Inter, sans-serif">
                        {value}
                      </text>
                    </g>
                  )}
                </g>
              ))
            )}
          </svg>
        </Box>

        {/* Color scale legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 2 }}>
          <Typography variant="caption" color="text.secondary">{minVal}</Typography>
          {colorScale.map((c, i) => (
            <Box key={i} sx={{ width: 24, height: 12, backgroundColor: c, borderRadius: 1 }} />
          ))}
          <Typography variant="caption" color="text.secondary">{maxVal}</Typography>
        </Box>
      </ChartContainer>
    </Fade>
  );
};

// ==================== Cancer Stats Chart Panel ====================
export const CancerStatsChartPanel: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  const cancerTypeData: DataPoint[] = [
    { label: 'Breast', value: 342, color: '#E91E63' },
    { label: 'Lung', value: 287, color: '#2196F3' },
    { label: 'Colon', value: 198, color: '#4CAF50' },
    { label: 'Prostate', value: 167, color: '#FF9800' },
    { label: 'Melanoma', value: 143, color: '#9C27B0' },
    { label: 'Leukemia', value: 98, color: '#00BCD4' },
    { label: 'Lymphoma', value: 76, color: '#F44336' },
    { label: 'Thyroid', value: 54, color: '#8BC34A' },
  ];

  const detectionTrend: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    value: Math.round(40 + Math.random() * 30 + Math.sin(i / 3) * 15),
  }));

  const survivalData: DataPoint[] = [
    { label: 'Stage I', value: 95, color: '#4CAF50' },
    { label: 'Stage II', value: 82, color: '#8BC34A' },
    { label: 'Stage III', value: 58, color: '#FF9800' },
    { label: 'Stage IV', value: 27, color: '#F44336' },
  ];

  const treatmentOutcomes: DataPoint[] = [
    { label: 'Complete Remission', value: 425, color: '#4CAF50' },
    { label: 'Partial Response', value: 187, color: '#8BC34A' },
    { label: 'Stable Disease', value: 134, color: '#FF9800' },
    { label: 'Progressive', value: 67, color: '#F44336' },
    { label: 'Under Evaluation', value: 89, color: '#9E9E9E' },
  ];

  const biomarkerData: DataPoint[] = [
    { label: 'HER2', value: 85 },
    { label: 'ER/PR', value: 72 },
    { label: 'PD-L1', value: 68 },
    { label: 'BRCA1/2', value: 45 },
    { label: 'KRAS', value: 62 },
    { label: 'EGFR', value: 78 },
  ];

  const weeklyHeatmap = [
    [12, 18, 22, 15, 20, 8, 5],
    [14, 21, 25, 18, 22, 10, 6],
    [16, 24, 28, 20, 25, 12, 7],
    [18, 26, 32, 22, 28, 14, 8],
    [20, 28, 35, 25, 30, 16, 10],
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>Cancer Analytics Dashboard</Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(_: any, v: any) => v && setTimeRange(v)}
          size="small"
        >
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="year">Year</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <LineChart
            data={detectionTrend}
            title="Detection Trend"
            subtitle="Daily cancer screening results"
            color="#E91E63"
            showArea
            gradient
            yAxisLabel="Screenings"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <PieChartComponent
            data={treatmentOutcomes}
            title="Treatment Outcomes"
            subtitle="Current cohort results"
            donut
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <BarChartComponent
            data={cancerTypeData}
            title="Cases by Cancer Type"
            subtitle="Distribution of active cases"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <BarChartComponent
            data={survivalData}
            title="5-Year Survival Rate (%)"
            subtitle="By cancer stage at diagnosis"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <RadarChart
            data={biomarkerData}
            title="Biomarker Testing Coverage"
            subtitle="Percentage of eligible patients tested"
            color="#9C27B0"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <HeatmapChart
            data={weeklyHeatmap}
            xLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            yLabels={['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']}
            title="Screening Volume Heatmap"
            subtitle="Weekly patterns of cancer screenings"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <GaugeChart
            value={94.7}
            maxValue={100}
            title="AI Detection Accuracy"
            subtitle="Overall model performance"
            thresholds={[
              { value: 0, color: '#F44336', label: 'Poor' },
              { value: 70, color: '#FF9800', label: 'Fair' },
              { value: 85, color: '#4CAF50', label: 'Good' },
              { value: 95, color: '#2196F3', label: 'Excellent' },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <GaugeChart
            value={87.3}
            maxValue={100}
            title="Sensitivity"
            subtitle="True positive rate"
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <GaugeChart
            value={96.1}
            maxValue={100}
            title="Specificity"
            subtitle="True negative rate"
            color="#2196F3"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// ==================== Exports ====================
export default {
  LineChart,
  BarChartComponent,
  PieChartComponent,
  GaugeChart,
  Sparkline,
  RadarChart,
  HeatmapChart,
  CancerStatsChartPanel,
};
