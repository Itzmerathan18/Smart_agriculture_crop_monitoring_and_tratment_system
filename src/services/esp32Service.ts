import { SensorReading, SensorAlert } from '../types/sensors';

export interface ESP32Config {
  device_id: string;
  api_endpoint: string;
  wifi_ssid: string;
  wifi_password: string;
  api_key: string;
  reading_interval: number; // milliseconds
  retry_attempts: number;
  timeout: number; // milliseconds
}

export interface ESP32Status {
  device_id: string;
  is_connected: boolean;
  last_reading?: Date;
  battery_level: number;
  signal_strength: number;
  uptime: number;
  free_heap: number;
  error_count: number;
}

export class ESP32Service {
  private config: ESP32Config;
  private status: Map<string, ESP32Status> = new Map();
  private readingCallbacks: ((reading: SensorReading) => void)[] = [];

  constructor(config: ESP32Config) {
    this.config = config;
  }

  // Subscribe to new readings
  onReading(callback: (reading: SensorReading) => void) {
    this.readingCallbacks.push(callback);
  }

  // Unsubscribe from readings
  offReading(callback: (reading: SensorReading) => void) {
    this.readingCallbacks = this.readingCallbacks.filter(cb => cb !== callback);
  }

  // Notify subscribers of new reading
  private notifySubscribers(reading: SensorReading) {
    this.readingCallbacks.forEach(callback => callback(reading));
  }

