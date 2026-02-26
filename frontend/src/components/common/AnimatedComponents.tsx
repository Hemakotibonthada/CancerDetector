// ============================================================
// Animated Components Library
// Production-quality animated wrapper components using MUI + CSS
// ============================================================

import React, {
  forwardRef,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  Box,
  Card,
  CardProps,
  Typography,
  TypographyProps,
  LinearProgress,
  CircularProgress,
  List,
  ListItem,
  Fab,
  FabProps,
  Button,
  ButtonProps,
  Drawer,
  DrawerProps,
  Paper,
  PaperProps,
  IconButton,
  Tooltip,
  Collapse,
  Zoom,
  useTheme,
  alpha,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  keyframes,
  buildTransition,
  entranceAnimation,
  hoverLiftSx,
  buttonPressSx,
} from '../../utils/animations';

// ==================== COMMON TYPES ====================

interface BaseAnimatedProps {
  sx?: SxProps<Theme>;
  className?: string;
  children?: React.ReactNode;
}

type AnimationVariant =
  | 'fadeIn'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleIn'
  | 'bounceIn'
  | 'elasticIn'
  | 'slideFadeUp';

// ==================== ANIMATED CARD ====================

export interface AnimatedCardProps extends Omit<CardProps, 'ref'> {
  /** Entrance animation variant */
  animationVariant?: AnimationVariant;
  /** Entrance animation delay in seconds */
  animationDelay?: number;
  /** Entrance animation duration in seconds */
  animationDuration?: number;
  /** Enable hover lift effect */
  hoverLift?: boolean;
  /** Enable hover glow effect */
  hoverGlow?: boolean;
  /** Glow color for hover */
  glowColor?: string;
  /** Disable all animations */
  disableAnimation?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      animationVariant = 'slideFadeUp',
      animationDelay = 0,
      animationDuration = 0.5,
      hoverLift = true,
      hoverGlow = false,
      glowColor = '#1565c0',
      disableAnimation = false,
      sx,
      children,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();

    const animationSx: SxProps<Theme> = disableAnimation
      ? {}
      : {
          ...keyframes[animationVariant],
          animation: `${animationVariant} ${animationDuration}s cubic-bezier(0.22, 1, 0.36, 1) ${animationDelay}s both`,
        };

    const hoverSx: SxProps<Theme> = {
      transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      ...(hoverLift && {
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: hoverGlow
            ? `0 16px 32px rgba(0,0,0,0.1), 0 0 24px ${alpha(glowColor, 0.15)}`
            : '0 16px 32px rgba(0,0,0,0.1)',
        },
      }),
    };

    return (
      <Card
        ref={ref}
        sx={[animationSx as any, hoverSx as any, ...(Array.isArray(sx) ? sx : [sx])]}
        {...props}
      >
        {children}
      </Card>
    );
  }
);
AnimatedCard.displayName = 'AnimatedCard';

// ==================== ANIMATED COUNTER ====================

export interface AnimatedCounterProps extends BaseAnimatedProps {
  /** Target value to count to */
  value: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Number of decimal places */
  decimals?: number;
  /** Prefix string (e.g., "$") */
  prefix?: string;
  /** Suffix string (e.g., "%") */
  suffix?: string;
  /** Separator for thousands */
  separator?: string;
  /** Typography variant */
  variant?: TypographyProps['variant'];
  /** Text color */
  color?: string;
  /** Easing function: 'easeOut' | 'easeInOut' | 'linear' */
  easing?: 'easeOut' | 'easeInOut' | 'linear';
}

