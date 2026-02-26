// ============================================================================
// Form Components - Reusable form elements for CancerGuard AI
// ============================================================================
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  TextField, Button, IconButton, InputAdornment, Autocomplete, Chip,
  Select, MenuItem, FormControl, InputLabel, FormHelperText, Checkbox,
  FormControlLabel, Radio, RadioGroup, FormLabel, Switch, Slider,
  Rating, ToggleButton, ToggleButtonGroup, Box, Typography, Paper,
  CircularProgress, Tooltip, Collapse, Stepper, Step, StepLabel,
  StepContent, Alert, Badge, Divider, LinearProgress, Avatar,
  Card, CardContent, Stack, Grid, useTheme, alpha,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Search, Clear, CloudUpload,
  AttachFile, Delete, CheckCircle, Error as ErrorIcon,
  Warning, Info, Add, Remove, DateRange, AccessTime,
  FilterList, Tune, ArrowBack, ArrowForward, Save,
  Edit, Close, PhotoCamera, Mic, MicOff, ContentPaste,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// ENHANCED TEXT FIELD
// ============================================================================
interface EnhancedTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  clearable?: boolean;
  debounceMs?: number;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  sx?: any;
}

export const EnhancedTextField: React.FC<EnhancedTextFieldProps> = ({
  label, value, onChange, type = 'text', placeholder, error, helperText,
  required, disabled, multiline, rows = 4, maxLength, showCharCount,
  startIcon, endIcon, clearable = false, size = 'medium',
  fullWidth = true, variant = 'outlined', sx,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const getEndAdornment = () => {
    const adornments: React.ReactNode[] = [];
    if (type === 'password') {
      adornments.push(
        <IconButton key="pw" size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      );
    }
    if (clearable && value) {
      adornments.push(
        <IconButton key="clear" size="small" onClick={() => onChange('')} edge="end">
          <Clear fontSize="small" />
        </IconButton>
      );
    }
    if (endIcon) adornments.push(<React.Fragment key="end">{endIcon}</React.Fragment>);
    return adornments.length > 0 ? <InputAdornment position="end"><>{adornments}</></InputAdornment> : undefined;
  };

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <TextField
        label={label}
        value={value}
        onChange={(e) => {
          if (maxLength && e.target.value.length > maxLength) return;
          onChange(e.target.value);
        }}
        type={type === 'password' && showPassword ? 'text' : type}
        placeholder={placeholder}
        error={!!error}
        helperText={error || helperText}
        required={required}
        disabled={disabled}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        size={size}
        fullWidth={fullWidth}
        variant={variant}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        InputProps={{
          startAdornment: startIcon ? (
            <InputAdornment position="start">{startIcon}</InputAdornment>
          ) : undefined,
          endAdornment: getEndAdornment(),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            transition: 'all 0.3s ease',
            ...(focused && {
              boxShadow: (theme: any) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
            }),
          },
        }}
      />
      {showCharCount && maxLength && (
        <Typography
          variant="caption"
          color={value.length >= maxLength ? 'error' : 'text.secondary'}
          sx={{ position: 'absolute', right: 12, bottom: error ? 28 : 4, fontSize: '0.7rem' }}
        >
          {value.length}/{maxLength}
        </Typography>
      )}
    </Box>
  );
};

