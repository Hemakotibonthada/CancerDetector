// ============================================================================
// Mobile Shared UI Components - Buttons, Cards, Modals, Inputs, Badges, etc.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  ActivityIndicator,
  Switch,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// Colors
// ============================================================================

export const Colors = {
  primary: '#667eea',
  primaryDark: '#5a6fd6',
  secondary: '#764ba2',
  accent: '#f093fb',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  white: '#ffffff',
  black: '#000000',
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#eeeeee',
  gray300: '#e0e0e0',
  gray400: '#bdbdbd',
  gray500: '#9e9e9e',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  background: '#f8f9fe',
  surface: '#ffffff',
  textPrimary: '#1a1a2e',
  textSecondary: '#666666',
  textDisabled: '#9e9e9e',
  border: '#e8e8eb',
  divider: '#f0f0f5',
  gradient: ['#667eea', '#764ba2'] as [string, string],
  gradientWarm: ['#f093fb', '#f5576c'] as [string, string],
  gradientCool: ['#4facfe', '#00f2fe'] as [string, string],
  gradientGreen: ['#43e97b', '#38f9d7'] as [string, string],
};

// ============================================================================
// Gradient Button
// ============================================================================

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: string[];
  icon?: string;
  iconFamily?: 'ionicons' | 'material' | 'fontawesome';
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title, onPress, colors = Colors.gradient, icon, iconFamily = 'ionicons',
  disabled = false, loading = false, size = 'medium', fullWidth = false,
  style, textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
    medium: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 15 },
    large: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 17 },
  };

  const iconSize = size === 'small' ? 16 : size === 'large' ? 22 : 18;

  const renderIcon = () => {
    if (!icon) return null;
    const iconProps = { name: icon as any, size: iconSize, color: Colors.white, style: { marginRight: 8 } };
    if (iconFamily === 'material') return <MaterialCommunityIcons {...iconProps} />;
    if (iconFamily === 'fontawesome') return <FontAwesome5 {...iconProps} />;
    return <Ionicons {...iconProps} />;
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { width: '100%' }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={disabled ? [Colors.gray400, Colors.gray500] : colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            btnStyles.gradient,
            { paddingVertical: sizeStyles[size].paddingVertical, paddingHorizontal: sizeStyles[size].paddingHorizontal },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <View style={btnStyles.content}>
              {renderIcon()}
              <Text style={[btnStyles.text, { fontSize: sizeStyles[size].fontSize }, textStyle]}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const btnStyles = StyleSheet.create({
  gradient: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: { color: Colors.white, fontWeight: '700', letterSpacing: 0.3 },
});

// ============================================================================
// Card Component
// ============================================================================

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
  gradient?: boolean;
  gradientColors?: string[];
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children, style, onPress, elevated = false, gradient = false, gradientColors, padding = 16,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const content = gradient ? (
    <LinearGradient
      colors={(gradientColors || Colors.gradient) as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[cardStyles.base, elevated && cardStyles.elevated, { padding }, style]}
    >
      {children}
    </LinearGradient>
  ) : (
    <View style={[cardStyles.base, elevated && cardStyles.elevated, { padding }, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>
      </Animated.View>
    );
  }

  return <Animated.View style={{ opacity: fadeAnim }}>{content}</Animated.View>;
};

const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0,
  },
});