export const AnimatedCounter = forwardRef<HTMLSpanElement, AnimatedCounterProps>(
  (
    {
      value,
      duration = 1500,
      decimals = 0,
      prefix = '',
      suffix = '',
      separator = ',',
      variant = 'h4',
      color,
      easing = 'easeOut',
      sx,
      ...rest
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState(0);
    const startRef = useRef<number>(0);
    const rafRef = useRef<number>();
    const prevValue = useRef(0);

    const easingFn = useCallback(
      (t: number): number => {
        switch (easing) {
          case 'easeOut':
            return 1 - Math.pow(1 - t, 3);
          case 'easeInOut':
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          default:
            return t;
        }
      },
      [easing]
    );

    useEffect(() => {
      const from = prevValue.current;
      const to = value;
      startRef.current = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);
        const current = from + (to - from) * easedProgress;
        setDisplayValue(current);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          prevValue.current = to;
        }
      };

      rafRef.current = requestAnimationFrame(animate);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [value, duration, easingFn]);

    const formatted = useMemo(() => {
      const fixed = displayValue.toFixed(decimals);
      const [intPart, decPart] = fixed.split('.');
      const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      return `${prefix}${withSep}${decPart ? '.' + decPart : ''}${suffix}`;
    }, [displayValue, decimals, prefix, suffix, separator]);

    return (
      <Typography
        ref={ref}
        variant={variant}
        sx={[
          {
            fontWeight: 800,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            color: color || 'text.primary',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...rest}
      >
        {formatted}
      </Typography>
    );
  }
);
AnimatedCounter.displayName = 'AnimatedCounter';

// ==================== ANIMATED PROGRESS BAR ====================

export interface AnimatedProgressBarProps extends BaseAnimatedProps {
  /** Progress value 0-100 */
  value: number;
  /** Bar variant */
  variant?: 'linear' | 'circular';
  /** Bar color */
  color?: string;
  /** Background track color */
  trackColor?: string;
  /** Height for linear bar */
  height?: number;
  /** Size for circular variant */
  size?: number;
  /** Show label inside/beside */
  showLabel?: boolean;
  /** Label format */
  labelFormat?: (value: number) => string;
  /** Animate on mount */
  animated?: boolean;
  /** Striped pattern */
  striped?: boolean;
  /** Gradient colors [start, end] */
  gradient?: [string, string];
}

export const AnimatedProgressBar = forwardRef<HTMLDivElement, AnimatedProgressBarProps>(
  (
    {
      value,
      variant = 'linear',
      color = '#1565c0',
      trackColor,
      height = 8,
      size = 80,
      showLabel = false,
      labelFormat = (v) => `${Math.round(v)}%`,
      animated = true,
      striped = false,
      gradient,
      sx,
      children,
    },
    ref
  ) => {
    const [animatedValue, setAnimatedValue] = useState(animated ? 0 : value);
    const theme = useTheme();

    useEffect(() => {
      if (!animated) {
        setAnimatedValue(value);
        return;
      }
      const start = performance.now();
      const from = animatedValue;
      const dur = 800;
      let raf: number;
      const tick = (now: number) => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setAnimatedValue(from + (value - from) * eased);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, animated]);

    if (variant === 'circular') {
      return (
        <Box
          ref={ref}
          sx={[
            { position: 'relative', display: 'inline-flex', width: size, height: size },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          <CircularProgress
            variant="determinate"
            value={100}
            size={size}
            thickness={4}
            sx={{
              color: trackColor || alpha(color, 0.15),
              position: 'absolute',
            }}
          />
          <CircularProgress
            variant="determinate"
            value={animatedValue}
            size={size}
            thickness={4}
            sx={{
              color,
              position: 'absolute',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
                transition: animated ? 'stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
              },
            }}
          />
          {showLabel && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: size * 0.18, color }}>
                {labelFormat(animatedValue)}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    const bgGradient = gradient
      ? `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`
      : color;

    return (
      <Box ref={ref} sx={[{ width: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        {showLabel && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {children}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color }}>
              {labelFormat(animatedValue)}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            width: '100%',
            height,
            borderRadius: height / 2,
            bgcolor: trackColor || alpha(color, 0.12),
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${animatedValue}%`,
              borderRadius: height / 2,
              background: bgGradient,
              transition: animated
                ? 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)'
                : 'none',
              position: 'relative',
              ...(striped && {
                ...keyframes.progressStripe,
                backgroundImage:
                  'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                backgroundSize: `${height * 2}px ${height * 2}px`,
                animation: 'progressStripe 1s linear infinite',
              }),
            }}
          />
        </Box>
      </Box>
    );
  }
);
AnimatedProgressBar.displayName = 'AnimatedProgressBar';

// ==================== ANIMATED LIST ====================

export interface AnimatedListProps extends BaseAnimatedProps {
  /** Stagger delay between children in ms */
  staggerDelay?: number;
  /** Animation variant for children */
  animationVariant?: AnimationVariant;
  /** Duration per item in seconds */
  duration?: number;
  /** Render as MUI List */
  asList?: boolean;
}

export const AnimatedList = forwardRef<HTMLDivElement, AnimatedListProps>(
  (
    {
      staggerDelay = 60,
      animationVariant = 'slideFadeUp',
      duration = 0.45,
      asList = false,
      sx,
      children,
      ...rest
    },
    ref
  ) => {
    const items = React.Children.toArray(children);
    const childStyles: Record<string, any> = {
      ...keyframes[animationVariant],
    };
    items.forEach((_, i) => {
      childStyles[`& > *:nth-of-type(${i + 1})`] = {
        animation: `${animationVariant} ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${i * staggerDelay}ms both`,
      };
    });

    const Wrapper = asList ? List : Box;

    return (
      <Wrapper
        ref={ref}
        sx={[childStyles as SxProps<Theme>, ...(Array.isArray(sx) ? sx : [sx])]}
        {...rest}
      >
        {children}
      </Wrapper>
    );
  }
);
AnimatedList.displayName = 'AnimatedList';

// ==================== ANIMATED PAGE ====================

export interface AnimatedPageProps extends BaseAnimatedProps {
  /** Page transition variant */
  variant?: AnimationVariant;
  /** Duration */
  duration?: number;
}

export const AnimatedPage = forwardRef<HTMLDivElement, AnimatedPageProps>(
  ({ variant = 'slideFadeUp', duration = 0.5, sx, children }, ref) => {
    return (
      <Box
        ref={ref}
        sx={[
          {
            ...keyframes[variant],
            animation: `${variant} ${duration}s cubic-bezier(0.22, 1, 0.36, 1) both`,
            minHeight: '100%',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Box>
    );
  }
);
AnimatedPage.displayName = 'AnimatedPage';

// ==================== ANIMATED TEXT ====================

export interface AnimatedTextProps extends Omit<TypographyProps, 'ref'> {
  /** Text animation type */
  effect?: 'typewriter' | 'fadeIn' | 'gradient' | 'slideUp' | 'countUp';
  /** Typewriter speed in ms per character */
  typewriterSpeed?: number;
  /** Gradient colors */
  gradientColors?: string[];
  /** Show cursor for typewriter */
  showCursor?: boolean;
}

export const AnimatedText = forwardRef<HTMLSpanElement, AnimatedTextProps>(
  (
    {
      effect = 'fadeIn',
      typewriterSpeed = 50,
      gradientColors = ['#1565c0', '#00897b', '#7b1fa2'],
      showCursor = true,
      children,
      sx,
      ...props
    },
    ref
  ) => {
    const [displayText, setDisplayText] = useState('');
    const fullText = typeof children === 'string' ? children : '';

    useEffect(() => {
      if (effect !== 'typewriter' || !fullText) return;
      let i = 0;
      setDisplayText('');
      const timer = setInterval(() => {
        i++;
        setDisplayText(fullText.slice(0, i));
        if (i >= fullText.length) clearInterval(timer);
      }, typewriterSpeed);
      return () => clearInterval(timer);
    }, [effect, fullText, typewriterSpeed]);

    if (effect === 'typewriter') {
      return (
        <Typography
          ref={ref}
          sx={[
            {
              fontFamily: 'inherit',
              ...(showCursor && {
                ...keyframes.blink,
                borderRight: '2px solid currentColor',
                animation: 'blink 0.8s step-end infinite',
                pr: 0.5,
              }),
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
          {...props}
        >
          {displayText}
        </Typography>
      );
    }

    if (effect === 'gradient') {
      return (
        <Typography
          ref={ref}
          sx={[
            {
              ...keyframes.gradientShift,
              background: `linear-gradient(-45deg, ${gradientColors.join(', ')})`,
              backgroundSize: '300% 300%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradientShift 4s ease infinite',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
          {...props}
        >
          {children}
        </Typography>
      );
    }

    // Default: fadeIn, slideUp, etc.
    const kfName = effect === 'countUp' ? 'countUp' : effect;
    return (
      <Typography
        ref={ref}
        sx={[
          {
            ...(keyframes[kfName as keyof typeof keyframes] || keyframes.fadeIn),
            animation: `${kfName} 0.6s cubic-bezier(0.22, 1, 0.36, 1) both`,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...props}
      >
        {children}
      </Typography>
    );
  }
);
AnimatedText.displayName = 'AnimatedText';

// ==================== PULSE INDICATOR ====================

export interface PulseIndicatorProps extends BaseAnimatedProps {
  /** Indicator color */
  color?: string;
  /** Size in pixels */
  size?: number;
  /** Pulse speed: slow | normal | fast */
  speed?: 'slow' | 'normal' | 'fast';
  /** Optional label next to dot */
  label?: string;
}

export const PulseIndicator = forwardRef<HTMLDivElement, PulseIndicatorProps>(
  ({ color = '#4caf50', size = 10, speed = 'normal', label, sx }, ref) => {
    const durationMap = { slow: '2.5s', normal: '1.5s', fast: '0.8s' };

    return (
      <Box
        ref={ref}
        sx={[
          { display: 'inline-flex', alignItems: 'center', gap: 1 },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Box
          sx={{
            ...keyframes.ping,
            width: size,
            height: size,
            borderRadius: '50%',
            bgcolor: color,
            position: 'relative',
            flexShrink: 0,
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              bgcolor: color,
              animation: `ping ${durationMap[speed]} cubic-bezier(0, 0, 0.2, 1) infinite`,
            },
          }}
        />
        {label && (
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {label}
          </Typography>
        )}
      </Box>
    );
  }
);
PulseIndicator.displayName = 'PulseIndicator';

// ==================== GRADIENT TEXT ====================

export interface GradientTextProps extends Omit<TypographyProps, 'ref'> {
  /** Gradient colors */
  colors?: string[];
  /** Gradient direction in degrees */
  direction?: number;
  /** Animate the gradient */
  animated?: boolean;
  /** Animation duration in seconds */
  animationDuration?: number;
}

export const GradientText = forwardRef<HTMLSpanElement, GradientTextProps>(
  (
    {
      colors = ['#1565c0', '#00897b'],
      direction = 135,
      animated = false,
      animationDuration = 4,
      sx,
      children,
      ...props
    },
    ref
  ) => (
    <Typography
      ref={ref}
      sx={[
        {
          background: `linear-gradient(${direction}deg, ${colors.join(', ')})`,
          ...(animated && {
            ...keyframes.gradientShift,
            backgroundSize: '300% 300%',
            animation: `gradientShift ${animationDuration}s ease infinite`,
          }),
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'inline-block',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Typography>
  )
);
GradientText.displayName = 'GradientText';

// ==================== FLOATING ACTION MENU ====================

export interface FloatingActionMenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

export interface FloatingActionMenuProps extends BaseAnimatedProps {
  /** Menu items */
  items: FloatingActionMenuItem[];
  /** FAB color */
  color?: 'primary' | 'secondary' | 'default';
  /** FAB icon when closed */
  icon?: React.ReactNode;
  /** Position */
  position?: { bottom?: number; right?: number; left?: number; top?: number };
}

export const FloatingActionMenu = forwardRef<HTMLDivElement, FloatingActionMenuProps>(
  (
    {
      items,
      color = 'primary',
      icon = <AddIcon />,
      position = { bottom: 24, right: 24 },
      sx,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);

    return (
      <Box
        ref={ref}
        sx={[
          { position: 'fixed', zIndex: 1200, ...position },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {/* Menu items */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            mb: 1,
            gap: 1,
          }}
        >
          {items.map((item, i) => (
            <Zoom
              key={i}
              in={open}
              style={{ transitionDelay: open ? `${i * 50}ms` : '0ms' }}
            >
              <Tooltip title={item.label} placement="left" arrow>
                <Fab
                  size="small"
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  sx={{
                    bgcolor: item.color || 'background.paper',
                    color: item.color ? '#fff' : 'text.primary',
                    boxShadow: 3,
                    '&:hover': { transform: 'scale(1.1)' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item.icon}
                </Fab>
              </Tooltip>
            </Zoom>
          ))}
        </Box>
        {/* Main FAB */}
        <Fab
          color={color}
          onClick={() => setOpen((o) => !o)}
          sx={{
            transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          {icon}
        </Fab>
      </Box>
    );
  }
);
FloatingActionMenu.displayName = 'FloatingActionMenu';

// ==================== PARALLAX CONTAINER ====================

export interface ParallaxContainerProps extends BaseAnimatedProps {
  /** Parallax speed factor (0 = no effect, 1 = full scroll speed) */
  speed?: number;
  /** Background image URL */
  backgroundImage?: string;
  /** Minimum height */
  minHeight?: string | number;
  /** Overlay color */
  overlay?: string;
}

export const ParallaxContainer = forwardRef<HTMLDivElement, ParallaxContainerProps>(
  (
    {
      speed = 0.5,
      backgroundImage,
      minHeight = 400,
      overlay,
      sx,
      children,
    },
    ref
  ) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const combinedRef = (node: HTMLDivElement) => {
      (innerRef as any).current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as any).current = node;
    };

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      const handleScroll = () => {
        const rect = el.getBoundingClientRect();
        const scrolled = window.scrollY;
        const offset = (rect.top + scrolled) * speed;
        el.style.backgroundPositionY = `${offset}px`;
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      return () => window.removeEventListener('scroll', handleScroll);
    }, [speed]);

    return (
      <Box
        ref={combinedRef}
        sx={[
          {
            minHeight,
            position: 'relative',
            overflow: 'hidden',
            ...(backgroundImage && {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              backgroundAttachment: 'fixed',
            }),
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {overlay && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: overlay,
              zIndex: 1,
            }}
          />
        )}
        <Box sx={{ position: 'relative', zIndex: 2 }}>{children}</Box>
      </Box>
    );
  }
);
ParallaxContainer.displayName = 'ParallaxContainer';

// ==================== MORPHING CARD ====================

export interface MorphingCardProps extends Omit<CardProps, 'ref'> {
  /** Morph speed in seconds */
  morphDuration?: number;
  /** Enable continuous morphing animation */
  continuousMorph?: boolean;
  /** Only morph on hover */
  morphOnHover?: boolean;
}

export const MorphingCard = forwardRef<HTMLDivElement, MorphingCardProps>(
  (
    {
      morphDuration = 8,
      continuousMorph = false,
      morphOnHover = true,
      sx,
      children,
      ...props
    },
    ref
  ) => (
    <Card
      ref={ref}
      sx={[
        {
          ...keyframes.morphing,
          transition: `border-radius ${morphDuration}s ease`,
          ...(continuousMorph && {
            animation: `morphing ${morphDuration}s ease-in-out infinite`,
          }),
          ...(morphOnHover && {
            '&:hover': {
              borderRadius: '50% 16px 50% 16px',
              transform: 'scale(1.02)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
            },
          }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Card>
  )
);
MorphingCard.displayName = 'MorphingCard';

// ==================== CONFETTI EXPLOSION ====================

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
}

export interface ConfettiExplosionProps extends BaseAnimatedProps {
  /** Number of confetti pieces */
  count?: number;
  /** Colors for confetti */
  colors?: string[];
  /** Duration in milliseconds */
  duration?: number;
  /** Spread radius */
  spread?: number;
  /** Active state */
  active?: boolean;
}

export const ConfettiExplosion = React.memo(
  forwardRef<HTMLDivElement, ConfettiExplosionProps>(
    (
      {
        count = 40,
        colors = ['#1565c0', '#00897b', '#7b1fa2', '#f57c00', '#d32f2f', '#ffd600'],
        duration = 2000,
        spread = 200,
        active = false,
        sx,
      },
      ref
    ) => {
      const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
      const [visible, setVisible] = useState(false);

      useEffect(() => {
        if (!active) return;
        const newPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
          id: i,
          x: (Math.random() - 0.5) * spread * 2,
          y: -(Math.random() * spread + 50),
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 720 - 360,
          scale: Math.random() * 0.5 + 0.5,
          delay: Math.random() * 200,
        }));
        setPieces(newPieces);
        setVisible(true);
        const timer = setTimeout(() => setVisible(false), duration);
        return () => clearTimeout(timer);
      }, [active, count, colors, spread, duration]);

      if (!visible || pieces.length === 0) return null;

      return (
        <Box
          ref={ref}
          sx={[
            {
              position: 'fixed',
              top: '50%',
              left: '50%',
              pointerEvents: 'none',
              zIndex: 9999,
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          {pieces.map((p) => (
            <Box
              key={p.id}
              sx={{
                position: 'absolute',
                width: 10,
                height: 10,
                bgcolor: p.color,
                borderRadius: Math.random() > 0.5 ? '50%' : 1,
                transform: 'translate(-50%, -50%) scale(0)',
                animation: `confetti-${p.id % 3} ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}ms forwards`,
                [`@keyframes confetti-${p.id % 3}`]: {
                  '0%': {
                    transform: 'translate(0, 0) scale(0) rotate(0deg)',
                    opacity: 1,
                  },
                  '20%': {
                    transform: `translate(${p.x * 0.3}px, ${p.y * 0.4}px) scale(${p.scale}) rotate(${p.rotation * 0.3}deg)`,
                    opacity: 1,
                  },
                  '100%': {
                    transform: `translate(${p.x}px, ${-p.y + spread}px) scale(0) rotate(${p.rotation}deg)`,
                    opacity: 0,
                  },
                },
              }}
            />
          ))}
        </Box>
      );
    }
  )
);
(ConfettiExplosion as any).displayName = 'ConfettiExplosion';

// ==================== SHIMMER PLACEHOLDER ====================

export interface ShimmerPlaceholderProps extends BaseAnimatedProps {
  /** Shape: rect, circle, text */
  shape?: 'rect' | 'circle' | 'text';
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
  /** Number of text lines (for shape='text') */
  lines?: number;
  /** Border radius */
  borderRadius?: number;
}

export const ShimmerPlaceholder = forwardRef<HTMLDivElement, ShimmerPlaceholderProps>(
  (
    {
      shape = 'rect',
      width = '100%',
      height = shape === 'text' ? 16 : 120,
      lines = 3,
      borderRadius = 8,
      sx,
    },
    ref
  ) => {
    const shimmerBase: SxProps<Theme> = {
      ...keyframes.shimmer,
      background:
        'linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.10) 37%, rgba(0,0,0,0.06) 63%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
    };

    if (shape === 'circle') {
      const sz = typeof width === 'number' ? width : 48;
      return (
        <Box
          ref={ref}
          sx={[
            shimmerBase,
            { width: sz, height: sz, borderRadius: '50%', flexShrink: 0 },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        />
      );
    }

    if (shape === 'text') {
      return (
        <Box ref={ref} sx={[{ display: 'flex', flexDirection: 'column', gap: 1 }, ...(Array.isArray(sx) ? sx : [sx])]}>
          {Array.from({ length: lines }, (_, i) => (
            <Box
              key={i}
              sx={[
                shimmerBase,
                {
                  height,
                  borderRadius: borderRadius / 2,
                  width: i === lines - 1 ? '60%' : '100%',
                },
              ]}
            />
          ))}
        </Box>
      );
    }

    return (
      <Box
        ref={ref}
        sx={[
          shimmerBase,
          { width, height, borderRadius: borderRadius / 8 },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      />
    );
  }
);
ShimmerPlaceholder.displayName = 'ShimmerPlaceholder';

// ==================== RIPPLE BUTTON ====================

export interface RippleButtonProps extends Omit<ButtonProps, 'ref'> {
  /** Ripple color */
  rippleColor?: string;
}

export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ rippleColor = 'rgba(255,255,255,0.4)', onClick, sx, children, ...props }, ref) => {
    const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        sx={[
          {
            position: 'relative',
            overflow: 'hidden',
            ...buttonPressSx,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...props}
      >
        {children}
        {ripples.map((r) => (
          <Box
            key={r.id}
            sx={{
              ...keyframes.ripple,
              position: 'absolute',
              left: r.x,
              top: r.y,
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: rippleColor,
              transform: 'translate(-50%, -50%) scale(0)',
              animation: 'ripple 0.6s ease-out',
              pointerEvents: 'none',
            }}
          />
        ))}
      </Button>
    );
  }
);
RippleButton.displayName = 'RippleButton';

// ==================== WAVE BACKGROUND ====================

export interface WaveBackgroundProps extends BaseAnimatedProps {
  /** Wave colors (up to 3 layers) */
  colors?: string[];
  /** Fixed height for the wave area */
  height?: number;
  /** Animation speed: slow, normal, fast */
  speed?: 'slow' | 'normal' | 'fast';
}

export const WaveBackground = forwardRef<HTMLDivElement, WaveBackgroundProps>(
  (
    {
      colors = ['rgba(21,101,192,0.15)', 'rgba(0,137,123,0.1)', 'rgba(123,31,162,0.08)'],
      height = 200,
      speed = 'normal',
      sx,
      children,
    },
    ref
  ) => {
    const durMap = { slow: 12, normal: 8, fast: 4 };

    return (
      <Box
        ref={ref}
        sx={[
          { position: 'relative', overflow: 'hidden' },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height, pointerEvents: 'none' }}>
          {colors.map((c, i) => (
            <svg
              key={i}
              style={{
                position: 'absolute',
                bottom: i * 8,
                left: 0,
                width: '200%',
                height: height - i * 20,
                animation: `wave-move-${i} ${durMap[speed] + i * 2}s linear infinite`,
              }}
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <defs>
                <style>{`
                  @keyframes wave-move-${i} {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                `}</style>
              </defs>
              <path
                fill={c}
                d={
                  i === 0
                    ? 'M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,149.3C840,139,960,149,1080,170.7C1200,192,1320,224,1380,240L1440,256L1440,320L0,320Z'
                    : i === 1
                      ? 'M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,234.7C672,245,768,235,864,208C960,181,1056,139,1152,138.7C1248,139,1344,181,1392,202.7L1440,224L1440,320L0,320Z'
                      : 'M0,288L48,272C96,256,192,224,288,218.7C384,213,480,235,576,250.7C672,267,768,277,864,272C960,267,1056,245,1152,234.7C1248,224,1344,224,1392,224L1440,224L1440,320L0,320Z'
                }
              />
            </svg>
          ))}
        </Box>
      </Box>
    );
  }
);
WaveBackground.displayName = 'WaveBackground';

// ==================== GLASS CARD ====================

export interface GlassCardProps extends Omit<PaperProps, 'ref'> {
  /** Blur intensity */
  blur?: number;
  /** Glass opacity */
  opacity?: number;
  /** Border glow color */
  borderGlow?: string;
  /** Entrance animation */
  animated?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      blur = 20,
      opacity = 0.72,
      borderGlow,
      animated = true,
      sx,
      children,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
      <Paper
        ref={ref}
        elevation={0}
        sx={[
          {
            background: isDark
              ? `rgba(19, 47, 76, ${opacity})`
              : `rgba(255, 255, 255, ${opacity})`,
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            border: borderGlow
              ? `1px solid ${borderGlow}40`
              : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)'}`,
            borderRadius: 4,
            boxShadow: borderGlow
              ? `0 8px 32px rgba(0,0,0,0.1), inset 0 0 0 1px ${borderGlow}10`
              : '0 8px 32px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: borderGlow
                ? `0 16px 48px rgba(0,0,0,0.15), 0 0 24px ${borderGlow}20`
                : '0 16px 48px rgba(0,0,0,0.12)',
            },
            ...(animated && {
              ...keyframes.fadeIn,
              animation: 'fadeIn 0.5s ease both',
            }),
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...props}
      >
        {children}
      </Paper>
    );
  }
);
GlassCard.displayName = 'GlassCard';

// ==================== NEON GLOW ====================

export interface NeonGlowProps extends BaseAnimatedProps {
  /** Neon color */
  color?: string;
  /** Intensity: subtle | normal | intense */
  intensity?: 'subtle' | 'normal' | 'intense';
  /** Pulsing animation */
  pulse?: boolean;
  /** Apply to text or box */
  variant?: 'text' | 'box';
}

export const NeonGlow = forwardRef<HTMLDivElement, NeonGlowProps>(
  (
    {
      color = '#1565c0',
      intensity = 'normal',
      pulse = true,
      variant = 'box',
      sx,
      children,
    },
    ref
  ) => {
    const shadowSizes = {
      subtle: { inner: 5, mid: 15, outer: 0 },
      normal: { inner: 10, mid: 30, outer: 60 },
      intense: { inner: 15, mid: 45, outer: 90 },
    };
    const s = shadowSizes[intensity];

    const boxGlow = `0 0 ${s.inner}px ${color}40, 0 0 ${s.mid}px ${color}25${s.outer ? `, 0 0 ${s.outer}px ${color}15` : ''}`;
    const textGlow = `0 0 ${s.inner / 2}px #fff, 0 0 ${s.inner}px #fff, 0 0 ${s.mid}px ${color}, 0 0 ${s.outer || s.mid * 2}px ${color}`;

    return (
      <Box
        ref={ref}
        sx={[
          variant === 'text'
            ? {
                ...keyframes.neonPulse,
                color: '#fff',
                textShadow: textGlow,
                ...(pulse && {
                  animation: 'neonPulse 2s ease-in-out infinite',
                }),
              }
            : {
                ...keyframes.glow,
                boxShadow: boxGlow,
                border: `1px solid ${color}50`,
                borderRadius: 3,
                ...(pulse && {
                  animation: `glow 2.5s ease-in-out infinite`,
                }),
              },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Box>
    );
  }
);
NeonGlow.displayName = 'NeonGlow';

// ==================== SLIDE DRAWER ====================

export interface SlideDrawerProps extends Omit<DrawerProps, 'ref'> {
  /** Width of drawer */
  width?: number | string;
  /** Spring-like animation */
  springEffect?: boolean;
}

export const SlideDrawer = forwardRef<HTMLDivElement, SlideDrawerProps>(
  (
    {
      width = 360,
      springEffect = true,
      sx,
      children,
      ...props
    },
    ref
  ) => (
    <Drawer
      ref={ref}
      sx={[
        {
          '& .MuiDrawer-paper': {
            width,
            borderRadius: 0,
            transition: springEffect
              ? 'transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important'
              : 'transform 0.3s ease !important',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.08)',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Drawer>
  )
);
SlideDrawer.displayName = 'SlideDrawer';

// ==================== ANIMATED BADGE ====================

export interface AnimatedBadgeProps extends BaseAnimatedProps {
  /** Badge content */
  count?: number;
  /** Badge color */
  color?: string;
  /** Max count */
  max?: number;
  /** Show zero */
  showZero?: boolean;
}

export const AnimatedBadge = forwardRef<HTMLDivElement, AnimatedBadgeProps>(
  ({ count = 0, color = '#d32f2f', max = 99, showZero = false, sx, children }, ref) => {
    const display = count > max ? `${max}+` : count;
    const show = showZero ? true : count > 0;

    return (
      <Box ref={ref} sx={[{ position: 'relative', display: 'inline-flex' }, ...(Array.isArray(sx) ? sx : [sx])]}>
        {children}
        {show && (
          <Box
            sx={{
              ...keyframes.bounceIn,
              position: 'absolute',
              top: -6,
              right: -6,
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              bgcolor: color,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              px: 0.5,
              animation: 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              border: '2px solid #fff',
            }}
          >
            {display}
          </Box>
        )}
      </Box>
    );
  }
);
AnimatedBadge.displayName = 'AnimatedBadge';

// ==================== SCROLL REVEAL WRAPPER ====================

export interface ScrollRevealProps extends BaseAnimatedProps {
  /** Animation variant */
  variant?: AnimationVariant;
  /** Threshold for intersection (0-1) */
  threshold?: number;
  /** Only animate once */
  once?: boolean;
  /** Duration */
  duration?: number;
  /** Delay */
  delay?: number;
}

export const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(
  (
    {
      variant = 'slideFadeUp',
      threshold = 0.15,
      once = true,
      duration = 0.6,
      delay = 0,
      sx,
      children,
    },
    ref
  ) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) observer.unobserve(el);
          } else if (!once) {
            setIsVisible(false);
          }
        },
        { threshold }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [threshold, once]);

    return (
      <Box
        ref={(node: HTMLDivElement) => {
          (innerRef as any).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as any).current = node;
        }}
        sx={[
          {
            ...keyframes[variant],
            opacity: isVisible ? 1 : 0,
            ...(isVisible && {
              animation: `${variant} ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
            }),
            ...(!isVisible && {
              transform:
                variant.includes('slide') || variant === 'slideFadeUp'
                  ? 'translateY(30px)'
                  : variant === 'scaleIn'
                    ? 'scale(0.85)'
                    : 'none',
            }),
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {children}
      </Box>
    );
  }
);
ScrollReveal.displayName = 'ScrollReveal';
