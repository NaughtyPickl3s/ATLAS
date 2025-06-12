import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import { sensorData, alerts, aiRecommendations, systemLogs } from '@shared/schema';
import { desc, gte, and, eq } from 'drizzle-orm';
import type { SensorData, InsertAiRecommendation } from '@shared/schema';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AnalysisPattern {
  nodeId: string;
  sensorType: string;
  baseline: number;
  variance: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  anomalyScore: number;
  confidence: number;
  predictiveInsights: string[];
}

interface ReactorPhysicsModel {
  coreTemperature: number;
  neutronFlux: number;
  primaryPressure: number;
  controlRodPosition: number;
  coolantFlow: number;
  radiationLevel: number;
  thermalEfficiency: number;
  reactorPower: number;
  criticalityMargin: number;
}

export class NuclearAIEngine {
  private learningPatterns: Map<string, AnalysisPattern> = new Map();
  private reactorModel: ReactorPhysicsModel | null = null;
  private lastAnalysisTime: Date = new Date(0);

  constructor() {
    // Initialize learning patterns from historical data
    this.initializeLearningPatterns();
    
    // Start continuous learning cycle
    this.startContinuousLearning();
  }

  private async initializeLearningPatterns() {
    try {
      console.log('Initializing AI learning patterns from historical data...');
      
      // Get last 24 hours of sensor data for pattern analysis
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const historicalData = await db.select()
        .from(sensorData)
        .where(gte(sensorData.timestamp, twentyFourHoursAgo))
        .orderBy(desc(sensorData.timestamp));

      // Group data by sensor node for pattern analysis
      const groupedData = this.groupSensorData(historicalData);
      
      // Analyze patterns for each sensor
      for (const [nodeId, readings] of Array.from(groupedData.entries())) {
        if (readings.length > 10) { // Need sufficient data for pattern analysis
          const pattern = await this.analyzePatternWithAI(nodeId, readings);
          this.learningPatterns.set(nodeId, pattern);
        }
      }

      console.log(`Initialized learning patterns for ${this.learningPatterns.size} sensor nodes`);
    } catch (error) {
      console.error('Error initializing learning patterns:', error);
    }
  }

  private groupSensorData(data: SensorData[]): Map<string, SensorData[]> {
    const grouped = new Map<string, SensorData[]>();
    
    data.forEach(reading => {
      if (!grouped.has(reading.nodeId)) {
        grouped.set(reading.nodeId, []);
      }
      grouped.get(reading.nodeId)!.push(reading);
    });

    return grouped;
  }