// ============================================================================
// Stat Card
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  iconFamily?: 'ionicons' | 'material' | 'fontawesome';
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label, value, unit, icon, iconFamily = 'ionicons', color = Colors.primary,
  trend, trendValue, onPress,
}) => {
  const renderIcon = () => {
    const iconProps = { name: icon as any, size: 22, color };
    if (iconFamily === 'material') return <MaterialCommunityIcons {...iconProps} />;
    if (iconFamily === 'fontawesome') return <FontAwesome5 {...iconProps} />;
    return <Ionicons {...iconProps} />;
  };

  return (
    <Card onPress={onPress} elevated style={{ flex: 1, margin: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={[statStyles.iconContainer, { backgroundColor: `${color}15` }]}>
          {renderIcon()}
        </View>
        {trend && (
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
              size={14}
              color={trend === 'up' ? Colors.success : trend === 'down' ? Colors.error : Colors.gray500}
            />
            {trendValue && <Text style={[statStyles.trendText, { color: trend === 'up' ? Colors.success : Colors.error }]}>{trendValue}</Text>}
          </View>
        )}
      </View>
      <Text style={statStyles.value}>
        {value}
        {unit && <Text style={statStyles.unit}> {unit}</Text>}
      </Text>
      <Text style={statStyles.label}>{label}</Text>
    </Card>
  );
};

const statStyles = StyleSheet.create({
  iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  unit: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  label: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  trendText: { fontSize: 11, fontWeight: '600', marginLeft: 2 },
});

// ============================================================================
// Badge Component
// ============================================================================

interface BadgeProps {
  text: string;
  color?: string;
  variant?: 'filled' | 'outlined' | 'soft';
  size?: 'small' | 'medium';
  icon?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text, color = Colors.primary, variant = 'soft', size = 'medium', icon, style,
}) => {
  const bgColor = variant === 'filled' ? color : variant === 'outlined' ? 'transparent' : `${color}15`;
  const textColor = variant === 'filled' ? Colors.white : color;
  const borderWidth = variant === 'outlined' ? 1 : 0;
  const fontSize = size === 'small' ? 10 : 12;
  const paddingV = size === 'small' ? 2 : 4;
  const paddingH = size === 'small' ? 6 : 10;

  return (
    <View style={[
      { backgroundColor: bgColor, borderColor: color, borderWidth, borderRadius: 20,
        paddingVertical: paddingV, paddingHorizontal: paddingH, flexDirection: 'row',
        alignItems: 'center', alignSelf: 'flex-start' },
      style,
    ]}>
      {icon && <Ionicons name={icon as any} size={fontSize} color={textColor} style={{ marginRight: 4 }} />}
      <Text style={{ color: textColor, fontSize, fontWeight: '600' }}>{text}</Text>
    </View>
  );
};

// ============================================================================
// Search Input
// ============================================================================

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  onClear?: () => void;
  style?: ViewStyle;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value, onChangeText, placeholder = 'Search...', onSubmit, onClear, style,
}) => {
  return (
    <View style={[searchStyles.container, style]}>
      <Ionicons name="search" size={20} color={Colors.gray500} style={{ marginRight: 10 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
        style={searchStyles.input}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => { onChangeText(''); onClear?.(); }}>
          <Ionicons name="close-circle" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const searchStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.gray100, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
});

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  icon: string;
  iconFamily?: 'ionicons' | 'material' | 'fontawesome';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon, iconFamily = 'ionicons', title, description, actionLabel, onAction,
}) => {
  const renderIcon = () => {
    const iconProps = { name: icon as any, size: 64, color: Colors.gray300 };
    if (iconFamily === 'material') return <MaterialCommunityIcons {...iconProps} />;
    if (iconFamily === 'fontawesome') return <FontAwesome5 {...iconProps} />;
    return <Ionicons {...iconProps} />;
  };

  return (
    <View style={emptyStyles.container}>
      {renderIcon()}
      <Text style={emptyStyles.title}>{title}</Text>
      {description && <Text style={emptyStyles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <GradientButton title={actionLabel} onPress={onAction} size="small" style={{ marginTop: 16 }} />
      )}
    </View>
  );
};

const emptyStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: 16, textAlign: 'center' },
  description: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20 },
});

// ============================================================================
// Avatar Component
// ============================================================================

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: number;
  color?: string;
  showStatus?: boolean;
  statusColor?: string;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  name, size = 40, color = Colors.primary, showStatus = false,
  statusColor = Colors.success, style,
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <View style={[{ width: size, height: size, position: 'relative' }, style]}>
      <LinearGradient
        colors={[color, `${color}CC`]}
        style={[
          { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <Text style={{ color: Colors.white, fontSize: size * 0.4, fontWeight: '700' }}>{initials}</Text>
      </LinearGradient>
      {showStatus && (
        <View style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15,
          backgroundColor: statusColor, borderWidth: 2, borderColor: Colors.white,
        }} />
      )}
    </View>
  );
};

