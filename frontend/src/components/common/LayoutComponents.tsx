// ============================================================================
// Layout Components - Reusable layout elements for CancerGuard AI
// ============================================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Divider, IconButton, Tooltip, Chip,
  LinearProgress, Skeleton, Avatar, Badge, Breadcrumbs, Link,
  Tab, Tabs, Collapse, Accordion, AccordionSummary, AccordionDetails,
  Card, CardContent, CardActions, CardHeader, Button, Stack,
  useTheme, alpha, Grid, CircularProgress, Fade, Menu, MenuItem,
  ListItemIcon, ListItemText, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  ExpandMore, ChevronRight, MoreVert, Home, DragIndicator,
  Fullscreen, FullscreenExit, Close, Add, Refresh,
  ViewModule, ViewList, GridView, Sort, ArrowUpward, ArrowDownward,
  KeyboardArrowLeft, KeyboardArrowRight, OpenInFull, CloseFullscreen,
  SentimentDissatisfied, SearchOff, Construction, CloudOff, Inbox,
  PlayArrow, Pause, SkipNext, FiberManualRecord,
  KeyboardDoubleArrowLeft, KeyboardDoubleArrowRight,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// PAGE HEADER
// ============================================================================
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  badge?: string | number;
  badgeColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info';
  loading?: boolean;
  sx?: any;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title, subtitle, icon, breadcrumbs, actions, badge, badgeColor = 'primary',
  loading = false, sx,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3, ...sx }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1.5 }} separator={<ChevronRight sx={{ fontSize: 16 }} />}>
          <Link
            href="/"
            underline="hover"
            color="text.secondary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem' }}
          >
            <Home sx={{ fontSize: 16 }} /> Home
          </Link>
          {breadcrumbs.map((crumb, index) =>
            crumb.href ? (
              <Link
                key={index}
                href={crumb.href}
                underline="hover"
                color="text.secondary"
                sx={{ fontSize: '0.85rem' }}
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography key={index} color="text.primary" variant="body2" fontWeight={500}>
                {crumb.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {icon && (
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              {icon}
            </Avatar>
          )}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.5px' }}>
                {title}
              </Typography>
              {badge !== undefined && (
                <Chip label={badge} size="small" color={badgeColor} sx={{ fontWeight: 600 }} />
              )}
            </Box>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
      </Box>
      {loading && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}
    </Box>
  );
};

// ============================================================================
// SPLIT PANE
// ============================================================================
interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: number | string;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  resizable?: boolean;
  collapsible?: boolean;
  direction?: 'horizontal' | 'vertical';
  gap?: number;
  sx?: any;
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  left, right, leftWidth: initialWidth = '30%', minLeftWidth = 200,
  maxLeftWidth = 600, resizable = true, collapsible = true,
  direction = 'horizontal', gap = 0, sx,
}) => {
  const [leftWidth, setLeftWidth] = useState(initialWidth);
  const [collapsed, setCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!resizable) return;
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = direction === 'horizontal'
        ? moveEvent.clientX - rect.left
        : moveEvent.clientY - rect.top;
      const clamped = Math.max(minLeftWidth, Math.min(maxLeftWidth, newWidth));
      setLeftWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (direction === 'vertical') {
    return (
      <Box ref={containerRef} sx={{ display: 'flex', flexDirection: 'column', height: '100%', ...sx }}>
        <Box sx={{ height: collapsed ? 0 : leftWidth, overflow: 'auto', transition: collapsed ? 'height 0.3s ease' : undefined }}>
          {!collapsed && left}
        </Box>
        {resizable && (
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              height: 6,
              cursor: 'row-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            <Box sx={{ width: 40, height: 3, bgcolor: theme.palette.divider, borderRadius: 1 }} />
          </Box>
        )}
        <Box sx={{ flex: 1, overflow: 'auto' }}>{right}</Box>
      </Box>
    );
  }

  return (
    <Box ref={containerRef} sx={{ display: 'flex', height: '100%', gap, ...sx }}>
      <Box
        sx={{
          width: collapsed ? 0 : leftWidth,
          minWidth: collapsed ? 0 : minLeftWidth,
          overflow: 'auto',
          transition: collapsed ? 'all 0.3s ease' : undefined,
          flexShrink: 0,
        }}
      >
        {!collapsed && left}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {resizable && (
          <Box
            onMouseDown={handleMouseDown}
            sx={{
              width: 6,
              height: '100%',
              cursor: 'col-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
              transition: 'background-color 0.2s',
            }}
          >
            <Box sx={{ width: 3, height: 40, bgcolor: theme.palette.divider, borderRadius: 1 }} />
          </Box>
        )}
        {collapsible && (
          <Tooltip title={collapsed ? 'Expand panel' : 'Collapse panel'}>
            <IconButton
              size="small"
              onClick={() => setCollapsed(!collapsed)}
              sx={{
                position: 'absolute',
                top: 8,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                zIndex: 1,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
              }}
            >
              {collapsed ? <KeyboardDoubleArrowRight fontSize="small" /> : <KeyboardDoubleArrowLeft fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>{right}</Box>
    </Box>
  );
};

// ============================================================================
// TAB PANEL
// ============================================================================
interface TabConfig {
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
  content: React.ReactNode;
}

interface TabPanelProps {
  tabs: TabConfig[];
  value?: number;
  onChange?: (index: number) => void;
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  orientation?: 'horizontal' | 'vertical';
  animated?: boolean;
  sx?: any;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  tabs, value: controlledValue, onChange, variant = 'standard',
  orientation = 'horizontal', animated = true, sx,
}) => {
  const [internalValue, setInternalValue] = useState(0);
  const activeTab = controlledValue ?? internalValue;
  const theme = useTheme();

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    if (onChange) onChange(newValue);
    else setInternalValue(newValue);
  };

  const tabContent = tabs[activeTab]?.content;

  if (orientation === 'vertical') {
    return (
      <Box sx={{ display: 'flex', height: '100%', ...sx }}>
        <Tabs
          orientation="vertical"
          value={activeTab}
          onChange={handleChange}
          sx={{
            borderRight: `1px solid ${theme.palette.divider}`,
            minWidth: 180,
            '& .MuiTab-root': { alignItems: 'flex-start', textAlign: 'left', textTransform: 'none', minHeight: 48 },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  {tab.icon}
                  <Typography variant="body2">{tab.label}</Typography>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <Chip label={tab.badge} size="small" color="primary" sx={{ ml: 'auto', height: 20 }} />
                  )}
                </Box>
              }
              disabled={tab.disabled}
            />
          ))}
        </Tabs>
        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          {animated ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {tabContent}
              </motion.div>
            </AnimatePresence>
          ) : (
            tabContent
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={sx}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        variant={variant}
        scrollButtons="auto"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
            minHeight: 48,
          },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            icon={tab.icon as any}
            iconPosition="start"
            disabled={tab.disabled}
          />
        ))}
      </Tabs>
      <Box sx={{ py: 2 }}>
        {animated ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {tabContent}
            </motion.div>
          </AnimatePresence>
        ) : (
          tabContent
        )}
      </Box>
    </Box>
  );
};

