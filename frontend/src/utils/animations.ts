// ============================================================
// Animation Utilities Module
// Comprehensive CSS-in-JS animation definitions for MUI sx prop
// ============================================================

import type { SxProps, Theme } from '@mui/material';

// ==================== TYPES ====================

export interface KeyframeDefinition {
  [key: string]: React.CSSProperties;
}

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  iterationCount?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
  velocity?: number;
}

export interface TransitionPreset {
  duration: string;
  easing: string;
  properties?: string[];
}

export interface PageTransitionVariant {
  enter: SxProps<Theme>;
  exit: SxProps<Theme>;
  active: SxProps<Theme>;
}

// ==================== KEYFRAME DEFINITIONS ====================

export const keyframes = {
  fadeIn: {
    '@keyframes fadeIn': {
      '0%': { opacity: 0 },
      '100%': { opacity: 1 },
    },
  },

  fadeOut: {
    '@keyframes fadeOut': {
      '0%': { opacity: 1 },
      '100%': { opacity: 0 },
    },
  },

  slideUp: {
    '@keyframes slideUp': {
      '0%': { opacity: 0, transform: 'translateY(30px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' },
    },
  },

  slideDown: {
    '@keyframes slideDown': {
      '0%': { opacity: 0, transform: 'translateY(-30px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' },
    },
  },

  slideLeft: {
    '@keyframes slideLeft': {
      '0%': { opacity: 0, transform: 'translateX(30px)' },
      '100%': { opacity: 1, transform: 'translateX(0)' },
    },
  },

  slideRight: {
    '@keyframes slideRight': {
      '0%': { opacity: 0, transform: 'translateX(-30px)' },
      '100%': { opacity: 1, transform: 'translateX(0)' },
    },
  },

  scaleIn: {
    '@keyframes scaleIn': {
      '0%': { opacity: 0, transform: 'scale(0.85)' },
      '100%': { opacity: 1, transform: 'scale(1)' },
    },
  },

  scaleOut: {
    '@keyframes scaleOut': {
      '0%': { opacity: 1, transform: 'scale(1)' },
      '100%': { opacity: 0, transform: 'scale(0.85)' },
    },
  },

  rotateIn: {
    '@keyframes rotateIn': {
      '0%': { opacity: 0, transform: 'rotate(-15deg) scale(0.9)' },
      '100%': { opacity: 1, transform: 'rotate(0deg) scale(1)' },
    },
  },

  bounceIn: {
    '@keyframes bounceIn': {
      '0%': { opacity: 0, transform: 'scale(0.3)' },
      '40%': { transform: 'scale(1.08)' },
      '60%': { transform: 'scale(0.95)' },
      '80%': { opacity: 1, transform: 'scale(1.02)' },
      '100%': { opacity: 1, transform: 'scale(1)' },
    },
  },

  elasticIn: {
    '@keyframes elasticIn': {
      '0%': { opacity: 0, transform: 'scale(0)' },
      '55%': { opacity: 1, transform: 'scale(1.1)' },
      '70%': { transform: 'scale(0.95)' },
      '85%': { transform: 'scale(1.03)' },
      '100%': { transform: 'scale(1)' },
    },
  },

  pulse: {
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)', opacity: 1 },
      '50%': { transform: 'scale(1.05)', opacity: 0.85 },
      '100%': { transform: 'scale(1)', opacity: 1 },
    },
  },

  shimmer: {
    '@keyframes shimmer': {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
  },

  glow: {
    '@keyframes glow': {
      '0%': { boxShadow: '0 0 5px rgba(21,101,192,0.2)' },
      '50%': { boxShadow: '0 0 20px rgba(21,101,192,0.5), 0 0 40px rgba(21,101,192,0.2)' },
      '100%': { boxShadow: '0 0 5px rgba(21,101,192,0.2)' },
    },
  },

  float: {
    '@keyframes float': {
      '0%': { transform: 'translateY(0px)' },
      '33%': { transform: 'translateY(-8px)' },
      '66%': { transform: 'translateY(4px)' },
      '100%': { transform: 'translateY(0px)' },
    },
  },

  shake: {
    '@keyframes shake': {
      '0%, 100%': { transform: 'translateX(0)' },
      '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
      '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
    },
  },

  wiggle: {
    '@keyframes wiggle': {
      '0%, 100%': { transform: 'rotate(0deg)' },
      '25%': { transform: 'rotate(-3deg)' },
      '50%': { transform: 'rotate(3deg)' },
      '75%': { transform: 'rotate(-1deg)' },
    },
  },

  morphing: {
    '@keyframes morphing': {
      '0%': { borderRadius: '16px' },
      '25%': { borderRadius: '50% 16px 50% 16px' },
      '50%': { borderRadius: '16px 50% 16px 50%' },
      '75%': { borderRadius: '50% 16px 50% 16px' },
      '100%': { borderRadius: '16px' },
    },
  },

  ripple: {
    '@keyframes ripple': {
      '0%': { transform: 'scale(0)', opacity: 0.6 },
      '100%': { transform: 'scale(4)', opacity: 0 },
    },
  },

  wave: {
    '@keyframes wave': {
      '0%': { transform: 'translateX(-100%)' },
      '50%': { transform: 'translateX(100%)' },
      '100%': { transform: 'translateX(-100%)' },
    },
  },

  sparkle: {
    '@keyframes sparkle': {
      '0%, 100%': { opacity: 0, transform: 'scale(0) rotate(0deg)' },
      '50%': { opacity: 1, transform: 'scale(1) rotate(180deg)' },
    },
  },

  spin: {
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  },

  ping: {
    '@keyframes ping': {
      '0%': { transform: 'scale(1)', opacity: 1 },
      '75%, 100%': { transform: 'scale(2)', opacity: 0 },
    },
  },

  breathe: {
    '@keyframes breathe': {
      '0%, 100%': { transform: 'scale(1)', opacity: 0.9 },
      '50%': { transform: 'scale(1.06)', opacity: 1 },
    },
  },

  slideFadeUp: {
    '@keyframes slideFadeUp': {
      '0%': { opacity: 0, transform: 'translateY(20px) scale(0.98)' },
      '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
    },
  },

  gradientShift: {
    '@keyframes gradientShift': {
      '0%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' },
    },
  },

  typewriter: {
    '@keyframes typewriter': {
      from: { width: '0' },
      to: { width: '100%' },
    },
  },

  blink: {
    '@keyframes blink': {
      '0%, 100%': { borderColor: 'transparent' },
      '50%': { borderColor: 'currentColor' },
    },
  },

  countUp: {
    '@keyframes countUp': {
      '0%': { transform: 'translateY(100%)', opacity: 0 },
      '100%': { transform: 'translateY(0)', opacity: 1 },
    },
  },

  expandWidth: {
    '@keyframes expandWidth': {
      '0%': { width: '0%' },
      '100%': { width: '100%' },
    },
  },

  slideInFromLeft: {
    '@keyframes slideInFromLeft': {
      '0%': { transform: 'translateX(-100%)', opacity: 0 },
      '100%': { transform: 'translateX(0)', opacity: 1 },
    },
  },

  slideInFromRight: {
    '@keyframes slideInFromRight': {
      '0%': { transform: 'translateX(100%)', opacity: 0 },
      '100%': { transform: 'translateX(0)', opacity: 1 },
    },
  },

  flipIn: {
    '@keyframes flipIn': {
      '0%': { transform: 'perspective(400px) rotateY(90deg)', opacity: 0 },
      '40%': { transform: 'perspective(400px) rotateY(-15deg)' },
      '70%': { transform: 'perspective(400px) rotateY(10deg)' },
      '100%': { transform: 'perspective(400px) rotateY(0deg)', opacity: 1 },
    },
  },

  zoomIn: {
    '@keyframes zoomIn': {
      '0%': { opacity: 0, transform: 'scale(0.5)' },
      '100%': { opacity: 1, transform: 'scale(1)' },
    },
  },

  heartbeat: {
    '@keyframes heartbeat': {
      '0%': { transform: 'scale(1)' },
      '14%': { transform: 'scale(1.15)' },
      '28%': { transform: 'scale(1)' },
      '42%': { transform: 'scale(1.15)' },
      '70%': { transform: 'scale(1)' },
    },
  },

  neonPulse: {
    '@keyframes neonPulse': {
      '0%, 100%': {
        textShadow: '0 0 4px #fff, 0 0 11px #fff, 0 0 19px #fff, 0 0 40px #1565c0, 0 0 80px #1565c0',
      },
      '50%': {
        textShadow: '0 0 2px #fff, 0 0 5px #fff, 0 0 10px #fff, 0 0 20px #1565c0, 0 0 40px #1565c0',
      },
    },
  },

  progressStripe: {
    '@keyframes progressStripe': {
      '0%': { backgroundPosition: '1rem 0' },
      '100%': { backgroundPosition: '0 0' },
    },
  },
} as const;