// ============================================================================
// Divider
// ============================================================================

export const Divider: React.FC<{ style?: ViewStyle; label?: string }> = ({ style, label }) => {
  if (label) {
    return (
      <View style={[{ flexDirection: 'row', alignItems: 'center', marginVertical: 12 }, style]}>
        <View style={{ flex: 1, height: 1, backgroundColor: Colors.divider }} />
        <Text style={{ marginHorizontal: 12, fontSize: 12, color: Colors.gray500, fontWeight: '500' }}>{label}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: Colors.divider }} />
      </View>
    );
  }
  return <View style={[{ height: 1, backgroundColor: Colors.divider, marginVertical: 8 }, style]} />;
};

// ============================================================================
// Loading Overlay
// ============================================================================

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message = 'Loading...' }) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={loadingStyles.overlay}>
        <View style={loadingStyles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={loadingStyles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const loadingStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  container: {
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 32, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  message: { fontSize: 15, color: Colors.textSecondary, marginTop: 16, fontWeight: '500' },
});

// ============================================================================
// Section Header
// ============================================================================

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title, subtitle, actionLabel, onAction, style,
}) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 }, style]}>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>}
    </View>
    {actionLabel && onAction && (
      <TouchableOpacity onPress={onAction}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary }}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ============================================================================
// Toggle Row
// ============================================================================

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: string;
  iconFamily?: 'ionicons' | 'material' | 'fontawesome';
  disabled?: boolean;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({
  label, description, value, onValueChange, icon, iconFamily = 'ionicons', disabled = false,
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    const iconProps = { name: icon as any, size: 20, color: Colors.primary, style: { marginRight: 12 } as ViewStyle };
    if (iconFamily === 'material') return <MaterialCommunityIcons {...iconProps} />;
    if (iconFamily === 'fontawesome') return <FontAwesome5 {...iconProps} />;
    return <Ionicons {...iconProps} />;
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider }}>
      {renderIcon()}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: disabled ? Colors.textDisabled : Colors.textPrimary }}>{label}</Text>
        {description && <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: Colors.gray300, true: `${Colors.primary}50` }}
        thumbColor={value ? Colors.primary : Colors.gray400}
      />
    </View>
  );
};

// ============================================================================
// Progress Bar
// ============================================================================

interface ProgressBarProps {
  progress: number; // 0-1
  color?: string;
  backgroundColor?: string;
  height?: number;
  animated?: boolean;
  label?: string;
  showPercent?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress, color = Colors.primary, backgroundColor = Colors.gray200,
  height = 8, animated = true, label, showPercent = false, style,
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  useEffect(() => {
    if (animated) {
      Animated.spring(widthAnim, {
        toValue: clampedProgress,
        friction: 8,
        tension: 40,
        useNativeDriver: false,
      }).start();
    } else {
      widthAnim.setValue(clampedProgress);
    }
  }, [clampedProgress]);

  return (
    <View style={style}>
      {(label || showPercent) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          {label && <Text style={{ fontSize: 13, color: Colors.textSecondary, fontWeight: '500' }}>{label}</Text>}
          {showPercent && <Text style={{ fontSize: 13, color: Colors.textSecondary, fontWeight: '600' }}>{Math.round(clampedProgress * 100)}%</Text>}
        </View>
      )}
      <View style={{ height, backgroundColor, borderRadius: height / 2, overflow: 'hidden' }}>
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: color,
            borderRadius: height / 2,
            width: widthAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </View>
  );
};

// ============================================================================
// Info Row
// ============================================================================

interface InfoRowProps {
  label: string;
  value: string;
  icon?: string;
  iconFamily?: 'ionicons' | 'material' | 'fontawesome';
  onPress?: () => void;
  valueColor?: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  label, value, icon, iconFamily = 'ionicons', onPress, valueColor,
}) => {
  const renderIcon = () => {
    if (!icon) return null;
    const iconProps = { name: icon as any, size: 18, color: Colors.gray500, style: { marginRight: 10 } as ViewStyle };
    if (iconFamily === 'material') return <MaterialCommunityIcons {...iconProps} />;
    if (iconFamily === 'fontawesome') return <FontAwesome5 {...iconProps} />;
    return <Ionicons {...iconProps} />;
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider }}
    >
      {renderIcon()}
      <Text style={{ flex: 1, fontSize: 14, color: Colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: valueColor || Colors.textPrimary }}>{value}</Text>
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.gray400} style={{ marginLeft: 6 }} />}
    </Container>
  );
};