// ============================================================================
// SEARCH BAR
// ============================================================================
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  suggestions?: string[];
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
  autoFocus?: boolean;
  sx?: any;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value, onChange, onSearch, placeholder = 'Search...', loading = false,
  suggestions, size = 'medium', fullWidth = true, variant = 'outlined',
  autoFocus = false, sx,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  if (suggestions && suggestions.length > 0) {
    return (
      <Autocomplete
        freeSolo
        options={suggestions}
        inputValue={value}
        onInputChange={(_, newValue) => onChange(newValue)}
        fullWidth={fullWidth}
        sx={sx}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            size={size}
            variant={variant}
            autoFocus={autoFocus}
            onKeyDown={handleKeyDown}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  {loading ? <CircularProgress size={20} /> : <Search />}
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {value && (
                    <IconButton size="small" onClick={() => onChange('')}>
                      <Clear fontSize="small" />
                    </IconButton>
                  )}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        )}
      />
    );
  }

  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      size={size}
      fullWidth={fullWidth}
      variant={variant}
      autoFocus={autoFocus}
      onKeyDown={handleKeyDown}
      sx={{
        '& .MuiOutlinedInput-root': { borderRadius: 3 },
        ...sx,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            {loading ? <CircularProgress size={20} /> : <Search />}
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => onChange('')}>
              <Clear fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : undefined,
      }}
    />
  );
};

// ============================================================================
// FILTER PANEL
// ============================================================================
interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'toggle' | 'slider' | 'text';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

interface FilterPanelProps {
  filters: FilterOption[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset?: () => void;
  onApply?: () => void;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  title?: string;
  sx?: any;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters, values, onChange, onReset, onApply, collapsible = true,
  defaultExpanded = false, title = 'Filters', sx,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const theme = useTheme();
  const activeCount = Object.values(values).filter((v) => v !== '' && v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true)).length;

