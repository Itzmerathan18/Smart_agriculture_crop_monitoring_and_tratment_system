// Advanced AI Treatment Engine for Smart Areca Crop Monitoring & Treatment System
import axios from 'axios';
import { SensorReading, AIRecommendation, WeatherData, GrowthStage, ArecaAlertThresholds } from '../types/sensors';

interface TreatmentRecord {
  id: string;
  type: 'watering' | 'fertilizer' | 'environmental' | 'pesticide' | 'harvest';
  appliedAt: Date;
  effectiveness: number; // 0-100
  cost: number;
}

export class ArecaAIEngine {
  private weatherAPI: string = 'https://api.openweathermap.org/data/2.5';
  private historicalData: SensorReading[] = [];
  private treatmentHistory: TreatmentRecord[] = [];
  private readonly arecaThresholds: ArecaAlertThresholds = {
    temperature: {
      critical_min: 20,
      critical_max: 35,
      optimal_min: 22,
      optimal_max: 32
    },
    humidity: {
      critical_min: 40,
      critical_max: 90,
      optimal_min: 60,
      optimal_max: 80
    },
    moisture: {
      critical: 25,
      warning: 50,
      optimal_min: 50,
      optimal_max: 70,
      high_max: 75
    },
    nitrogen: {
      critical: 200,
      warning: 250,
      optimal_min: 250
    },
    phosphorus: {
      critical: 30,
      warning: 50,
      optimal_min: 50
    },
    potassium: {
      critical: 150,
      warning: 200,
      optimal_min: 200
    }
  };

  constructor() {
    this.loadHistoricalData();
    this.loadTreatmentHistory();
  }