// ============================================================================
// ACCORDION GROUP
// ============================================================================
interface AccordionItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  defaultExpanded?: boolean;
  badge?: string | number;
}

interface AccordionGroupProps {
  items: AccordionItem[];
  exclusive?: boolean;
  elevation?: number;
  sx?: any;
}

export const AccordionGroup: React.FC<AccordionGroupProps> = ({
  items, exclusive = false, elevation = 0, sx,
}) => {
  const [expanded, setExpanded] = useState<string[]>(
    items.filter((i) => i.defaultExpanded).map((i) => i.id)
  );
  const theme = useTheme();

  const handleChange = (id: string) => {
    if (exclusive) {
      setExpanded(expanded.includes(id) ? [] : [id]);
    } else {
      setExpanded(
        expanded.includes(id) ? expanded.filter((e) => e !== id) : [...expanded, id]
      );
    }
  };

  return (
    <Box sx={sx}>
      {items.map((item) => (
        <Accordion
          key={item.id}
          expanded={expanded.includes(item.id)}
          onChange={() => handleChange(item.id)}
          disabled={item.disabled}
          elevation={elevation}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '12px !important',
            mb: 1,
            '&:before': { display: 'none' },
            '&.Mui-expanded': { mt: 0, mb: 1 },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              '& .MuiAccordionSummary-content': {
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              },
            }}
          >
            {item.icon && (
              <Box sx={{ color: theme.palette.primary.main }}>{item.icon}</Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography fontWeight={600}>{item.title}</Typography>
                {item.badge !== undefined && (
                  <Chip label={item.badge} size="small" color="primary" variant="outlined" />
                )}
              </Box>
              {item.subtitle && (
                <Typography variant="caption" color="text.secondary">{item.subtitle}</Typography>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>{item.content}</AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

// ============================================================================
// EMPTY STATE
// ============================================================================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'search' | 'error' | 'offline' | 'maintenance' | 'empty';
  size?: 'small' | 'medium' | 'large';
  sx?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon, title, message, action, variant = 'default', size = 'medium', sx,
}) => {
  const theme = useTheme();

  const defaultIcons: Record<string, React.ReactNode> = {
    default: <Inbox sx={{ fontSize: size === 'large' ? 80 : size === 'medium' ? 64 : 48 }} />,
    search: <SearchOff sx={{ fontSize: size === 'large' ? 80 : size === 'medium' ? 64 : 48 }} />,
    error: <SentimentDissatisfied sx={{ fontSize: size === 'large' ? 80 : size === 'medium' ? 64 : 48 }} />,
    offline: <CloudOff sx={{ fontSize: size === 'large' ? 80 : size === 'medium' ? 64 : 48 }} />,
    maintenance: <Construction sx={{ fontSize: size === 'large' ? 80 : size === 'medium' ? 64 : 48 }} />,
    empty: <Inbox sx={{ fontSize: size === 'large' ? 80 : size === 'medium' ? 64 : 48 }} />,
  };

  const displayIcon = icon || defaultIcons[variant];
  const padding = size === 'large' ? 8 : size === 'medium' ? 5 : 3;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: padding,
        px: 3,
        textAlign: 'center',
        ...sx,
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <Box
          sx={{
            color: alpha(theme.palette.text.secondary, 0.3),
            mb: 2,
          }}
        >
          {displayIcon}
        </Box>
      </motion.div>
      <Typography
        variant={size === 'large' ? 'h5' : size === 'medium' ? 'h6' : 'subtitle1'}
        fontWeight={600}
        color="text.secondary"
        gutterBottom
      >
        {title}
      </Typography>
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 400, mb: action ? 3 : 0, lineHeight: 1.6 }}
        >
          {message}
        </Typography>
      )}
      {action && <Box>{action}</Box>}
    </Box>
  );
};