  // Generate Arduino code for ESP32
  generateArduinoCode(): string {
    return `
// AgriSense ESP32 Sensor Data Collection
// Generated for device: ${this.config.device_id}

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <Adafruit_ADS1115.h>
#include <esp_wifi.h>

// Configuration
const char* WIFI_SSID = "${this.config.wifi_ssid}";
const char* WIFI_PASSWORD = "${this.config.wifi_password}";
const char* API_ENDPOINT = "${this.config.api_endpoint}";
const char* API_KEY = "${this.config.api_key}";
const unsigned long READING_INTERVAL = ${this.config.reading_interval};
const int MAX_RETRY_ATTEMPTS = ${this.config.retry_attempts};
const int REQUEST_TIMEOUT = ${this.config.timeout};

// Pin definitions
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define SOIL_MOISTURE_PIN 32
#define PH_SENSOR_PIN 33
#define BATTERY_PIN 35

// Sensor objects
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_ADS1115 ads;

// Global variables
unsigned long lastReadingTime = 0;
int errorCount = 0;
bool wifiConnected = false;

void setup() {
  Serial.begin(115200);
  Serial.println("AgriSense ESP32 starting...");

  // Initialize sensors
  dht.begin();
  ads.begin();

  // Set up pin modes
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(PH_SENSOR_PIN, INPUT);
  pinMode(BATTERY_PIN, INPUT);

  // Connect to WiFi
  connectToWiFi();

  // Get initial battery level
  float batteryLevel = readBatteryLevel();
  Serial.printf("Initial battery level: %.2f%%\\n", batteryLevel);

  Serial.println("Setup complete. Starting sensor readings...");
}

void loop() {
  unsigned long currentTime = millis();

  // Check if it's time for a new reading
  if (currentTime - lastReadingTime >= READING_INTERVAL) {
    lastReadingTime = currentTime;

    // Ensure WiFi is connected
    if (!wifiConnected) {
      connectToWiFi();
    }

    if (wifiConnected) {
      // Take sensor readings
      SensorData data = readSensors();

      // Send data to server
      if (sendSensorData(data)) {
        errorCount = 0;
        Serial.println("Data sent successfully");
      } else {
        errorCount++;
        Serial.printf("Failed to send data (attempt %d)\\n", errorCount);
      }
    } else {
      errorCount++;
      Serial.println("WiFi not connected, skipping reading");
    }

    // Print status
    printStatus();
  }

  // Handle WiFi reconnection
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    if (errorCount % 10 == 0) { // Try to reconnect every 10 failures
      connectToWiFi();
    }
  }

  delay(1000); // Small delay to prevent watchdog issues
}

struct SensorData {
  float soilMoisture;
  float phLevel;
  float microbialActivity;
  float humidity;
  float temperature;
  float batteryLevel;
  int signalStrength;
  String dataTransferQuality;
};

SensorData readSensors() {
  SensorData data;

  // Read soil moisture
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  data.soilMoisture = map(soilRaw, 0, 4095, 0, 100);

  // Read pH sensor (assuming analog pH sensor)
  int phRaw = analogRead(PH_SENSOR_PIN);
  data.phLevel = map(phRaw, 0, 4095, 0, 140) / 10.0; // Convert to pH scale

  // Simulate microbial activity (replace with actual sensor)
  data.microbialActivity = 1000 + random(0, 50000);

  // Read DHT sensor
  data.humidity = dht.readHumidity();
  data.temperature = dht.readTemperature();

  // Read battery level
  data.batteryLevel = readBatteryLevel();

  // Get WiFi signal strength
  data.signalStrength = WiFi.RSSI();

  // Determine data transfer quality based on signal strength
  if (data.signalStrength > -50) {
    data.dataTransferQuality = "excellent";
  } else if (data.signalStrength > -70) {
    data.dataTransferQuality = "good";
  } else {
    data.dataTransferQuality = "poor";
  }

  return data;
}

float readBatteryLevel() {
  int batteryRaw = analogRead(BATTERY_PIN);
  // Assuming voltage divider: 3.3V max, ADC range 0-4095
  float voltage = batteryRaw * (3.3 / 4095.0);
  // Convert to percentage (assuming 2.7V min, 4.2V max)
  float percentage = ((voltage - 2.7) / (4.2 - 2.7)) * 100;
  return constrain(percentage, 0, 100);
}

bool sendSensorData(SensorData data) {
  HTTPClient http;
  WiFiClient client;

  // Create JSON document
  DynamicJsonDocument doc(2048);

  doc["sensor_id"] = "${this.config.device_id}_sensor";
  doc["esp32_id"] = "${this.config.device_id}";
  doc["field_id"] = "field_001"; // This should be configurable
  doc["timestamp"] = getISO8601Timestamp();
  doc["signal_strength"] = data.signalStrength;
  doc["battery_level"] = data.batteryLevel;

  // Sensor data
  JsonObject sensors = doc.createNestedObject("sensors");
  sensors["soil_moisture"] = data.soilMoisture;
  sensors["ph_level"] = data.phLevel;
  sensors["microbial_activity"] = data.microbialActivity;
  sensors["humidity"] = data.humidity;
  sensors["data_transfer_quality"] = data.dataTransferQuality;

  // Location (this should be configurable or from GPS)
  JsonObject location = doc.createNestedObject("location");
  location["latitude"] = 40.7128; // Default location
  location["longitude"] = -74.0060;

  // Alerts array
  JsonArray alerts = doc.createNestedArray("alerts");

  // Check for critical conditions
  if (data.batteryLevel < 15) {
    JsonObject alert = alerts.createNestedObject();
    alert["type"] = "low_battery";
    alert["message"] = "Low battery level: " + String(data.batteryLevel) + "%";
    alert["severity"] = data.batteryLevel < 5 ? "critical" : "medium";
  }

  if (data.signalStrength < -80) {
    JsonObject alert = alerts.createNestedObject();
    alert["type"] = "sensor_offline";
    alert["message"] = "Poor signal strength: " + String(data.signalStrength) + " dBm";
    alert["severity"] = "high";
  }

  String jsonString;
  serializeJson(doc, jsonString);

  // Send HTTP POST request
  http.begin(client, API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  http.setTimeout(REQUEST_TIMEOUT);

  Serial.printf("Sending data to %s\\n", API_ENDPOINT);
  Serial.println("JSON payload: " + jsonString);

  int httpResponseCode = http.POST(jsonString);
  bool success = (httpResponseCode >= 200 && httpResponseCode < 300);

  Serial.printf("HTTP Response code: %d\\n", httpResponseCode);
  if (!success) {
    Serial.println("Response payload: " + http.getString());
  }

  http.end();
  return success;
}

void connectToWiFi() {
  Serial.printf("Connecting to WiFi: %s\\n", WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println();
    Serial.printf("WiFi connected! IP address: %s\\n", WiFi.localIP().toString().c_str());
    Serial.printf("Signal strength: %d dBm\\n", WiFi.RSSI());
  } else {
    wifiConnected = false;
    Serial.println();
    Serial.println("Failed to connect to WiFi");
  }
}

String getISO8601Timestamp() {
  time_t now;
  struct tm timeinfo;
  time(&now);

  // Set timezone if needed
  // setenv("TZ", "UTC", 1);
  // tzset();

  localtime_r(&now, &timeinfo);

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &timeinfo);

  return String(buffer);
}

void printStatus() {
  Serial.printf("\\n=== Device Status ===\\n");
  Serial.printf("Device ID: %s\\n", "${this.config.device_id}");
  Serial.printf("WiFi: %s\\n", wifiConnected ? "Connected" : "Disconnected");
  Serial.printf("IP Address: %s\\n", WiFi.localIP().toString().c_str());
  Serial.printf("Signal Strength: %d dBm\\n", WiFi.RSSI());
  Serial.printf("Battery Level: %.2f%%\\n", readBatteryLevel());
  Serial.printf("Free Heap: %d bytes\\n", ESP.getFreeHeap());
  Serial.printf("Uptime: %lu seconds\\n", millis() / 1000);
  Serial.printf("Error Count: %d\\n", errorCount);
  Serial.printf("=====================\\n\\n");
}
`;
  }

