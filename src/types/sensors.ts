// IoT Sensor Data Types for AgriSense Smart Agriculture Dashboard

export interface SensorReading {
  sensor_id: string;
  esp32_id: string;
  field_id: string;
  timestamp: string; // ISO 8601
  signal_strength: number; // percentage (0-100)
  battery_level: number; // percentage (0-100)
  sensors: {
    soil_moisture: number; // percentage (0-100)
    ph_level: number; // number (0-14)
    microbial_activity: number; // CFU/ml or activity index
    humidity: number; // percentage (0-100)
    data_transfer_quality: 'excellent' | 'good' | 'poor';
  };
  location: {
    latitude: number;
    longitude: number;
  };
  alerts: SensorAlert[];
}

export interface SensorAlert {
  type: 'sensor_offline' | 'low_battery' | 'threshold_breach';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Field {
  id: string;
  name: string;
  crop_type: string;
  boundaries: {
    latitude: number;
    longitude: number;
  }[];
  sensors: string[]; // sensor IDs
  health_score: number; // 0-100
}

export interface SensorMetrics {
  current: SensorReading[];
  historical: SensorReading[];
  alerts: SensorAlert[];
}

export interface AlertThresholds {
  soil_moisture: {
    critical: number; // < critical
    warning: number; // < warning
    optimal_min: number;
    optimal_max: number;
  };
  ph_level: {
    critical_min: number;
    critical_max: number;
    optimal_min: number;
    optimal_max: number;
  };
  microbial_activity: {
    critical_min: number; // CFU/ml
    warning_min: number;
    optimal_min: number;
    optimal_max: number;
  };
  esp32_signal: {
    critical: number; // < critical
    warning: number; // < warning
    good_min: number;
  };
  battery_level: {
    critical: number; // < critical
    warning: number; // < warning
    good_min: number;
  };
}

export interface DashboardConfig {
  fields: Field[];
  thresholds: AlertThresholds;
  refresh_interval: number; // milliseconds
  notifications: {
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
  };
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  status?: 'optimal' | 'warning' | 'critical';
}

export interface HistoricalData {
  [sensor_id: string]: {
    [metric_name: string]: ChartDataPoint[];
  };
}

export interface ExportRequest {
  field_id?: string;
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  format: 'csv' | 'pdf' | 'json';
  metrics: string[]; // soil_moisture, ph_level, etc.
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}