  const renderFilter = (filter: FilterOption) => {
    const value = values[filter.key];
    switch (filter.type) {
      case 'select':
        return (
          <FormControl fullWidth size="small" key={filter.key}>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={value || ''}
              onChange={(e) => onChange(filter.key, e.target.value)}
              label={filter.label}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All</MenuItem>
              {filter.options?.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'multiselect':
        return (
          <Autocomplete
            key={filter.key}
            multiple
            size="small"
            options={filter.options || []}
            getOptionLabel={(opt: any) => opt.label}
            value={value || []}
            onChange={(_, newValue) => onChange(filter.key, newValue)}
            renderInput={(params) => <TextField {...params} label={filter.label} />}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option: any, index) => (
                <Chip {...getTagProps({ index })} label={option.label} size="small" />
              ))
            }
          />
        );
      case 'toggle':
        return (
          <FormControlLabel
            key={filter.key}
            control={
              <Switch checked={!!value} onChange={(e) => onChange(filter.key, e.target.checked)} />
            }
            label={filter.label}
          />
        );
      case 'slider':
        return (
          <Box key={filter.key} sx={{ px: 1 }}>
            <Typography variant="caption" color="text.secondary">{filter.label}</Typography>
            <Slider
              value={value || [filter.min || 0, filter.max || 100]}
              onChange={(_, newValue) => onChange(filter.key, newValue)}
              min={filter.min || 0}
              max={filter.max || 100}
              valueLabelDisplay="auto"
              size="small"
            />
          </Box>
        );
      case 'text':
        return (
          <TextField
            key={filter.key}
            label={filter.label}
            value={value || ''}
            onChange={(e) => onChange(filter.key, e.target.value)}
            size="small"
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        overflow: 'hidden',
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          cursor: collapsible ? 'pointer' : 'default',
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        }}
        onClick={() => collapsible && setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList color="primary" />
          <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
          {activeCount > 0 && (
            <Badge badgeContent={activeCount} color="primary" sx={{ ml: 1 }} />
          )}
        </Box>
        <Box>
          {activeCount > 0 && onReset && (
            <Button size="small" onClick={(e) => { e.stopPropagation(); onReset(); }}>
              Clear All
            </Button>
          )}
        </Box>
      </Box>
      <Collapse in={!collapsible || expanded}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {filters.map((filter) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={filter.key}>
                {renderFilter(filter)}
              </Grid>
            ))}
          </Grid>
          {onApply && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="contained" onClick={onApply} startIcon={<Tune />} sx={{ borderRadius: 2 }}>
                Apply Filters
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

// ============================================================================
// FILE UPLOADER
// ============================================================================
interface FileUploaderProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  preview?: boolean;
  uploadProgress?: number;
  variant?: 'dropzone' | 'button' | 'compact';
  sx?: any;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload, accept, multiple = false, maxSize = 10, maxFiles = 5,
  label = 'Upload Files', helperText, error, disabled = false,
  preview = true, uploadProgress, variant = 'dropzone', sx,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const validateFiles = (fileList: File[]): File[] => {
    const validated: File[] = [];
    for (const file of fileList) {
      if (file.size > maxSize * 1024 * 1024) {
        setLocalError(`${file.name} exceeds ${maxSize}MB limit`);
        continue;
      }
      if (accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type.toLowerCase());
          if (type.endsWith('/*')) return file.type.startsWith(type.replace('/*', '/'));
          return file.type === type;
        });
        if (!isAccepted) {
          setLocalError(`${file.name} has an unsupported file type`);
          continue;
        }
      }
      validated.push(file);
    }
    return validated;
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setLocalError('');
    const fileArray = Array.from(fileList);
    const validated = validateFiles(fileArray);
    
    const newFiles = multiple
      ? [...files, ...validated].slice(0, maxFiles)
      : validated.slice(0, 1);
    
    setFiles(newFiles);
    onUpload(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onUpload(newFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (variant === 'button') {
    return (
      <Box sx={sx}>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        <Button
          variant="outlined"
          startIcon={<CloudUpload />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          sx={{ borderRadius: 2 }}
        >
          {label}
        </Button>
        {(error || localError) && (
          <FormHelperText error>{error || localError}</FormHelperText>
        )}
      </Box>
    );
  }

  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...sx }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        <IconButton onClick={() => fileInputRef.current?.click()} disabled={disabled} color="primary">
          <AttachFile />
        </IconButton>
        {files.length > 0 && (
          <Chip
            label={`${files.length} file(s)`}
            onDelete={() => { setFiles([]); onUpload([]); }}
            size="small"
          />
        )}
      </Box>
    );
  }

  return (
    <Box sx={sx}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        sx={{
          border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
          borderRadius: 3,
          p: 4,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          bgcolor: dragActive
            ? alpha(theme.palette.primary.main, 0.05)
            : alpha(theme.palette.background.default, 0.5),
          transition: 'all 0.3s ease',
          '&:hover': !disabled ? {
            borderColor: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
          } : {},
        }}
      >
        <CloudUpload sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1, opacity: 0.7 }} />
        <Typography variant="subtitle1" fontWeight={600}>{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          Drag & drop files here or click to browse
        </Typography>
        {helperText && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {helperText}
          </Typography>
        )}
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          Max size: {maxSize}MB {multiple ? `• Up to ${maxFiles} files` : ''}
        </Typography>
      </Box>

      {uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100 && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 2 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}

      {(error || localError) && (
        <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>{error || localError}</Alert>
      )}

      {preview && files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {files.map((file, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                mb: 1,
              }}
            >
              {file.type.startsWith('image/') ? (
                <Avatar
                  src={URL.createObjectURL(file)}
                  variant="rounded"
                  sx={{ width: 40, height: 40 }}
                />
              ) : (
                <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                  <AttachFile color="primary" />
                </Avatar>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap fontWeight={500}>{file.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(file.size)}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => removeFile(index)} color="error">
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

// ============================================================================
// TAG INPUT
// ============================================================================
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
  error?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  sx?: any;
}

export const TagInput: React.FC<TagInputProps> = ({
  value, onChange, label = 'Tags', placeholder = 'Add tag...', maxTags = 10,
  suggestions, error, disabled, size = 'medium', color = 'primary', sx,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed) || value.length >= maxTags) return;
    onChange([...value, trimmed]);
    setInputValue('');
  };

  const handleRemoveTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      handleRemoveTag(value.length - 1);
    }
  };

  if (suggestions) {
    return (
      <Autocomplete
        multiple
        freeSolo
        options={suggestions.filter((s) => !value.includes(s))}
        value={value}
        onChange={(_, newValue) => onChange(newValue.slice(0, maxTags))}
        inputValue={inputValue}
        onInputChange={(_, v) => setInputValue(v)}
        disabled={disabled}
        size={size}
        sx={sx}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              label={option}
              size="small"
              color={color}
              variant="outlined"
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={value.length < maxTags ? placeholder : ''}
            error={!!error}
            helperText={error || `${value.length}/${maxTags} tags`}
          />
        )}
      />
    );
  }

  return (
    <Box sx={sx}>
      <TextField
        label={label}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length < maxTags ? placeholder : 'Max tags reached'}
        disabled={disabled || value.length >= maxTags}
        error={!!error}
        helperText={error || `${value.length}/${maxTags} tags • Press Enter to add`}
        size={size}
        fullWidth
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        InputProps={{
          startAdornment: value.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mr: 1, maxWidth: '60%' }}>
              {value.map((tag, index) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  color={color}
                  variant="outlined"
                  onDelete={() => handleRemoveTag(index)}
                />
              ))}
            </Box>
          ) : undefined,
        }}
      />
    </Box>
  );
};