// ==================== ANIMATION FACTORY FUNCTIONS ====================

/**
 * Creates an animation sx prop from keyframe name and config
 */
export const createAnimation = (
  keyframeName: keyof typeof keyframes,
  config: AnimationConfig = {}
): SxProps<Theme> => {
  const {
    duration = 0.4,
    delay = 0,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
    fillMode = 'both',
    iterationCount = 1,
    direction = 'normal',
  } = config;

  return {
    ...keyframes[keyframeName],
    animation: `${keyframeName} ${duration}s ${easing} ${delay}s ${iterationCount} ${direction} ${fillMode}`,
  } as SxProps<Theme>;
};

/**
 * Creates staggered entry animations for child elements
 */
export const createStaggeredAnimation = (
  keyframeName: keyof typeof keyframes,
  childCount: number,
  options: {
    baseDuration?: number;
    staggerDelay?: number;
    baseDelay?: number;
    easing?: string;
  } = {}
): SxProps<Theme> => {
  const {
    baseDuration = 0.5,
    staggerDelay = 0.08,
    baseDelay = 0,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
  } = options;

  const childStyles: Record<string, any> = {};
  for (let i = 0; i < childCount; i++) {
    childStyles[`& > *:nth-of-type(${i + 1})`] = {
      ...keyframes[keyframeName],
      animation: `${keyframeName} ${baseDuration}s ${easing} ${baseDelay + i * staggerDelay}s both`,
    };
  }

  return childStyles as SxProps<Theme>;
};

