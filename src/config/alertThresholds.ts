import { AlertThresholds } from '../types/sensors';

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  soil_moisture: {
    critical: 25,    // < 25% (critical)
    warning: 50,     // < 50% (warning)
    optimal_min: 50, // 50-75% (optimal)
    optimal_max: 75,
  },
  ph_level: {
    critical_min: 5.5,  // < 5.5 (critical)
    critical_max: 8.0,  // > 8.0 (critical)
    optimal_min: 6.0,   // 6.0-7.5 (optimal)
    optimal_max: 7.5,
  },
  microbial_activity: {
    critical_min: 1000,   // < 1000 CFU/ml (critical - low activity)
    warning_min: 10000,   // < 10000 (warning)
    optimal_min: 10000,   // 10000-100000 (optimal)
    optimal_max: 100000,
  },
  esp32_signal: {
    critical: 20,   // < 20% (critical - poor connection)
    warning: 50,    // < 50% (warning)
    good_min: 50,   // > 50% (good)
  },
  battery_level: {
    critical: 15,   // < 15% (critical)
    warning: 30,    // < 30% (warning)
    good_min: 30,   // > 30% (good)
  },
};

export const getSensorStatus = (
  value: number,
  thresholds: {
    critical?: number;
    critical_min?: number;
    critical_max?: number;
    warning?: number;
    warning_min?: number;
    optimal_min: number;
    optimal_max: number;
  }
): 'optimal' | 'warning' | 'critical' => {
  // Check critical thresholds
  if (thresholds.critical !== undefined && value < thresholds.critical) {
    return 'critical';
  }
  if (thresholds.critical_min !== undefined && value < thresholds.critical_min) {
    return 'critical';
  }
  if (thresholds.critical_max !== undefined && value > thresholds.critical_max) {
    return 'critical';
  }

  // Check warning thresholds
  if (thresholds.warning !== undefined && value < thresholds.warning) {
    return 'warning';
  }
  if (thresholds.warning_min !== undefined && value < thresholds.warning_min) {
    return 'warning';
  }

  // Check if within optimal range
  if (value >= thresholds.optimal_min && value <= thresholds.optimal_max) {
    return 'optimal';
  }

  // If not critical or warning but outside optimal, still warning
  return 'warning';
};

export const getStatusColor = (status: 'optimal' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'optimal':
      return '#10B981'; // Green
    case 'warning':
      return '#F59E0B'; // Yellow
    case 'critical':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

export const getStatusIcon = (status: 'optimal' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'optimal':
      return '✓';
    case 'warning':
      return '⚠';
    case 'critical':
      return '✗';
    default:
      return '•';
  }
};