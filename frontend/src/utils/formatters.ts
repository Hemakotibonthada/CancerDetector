// ============================================================================
// Formatters - Comprehensive Formatting Utilities for CancerGuard AI
// ============================================================================
// Date, number, currency, file size, medical data, and string formatters
// ============================================================================

// ============================================================================
// DATE & TIME FORMATTERS
// ============================================================================

/**
 * Format a date to locale string
 */
export const formatDate = (
  date: string | Date | null | undefined,
  format: 'short' | 'medium' | 'long' | 'full' | 'relative' = 'medium'
): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid Date';

  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    case 'medium':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'long':
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    case 'full':
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    case 'relative':
      return formatRelativeTime(d);
    default:
      return d.toLocaleDateString();
  }
};

/**
 * Format time to locale string
 */
export const formatTime = (
  date: string | Date | null | undefined,
  includeSeconds: boolean = false
): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid Time';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
  });
};

/**
 * Format datetime combined
 */
export const formatDateTime = (
  date: string | Date | null | undefined,
  dateFormat: 'short' | 'medium' | 'long' = 'medium'
): string => {
  if (!date) return 'N/A';
  return `${formatDate(date, dateFormat)} at ${formatTime(date)}`;
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const absDiff = Math.abs(diffMs);
  const isFuture = diffMs < 0;
  const prefix = isFuture ? 'in ' : '';
  const suffix = isFuture ? '' : ' ago';

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${prefix}${seconds}s${suffix}`;
  if (minutes < 60) return `${prefix}${minutes}m${suffix}`;
  if (hours < 24) return `${prefix}${hours}h${suffix}`;
  if (days < 7) return `${prefix}${days}d${suffix}`;
  if (weeks < 5) return `${prefix}${weeks}w${suffix}`;
  if (months < 12) return `${prefix}${months}mo${suffix}`;
  return `${prefix}${years}y${suffix}`;
};

/**
 * Format duration in milliseconds to human readable
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Format age from date of birth
 */
export const formatAge = (dob: string | Date | null | undefined): string => {
  if (!dob) return 'N/A';
  const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return `${age} years`;
};

/**
 * Get the next occurrence of a weekday
 */
export const getNextWeekday = (dayOfWeek: number): Date => {
  const now = new Date();
  const diff = (dayOfWeek - now.getDay() + 7) % 7;
  const next = new Date(now);
  next.setDate(now.getDate() + (diff === 0 ? 7 : diff));
  return next;
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Format date range
 */
export const formatDateRange = (start: Date, end: Date): string => {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const sameDay = sameMonth && start.getDate() === end.getDate();

  if (sameDay) return formatDate(start, 'long');
  if (sameMonth) return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  if (sameYear) return `${formatDate(start, 'medium')} - ${formatDate(end, 'medium')}`;
  return `${formatDate(start, 'medium')} - ${formatDate(end, 'medium')}`;
};

// ============================================================================
// NUMBER FORMATTERS
// ============================================================================

/**
 * Format number with locale separators
 */
export const formatNumber = (
  num: number | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', options).format(num);
};

/**
 * Format to compact notation (1K, 1M, 1B)
 */
export const formatCompact = (num: number): string => {
  if (Math.abs(num) >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (Math.abs(num) >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (Math.abs(num) >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
};

/**
 * Format percentage
 */
export const formatPercentage = (
  value: number | null | undefined,
  decimals: number = 1
): string => {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format currency
 */
export const formatCurrency = (
  amount: number | null | undefined,
  currency: string = 'USD',
  compact: boolean = false
): string => {
  if (amount === null || amount === undefined) return 'N/A';
  if (compact && Math.abs(amount) >= 1000) {
    return `$${formatCompact(amount)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format decimal places
 */
export const formatDecimal = (value: number, places: number = 2): string => {
  return value.toFixed(places);
};

/**
 * Format ordinal number (1st, 2nd, 3rd, etc.)
 */
export const formatOrdinal = (num: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

// ============================================================================
// FILE SIZE FORMATTERS
// ============================================================================

/**
 * Format byte size to human readable
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined) return 'N/A';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

/**
 * Format bits per second
 */
export const formatBandwidth = (bps: number): string => {
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`;
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(2)} Mbps`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(2)} Kbps`;
  return `${bps} bps`;
};

// ============================================================================
// STRING FORMATTERS
// ============================================================================

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number = 50, suffix: string = '...'): string => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Title case
 */
export const titleCase = (text: string): string => {
  if (!text) return '';
  return text.replace(/\w\S*/g, (word) => capitalize(word));
};

/**
 * Format snake_case or kebab-case to readable text
 */
export const formatLabel = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Slugify text
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Mask sensitive data
 */
export const maskData = (text: string, visibleChars: number = 4, maskChar: string = '*'): string => {
  if (!text || text.length <= visibleChars) return text || '';
  return maskChar.repeat(text.length - visibleChars) + text.slice(-visibleChars);
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return 'N/A';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  if (cleaned.length === 11) return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  return phone;
};

/**
 * Format email (mask partially)
 */
export const formatEmail = (email: string, mask: boolean = false): string => {
  if (!email) return 'N/A';
  if (!mask) return email;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.length > 2
    ? local[0] + '***' + local[local.length - 1]
    : '***';
  return `${masked}@${domain}`;
};

/**
 * Format health ID
 */
export const formatHealthId = (id: string): string => {
  if (!id) return 'N/A';
  return id.replace(/(.{4})/g, '$1-').replace(/-$/, '');
};

/**
 * Pluralize a word
 */
export const pluralize = (count: number, singular: string, plural?: string): string => {
  const p = plural || `${singular}s`;
  return `${count} ${count === 1 ? singular : p}`;
};

/**
 * Format initials from name
 */
export const getInitials = (name: string, maxChars: number = 2): string => {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, maxChars)
    .join('');
};

// ============================================================================
// MEDICAL DATA FORMATTERS
// ============================================================================

/**
 * Format blood pressure reading
 */
export const formatBloodPressure = (systolic: number, diastolic: number): string => {
  return `${systolic}/${diastolic} mmHg`;
};

/**
 * Format temperature
 */
export const formatTemperature = (value: number, unit: 'C' | 'F' = 'F'): string => {
  return `${value.toFixed(1)}°${unit}`;
};

/**
 * Format BMI with category
 */
export const formatBMI = (bmi: number): { value: string; category: string; color: string } => {
  const value = bmi.toFixed(1);
  if (bmi < 18.5) return { value, category: 'Underweight', color: '#ff9800' };
  if (bmi < 25) return { value, category: 'Normal', color: '#4caf50' };
  if (bmi < 30) return { value, category: 'Overweight', color: '#ff9800' };
  return { value, category: 'Obese', color: '#f44336' };
};

/**
 * Format blood glucose
 */
export const formatGlucose = (value: number, fasting: boolean = true): {
  value: string; status: string; color: string;
} => {
  const formatted = `${value} mg/dL`;
  if (fasting) {
    if (value < 70) return { value: formatted, status: 'Low', color: '#ff9800' };
    if (value <= 100) return { value: formatted, status: 'Normal', color: '#4caf50' };
    if (value <= 125) return { value: formatted, status: 'Pre-diabetic', color: '#ff9800' };
    return { value: formatted, status: 'Diabetic', color: '#f44336' };
  }
  if (value < 140) return { value: formatted, status: 'Normal', color: '#4caf50' };
  if (value < 200) return { value: formatted, status: 'Pre-diabetic', color: '#ff9800' };
  return { value: formatted, status: 'Diabetic', color: '#f44336' };
};

/**
 * Format heart rate
 */
export const formatHeartRate = (bpm: number): { value: string; status: string; color: string } => {
  const formatted = `${bpm} bpm`;
  if (bpm < 60) return { value: formatted, status: 'Bradycardia', color: '#2196f3' };
  if (bpm <= 100) return { value: formatted, status: 'Normal', color: '#4caf50' };
  if (bpm <= 120) return { value: formatted, status: 'Elevated', color: '#ff9800' };
  return { value: formatted, status: 'Tachycardia', color: '#f44336' };
};

/**
 * Format oxygen saturation
 */
export const formatSpO2 = (value: number): { value: string; status: string; color: string } => {
  const formatted = `${value}%`;
  if (value >= 95) return { value: formatted, status: 'Normal', color: '#4caf50' };
  if (value >= 90) return { value: formatted, status: 'Low', color: '#ff9800' };
  return { value: formatted, status: 'Critical', color: '#f44336' };
};

/**
 * Format cancer risk level
 */
export const formatRiskLevel = (risk: number): {
  value: string; level: string; color: string; description: string;
} => {
  const value = formatPercentage(risk);
  if (risk < 10) return { value, level: 'Very Low', color: '#4caf50', description: 'Minimal risk detected' };
  if (risk < 25) return { value, level: 'Low', color: '#8bc34a', description: 'Below average risk' };
  if (risk < 50) return { value, level: 'Moderate', color: '#ff9800', description: 'Average risk level' };
  if (risk < 75) return { value, level: 'High', color: '#ff5722', description: 'Above average risk' };
  return { value, level: 'Very High', color: '#f44336', description: 'Significantly elevated risk' };
};

/**
 * Format weight with unit
 */
export const formatWeight = (kg: number, unit: 'kg' | 'lbs' = 'kg'): string => {
  if (unit === 'lbs') return `${(kg * 2.20462).toFixed(1)} lbs`;
  return `${kg.toFixed(1)} kg`;
};

/**
 * Format height with unit
 */
export const formatHeight = (cm: number, unit: 'cm' | 'ft' = 'cm'): string => {
  if (unit === 'ft') {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  return `${cm} cm`;
};

/**
 * Format lab result with reference range
 */
export const formatLabResult = (
  value: number,
  unit: string,
  refLow: number,
  refHigh: number
): { value: string; status: 'low' | 'normal' | 'high'; color: string } => {
  const formatted = `${value.toFixed(2)} ${unit}`;
  if (value < refLow) return { value: formatted, status: 'low', color: '#2196f3' };
  if (value > refHigh) return { value: formatted, status: 'high', color: '#f44336' };
  return { value: formatted, status: 'normal', color: '#4caf50' };
};

/**
 * Format medication dosage
 */
export const formatDosage = (amount: number, unit: string, frequency: string): string => {
  return `${amount}${unit} ${frequency}`;
};

/**
 * Format blood type
 */
export const formatBloodType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'A+': 'A Positive (A+)', 'A-': 'A Negative (A-)',
    'B+': 'B Positive (B+)', 'B-': 'B Negative (B-)',
    'AB+': 'AB Positive (AB+)', 'AB-': 'AB Negative (AB-)',
    'O+': 'O Positive (O+)', 'O-': 'O Negative (O-)',
  };
  return typeMap[type] || type;
};

/**
 * Format appointment status
 */
export const formatAppointmentStatus = (status: string): {
  label: string; color: string; bgColor: string;
} => {
  const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
    scheduled: { label: 'Scheduled', color: '#1565c0', bgColor: '#e3f2fd' },
    confirmed: { label: 'Confirmed', color: '#2e7d32', bgColor: '#e8f5e9' },
    in_progress: { label: 'In Progress', color: '#f57c00', bgColor: '#fff3e0' },
    completed: { label: 'Completed', color: '#388e3c', bgColor: '#e8f5e9' },
    cancelled: { label: 'Cancelled', color: '#c62828', bgColor: '#ffebee' },
    no_show: { label: 'No Show', color: '#757575', bgColor: '#f5f5f5' },
    rescheduled: { label: 'Rescheduled', color: '#7b1fa2', bgColor: '#f3e5f5' },
    waiting: { label: 'Waiting', color: '#0288d1', bgColor: '#e1f5fe' },
  };
  return statusMap[status] || { label: formatLabel(status), color: '#757575', bgColor: '#f5f5f5' };
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  formatDate, formatTime, formatDateTime, formatRelativeTime, formatDuration,
  formatAge, getNextWeekday, isToday, formatDateRange,
  formatNumber, formatCompact, formatPercentage, formatCurrency, formatDecimal, formatOrdinal,
  formatFileSize, formatBandwidth,
  truncate, capitalize, titleCase, formatLabel, slugify, maskData,
  formatPhoneNumber, formatEmail, formatHealthId, pluralize, getInitials,
  formatBloodPressure, formatTemperature, formatBMI, formatGlucose,
  formatHeartRate, formatSpO2, formatRiskLevel, formatWeight, formatHeight,
  formatLabResult, formatDosage, formatBloodType, formatAppointmentStatus,
};