/**
 * Create staggered animation using CSS custom properties approach
 */
export const staggeredEntrySx = (
  animationName: keyof typeof keyframes = 'slideFadeUp',
  maxItems: number = 20,
  staggerMs: number = 60,
  durationMs: number = 500
): SxProps<Theme> => {
  const children: Record<string, any> = {};
  for (let i = 1; i <= maxItems; i++) {
    children[`& > *:nth-of-type(${i})`] = {
      ...keyframes[animationName],
      animation: `${animationName} ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1) ${i * staggerMs}ms both`,
    };
  }
  return children as SxProps<Theme>;
};

// ==================== SPRING PHYSICS CONFIGS ====================

export const springConfigs: Record<string, SpringConfig> = {
  gentle: { stiffness: 120, damping: 14, mass: 1 },
  wobbly: { stiffness: 180, damping: 12, mass: 1 },
  stiff: { stiffness: 300, damping: 20, mass: 1 },
  slow: { stiffness: 80, damping: 20, mass: 1.5 },
  snappy: { stiffness: 400, damping: 25, mass: 0.8 },
  bouncy: { stiffness: 200, damping: 8, mass: 1 },
  molasses: { stiffness: 60, damping: 30, mass: 2 },
  responsive: { stiffness: 250, damping: 18, mass: 1 },
};