// ============================================================================
// MULTI-STEP FORM
// ============================================================================
interface StepConfig {
  label: string;
  description?: string;
  optional?: boolean;
  icon?: React.ReactNode;
  content: React.ReactNode;
  validate?: () => boolean | string;
}

interface MultiStepFormProps {
  steps: StepConfig[];
  onComplete: () => void;
  onCancel?: () => void;
  activeStep?: number;
  onStepChange?: (step: number) => void;
  orientation?: 'horizontal' | 'vertical';
  allowSkip?: boolean;
  submitLabel?: string;
  loading?: boolean;
  sx?: any;
}

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps, onComplete, onCancel, activeStep: controlledStep,
  onStepChange, orientation = 'horizontal', allowSkip = false,
  submitLabel = 'Submit', loading = false, sx,
}) => {
  const [internalStep, setInternalStep] = useState(0);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const activeStep = controlledStep ?? internalStep;
  const theme = useTheme();

  const handleNext = () => {
    const currentStepConfig = steps[activeStep];
    if (currentStepConfig.validate) {
      const result = currentStepConfig.validate();
      if (result !== true) {
        setErrors({ ...errors, [activeStep]: typeof result === 'string' ? result : 'Please fix errors before continuing' });
        return;
      }
    }
    setErrors({ ...errors, [activeStep]: '' });

    if (activeStep === steps.length - 1) {
      onComplete();
    } else {
      const nextStep = activeStep + 1;
      if (onStepChange) onStepChange(nextStep);
      else setInternalStep(nextStep);
    }
  };

  const handleBack = () => {
    const prevStep = activeStep - 1;
    if (onStepChange) onStepChange(prevStep);
    else setInternalStep(prevStep);
  };

  if (orientation === 'vertical') {
    return (
      <Box sx={sx}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label} completed={index < activeStep}>
              <StepLabel
                optional={step.optional ? <Typography variant="caption">Optional</Typography> : undefined}
                error={!!errors[index]}
              >
                {step.label}
              </StepLabel>
              <StepContent>
                {step.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>
                )}
                {step.content}
                {errors[index] && (
                  <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>{errors[index]}</Alert>
                )}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : undefined}
                    sx={{ borderRadius: 2 }}
                  >
                    {index === steps.length - 1 ? submitLabel : 'Continue'}
                  </Button>
                  <Button disabled={index === 0} onClick={handleBack} sx={{ borderRadius: 2 }}>
                    Back
                  </Button>
                  {allowSkip && step.optional && (
                    <Button onClick={handleNext} sx={{ borderRadius: 2 }}>Skip</Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>
    );
  }

  return (
    <Box sx={sx}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((step, index) => (
          <Step key={step.label} completed={index < activeStep}>
            <StepLabel
              optional={step.optional ? <Typography variant="caption">Optional</Typography> : undefined}
              error={!!errors[index]}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {steps[activeStep]?.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {steps[activeStep].description}
            </Typography>
          )}
          {steps[activeStep]?.content}
          {errors[activeStep] && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{errors[activeStep]}</Alert>
          )}
        </motion.div>
      </AnimatePresence>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Box>
          {onCancel && (
            <Button onClick={onCancel} color="inherit" sx={{ borderRadius: 2, mr: 1 }}>
              Cancel
            </Button>
          )}
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {allowSkip && steps[activeStep]?.optional && (
            <Button onClick={handleNext} sx={{ borderRadius: 2 }}>Skip</Button>
          )}
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            endIcon={activeStep < steps.length - 1 ? <ArrowForward /> : undefined}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ borderRadius: 2, minWidth: 120 }}
          >
            {activeStep === steps.length - 1 ? submitLabel : 'Next'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// ============================================================================
// DATE RANGE PICKER
// ============================================================================
interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
  minDate?: string;
  maxDate?: string;
  error?: string;
  size?: 'small' | 'medium';
  sx?: any;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate, endDate, onStartDateChange, onEndDateChange,
  label = 'Date Range', minDate, maxDate, error, size = 'medium', sx,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...sx }}>
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5, whiteSpace: 'nowrap' }}>
          {label}:
        </Typography>
      )}
      <TextField
        type="date"
        label="From"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        size={size}
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: minDate, max: endDate || maxDate }}
        error={!!error}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />
      <Typography color="text.secondary">—</Typography>
      <TextField
        type="date"
        label="To"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        size={size}
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: startDate || minDate, max: maxDate }}
        error={!!error}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
};