  // Generate ESP32 configuration JSON
  generateConfigFile(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // Simulate receiving data from ESP32 (for testing)
  simulateESP32Data(sensorCount: number = 3): SensorReading[] {
    const readings: SensorReading[] = [];

    for (let i = 0; i < sensorCount; i++) {
      const reading: SensorReading = {
        sensor_id: `${this.config.device_id}_sensor_${i}`,
        esp32_id: this.config.device_id,
        field_id: `field_${String(i + 1).padStart(3, '0')}`,
        timestamp: new Date(Date.now() - Math.random() * 60000).toISOString(),
        signal_strength: 50 + Math.random() * 50,
        battery_level: 20 + Math.random() * 80,
        sensors: {
          soil_moisture: 20 + Math.random() * 70,
          ph_level: 5 + Math.random() * 4,
          microbial_activity: 1000 + Math.random() * 50000,
          humidity: 30 + Math.random() * 60,
          data_transfer_quality: ['excellent', 'good', 'poor'][Math.floor(Math.random() * 3)] as any,
        },
        location: {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
        },
        alerts: [],
      };

      // Generate alerts based on values
      if (reading.battery_level < 15) {
        reading.alerts.push({
          type: 'low_battery',
          message: `Low battery: ${reading.battery_level.toFixed(1)}%`,
          severity: reading.battery_level < 5 ? 'critical' : 'medium',
          timestamp: reading.timestamp,
        });
      }

      if (reading.signal_strength < 20) {
        reading.alerts.push({
          type: 'sensor_offline',
          message: `Poor signal: ${reading.signal_strength.toFixed(1)}%`,
          severity: 'high',
          timestamp: reading.timestamp,
        });
      }

      readings.push(reading);
      this.notifySubscribers(reading);
    }

    return readings;
  }

  // Update ESP32 status
  updateStatus(deviceId: string, status: Partial<ESP32Status>) {
    const currentStatus = this.status.get(deviceId) || {
      device_id: deviceId,
      is_connected: false,
      battery_level: 0,
      signal_strength: 0,
      uptime: 0,
      free_heap: 0,
      error_count: 0,
    };

    const updatedStatus = { ...currentStatus, ...status };
    this.status.set(deviceId, updatedStatus);
  }

  // Get status of all ESP32 devices
  getAllStatus(): ESP32Status[] {
    return Array.from(this.status.values());
  }

  // Get status of specific ESP32 device
  getStatus(deviceId: string): ESP32Status | undefined {
    return this.status.get(deviceId);
  }

  // Check if ESP32 device is online
  isDeviceOnline(deviceId: string): boolean {
    const status = this.status.get(deviceId);
    if (!status) return false;

    // Consider device offline if no reading in last 10 minutes
    const lastReadingTime = status.last_reading?.getTime() || 0;
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    return status.is_connected && lastReadingTime > tenMinutesAgo;
  }

  // Send command to ESP32 (future enhancement)
  async sendCommand(deviceId: string, command: string, params?: any): Promise<boolean> {
    // This would be implemented with MQTT, WebSocket, or HTTP push
    // For now, return true as a placeholder
    console.log(`Sending command to ${deviceId}: ${command}`, params);
    return true;
  }

  // Update configuration
  updateConfig(newConfig: Partial<ESP32Config>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): ESP32Config {
    return { ...this.config };
  }

  // Validate ESP32 data format
  static validateDataFormat(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const requiredFields = [
      'sensor_id',
      'esp32_id',
      'field_id',
      'timestamp',
      'signal_strength',
      'battery_level',
      'sensors',
      'location'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    const requiredSensors = ['soil_moisture', 'ph_level', 'microbial_activity', 'humidity'];
    if (data.sensors) {
      for (const sensor of requiredSensors) {
        if (data.sensors[sensor] === undefined || data.sensors[sensor] === null) {
          errors.push(`Missing required sensor data: ${sensor}`);
        }
      }
    } else {
      errors.push('Missing sensors object');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}