/**
 * Convert spring config to approximate CSS cubic-bezier
 * (Simplified approximation since CSS doesn't natively support spring physics)
 */
export const springToCubicBezier = (config: SpringConfig): string => {
  const { stiffness, damping, mass } = config;
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
  if (dampingRatio >= 1) {
    return 'cubic-bezier(0.25, 0.1, 0.25, 1)';
  }
  const x1 = Math.min(0.5, 1 - dampingRatio);
  const y1 = Math.min(1.5, 1 + (1 - dampingRatio) * 0.5);
  const x2 = Math.max(0.1, dampingRatio * 0.5);
  const y2 = 1;
  return `cubic-bezier(${x1.toFixed(3)}, ${y1.toFixed(3)}, ${x2.toFixed(3)}, ${y2})`;
};

/**
 * Estimate animation duration from spring config
 */
export const springDuration = (config: SpringConfig): number => {
  const { stiffness, damping, mass } = config;
  const omega = Math.sqrt(stiffness / mass);
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
  if (dampingRatio >= 1) {
    return 4 / omega;
  }
  return (4 * Math.PI) / (omega * Math.sqrt(1 - dampingRatio * dampingRatio));
};

// ==================== TRANSITION PRESETS ====================

export const transitions: Record<string, TransitionPreset> = {
  ease: {
    duration: '0.3s',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  easeIn: {
    duration: '0.3s',
    easing: 'cubic-bezier(0.4, 0, 1, 1)',
  },
  easeOut: {
    duration: '0.3s',
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
  },
  easeInOut: {
    duration: '0.35s',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  bounce: {
    duration: '0.5s',
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  elastic: {
    duration: '0.6s',
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  smooth: {
    duration: '0.4s',
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  sharp: {
    duration: '0.2s',
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
  snappy: {
    duration: '0.25s',
    easing: 'cubic-bezier(0.85, 0, 0.15, 1)',
  },
  gentle: {
    duration: '0.5s',
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
  spring: {
    duration: '0.55s',
    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  decelerate: {
    duration: '0.4s',
    easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  },
  accelerate: {
    duration: '0.3s',
    easing: 'cubic-bezier(0.4, 0.0, 1, 1)',
  },
};

/**
 * Build a CSS transition string from a preset
 */
export const buildTransition = (
  preset: keyof typeof transitions | TransitionPreset,
  properties: string[] = ['all']
): string => {
  const config = typeof preset === 'string' ? transitions[preset] : preset;
  return properties.map((p) => `${p} ${config.duration} ${config.easing}`).join(', ');
};

// ==================== PAGE TRANSITION VARIANTS ====================

export const pageTransitions: Record<string, PageTransitionVariant> = {
  fade: {
    enter: { opacity: 0 },
    exit: { opacity: 0 },
    active: { opacity: 1, transition: 'opacity 0.35s ease' },
  },
  slideUp: {
    enter: { opacity: 0, transform: 'translateY(24px)' },
    exit: { opacity: 0, transform: 'translateY(-24px)' },
    active: {
      opacity: 1,
      transform: 'translateY(0)',
      transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
    },
  },
  slideLeft: {
    enter: { opacity: 0, transform: 'translateX(40px)' },
    exit: { opacity: 0, transform: 'translateX(-40px)' },
    active: {
      opacity: 1,
      transform: 'translateX(0)',
      transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
    },
  },
  scale: {
    enter: { opacity: 0, transform: 'scale(0.95)' },
    exit: { opacity: 0, transform: 'scale(1.02)' },
    active: {
      opacity: 1,
      transform: 'scale(1)',
      transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
    },
  },
  scaleRotate: {
    enter: { opacity: 0, transform: 'scale(0.92) rotate(-2deg)' },
    exit: { opacity: 0, transform: 'scale(1.05) rotate(2deg)' },
    active: {
      opacity: 1,
      transform: 'scale(1) rotate(0deg)',
      transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
    },
  },
  flip: {
    enter: { opacity: 0, transform: 'perspective(800px) rotateY(25deg)' },
    exit: { opacity: 0, transform: 'perspective(800px) rotateY(-25deg)' },
    active: {
      opacity: 1,
      transform: 'perspective(800px) rotateY(0deg)',
      transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
    },
  },
};

// ==================== SKELETON LOADING ANIMATIONS ====================

export const skeletonSx: SxProps<Theme> = {
  ...keyframes.shimmer,
  background: 'linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.1) 37%, rgba(0,0,0,0.06) 63%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
  borderRadius: 1,
};

export const skeletonDarkSx: SxProps<Theme> = {
  ...keyframes.shimmer,
  background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 37%, rgba(255,255,255,0.06) 63%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
  borderRadius: 1,
};

export const skeletonTextSx = (width: string | number = '80%', height: number = 16): SxProps<Theme> => ({
  ...skeletonSx,
  width,
  height,
  display: 'block',
});

export const skeletonCircleSx = (size: number = 40): SxProps<Theme> => ({
  ...skeletonSx,
  width: size,
  height: size,
  borderRadius: '50%',
  flexShrink: 0,
});

export const skeletonRectSx = (width: string | number = '100%', height: number = 120): SxProps<Theme> => ({
  ...skeletonSx,
  width,
  height,
  borderRadius: 2,
});

// ==================== MICRO-INTERACTION ANIMATIONS ====================

/** Button press effect (scale down on active) */
export const buttonPressSx: SxProps<Theme> = {
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  '&:active': {
    transform: 'scale(0.96)',
  },
};

/** Hover lift effect with shadow */
export const hoverLiftSx: SxProps<Theme> = {
  transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
  },
};

/** Subtle hover scale */
export const hoverScaleSx: SxProps<Theme> = {
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.03)',
  },
};

/** Hover glow effect */
export const hoverGlowSx = (color: string = '#1565c0'): SxProps<Theme> => ({
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: `0 0 20px ${color}33, 0 0 40px ${color}1a`,
  },
});

/** Focus ring for accessibility */
export const focusRingSx = (color: string = '#1565c0'): SxProps<Theme> => ({
  '&:focus-visible': {
    outline: 'none',
    boxShadow: `0 0 0 3px ${color}40`,
  },
});

/** Card hover with border highlight */
export const cardHoverSx = (color: string = '#1565c0'): SxProps<Theme> => ({
  transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 24px rgba(0,0,0,0.1), 0 0 0 1px ${color}20`,
    borderColor: `${color}30`,
  },
});

/** Icon spin on hover */
export const iconHoverSpinSx: SxProps<Theme> = {
  ...keyframes.spin,
  transition: 'transform 0.3s ease',
  '&:hover': {
    animation: 'spin 0.6s ease',
  },
};

/** Tap/click feedback */
export const tapFeedbackSx: SxProps<Theme> = {
  transition: 'all 0.12s ease',
  cursor: 'pointer',
  userSelect: 'none',
  '&:active': {
    transform: 'scale(0.95)',
    opacity: 0.85,
  },
};

/** Expand on hover (for images, avatars) */
export const expandOnHoverSx = (scale: number = 1.08): SxProps<Theme> => ({
  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  '&:hover': {
    transform: `scale(${scale})`,
  },
});

/** Underline slide effect for links/text */
export const underlineSlideSx = (color: string = '#1565c0'): SxProps<Theme> => ({
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '0%',
    height: '2px',
    backgroundColor: color,
    transition: 'width 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  '&:hover::after': {
    width: '100%',
  },
});

/** Checkbox/toggle spring animation */
export const toggleSpringSx: SxProps<Theme> = {
  transition: 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

/** Notification badge bounce */
export const badgeBounceSx: SxProps<Theme> = {
  ...keyframes.bounceIn,
  '& .MuiBadge-badge': {
    animation: 'bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

// ==================== COMPOSITE ANIMATION BUILDERS ====================

/**
 * Combine multiple animation sx objects
 */
export const combineAnimations = (...animations: SxProps<Theme>[]): SxProps<Theme> => {
  return animations.reduce<any>((acc, anim) => ({ ...acc, ...(anim as any) }), {});
};

/**
 * Apply entrance animation to a container with a specific variant
 */
export const entranceAnimation = (
  variant: 'fadeIn' | 'slideUp' | 'slideDown' | 'scaleIn' | 'bounceIn' | 'elasticIn' | 'slideFadeUp' = 'slideFadeUp',
  duration: number = 0.5,
  delay: number = 0
): SxProps<Theme> => ({
  ...keyframes[variant],
  animation: `${variant} ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
});

/**
 * Create a pulsing glow effect for status indicators
 */
export const statusGlowSx = (color: string, size: number = 10): SxProps<Theme> => ({
  ...keyframes.ping,
  width: size,
  height: size,
  borderRadius: '50%',
  backgroundColor: color,
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    backgroundColor: color,
    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
  },
});

/**
 * Create animated gradient background
 */
export const animatedGradientSx = (
  colors: string[] = ['#1565c0', '#00897b', '#7b1fa2'],
  duration: number = 6
): SxProps<Theme> => ({
  ...keyframes.gradientShift,
  background: `linear-gradient(-45deg, ${colors.join(', ')})`,
  backgroundSize: '300% 300%',
  animation: `gradientShift ${duration}s ease infinite`,
});

/**
 * Create a progressive reveal animation for lists of items
 */
export const progressiveRevealSx = (
  itemSelector: string = '> *',
  delayMs: number = 80,
  maxItems: number = 15
): SxProps<Theme> => {
  const styles: Record<string, any> = {
    ...keyframes.slideFadeUp,
  };
  for (let i = 0; i < maxItems; i++) {
    styles[`& ${itemSelector}:nth-of-type(${i + 1})`] = {
      animation: `slideFadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${i * delayMs}ms both`,
    };
  }
  return styles as SxProps<Theme>;
};

/**
 * Striped progress bar animation
 */
export const stripedProgressSx: SxProps<Theme> = {
  ...keyframes.progressStripe,
  backgroundImage:
    'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
  backgroundSize: '1rem 1rem',
  animation: 'progressStripe 1s linear infinite',
};

/**
 * Glassmorphism entrance
 */
export const glassEntranceSx: SxProps<Theme> = {
  ...keyframes.fadeIn,
  animation: 'fadeIn 0.5s ease both',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(255,255,255,0.18)',
};

// ==================== ANIMATION HOOKS HELPERS ====================

/**
 * CSS variable-based delay helper for use with inline styles
 */
export const animationDelay = (index: number, baseDelayMs: number = 60): React.CSSProperties => ({
  animationDelay: `${index * baseDelayMs}ms`,
});

/**
 * Generate scroll-triggered animation styles
 * Use with IntersectionObserver: toggle 'visible' class
 */
export const scrollRevealSx = (
  variant: 'slideUp' | 'fadeIn' | 'scaleIn' | 'slideLeft' | 'slideRight' = 'slideUp'
): SxProps<Theme> => ({
  ...keyframes[variant],
  opacity: 0,
  transform:
    variant === 'slideUp'
      ? 'translateY(30px)'
      : variant === 'slideLeft'
        ? 'translateX(30px)'
        : variant === 'slideRight'
          ? 'translateX(-30px)'
          : variant === 'scaleIn'
            ? 'scale(0.85)'
            : 'none',
  transition: 'none',
  '&.visible': {
    animation: `${variant} 0.6s cubic-bezier(0.22, 1, 0.36, 1) both`,
  },
});

/**
 * Reduced-motion safe animation wrapper
 */
export const safeAnimation = (animationSx: SxProps<Theme>): SxProps<Theme> => ({
  '@media (prefers-reduced-motion: no-preference)': animationSx as any,
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none !important',
    transition: 'none !important',
  },
});