// ============================================================================
// Animated Counter
// ============================================================================

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  style?: TextStyle;
  decimals?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value, duration = 1000, prefix = '', suffix = '', style, decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();
    const startVal = displayValue;
    const diff = value - startVal;

    const animate = () => {
      const elapsed = Date.now() - startTime.current;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startVal + diff * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <Text style={style}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </Text>
  );
};

// ============================================================================
// Toast Notification
// ============================================================================

interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

let toastHandler: ((config: ToastConfig) => void) | null = null;

export const Toast = {
  show: (config: ToastConfig) => {
    if (toastHandler) toastHandler(config);
  },
  success: (message: string, duration?: number) => Toast.show({ message, type: 'success', duration }),
  error: (message: string, duration?: number) => Toast.show({ message, type: 'error', duration }),
  warning: (message: string, duration?: number) => Toast.show({ message, type: 'warning', duration }),
  info: (message: string, duration?: number) => Toast.show({ message, type: 'info', duration }),
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    toastHandler = (config) => {
      setToast(config);
      Animated.sequence([
        Animated.spring(slideAnim, { toValue: 0, friction: 6, useNativeDriver: true }),
        Animated.delay(config.duration || 3000),
        Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
      ]).start(() => setToast(null));
    };
    return () => { toastHandler = null; };
  }, []);

  const typeConfig = {
    success: { icon: 'checkmark-circle', color: Colors.success, bg: '#e8f5e9' },
    error: { icon: 'close-circle', color: Colors.error, bg: '#ffebee' },
    warning: { icon: 'warning', color: Colors.warning, bg: '#fff3e0' },
    info: { icon: 'information-circle', color: Colors.info, bg: '#e3f2fd' },
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      {toast && (
        <Animated.View
          style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? 50 : 30,
            left: 16, right: 16,
            transform: [{ translateY: slideAnim }],
            zIndex: 9999,
          }}
        >
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: typeConfig[toast.type].bg,
            padding: 14, borderRadius: 12,
            borderLeftWidth: 4, borderLeftColor: typeConfig[toast.type].color,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
          }}>
            <Ionicons name={typeConfig[toast.type].icon as any} size={22} color={typeConfig[toast.type].color} />
            <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, color: Colors.textPrimary, fontWeight: '500' }}>
              {toast.message}
            </Text>
            <TouchableOpacity onPress={() => {
              Animated.timing(slideAnim, { toValue: -100, duration: 200, useNativeDriver: true }).start(() => setToast(null));
            }}>
              <Ionicons name="close" size={18} color={Colors.gray500} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// ============================================================================
// Confirmation Dialog
// ============================================================================

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  confirmColor = Colors.primary, onConfirm, onCancel, loading = false,
}) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        backgroundColor: Colors.white, borderRadius: 20, padding: 24,
        width: SCREEN_WIDTH * 0.85, maxWidth: 400,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 }}>{title}</Text>
        <Text style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: 21, marginBottom: 24 }}>{message}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <TouchableOpacity onPress={onCancel} disabled={loading} style={{ paddingVertical: 10, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.gray600 }}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={loading}
            style={{
              paddingVertical: 10, paddingHorizontal: 20, marginLeft: 8,
              backgroundColor: confirmColor, borderRadius: 10,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.white }}>{confirmLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ============================================================================
// Skeleton Loader
// ============================================================================

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%', height = 16, borderRadius = 8, style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.gray200,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <Card>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} height={12} style={{ marginBottom: 8 }} />
    ))}
  </Card>
);

// ============================================================================
// FilterChips
// ============================================================================

