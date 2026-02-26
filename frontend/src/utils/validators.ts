// ============================================================================
// Validators - Comprehensive Validation Utilities for CancerGuard AI
// ============================================================================

// ============================================================================
// BASIC VALIDATORS
// ============================================================================

export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const isEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

export const isPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const isUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isNumeric = (value: string): boolean => /^-?\d*\.?\d+$/.test(value);

export const isInteger = (value: string): boolean => /^-?\d+$/.test(value);

export const isAlpha = (value: string): boolean => /^[a-zA-Z\s]+$/.test(value);

export const isAlphaNumeric = (value: string): boolean => /^[a-zA-Z0-9\s]+$/.test(value);

export const isDate = (value: string): boolean => {
  const d = new Date(value);
  return !isNaN(d.getTime());
};

export const isUUID = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

export const isJSON = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

// ============================================================================
// STRING VALIDATORS
// ============================================================================

export const minLength = (value: string, min: number): boolean => value.length >= min;
export const maxLength = (value: string, max: number): boolean => value.length <= max;
export const exactLength = (value: string, length: number): boolean => value.length === length;

export const hasUpperCase = (value: string): boolean => /[A-Z]/.test(value);
export const hasLowerCase = (value: string): boolean => /[a-z]/.test(value);
export const hasNumber = (value: string): boolean => /[0-9]/.test(value);
export const hasSpecialChar = (value: string): boolean => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
export const hasNoSpaces = (value: string): boolean => !/\s/.test(value);

export const matchesPattern = (value: string, pattern: RegExp): boolean => pattern.test(value);

// ============================================================================
// NUMBER VALIDATORS
// ============================================================================

export const isInRange = (value: number, min: number, max: number): boolean => value >= min && value <= max;
export const isPositive = (value: number): boolean => value > 0;
export const isNonNegative = (value: number): boolean => value >= 0;
export const isWholeNumber = (value: number): boolean => Number.isInteger(value);

// ============================================================================
// PASSWORD VALIDATOR
// ============================================================================

export interface PasswordStrength {
  score: number; // 0-5
  level: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  color: string;
  feedback: string[];
  isValid: boolean;
}

export const validatePassword = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters required');

  if (password.length >= 12) score++;

  if (hasUpperCase(password)) score++;
  else feedback.push('Add an uppercase letter');

  if (hasLowerCase(password)) score++;

  if (hasNumber(password)) score++;
  else feedback.push('Add a number');

  if (hasSpecialChar(password)) score++;
  else feedback.push('Add a special character');

  // Penalize common patterns
  const commonPatterns = ['password', '123456', 'qwerty', 'abc123', 'admin', 'letmein'];
  if (commonPatterns.some(p => password.toLowerCase().includes(p))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common passwords');
  }

  // Penalize sequential characters
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid repeated characters');
  }

  const normalizedScore = Math.min(5, Math.max(0, score));
  const levels: PasswordStrength['level'][] = ['very-weak', 'weak', 'fair', 'fair', 'strong', 'very-strong'];
  const colors = ['#f44336', '#ff5722', '#ff9800', '#ffc107', '#8bc34a', '#4caf50'];

  return {
    score: normalizedScore,
    level: levels[normalizedScore],
    color: colors[normalizedScore],
    feedback: feedback.length > 0 ? feedback : ['Strong password!'],
    isValid: normalizedScore >= 3,
  };
};

// ============================================================================
// MEDICAL VALIDATORS
// ============================================================================

export const isValidBloodType = (type: string): boolean => {
  return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(type);
};

export const isValidBMI = (bmi: number): boolean => isInRange(bmi, 10, 60);

export const isValidHeartRate = (bpm: number): boolean => isInRange(bpm, 30, 250);

export const isValidBloodPressure = (systolic: number, diastolic: number): boolean => {
  return isInRange(systolic, 50, 300) && isInRange(diastolic, 30, 200) && systolic > diastolic;
};

export const isValidTemperature = (temp: number, unit: 'C' | 'F' = 'F'): boolean => {
  if (unit === 'C') return isInRange(temp, 33, 43);
  return isInRange(temp, 91, 110);
};

export const isValidOxygenSaturation = (spo2: number): boolean => isInRange(spo2, 50, 100);

export const isValidBloodGlucose = (glucose: number): boolean => isInRange(glucose, 20, 600);

export const isValidWeight = (kg: number): boolean => isInRange(kg, 0.5, 500);

export const isValidHeight = (cm: number): boolean => isInRange(cm, 30, 300);

export const isValidAge = (age: number): boolean => isInRange(age, 0, 150);

export const isValidMedicalRecordNumber = (mrn: string): boolean => {
  return /^[A-Z]{2,3}\d{6,10}$/.test(mrn);
};

export const isValidHealthId = (id: string): boolean => {
  const cleaned = id.replace(/-/g, '');
  return /^[A-Z0-9]{8,16}$/.test(cleaned);
};

// ============================================================================
// FILE VALIDATORS
// ============================================================================

export const isValidFileType = (filename: string, allowedTypes: string[]): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return allowedTypes.includes(ext);
};

export const isValidFileSize = (sizeBytes: number, maxSizeMB: number): boolean => {
  return sizeBytes <= maxSizeMB * 1024 * 1024;
};