// ============================================================================
// TIMELINE
// ============================================================================
interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  content?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  variant?: 'default' | 'compact' | 'alternate';
  sx?: any;
}

export const Timeline: React.FC<TimelineProps> = ({
  items, variant = 'default', sx,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ position: 'relative', pl: variant === 'alternate' ? 0 : 4, ...sx }}>
      {/* Vertical line */}
      <Box
        sx={{
          position: 'absolute',
          left: variant === 'alternate' ? '50%' : 15,
          top: 0,
          bottom: 0,
          width: 2,
          bgcolor: theme.palette.divider,
          transform: variant === 'alternate' ? 'translateX(-50%)' : undefined,
        }}
      />

      {items.map((item, index) => {
        const isLeft = variant === 'alternate' && index % 2 === 0;
        const color = item.color || 'primary';

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                mb: variant === 'compact' ? 2 : 3,
                position: 'relative',
                ...(variant === 'alternate' && {
                  flexDirection: isLeft ? 'row-reverse' : 'row',
                  textAlign: isLeft ? 'right' : 'left',
                }),
              }}
            >
              {/* Dot/Icon */}
              <Box
                sx={{
                  position: variant === 'alternate' ? 'absolute' : 'absolute',
                  left: variant === 'alternate' ? '50%' : -25,
                  transform: variant === 'alternate' ? 'translateX(-50%)' : undefined,
                  zIndex: 1,
                  width: item.icon ? 36 : 12,
                  height: item.icon ? 36 : 12,
                  borderRadius: '50%',
                  bgcolor: item.icon
                    ? alpha(theme.palette[color].main, 0.1)
                    : theme.palette[color].main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: item.icon
                    ? `2px solid ${theme.palette[color].main}`
                    : `3px solid ${theme.palette.background.paper}`,
                  color: theme.palette[color].main,
                }}
              >
                {item.icon}
              </Box>

              {/* Content */}
              <Box
                sx={{
                  flex: 1,
                  ...(variant === 'alternate' && {
                    width: 'calc(50% - 30px)',
                    px: 2,
                  }),
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>{item.title}</Typography>
                  {item.time && (
                    <Typography variant="caption" color="text.secondary">{item.time}</Typography>
                  )}
                </Box>
                {item.description && (
                  <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                )}
                {item.content && <Box sx={{ mt: 1 }}>{item.content}</Box>}
              </Box>
            </Box>
          </motion.div>
        );
      })}
    </Box>
  );
};

