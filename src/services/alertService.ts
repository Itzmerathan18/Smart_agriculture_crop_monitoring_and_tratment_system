import { SensorReading, SensorAlert, AlertThresholds } from '../types/sensors';
import { DEFAULT_ALERT_THRESHOLDS, getSensorStatus } from '../config/alertThresholds';

export class AlertService {
  private thresholds: AlertThresholds;
  private alertHistory: SensorAlert[] = [];
  private alertCallbacks: ((alerts: SensorAlert[]) => void)[] = [];

  constructor(thresholds: AlertThresholds = DEFAULT_ALERT_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  // Subscribe to alert updates
  onAlertUpdate(callback: (alerts: SensorAlert[]) => void) {
    this.alertCallbacks.push(callback);
  }

  // Unsubscribe from alert updates
  offAlertUpdate(callback: (alerts: SensorAlert[]) => void) {
    this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.alertCallbacks.forEach(callback => callback(this.getActiveAlerts()));
  }

  // Get active alerts (non-dismissed)
  getActiveAlerts(): SensorAlert[] {
    return this.alertHistory.filter(alert => !alert.dismissed);
  }

  // Get all alerts including dismissed
  getAllAlerts(): SensorAlert[] {
    return [...this.alertHistory];
  }

  // Process sensor reading and generate alerts
  processSensorReading(reading: SensorReading): SensorAlert[] {
    const newAlerts: SensorAlert[] = [];

    // Check sensor connectivity
    if (reading.signal_strength < 20) {
      newAlerts.push({
        type: 'sensor_offline',
        message: `Sensor ${reading.sensor_id} has poor signal strength (${reading.signal_strength}%)`,
        severity: reading.signal_strength < 10 ? 'critical' : 'high',
        timestamp: reading.timestamp,
        sensor_id: reading.sensor_id,
      });
    }

    // Check battery level
    if (reading.battery_level < 15) {
      newAlerts.push({
        type: 'low_battery',
        message: `Sensor ${reading.sensor_id} has low battery (${reading.battery_level}%)`,
        severity: reading.battery_level < 5 ? 'critical' : 'medium',
        timestamp: reading.timestamp,
        sensor_id: reading.sensor_id,
      });
    }

    // Check threshold breaches
    const soilMoistureStatus = getSensorStatus(reading.sensors.soil_moisture, this.thresholds.soil_moisture);
    if (soilMoistureStatus === 'critical') {
      newAlerts.push({
        type: 'threshold_breach',
        message: `Critical soil moisture level: ${reading.sensors.soil_moisture}% (optimal: 50-75%)`,
        severity: 'critical',
        timestamp: reading.timestamp,
        sensor_id: reading.sensor_id,
      });
    } else if (soilMoistureStatus === 'warning') {
      newAlerts.push({
        type: 'threshold_breach',
        message: `Low soil moisture level: ${reading.sensors.soil_moisture}%`,
        severity: 'medium',
        timestamp: reading.timestamp,
        sensor_id: reading.sensor_id,
      });
    }

    const phStatus = getSensorStatus(reading.sensors.ph_level, this.thresholds.ph_level);
    if (phStatus === 'critical') {
      newAlerts.push({
        type: 'threshold_breach',
        message: `Critical pH level: ${reading.sensors.ph_level} (optimal: 6.0-7.5)`,
        severity: 'high',
        timestamp: reading.timestamp,
        sensor_id: reading.sensor_id,
      });
    }

    const microbialStatus = getSensorStatus(reading.sensors.microbial_activity, this.thresholds.microbial_activity);
    if (microbialStatus === 'critical') {
      newAlerts.push({
        type: 'threshold_breach',
        message: `Low microbial activity: ${reading.sensors.microbial_activity} CFU/ml`,
        severity: 'medium',
        timestamp: reading.timestamp,
        sensor_id: reading.sensor_id,
      });
    }

    // Check data transfer quality
    if (reading.sensors.data_transfer_quality === 'poor') {
      newAlerts.push({
        type: 'sensor_offline',
        message: `Poor data transfer quality from sensor ${reading.sensor_id}`,
        severity: 'medium',
        timestamp: reading.timestamp,
        sensor_id: reading.sensor_id,
      });
    }

    // Add new alerts to history
    if (newAlerts.length > 0) {
      // Check for duplicates (same type and sensor in last 30 minutes)
      const filteredAlerts = newAlerts.filter(newAlert => {
        const duplicate = this.alertHistory.some(existingAlert =>
          existingAlert.type === newAlert.type &&
          existingAlert.sensor_id === newAlert.sensor_id &&
          !existingAlert.dismissed &&
          new Date(newAlert.timestamp).getTime() - new Date(existingAlert.timestamp).getTime() < 30 * 60 * 1000
        );
        return !duplicate;
      });

      this.alertHistory.push(...filteredAlerts);
      this.notifySubscribers();
      return filteredAlerts;
    }

    return [];
  }

  // Dismiss an alert
  dismissAlert(alertIndex: number) {
    if (alertIndex >= 0 && alertIndex < this.alertHistory.length) {
      this.alertHistory[alertIndex].dismissed = true;
      this.notifySubscribers();
    }
  }

  // Dismiss all alerts
  dismissAllAlerts() {
    this.alertHistory.forEach(alert => {
      alert.dismissed = true;
    });
    this.notifySubscribers();
  }

  // Clear alert history
  clearAlertHistory() {
    this.alertHistory = [];
    this.notifySubscribers();
  }

  // Get alerts by severity
  getAlertsBySeverity(severity: SensorAlert['severity']): SensorAlert[] {
    return this.alertHistory.filter(alert => alert.severity === severity && !alert.dismissed);
  }

  // Get alerts by type
  getAlertsByType(type: SensorAlert['type']): SensorAlert[] {
    return this.alertHistory.filter(alert => alert.type === type && !alert.dismissed);
  }

  // Get alerts for specific sensor
  getAlertsForSensor(sensorId: string): SensorAlert[] {
    return this.alertHistory.filter(alert => alert.sensor_id === sensorId && !alert.dismissed);
  }

  // Update thresholds
  updateThresholds(newThresholds: Partial<AlertThresholds>) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  // Get current thresholds
  getThresholds(): AlertThresholds {
    return { ...this.thresholds };
  }

  // Generate alert summary for notifications
  generateAlertSummary(): string {
    const activeAlerts = this.getActiveAlerts();
    const critical = activeAlerts.filter(a => a.severity === 'critical').length;
    const high = activeAlerts.filter(a => a.severity === 'high').length;
    const medium = activeAlerts.filter(a => a.severity === 'medium').length;
    const low = activeAlerts.filter(a => a.severity === 'low').length;

    if (activeAlerts.length === 0) {
      return 'All systems operating normally.';
    }

    let summary = `${activeAlerts.length} active alert${activeAlerts.length !== 1 ? 's' : ''}: `;

    if (critical > 0) summary += `${critical} critical, `;
    if (high > 0) summary += `${high} high, `;
    if (medium > 0) summary += `${medium} medium, `;
    if (low > 0) summary += `${low} low, `;

    return summary.replace(/, $/, '');
  }

  // Check for rapid changes (predictive alerts)
  checkForRapidChanges(readings: SensorReading[]): SensorAlert[] {
    if (readings.length < 2) return [];

    const alerts: SensorAlert[] = [];
    const latest = readings[readings.length - 1];
    const previous = readings[readings.length - 2];

    // Check for rapid temperature/moisture changes
    const moistureChange = latest.sensors.soil_moisture - previous.sensors.soil_moisture;
    if (Math.abs(moistureChange) > 15) {
      alerts.push({
        type: 'threshold_breach',
        message: `Rapid soil moisture change detected: ${moistureChange > 0 ? '+' : ''}${moistureChange.toFixed(1)}%`,
        severity: 'high',
        timestamp: latest.timestamp,
        sensor_id: latest.sensor_id,
      });
    }

    return alerts;
  }

  // Simulate sending notifications (would integrate with email/SMS services)
  async sendNotification(alert: SensorAlert, destination: 'email' | 'sms' | 'push'): Promise<boolean> {
    // In a real implementation, this would integrate with:
    // - Email service (SendGrid, AWS SES)
    // - SMS service (Twilio, AWS SNS)
    // - Push notification service (Firebase, OneSignal)

    console.log(`Sending ${destination} notification:`, alert);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate success/failure
    return Math.random() > 0.1; // 90% success rate
  }

  // Batch send notifications for multiple alerts
  async sendBatchNotifications(alerts: SensorAlert[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const alert of alerts) {
      // Determine notification method based on severity
      const destinations = alert.severity === 'critical'
        ? ['email', 'sms', 'push'] as const
        : ['email', 'push'] as const;

      for (const destination of destinations) {
        try {
          const result = await this.sendNotification(alert, destination);
          if (result) {
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Failed to send ${destination} notification:`, error);
          failed++;
        }
      }
    }

    return { success, failed };
  }
}