  private async analyzePatternWithAI(nodeId: string, readings: SensorData[]): Promise<AnalysisPattern> {
    const values = readings.map(r => r.value);
    const timestamps = readings.map(r => r.timestamp);
    const sensorType = readings[0].sensorType;

    // Statistical analysis
    const baseline = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - baseline, 2), 0) / values.length);
    
    // Trend analysis
    const trend = this.calculateTrend(values);
    
    // AI-powered anomaly detection and insights
    const aiAnalysis = await this.getAIAnalysis(nodeId, sensorType, readings);

    return {
      nodeId,
      sensorType,
      baseline,
      variance,
      trend,
      anomalyScore: aiAnalysis.anomalyScore,
      confidence: aiAnalysis.confidence,
      predictiveInsights: aiAnalysis.insights
    };
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (changePercent > 2) return 'increasing';
    if (changePercent < -2) return 'decreasing';
    return 'stable';
  }

  private async getAIAnalysis(nodeId: string, sensorType: string, readings: SensorData[]) {
    try {
      const analysisPrompt = `
        You are a nuclear reactor physics expert analyzing sensor data for safety and predictive maintenance.
        
        Sensor: ${nodeId} (${sensorType})
        Recent readings: ${readings.slice(0, 10).map(r => `${r.value}${r.unit} at ${r.timestamp.toISOString()}`).join(', ')}
        
        Based on nuclear safety principles and reactor physics, analyze:
        1. Anomaly score (0-100, where 100 is critical)
        2. Confidence in analysis (0-100)
        3. Predictive insights for maintenance and safety
        
        Consider reactor physics relationships:
        - Temperature vs neutron flux correlation
        - Pressure system interdependencies
        - Control rod positioning effects
        - Coolant flow thermal hydraulics
        - Radiation level trends
        
        Respond in JSON format:
        {
          "anomalyScore": number,
          "confidence": number,
          "insights": ["insight1", "insight2", "insight3"],
          "reactorPhysicsAnalysis": "detailed analysis",
          "maintenancePrediction": "prediction with timeline"
        }
      `;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: analysisPrompt }],
      });

      const content = response.content[0] as any;
      const analysis = JSON.parse(content.text);
      return {
        anomalyScore: Math.max(0, Math.min(100, analysis.anomalyScore)),
        confidence: Math.max(0, Math.min(100, analysis.confidence)),
        insights: analysis.insights || [],
        physicsAnalysis: analysis.reactorPhysicsAnalysis || '',
        maintenancePrediction: analysis.maintenancePrediction || ''
      };
    } catch (error) {
      console.error('Error in AI analysis:', error);
      return {
        anomalyScore: 0,
        confidence: 0,
        insights: ['AI analysis temporarily unavailable'],
        physicsAnalysis: '',
        maintenancePrediction: ''
      };
    }
  }

  private startContinuousLearning() {
    // Run comprehensive analysis every 5 minutes
    setInterval(async () => {
      await this.performContinuousLearning();
    }, 5 * 60 * 1000);

    // Quick pattern updates every 30 seconds
    setInterval(async () => {
      await this.updatePatterns();
    }, 30 * 1000);
  }

  private async performContinuousLearning() {
    try {
      console.log('Performing continuous AI learning cycle...');
      
      // Get latest sensor data
      const latestData = await this.getLatestSensorReadings();
      
      // Update reactor physics model
      await this.updateReactorModel(latestData);
      
      // Detect complex patterns and correlations
      const correlations = await this.analyzeSystemCorrelations(latestData);
      
      // Generate predictive insights
      const predictions = await this.generatePredictiveInsights(correlations);
      
      // Create intelligent recommendations
      await this.createIntelligentRecommendations(predictions);
      
      console.log('Continuous learning cycle completed');
    } catch (error) {
      console.error('Error in continuous learning:', error);
    }
  }

  private async getLatestSensorReadings(): Promise<SensorData[]> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return await db.select()
      .from(sensorData)
      .where(gte(sensorData.timestamp, oneHourAgo))
      .orderBy(desc(sensorData.timestamp));
  }

  private async updateReactorModel(latestData: SensorData[]) {
    const groupedByType = latestData.reduce((acc, reading) => {
      if (!acc[reading.sensorType]) acc[reading.sensorType] = [];
      acc[reading.sensorType].push(reading);
      return acc;
    }, {} as Record<string, SensorData[]>);

    // Calculate average values for reactor model
    const getAverage = (type: string) => {
      const readings = groupedByType[type] || [];
      return readings.length > 0 ? readings.reduce((sum, r) => sum + r.value, 0) / readings.length : 0;
    };

    const coreTemp = getAverage('temperature');
    const neutronFlux = getAverage('neutron_flux');
    const primaryPressure = getAverage('pressure');
    const controlRods = getAverage('control_rods');
    const coolantFlow = getAverage('coolant_flow');
    const radiation = getAverage('radiation');

    this.reactorModel = {
      coreTemperature: coreTemp,
      neutronFlux: neutronFlux,
      primaryPressure: primaryPressure,
      controlRodPosition: controlRods,
      coolantFlow: coolantFlow,
      radiationLevel: radiation,
      thermalEfficiency: this.calculateThermalEfficiency(coreTemp, coolantFlow),
      reactorPower: this.calculateReactorPower(neutronFlux, coreTemp),
      criticalityMargin: this.calculateCriticalityMargin(neutronFlux, controlRods)
    };
  }

  private calculateThermalEfficiency(temp: number, flow: number): number {
    // Simplified thermal efficiency calculation based on reactor physics
    const idealTemp = 580; // °C
    const idealFlow = 1247; // L/s
    
    const tempEfficiency = Math.max(0, 1 - Math.abs(temp - idealTemp) / idealTemp);
    const flowEfficiency = Math.max(0, 1 - Math.abs(flow - idealFlow) / idealFlow);
    
    return (tempEfficiency * flowEfficiency) * 100;
  }

  private calculateReactorPower(neutronFlux: number, temperature: number): number {
    // Simplified power calculation from neutron flux and temperature
    const nominalFlux = 3.0e14;
    const nominalTemp = 580;
    
    const fluxRatio = neutronFlux / nominalFlux;
    const tempRatio = temperature / nominalTemp;
    
    return Math.max(0, Math.min(100, (fluxRatio * tempRatio) * 100));
  }

  private calculateCriticalityMargin(neutronFlux: number, controlRods: number): number {
    // Calculate safety margin to criticality
    const criticalFlux = 3.2e14;
    const margin = ((criticalFlux - neutronFlux) / criticalFlux) * 100;
    
    // Factor in control rod position
    const rodSafetyFactor = (100 - controlRods) / 100;
    
    return Math.max(0, margin * rodSafetyFactor);
  }

  private async analyzeSystemCorrelations(data: SensorData[]) {
    const correlationPrompt = `
      Analyze the following nuclear reactor sensor correlations for physics-based relationships:
      
      Recent sensor data summary:
      ${this.formatSensorDataForAI(data)}
      
      Current reactor model:
      ${JSON.stringify(this.reactorModel, null, 2)}
      
      Analyze correlations between:
      1. Temperature vs Neutron Flux (reactivity feedback)
      2. Pressure vs Control Rod Position (reactor control)
      3. Coolant Flow vs Core Temperature (heat removal)
      4. Radiation vs System Integrity (safety barriers)
      
      Identify any anomalous correlations that could indicate:
      - Equipment degradation
      - Control system drift
      - Thermal hydraulic changes
      - Nuclear physics anomalies
      
      Respond with JSON analysis of correlations and concerns.
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: correlationPrompt }],
      });

      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Error analyzing correlations:', error);
      return { correlations: [], concerns: [] };
    }
  }

  private formatSensorDataForAI(data: SensorData[]): string {
    const summary = data.reduce((acc, reading) => {
      if (!acc[reading.sensorType]) {
        acc[reading.sensorType] = { values: [], latest: reading };
      }
      acc[reading.sensorType].values.push(reading.value);
      if (reading.timestamp > acc[reading.sensorType].latest.timestamp) {
        acc[reading.sensorType].latest = reading;
      }
      return acc;
    }, {} as Record<string, { values: number[], latest: SensorData }>);

    return Object.entries(summary)
      .map(([type, data]) => {
        const avg = data.values.reduce((sum, val) => sum + val, 0) / data.values.length;
        return `${type}: Latest=${data.latest.value}${data.latest.unit}, Avg=${avg.toFixed(2)}${data.latest.unit}, Status=${data.latest.status}`;
      })
      .join('\n');
  }

  private async generatePredictiveInsights(correlations: any) {
    const predictionPrompt = `
      Based on the reactor correlation analysis and current operating patterns, generate predictive insights:
      
      Correlations: ${JSON.stringify(correlations)}
      Reactor Model: ${JSON.stringify(this.reactorModel)}
      Learning Patterns: ${Array.from(this.learningPatterns.values()).map(p => `${p.nodeId}: trend=${p.trend}, anomaly=${p.anomalyScore}`).join(', ')}
      
      Predict:
      1. Equipment that may require maintenance in the next 30-90 days
      2. System parameters trending toward alarm conditions
      3. Operational optimizations to improve efficiency
      4. Safety margin trends and recommendations
      
      Use nuclear engineering principles and provide specific, actionable predictions with confidence levels.
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: predictionPrompt }],
      });

      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Error generating predictions:', error);
      return { predictions: [], optimizations: [], safetyTrends: [] };
    }
  }

  private async createIntelligentRecommendations(predictions: any) {
    try {
      // Create maintenance recommendations
      if (predictions.predictions && predictions.predictions.length > 0) {
        for (const prediction of predictions.predictions.slice(0, 3)) {
          await db.insert(aiRecommendations).values({
            title: `Predictive Maintenance: ${prediction.component}`,
            description: `AI analysis suggests ${prediction.description}. Confidence: ${prediction.confidence}%. Recommended action within ${prediction.timeframe}.`,
            priority: prediction.priority || 'medium',
            confidence: prediction.confidence || 85,
            category: 'maintenance'
          });
        }
      }

      // Create optimization recommendations
      if (predictions.optimizations && predictions.optimizations.length > 0) {
        for (const optimization of predictions.optimizations.slice(0, 2)) {
          await db.insert(aiRecommendations).values({
            title: `Operational Optimization: ${optimization.area}`,
            description: `AI learning identified optimization opportunity: ${optimization.description}. Estimated improvement: ${optimization.benefit}.`,
            priority: 'medium',
            confidence: optimization.confidence || 80,
            category: 'optimization'
          });
        }
      }

      // Create safety trend alerts
      if (predictions.safetyTrends && predictions.safetyTrends.length > 0) {
        for (const trend of predictions.safetyTrends.slice(0, 2)) {
          await db.insert(aiRecommendations).values({
            title: `Safety Trend Analysis: ${trend.parameter}`,
            description: `AI monitoring detected ${trend.description}. Current safety margin: ${trend.margin}%. Recommend ${trend.action}.`,
            priority: trend.priority || 'high',
            confidence: trend.confidence || 90,
            category: 'safety'
          });
        }
      }

      // Log the AI learning activity
      await db.insert(systemLogs).values({
        level: 'info',
        message: `AI learning cycle completed. Generated ${(predictions.predictions?.length || 0) + (predictions.optimizations?.length || 0) + (predictions.safetyTrends?.length || 0)} intelligent recommendations.`,
        source: 'ai-engine'
      });

    } catch (error) {
      console.error('Error creating intelligent recommendations:', error);
    }
  }

  private async updatePatterns() {
    // Quick pattern update for real-time learning
    try {
      const recentData = await db.select()
        .from(sensorData)
        .where(gte(sensorData.timestamp, new Date(Date.now() - 10 * 60 * 1000)))
        .orderBy(desc(sensorData.timestamp));

      // Update existing patterns with new data
      const groupedData = this.groupSensorData(recentData);
      
      for (const [nodeId, readings] of Array.from(groupedData.entries())) {
        const existingPattern = this.learningPatterns.get(nodeId);
        if (existingPattern && readings.length > 0) {
          const latestValue = readings[0].value;
          const deviation = Math.abs(latestValue - existingPattern.baseline) / existingPattern.baseline;
          
          // Update anomaly score based on deviation
          if (deviation > 0.1) { // 10% deviation threshold
            existingPattern.anomalyScore = Math.min(100, existingPattern.anomalyScore + (deviation * 20));
          } else {
            existingPattern.anomalyScore = Math.max(0, existingPattern.anomalyScore - 1);
          }
          
          this.learningPatterns.set(nodeId, existingPattern);
        }
      }
    } catch (error) {
      console.error('Error updating patterns:', error);
    }
  }

  // Public methods for external access
  public getReactorModel(): ReactorPhysicsModel | null {
    return this.reactorModel;
  }

  public getLearningPatterns(): Map<string, AnalysisPattern> {
    return this.learningPatterns;
  }

  public async generateCustomAnalysis(prompt: string): Promise<string> {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{ 
          role: 'user', 
          content: `As a nuclear reactor AI expert with access to real-time reactor data: ${prompt}\n\nReactor Status: ${JSON.stringify(this.reactorModel)}` 
        }],
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Error in custom analysis:', error);
      return 'Analysis temporarily unavailable';
    }
  }
}

export const nuclearAI = new NuclearAIEngine();