export const isValidImageFile = (filename: string): boolean => {
  return isValidFileType(filename, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff']);
};

export const isValidDocumentFile = (filename: string): boolean => {
  return isValidFileType(filename, ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'csv']);
};

export const isValidMedicalImageFile = (filename: string): boolean => {
  return isValidFileType(filename, ['dcm', 'dicom', 'nii', 'nii.gz', 'jpg', 'jpeg', 'png', 'tiff', 'bmp']);
};

// ============================================================================
// DATE VALIDATORS
// ============================================================================

export const isFutureDate = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > Date.now();
};

export const isPastDate = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
};

export const isWithinDays = (date: Date | string, days: number): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.abs(d.getTime() - Date.now());
  return diff <= days * 86400000;
};

export const isValidDateOfBirth = (dob: Date | string): boolean => {
  const d = typeof dob === 'string' ? new Date(dob) : dob;
  const age = (Date.now() - d.getTime()) / (365.25 * 86400000);
  return isPastDate(d) && age <= 150;
};

export const isValidAppointmentTime = (dateTime: Date | string): boolean => {
  const d = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  const hour = d.getHours();
  return isFutureDate(d) && hour >= 7 && hour <= 21;
};

// ============================================================================
// FORM VALIDATION RULES FACTORY
// ============================================================================

export interface ValidationRule {
  validate: (value: any, formData?: any) => boolean;
  message: string;
}

export const rules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: isRequired,
    message,
  }),

  email: (message = 'Please enter a valid email'): ValidationRule => ({
    validate: (v: string) => !v || isEmail(v),
    message,
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    validate: (v: string) => !v || isPhone(v),
    message,
  }),

  minLen: (min: number, message?: string): ValidationRule => ({
    validate: (v: string) => !v || minLength(v, min),
    message: message || `Must be at least ${min} characters`,
  }),

  maxLen: (max: number, message?: string): ValidationRule => ({
    validate: (v: string) => !v || maxLength(v, max),
    message: message || `Must be at most ${max} characters`,
  }),

  min: (minVal: number, message?: string): ValidationRule => ({
    validate: (v: number) => v === undefined || v === null || v >= minVal,
    message: message || `Must be at least ${minVal}`,
  }),

  max: (maxVal: number, message?: string): ValidationRule => ({
    validate: (v: number) => v === undefined || v === null || v <= maxVal,
    message: message || `Must be at most ${maxVal}`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (v: string) => !v || regex.test(v),
    message,
  }),

  password: (message = 'Password does not meet requirements'): ValidationRule => ({
    validate: (v: string) => !v || validatePassword(v).isValid,
    message,
  }),

  match: (fieldName: string, message?: string): ValidationRule => ({
    validate: (v: any, formData: any) => !v || v === formData?.[fieldName],
    message: message || `Must match ${fieldName}`,
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    validate: (v: string) => !v || isUrl(v),
    message,
  }),

  date: (message = 'Please enter a valid date'): ValidationRule => ({
    validate: (v: string) => !v || isDate(v),
    message,
  }),

  futureDate: (message = 'Date must be in the future'): ValidationRule => ({
    validate: (v: string) => !v || isFutureDate(v),
    message,
  }),

  pastDate: (message = 'Date must be in the past'): ValidationRule => ({
    validate: (v: string) => !v || isPastDate(v),
    message,
  }),

  bloodType: (message = 'Invalid blood type'): ValidationRule => ({
    validate: (v: string) => !v || isValidBloodType(v),
    message,
  }),

  numeric: (message = 'Must be a number'): ValidationRule => ({
    validate: (v: string) => !v || isNumeric(v),
    message,
  }),

  custom: (fn: (value: any, formData?: any) => boolean, message: string): ValidationRule => ({
    validate: fn,
    message,
  }),
};

// ============================================================================
// BATCH VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateFields = (
  data: Record<string, any>,
  fieldRules: Record<string, ValidationRule[]>
): ValidationResult => {
  const errors: Record<string, string> = {};

  for (const [field, ruleList] of Object.entries(fieldRules)) {
    for (const rule of ruleList) {
      if (!rule.validate(data[field], data)) {
        errors[field] = rule.message;
        break;
      }
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

// ============================================================================
// SANITIZERS
// ============================================================================

export const sanitizeHtml = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const stripHtml = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export const normalizeWhitespace = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim();
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  isRequired, isEmail, isPhone, isUrl, isNumeric, isInteger, isAlpha, isAlphaNumeric,
  isDate, isUUID, isJSON,
  minLength, maxLength, exactLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, hasNoSpaces,
  matchesPattern, isInRange, isPositive, isNonNegative, isWholeNumber,
  validatePassword,
  isValidBloodType, isValidBMI, isValidHeartRate, isValidBloodPressure,
  isValidTemperature, isValidOxygenSaturation, isValidBloodGlucose,
  isValidWeight, isValidHeight, isValidAge, isValidMedicalRecordNumber, isValidHealthId,
  isValidFileType, isValidFileSize, isValidImageFile, isValidDocumentFile, isValidMedicalImageFile,
  isFutureDate, isPastDate, isWithinDays, isValidDateOfBirth, isValidAppointmentTime,
  rules, validateFields,
  sanitizeHtml, sanitizeInput, stripHtml, normalizeWhitespace,
};