  async processSensorData(reading: SensorReading): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    try {
      // 1. Get current weather data
      const weather = await this.getWeatherData(reading.location);

      // 2. Determine growth stage
      const growthStage = this.predictGrowthStage(reading);

      // 3. Analyze current conditions vs Areca requirements
      const moistureAnalysis = this.analyzeMoisture(reading.sensors.moisture, weather);
      const npkAnalysis = this.analyzeNPK(reading.sensors, growthStage);
      const tempAnalysis = this.analyzeTemperature(reading.sensors.temperature, weather);
      const humidityAnalysis = this.analyzeHumidity(reading.sensors.humidity, weather);

      // 4. Generate specific recommendations
      if (moistureAnalysis.needsWater) {
        recommendations.push({
          type: 'watering',
          priority: moistureAnalysis.severity,
          action: moistureAnalysis.action || 'Add water',
          quantity: moistureAnalysis.quantity,
          frequency: moistureAnalysis.frequency,
          reasoning: moistureAnalysis.reasoning,
          confidence: moistureAnalysis.confidence,
          costEstimate: this.calculateWaterCost(moistureAnalysis.quantity)
        });
      }

      if (npkAnalysis.needsFertilizer) {
        npkAnalysis.recommendations.forEach((rec: any) => {
          recommendations.push({
            type: 'fertilizer',
            priority: rec.severity,
            action: `Apply ${rec.fertilizer}`,
            quantity: rec.quantity,
            frequency: 'as needed',
            reasoning: rec.reasoning,
            confidence: rec.confidence,
            costEstimate: this.calculateFertilizerCost(rec.fertilizer, rec.quantity)
          });
        });
      }

      if (tempAnalysis.needsIntervention) {
        recommendations.push({
          type: 'environmental',
          priority: tempAnalysis.severity,
          action: tempAnalysis.action,
          reasoning: tempAnalysis.reasoning,
          confidence: tempAnalysis.confidence,
          costEstimate: tempAnalysis.costEstimate
        });
      }

      if (humidityAnalysis.needsIntervention) {
        recommendations.push({
          type: 'environmental',
          priority: humidityAnalysis.severity,
          action: humidityAnalysis.action,
          reasoning: humidityAnalysis.reasoning,
          confidence: humidityAnalysis.confidence,
          costEstimate: humidityAnalysis.costEstimate
        });
      }

      // 5. Sort by priority and confidence
      return recommendations.sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const scoreA = priorityWeight[a.priority] * a.confidence;
        const scoreB = priorityWeight[b.priority] * b.confidence;
        return scoreB - scoreA;
      });

    } catch (error) {
      console.error('Error processing sensor data:', error);
      return [{
        type: 'environmental',
        priority: 'medium',
        action: 'System maintenance required',
        reasoning: 'AI processing error - please check system status',
        confidence: 50
      }];
    }
  }

  private analyzeMoisture(moisture: number, weather: WeatherData) {
    // Advanced moisture analysis considering weather forecast
    if (moisture < this.arecaThresholds.moisture.critical) {
      return {
        needsWater: true,
        action: 'Add water immediately',
        severity: 'critical' as const,
        quantity: '400-500ml',
        frequency: 'immediate, then every 8 hours',
        reasoning: `Critical moisture level (${moisture}%). Immediate watering required to prevent crop stress.`,
        confidence: 95
      };
    } else if (moisture < this.arecaThresholds.moisture.warning) {
      let adjustment = weather.rainfall > 0 ? 'reduce by 25%' : 'standard amount';
      return {
        needsWater: true,
        action: 'Add water',
        severity: 'high' as const,
        quantity: `300-400ml (${adjustment})`,
        frequency: 'every 12 hours',
        reasoning: `Low moisture (${moisture}%). ${weather.rainfall > 0 ? 'Expected rain may reduce requirement.' : 'No rain expected.'}`,
        confidence: 85
      };
    } else if (moisture < this.arecaThresholds.moisture.optimal_min) {
      return {
        needsWater: true,
        action: 'Add water',
        severity: 'medium' as const,
        quantity: '200-300ml',
        frequency: 'daily',
        reasoning: `Moisture below optimal (${moisture}%). Light watering recommended.`,
        confidence: 75
      };
    } else if (moisture > this.arecaThresholds.moisture.high_max) {
      return {
        needsWater: true,
        action: 'Stop watering',
        severity: 'medium' as const,
        quantity: '0ml',
        frequency: 'for 2-3 days',
        reasoning: `Excess moisture (${moisture}%). Risk of root rot. Stop watering temporarily.`,
        confidence: 90
      };
    }

    return { needsWater: false };
  }

  private analyzeNPK(sensors: any, growthStage: GrowthStage) {
    const { nitrogen, phosphorus, potassium } = sensors;
    const recommendations: any[] = [];

    // Nitrogen analysis
    if (nitrogen < this.arecaThresholds.nitrogen.critical) {
      recommendations.push({
        type: 'fertilizer',
        severity: 'critical' as const,
        fertilizer: 'Urea',
        quantity: '10-15g',
        reasoning: `Critical nitrogen deficiency (${nitrogen} mg/kg). Immediate treatment required.`,
        confidence: 90
      });
    } else if (nitrogen < this.arecaThresholds.nitrogen.warning) {
      recommendations.push({
        type: 'fertilizer',
        severity: 'high' as const,
        fertilizer: 'Urea',
        quantity: '5-10g',
        reasoning: `Low nitrogen levels (${nitrogen} mg/kg). Supplement needed.`,
        confidence: 85
      });
    }

    // Phosphorus analysis
    if (phosphorus < this.arecaThresholds.phosphorus.critical) {
      recommendations.push({
        type: 'fertilizer',
        severity: 'critical' as const,
        fertilizer: 'SSP (Single Super Phosphate)',
        quantity: '5-8g',
        reasoning: `Critical phosphorus deficiency (${phosphorus} mg/kg). Root development affected.`,
        confidence: 90
      });
    } else if (phosphorus < this.arecaThresholds.phosphorus.warning) {
      recommendations.push({
        type: 'fertilizer',
        severity: 'medium' as const,
        fertilizer: 'SSP (Single Super Phosphate)',
        quantity: '3-5g',
        reasoning: `Low phosphorus (${phosphorus} mg/kg). Moderate supplementation recommended.`,
        confidence: 80
      });
    }

    // Potassium analysis
    if (potassium < this.arecaThresholds.potassium.critical) {
      recommendations.push({
        type: 'fertilizer',
        severity: 'high' as const,
        fertilizer: 'MOP (Muriate of Potash)',
        quantity: '5-8g',
        reasoning: `Potassium deficiency (${potassium} mg/kg). Disease resistance reduced.`,
        confidence: 85
      });
    } else if (potassium < this.arecaThresholds.potassium.warning) {
      recommendations.push({
        type: 'fertilizer',
        severity: 'medium' as const,
        fertilizer: 'MOP (Muriate of Potash)',
        quantity: '3-5g',
        reasoning: `Slightly low potassium (${potassium} mg/kg). Light supplementation.`,
        confidence: 75
      });
    }

    // Growth stage adjustments
    if (growthStage.stage === 'juvenile') {
      // Increase nitrogen for growth
      recommendations.forEach(rec => {
        if (rec.fertilizer === 'Urea') {
          const currentQty = parseInt(rec.quantity);
          rec.quantity = (currentQty * 1.2) + 'g';
          rec.reasoning += ' Increased for juvenile growth stage.';
        }
      });
    }

    return {
      needsFertilizer: recommendations.length > 0,
      recommendations,
      severity: recommendations.length > 0 ? recommendations[0].severity : 'low'
    };
  }

  private analyzeTemperature(temperature: number, weather: WeatherData) {
    if (temperature > this.arecaThresholds.temperature.critical_max) {
      return {
        needsIntervention: true,
        severity: 'critical' as const,
        action: 'Provide 60% shade netting',
        reasoning: `High temperature (${temperature}°C). Heat stress risk. Shade required immediately.`,
        confidence: 95,
        costEstimate: 1500 // Shade netting cost
      };
    } else if (temperature < this.arecaThresholds.temperature.critical_min) {
      return {
        needsIntervention: true,
        severity: 'high' as const,
        action: 'Move to warmer area or provide heating',
        reasoning: `Low temperature (${temperature}°C). Growth slowed. Warming measures needed.`,
        confidence: 90,
        costEstimate: 800 // Heating cost
      };
    }

    return { needsIntervention: false };
  }

  private analyzeHumidity(humidity: number, weather: WeatherData) {
    if (humidity > this.arecaThresholds.humidity.critical_max) {
      return {
        needsIntervention: true,
        severity: 'medium' as const,
        action: 'Improve air circulation',
        reasoning: `High humidity (${humidity}%). Risk of fungal diseases. Improve ventilation.`,
        confidence: 85,
        costEstimate: 200 // Ventilation improvement
      };
    } else if (humidity < this.arecaThresholds.humidity.critical_min) {
      return {
        needsIntervention: true,
        severity: 'medium' as const,
        action: 'Increase humidity through misting',
        reasoning: `Low humidity (${humidity}%). May cause leaf desiccation. Misting recommended.`,
        confidence: 80,
        costEstimate: 100 // Misting system cost
      };
    }

    return { needsIntervention: false };
  }

  private async getWeatherData(location: any): Promise<WeatherData> {
    try {
      // In production, integrate with real weather API
      // const response = await axios.get(`${this.weatherAPI}/weather`, {
      //   params: {
      //     lat: location.latitude,
      //     lon: location.longitude,
      //     appid: process.env.WEATHER_API_KEY,
      //     units: 'metric'
      //   }
      // });

      // For now, return mock data based on typical Areca growing conditions
      return {
        temperature: 28 + Math.random() * 8, // 28-36°C
        humidity: 65 + Math.random() * 20,  // 65-85%
        rainfall: Math.random() > 0.7 ? Math.random() * 10 : 0, // 30% chance of rain
        forecast: ['sunny', 'partly_cloudy', 'cloudy', 'light_rain'][Math.floor(Math.random() * 4)],
        windSpeed: 2 + Math.random() * 8 // 2-10 km/h
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Fallback to default values
      return {
        temperature: 30,
        humidity: 75,
        rainfall: 0,
        forecast: 'sunny',
        windSpeed: 5
      };
    }
  }

  private predictGrowthStage(reading: SensorReading): GrowthStage {
    // Analyze historical data to predict growth stage
    const daysSinceFirstReading = this.getDaysSinceFirstReading(reading.sensor_id);

    if (daysSinceFirstReading < 90) {
      return {
        stage: 'seedling',
        ageMonths: Math.round(daysSinceFirstReading / 30),
        expectedYield: 0
      };
    } else if (daysSinceFirstReading < 365) {
      return {
        stage: 'juvenile',
        ageMonths: Math.round(daysSinceFirstReading / 30),
        expectedYield: 50
      };
    } else if (daysSinceFirstReading < 1825) { // 5 years
      return {
        stage: 'mature',
        ageMonths: Math.round(daysSinceFirstReading / 30),
        expectedYield: 85
      };
    } else {
      return {
        stage: 'harvest',
        ageMonths: Math.round(daysSinceFirstReading / 30),
        expectedYield: 100
      };
    }
  }

  private getDaysSinceFirstReading(sensorId: string): number {
    const sensorReadings = this.historicalData.filter(r => r.sensor_id === sensorId);
    if (sensorReadings.length === 0) return 180; // Default to 6 months if no history

    const firstReading = sensorReadings.reduce((oldest, current) =>
      new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest
    );

    const now = new Date();
    const firstDate = new Date(firstReading.timestamp);
    return Math.floor((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateWaterCost(quantity: string): number {
    // Estimate water cost based on quantity
    const match = quantity.match(/(\d+)/);
    if (!match) return 0;

    const milliliters = parseInt(match[0]);
    const liters = milliliters / 1000;
    return Math.round(liters * 0.002 * 100) / 100; // Rs. 0.002 per liter (agricultural rate)
  }

  private calculateFertilizerCost(type: string, quantity: string): number {
    // Estimate fertilizer cost
    const match = quantity.match(/(\d+)/);
    if (!match) return 0;

    const grams = parseInt(match[0]);
    const costPerGram = {
      'Urea': 0.05,      // Rs. 50 per kg
      'SSP': 0.08,       // Rs. 80 per kg
      'MOP': 0.06        // Rs. 60 per kg
    };

    const rate = costPerGram[type as keyof typeof costPerGram] || 0.05;
    return Math.round(grams * rate * 100) / 100;
  }

  private loadHistoricalData(): void {
    // In production, load from database
    // For now, simulate some historical data
    this.historicalData = [];
  }

  private loadTreatmentHistory(): void {
    // In production, load from database
    // For now, simulate some treatment history
    this.treatmentHistory = [];
  }

  // Public methods for external access
  public addHistoricalReading(reading: SensorReading): void {
    this.historicalData.push(reading);
    // Keep only last 1000 readings to prevent memory issues
    if (this.historicalData.length > 1000) {
      this.historicalData = this.historicalData.slice(-1000);
    }
  }

  public addTreatmentRecord(record: TreatmentRecord): void {
    this.treatmentHistory.push(record);
  }

  public getArecaThresholds(): ArecaAlertThresholds {
    return this.arecaThresholds;
  }

  public getTreatmentHistory(): TreatmentRecord[] {
    return this.treatmentHistory;
  }
}