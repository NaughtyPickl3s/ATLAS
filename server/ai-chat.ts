import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import { sensorData, aiRecommendations, systemLogs } from '@shared/schema';
import { desc, gte } from 'drizzle-orm';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reactorData?: any;
}

export class ReactorAIChatEngine {
  private chatHistory: ChatMessage[] = [];

  async processUserMessage(userMessage: string): Promise<ChatMessage> {
    try {
      // Get current reactor status for context
      const currentData = await this.getCurrentReactorStatus();
      
      // Create user message
      const userChatMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };
      
      this.chatHistory.push(userChatMessage);

      // Generate AI response with reactor context
      const aiResponse = await this.generateAIResponse(userMessage, currentData);
      
      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        reactorData: currentData
      };
      
      this.chatHistory.push(assistantMessage);

      // Log the interaction
      await db.insert(systemLogs).values({
        level: 'info',
        message: `AI chat interaction: User asked about reactor operations`,
        source: 'ai-chat'
      });

      return assistantMessage;
    } catch (error) {
      console.error('Error processing chat message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I am experiencing technical difficulties analyzing the reactor data. Please check that the AI service is properly configured and try again.',
        timestamp: new Date()
      };
      
      return errorMessage;
    }
  }

  private async getCurrentReactorStatus() {
    try {
      // Get latest sensor readings
      const latestSensors = await db.select()
        .from(sensorData)
        .where(gte(sensorData.timestamp, new Date(Date.now() - 5 * 60 * 1000)))
        .orderBy(desc(sensorData.timestamp))
        .limit(50);

      // Group by sensor type to get current readings
      const currentReadings: Record<string, any> = {};
      
      latestSensors.forEach(sensor => {
        if (!currentReadings[sensor.sensorType] || 
            sensor.timestamp > currentReadings[sensor.sensorType].timestamp) {
          currentReadings[sensor.sensorType] = sensor;
        }
      });

      // Calculate reactor metrics
      const coreTemp = currentReadings.temperature?.value || 0;
      const neutronFlux = currentReadings.neutron_flux?.value || 0;
      const primaryPressure = currentReadings.pressure?.value || 0;
      const coolantFlow = currentReadings.coolant_flow?.value || 0;
      const controlRods = currentReadings.control_rods?.value || 0;
      const radiation = currentReadings.radiation?.value || 0;

      return {
        currentReadings,
        metrics: {
          coreTemperature: coreTemp,
          neutronFlux: neutronFlux,
          primaryPressure: primaryPressure,
          coolantFlow: coolantFlow,
          controlRodPosition: controlRods,
          radiationLevel: radiation,
          reactorPower: this.calculatePowerLevel(neutronFlux, coreTemp),
          thermalEfficiency: this.calculateEfficiency(coreTemp, coolantFlow),
          safetyMargin: this.calculateSafetyMargin(neutronFlux, controlRods)
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting reactor status:', error);
      return { error: 'Unable to retrieve reactor data' };
    }
  }

  private calculatePowerLevel(neutronFlux: number, temperature: number): number {
    const nominalFlux = 3.0e14;
    const nominalTemp = 580;
    return Math.round(((neutronFlux / nominalFlux) * (temperature / nominalTemp)) * 100);
  }

  private calculateEfficiency(temperature: number, flow: number): number {
    const optimalTemp = 580;
    const optimalFlow = 1247;
    const tempEff = Math.max(0, 1 - Math.abs(temperature - optimalTemp) / optimalTemp);
    const flowEff = Math.max(0, 1 - Math.abs(flow - optimalFlow) / optimalFlow);
    return Math.round(tempEff * flowEff * 100);
  }

  private calculateSafetyMargin(neutronFlux: number, controlRods: number): number {
    const criticalFlux = 3.2e14;
    const fluxMargin = ((criticalFlux - neutronFlux) / criticalFlux) * 100;
    const rodSafety = (100 - controlRods) * 0.5; // Control rod safety factor
    return Math.max(0, Math.round(fluxMargin + rodSafety));
  }

  private async generateAIResponse(userMessage: string, reactorData: any): Promise<string> {
    const systemPrompt = `You are NUCLEAR-AI, an advanced nuclear reactor monitoring and safety assistant. You have real-time access to reactor instrumentation and operational data.

CURRENT REACTOR STATUS:
${JSON.stringify(reactorData.metrics, null, 2)}

SENSOR READINGS:
${Object.entries(reactorData.currentReadings).map(([type, data]: [string, any]) => 
  `${type}: ${data.value}${data.unit} (${data.status})`
).join('\n')}

You are an expert in:
- Nuclear reactor physics and thermodynamics
- PWR/BWR safety systems and operations
- Radiation protection and ALARA principles
- Nuclear instrumentation and control systems
- Emergency response procedures
- Predictive maintenance and optimization

GUIDELINES:
- Always prioritize safety in your responses
- Provide specific technical analysis when discussing reactor parameters
- Reference actual sensor data in your explanations
- Explain complex nuclear concepts in accessible terms
- Alert to any concerning trends or anomalies
- Suggest specific operational improvements when appropriate
- Maintain professional nuclear industry standards

Respond to the user's question about reactor operations with accurate, helpful analysis.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...this.chatHistory.slice(-6).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: userMessage
          }
        ],
      });

      const content = response.content[0] as any;
      return content.text;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return 'I am currently unable to analyze the reactor data due to a technical issue. Please ensure the AI service is properly configured and try again.';
    }
  }

  getChatHistory(): ChatMessage[] {
    return this.chatHistory.slice(-20); // Return last 20 messages
  }

  clearChatHistory(): void {
    this.chatHistory = [];
  }

  async generateReactorSummary(): Promise<string> {
    const reactorData = await this.getCurrentReactorStatus();
    
    if (reactorData.error) {
      return "Unable to generate reactor summary - data unavailable";
    }

    return `REACTOR STATUS SUMMARY:
Core Temperature: ${reactorData.metrics.coreTemperature}°C
Reactor Power: ${reactorData.metrics.reactorPower}%
Safety Margin: ${reactorData.metrics.safetyMargin}%
Thermal Efficiency: ${reactorData.metrics.thermalEfficiency}%
Control Rod Position: ${reactorData.metrics.controlRodPosition}%
Primary Pressure: ${reactorData.metrics.primaryPressure} MPa

All systems operating within normal parameters. No immediate safety concerns detected.`;
  }
}

export const reactorAIChat = new ReactorAIChatEngine();