interface FilterChipsProps {
  options: Array<{ label: string; value: string; icon?: string }>;
  selected: string[];
  onSelect: (value: string) => void;
  multiSelect?: boolean;
  style?: ViewStyle;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  options, selected, onSelect, multiSelect = false, style,
}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[{ marginVertical: 8 }, style]}>
    {options.map((option) => {
      const isSelected = selected.includes(option.value);
      return (
        <TouchableOpacity
          key={option.value}
          onPress={() => onSelect(option.value)}
          style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: isSelected ? Colors.primary : Colors.gray100,
            paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
            marginRight: 8, borderWidth: 1,
            borderColor: isSelected ? Colors.primary : Colors.border,
          }}
        >
          {option.icon && (
            <Ionicons
              name={option.icon as any}
              size={14}
              color={isSelected ? Colors.white : Colors.textSecondary}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: isSelected ? Colors.white : Colors.textPrimary,
          }}>
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

// ============================================================================
// Circular Progress
// ============================================================================

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  sublabel?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress, size = 120, strokeWidth = 10, color = Colors.primary,
  backgroundColor = Colors.gray200, label, sublabel,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: backgroundColor,
        position: 'absolute',
      }} />
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: strokeWidth, borderColor: color,
        borderTopColor: clampedProgress >= 25 ? color : 'transparent',
        borderRightColor: clampedProgress >= 50 ? color : 'transparent',
        borderBottomColor: clampedProgress >= 75 ? color : 'transparent',
        borderLeftColor: clampedProgress >= 100 ? color : 'transparent',
        position: 'absolute',
        transform: [{ rotate: '-90deg' }],
      }} />
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: size * 0.22, fontWeight: '800', color: Colors.textPrimary }}>
          {Math.round(clampedProgress)}%
        </Text>
        {label && <Text style={{ fontSize: size * 0.1, color: Colors.textSecondary, fontWeight: '500' }}>{label}</Text>}
        {sublabel && <Text style={{ fontSize: size * 0.08, color: Colors.gray500, marginTop: 1 }}>{sublabel}</Text>}
      </View>
    </View>
  );
};

// ============================================================================
// List Item
// ============================================================================

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
  leftIconFamily?: 'ionicons' | 'material' | 'fontawesome';
  leftIconColor?: string;
  rightText?: string;
  rightTextColor?: string;
  showChevron?: boolean;
  onPress?: () => void;
  badge?: string;
  badgeColor?: string;
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title, subtitle, leftIcon, leftIconFamily = 'ionicons', leftIconColor = Colors.primary,
  rightText, rightTextColor, showChevron = true, onPress, badge, badgeColor = Colors.error, style,
}) => {
  const renderLeftIcon = () => {
    if (!leftIcon) return null;
    const iconProps = { name: leftIcon as any, size: 22, color: leftIconColor };
    const IconComp = leftIconFamily === 'material' ? MaterialCommunityIcons :
      leftIconFamily === 'fontawesome' ? FontAwesome5 : Ionicons;
    return (
      <View style={{
        width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        backgroundColor: `${leftIconColor}15`, marginRight: 14,
      }}>
        <IconComp {...iconProps} />
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[{
        flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: Colors.divider,
      }, style]}
      activeOpacity={0.6}
    >
      {renderLeftIcon()}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: Colors.textPrimary }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {badge && (
        <View style={{
          backgroundColor: badgeColor, borderRadius: 10,
          paddingHorizontal: 8, paddingVertical: 2, marginRight: 8,
        }}>
          <Text style={{ color: Colors.white, fontSize: 11, fontWeight: '700' }}>{badge}</Text>
        </View>
      )}
      {rightText && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: rightTextColor || Colors.textSecondary, marginRight: showChevron ? 4 : 0 }}>
          {rightText}
        </Text>
      )}
      {showChevron && onPress && <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />}
    </TouchableOpacity>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default {
  Colors,
  GradientButton,
  Card,
  StatCard,
  Badge,
  SearchInput,
  EmptyState,
  Avatar,
  Divider,
  LoadingOverlay,
  SectionHeader,
  ToggleRow,
  ProgressBar,
  InfoRow,
  AnimatedCounter,
  Toast,
  ToastProvider,
  ConfirmDialog,
  Skeleton,
  SkeletonCard,
  FilterChips,
  CircularProgress,
  ListItem,
};