// ============================================================================
// PHONE INPUT
// ============================================================================
interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium';
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  sx?: any;
}

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
];

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value, onChange, label = 'Phone Number', error, required,
  disabled, size = 'medium', countryCode = '+1', onCountryCodeChange, sx,
}) => {
  const formatPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  return (
    <TextField
      label={label}
      value={formatPhone(value)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
        onChange(digits);
      }}
      error={!!error}
      helperText={error}
      required={required}
      disabled={disabled}
      size={size}
      fullWidth
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, ...sx }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Select
              value={countryCode}
              onChange={(e) => onCountryCodeChange?.(e.target.value)}
              variant="standard"
              disableUnderline
              sx={{ minWidth: 70, mr: 0.5 }}
              disabled={disabled}
            >
              {COUNTRY_CODES.map((cc) => (
                <MenuItem key={cc.code} value={cc.code}>
                  {cc.flag} {cc.code}
                </MenuItem>
              ))}
            </Select>
          </InputAdornment>
        ),
      }}
    />
  );
};

// ============================================================================
// OTP INPUT
// ============================================================================
interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (code: string) => void;
  sx?: any;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6, value, onChange, error, disabled, autoFocus = true, onComplete, sx,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const theme = useTheme();

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    const newValue = value.split('');
    newValue[index] = digit;
    const joined = newValue.join('').slice(0, length);
    onChange(joined);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (joined.length === length && onComplete) {
      onComplete(joined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    if (pasted.length === length && onComplete) {
      onComplete(pasted);
    }
  };

  return (
    <Box sx={sx}>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        {Array.from({ length }).map((_, index) => (
          <TextField
            key={index}
            inputRef={(el) => { inputRefs.current[index] = el; }}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value.slice(-1))}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            inputProps={{
              maxLength: 1,
              style: {
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                width: '2.5rem',
                height: '2.5rem',
                padding: '8px',
              },
            }}
            error={!!error}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                ...(value[index] && {
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                }),
              },
            }}
          />
        ))}
      </Box>
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, textAlign: 'center', display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

// ============================================================================
// RICH SELECT (with icons and descriptions)
// ============================================================================
interface RichSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  color?: string;
}

interface RichSelectProps {
  options: RichSelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium';
  sx?: any;
}