// ============================================================================
// INFINITE SCROLL CONTAINER
// ============================================================================
interface InfiniteScrollProps {
  children: React.ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  loading?: boolean;
  threshold?: number;
  loader?: React.ReactNode;
  endMessage?: string;
  sx?: any;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children, onLoadMore, hasMore, loading = false, threshold = 200,
  loader, endMessage = 'No more items to load', sx,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <Box ref={containerRef} sx={sx}>
      {children}
      <Box ref={observerRef} sx={{ py: 2, textAlign: 'center' }}>
        {loading && (
          loader || (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">Loading more...</Typography>
            </Box>
          )
        )}
        {!hasMore && !loading && (
          <Typography variant="body2" color="text.secondary">{endMessage}</Typography>
        )}
      </Box>
    </Box>
  );
};

// ============================================================================
// KANBAN BOARD
// ============================================================================
interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: { name: string; avatar?: string };
  tags?: string[];
  dueDate?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  cards: KanbanCard[];
  limit?: number;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onCardMove?: (cardId: string, fromColumn: string, toColumn: string) => void;
  onCardClick?: (card: KanbanCard) => void;
  onAddCard?: (columnId: string) => void;
  sx?: any;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns, onCardMove, onCardClick, onAddCard, sx,
}) => {
  const theme = useTheme();

  const priorityColors: Record<string, string> = {
    low: theme.palette.success.main,
    medium: theme.palette.warning.main,
    high: theme.palette.error.light,
    critical: theme.palette.error.main,
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        pb: 2,
        minHeight: 400,
        ...sx,
      }}
    >
      {columns.map((column) => (
        <Paper
          key={column.id}
          elevation={0}
          sx={{
            minWidth: 300,
            maxWidth: 350,
            flex: '0 0 300px',
            bgcolor: alpha(theme.palette.background.default, 0.7),
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Column Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: column.color ? alpha(column.color, 0.05) : undefined,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {column.color && (
                  <FiberManualRecord sx={{ fontSize: 12, color: column.color }} />
                )}
                <Typography variant="subtitle2" fontWeight={700}>{column.title}</Typography>
                <Chip
                  label={column.cards.length}
                  size="small"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
              {onAddCard && (
                <IconButton size="small" onClick={() => onAddCard(column.id)}>
                  <Add fontSize="small" />
                </IconButton>
              )}
            </Box>
            {column.limit && column.cards.length >= column.limit && (
              <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                Column limit ({column.limit}) reached
              </Typography>
            )}
          </Box>

          {/* Cards */}
          <Box sx={{ flex: 1, p: 1, overflowY: 'auto' }}>
            <AnimatePresence>
              {column.cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    elevation={0}
                    onClick={() => onCardClick?.(card)}
                    sx={{
                      mb: 1,
                      cursor: onCardClick ? 'pointer' : 'default',
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      borderLeft: card.priority
                        ? `3px solid ${priorityColors[card.priority]}`
                        : undefined,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: theme.shadows[2],
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                        {card.title}
                      </Typography>
                      {card.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {card.description}
                        </Typography>
                      )}
                      {(card.tags || card.assignee || card.dueDate) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {card.tags?.slice(0, 2).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {card.dueDate && (
                              <Typography variant="caption" color="text.secondary">
                                {card.dueDate}
                              </Typography>
                            )}
                            {card.assignee && (
                              <Tooltip title={card.assignee.name}>
                                <Avatar
                                  src={card.assignee.avatar}
                                  sx={{ width: 20, height: 20, fontSize: '0.6rem' }}
                                >
                                  {card.assignee.name[0]}
                                </Avatar>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            {column.cards.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, color: theme.palette.text.disabled }}>
                <Typography variant="caption">No items</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

// ============================================================================
// STATS GRID
// ============================================================================
interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: number;
  variant?: 'card' | 'compact' | 'outlined';
  sx?: any;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats, columns = 4, variant = 'card', sx,
}) => {
  const theme = useTheme();

  return (
    <Grid container spacing={2} sx={sx}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={12 / Math.min(columns, 6)} key={index}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Paper
              elevation={variant === 'card' ? 1 : 0}
              sx={{
                p: variant === 'compact' ? 1.5 : 2.5,
                borderRadius: 3,
                border: variant === 'outlined' ? `1px solid ${theme.palette.divider}` : undefined,
                bgcolor: stat.color ? alpha(stat.color, 0.04) : undefined,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {stat.label}
                  </Typography>
                  {stat.loading ? (
                    <Skeleton width={80} height={36} />
                  ) : (
                    <Typography variant="h5" fontWeight={700} sx={{ color: stat.color || 'text.primary', my: 0.5 }}>
                      {stat.value}
                    </Typography>
                  )}
                  {stat.change !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {stat.trend === 'up' ? (
                        <ArrowUpward sx={{ fontSize: 14, color: 'success.main' }} />
                      ) : stat.trend === 'down' ? (
                        <ArrowDownward sx={{ fontSize: 14, color: 'error.main' }} />
                      ) : null}
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color={
                          stat.trend === 'up' ? 'success.main' :
                          stat.trend === 'down' ? 'error.main' : 'text.secondary'
                        }
                      >
                        {stat.change > 0 ? '+' : ''}{stat.change}%
                      </Typography>
                      {stat.changeLabel && (
                        <Typography variant="caption" color="text.secondary">
                          {stat.changeLabel}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
                {stat.icon && (
                  <Avatar
                    sx={{
                      bgcolor: alpha(stat.color || theme.palette.primary.main, 0.1),
                      color: stat.color || theme.palette.primary.main,
                      width: 44,
                      height: 44,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                )}
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
};

// ============================================================================
// DATA TABLE SKELETON
// ============================================================================
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  sx?: any;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5, columns = 4, sx,
}) => {
  return (
    <Box sx={sx}>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={24} />
        ))}
      </Box>
      <Divider sx={{ mb: 1 }} />
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', gap: 2, py: 1.5 }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width={`${100 / columns}%`}
              height={20}
              animation="wave"
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};

// ============================================================================
// CONTENT CARD
// ============================================================================
interface ContentCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  noPadding?: boolean;
  variant?: 'elevated' | 'outlined' | 'filled';
  accentColor?: string;
  sx?: any;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  title, subtitle, icon, action, children, loading, error,
  collapsible = false, defaultExpanded = true, noPadding = false,
  variant = 'outlined', accentColor, sx,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const theme = useTheme();

  return (
    <Paper
      elevation={variant === 'elevated' ? 2 : 0}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: variant === 'outlined' ? `1px solid ${theme.palette.divider}` : undefined,
        bgcolor: variant === 'filled' ? alpha(theme.palette.background.paper, 0.7) : undefined,
        borderTop: accentColor ? `3px solid ${accentColor}` : undefined,
        ...sx,
      }}
    >
      {(title || action) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            cursor: collapsible ? 'pointer' : 'default',
          }}
          onClick={() => collapsible && setExpanded(!expanded)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {icon && <Box sx={{ color: accentColor || theme.palette.primary.main }}>{icon}</Box>}
            <Box>
              {title && <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>}
              {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {action}
            {collapsible && (
              <ExpandMore
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.3s',
                }}
              />
            )}
          </Box>
        </Box>
      )}

      {loading && <LinearProgress />}

      <Collapse in={!collapsible || expanded}>
        {error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Box sx={noPadding ? {} : { p: 3 }}>{children}</Box>
        )}
      </Collapse>
    </Paper>
  );
};

// ============================================================================
// VIEW TOGGLE
// ============================================================================
interface ViewToggleProps {
  view: 'grid' | 'list' | 'table';
  onViewChange: (view: 'grid' | 'list' | 'table') => void;
  options?: ('grid' | 'list' | 'table')[];
  size?: 'small' | 'medium';
  sx?: any;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  view, onViewChange, options = ['grid', 'list'], size = 'small', sx,
}) => {
  const iconMap = {
    grid: <GridView fontSize="small" />,
    list: <ViewList fontSize="small" />,
    table: <ViewModule fontSize="small" />,
  };

  return (
    <ToggleButtonGroup
      value={view}
      exclusive
      onChange={(_, newView) => newView && onViewChange(newView)}
      size={size}
      sx={{ '& .MuiToggleButton-root': { borderRadius: 2, px: 1.5 }, ...sx }}
    >
      {options.map((opt) => (
        <ToggleButton key={opt} value={opt}>
          <Tooltip title={`${opt.charAt(0).toUpperCase() + opt.slice(1)} view`}>
            {iconMap[opt]}
          </Tooltip>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

// ============================================================================
// SORT CONTROL
// ============================================================================
interface SortOption {
  value: string;
  label: string;
}

interface SortControlProps {
  options: SortOption[];
  value: string;
  direction: 'asc' | 'desc';
  onSortChange: (field: string) => void;
  onDirectionChange: (direction: 'asc' | 'desc') => void;
  size?: 'small' | 'medium';
  sx?: any;
}

export const SortControl: React.FC<SortControlProps> = ({
  options, value, direction, onSortChange, onDirectionChange, size = 'small', sx,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ...sx }}>
      <Button
        size={size}
        startIcon={<Sort />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        variant="outlined"
        sx={{ borderRadius: 2, textTransform: 'none' }}
      >
        {options.find((o) => o.value === value)?.label || 'Sort'}
      </Button>
      <IconButton
        size={size}
        onClick={() => onDirectionChange(direction === 'asc' ? 'desc' : 'asc')}
      >
        {direction === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === value}
            onClick={() => { onSortChange(option.value); setAnchorEl(null); }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

// ============================================================================
// EXPORT ALL
// ============================================================================
export default {
  PageHeader,
  SplitPane,
  TabPanel,
  AccordionGroup,
  EmptyState,
  Timeline,
  InfiniteScroll,
  KanbanBoard,
  StatsGrid,
  TableSkeleton,
  ContentCard,
  ViewToggle,
  SortControl,
};
