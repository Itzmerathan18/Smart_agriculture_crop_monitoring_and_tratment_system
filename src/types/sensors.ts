// IoT Sensor Data Types for Smart Areca Crop Monitoring & Treatment System

export interface SensorReading {
  sensor_id: string;
  esp32_id: string;
  field_id: string;
  timestamp: string; // ISO 8601
  signal_strength: number; // percentage (0-100)
  battery_level: number; // percentage (0-100)
  sensors: {
    // Environmental sensors
    temperature: number;        // Celsius (°C)
    humidity: number;           // Percentage (%)

    // Soil sensors
    moisture: number;           // Percentage (%)

    // NPK nutrient sensors
    nitrogen: number;           // mg/kg
    phosphorus: number;         // mg/kg
    potassium: number;          // mg/kg

    // System status
    data_transfer_quality: 'excellent' | 'good' | 'poor';
  };
  location: {
    latitude: number;
    longitude: number;
  };
  alerts: SensorAlert[];
  ai_recommendations?: AIRecommendation[];
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

// AI Treatment Recommendation Interfaces
export interface AIRecommendation {
  type: 'watering' | 'fertilizer' | 'environmental' | 'pesticide' | 'harvest';
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  quantity?: string;
  frequency?: string;
  reasoning: string;
  confidence: number; // 0-100
  costEstimate?: number;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  forecast: string;
  windSpeed: number;
}

export interface GrowthStage {
  stage: 'seedling' | 'juvenile' | 'mature' | 'harvest';
  ageMonths: number;
  expectedYield: number;
}

export interface ArecaAlertThresholds {
  temperature: {
    critical_min: number;     // < 20°C (too cold)
    critical_max: number;     // > 35°C (too hot)
    optimal_min: number;      // 22°C
    optimal_max: number;      // 32°C
  };
  humidity: {
    critical_min: number;     // < 40%
    critical_max: number;     // > 90%
    optimal_min: number;      // 60%
    optimal_max: number;      // 80%
  };
  moisture: {
    critical: number;         // < 25% (danger)
    warning: number;          // < 50% (needs water)
    optimal_min: number;      // 50%
    optimal_max: number;      // 70%
    high_max: number;         // > 75% (stop watering)
  };
  nitrogen: {
    critical: number;         // < 200 mg/kg
    warning: number;          // < 250 mg/kg
    optimal_min: number;      // 250 mg/kg
  };
  phosphorus: {
    critical: number;         // < 30 mg/kg
    warning: number;          // < 50 mg/kg
    optimal_min: number;      // 50 mg/kg
  };
  potassium: {
    critical: number;         // < 150 mg/kg
    warning: number;          // < 200 mg/kg
    optimal_min: number;      // 200 mg/kg
  };
}

export interface AlertThresholds {
  // Keep for backward compatibility
  soil_moisture: {
    critical: number;
    warning: number;
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
    critical_min: number;
    warning_min: number;
    optimal_min: number;
    optimal_max: number;
  };
  esp32_signal: {
    critical: number;
    warning: number;
    good_min: number;
  };
  battery_level: {
    critical: number;
    warning: number;
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