export const RichSelect: React.FC<RichSelectProps> = ({
  options, value, onChange, label, error, required, disabled, size = 'medium', sx,
}) => {
  return (
    <FormControl fullWidth error={!!error} required={required} disabled={disabled} size={size} sx={sx}>
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        label={label}
        sx={{ borderRadius: 2 }}
        renderValue={(selected) => {
          const option = options.find((o) => o.value === selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {option?.icon}
              <Typography>{option?.label}</Typography>
            </Box>
          );
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {option.icon && (
                <Box sx={{ color: option.color || 'inherit' }}>{option.icon}</Box>
              )}
              <Box>
                <Typography variant="body2" fontWeight={500}>{option.label}</Typography>
                {option.description && (
                  <Typography variant="caption" color="text.secondary">
                    {option.description}
                  </Typography>
                )}
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

// ============================================================================
// FORM SECTION
// ============================================================================
interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  required?: boolean;
  badge?: string | number;
  sx?: any;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title, description, icon, children, collapsible = false,
  defaultExpanded = true, required, badge, sx,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        overflow: 'hidden',
        mb: 2,
        ...sx,
      }}
    >
      <Box
        onClick={() => collapsible && setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 2,
          cursor: collapsible ? 'pointer' : 'default',
          bgcolor: alpha(theme.palette.primary.main, 0.03),
          borderBottom: expanded ? `1px solid ${theme.palette.divider}` : 'none',
        }}
      >
        {icon && <Box sx={{ color: theme.palette.primary.main }}>{icon}</Box>}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
            {required && <Typography color="error" variant="body2">*</Typography>}
            {badge !== undefined && (
              <Chip label={badge} size="small" color="primary" variant="outlined" />
            )}
          </Box>
          {description && (
            <Typography variant="body2" color="text.secondary">{description}</Typography>
          )}
        </Box>
      </Box>
      <Collapse in={!collapsible || expanded}>
        <Box sx={{ p: 3 }}>{children}</Box>
      </Collapse>
    </Paper>
  );
};

// ============================================================================
// CONFIRMATION DIALOG CONTENT
// ============================================================================
interface ConfirmActionProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'info' | 'warning' | 'error' | 'success';
  loading?: boolean;
  requireConfirmation?: boolean;
  confirmationText?: string;
  sx?: any;
}

export const ConfirmAction: React.FC<ConfirmActionProps> = ({
  title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, severity = 'warning', loading = false,
  requireConfirmation = false, confirmationText = 'DELETE', sx,
}) => {
  const [inputValue, setInputValue] = useState('');
  const confirmed = !requireConfirmation || inputValue === confirmationText;

  const severityColors = {
    info: 'primary',
    warning: 'warning',
    error: 'error',
    success: 'success',
  } as const;

  const severityIcons = {
    info: <Info fontSize="large" />,
    warning: <Warning fontSize="large" />,
    error: <ErrorIcon fontSize="large" />,
    success: <CheckCircle fontSize="large" />,
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2, ...sx }}>
      <Box sx={{ mb: 2, color: `${severityColors[severity]}.main` }}>
        {severityIcons[severity]}
      </Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {message}
      </Typography>
      {requireConfirmation && (
        <TextField
          label={`Type "${confirmationText}" to confirm`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          fullWidth
          size="small"
          error={inputValue.length > 0 && inputValue !== confirmationText}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      )}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button onClick={onCancel} variant="outlined" sx={{ borderRadius: 2, minWidth: 100 }}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={severityColors[severity]}
          disabled={!confirmed || loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ borderRadius: 2, minWidth: 100 }}
        >
          {confirmLabel}
        </Button>
      </Box>
    </Box>
  );
};

// ============================================================================
// EXPORT ALL
// ============================================================================
export default {
  EnhancedTextField,
  SearchBar,
  FilterPanel,
  FileUploader,
  TagInput,
  MultiStepForm,
  DateRangePicker,
  PhoneInput,
  OTPInput,
  RichSelect,
  FormSection,
  ConfirmAction,
};
