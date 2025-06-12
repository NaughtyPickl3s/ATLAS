import {
  sensorData,
  alerts,
  aiRecommendations,
  systemLogs,
  serverConnections,
  type SensorData,
  type InsertSensorData,
  type Alert,
  type InsertAlert,
  type AiRecommendation,
  type InsertAiRecommendation,
  type SystemLog,
  type InsertSystemLog,
  type ServerConnection,
  type InsertServerConnection,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Sensor Data
  createSensorData(data: InsertSensorData): Promise<SensorData>;
  getAllSensorData(): Promise<SensorData[]>;
  getLatestSensorData(): Promise<SensorData[]>;
  getSensorDataByType(sensorType: string): Promise<SensorData[]>;
  
  // Alerts
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAllAlerts(): Promise<Alert[]>;
  getActiveAlerts(): Promise<Alert[]>;
  deactivateAlert(id: number): Promise<void>;
  
  // AI Recommendations
  createAiRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation>;
  getAllAiRecommendations(): Promise<AiRecommendation[]>;
  getRecentAiRecommendations(limit?: number): Promise<AiRecommendation[]>;
  
  // System Logs
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  getAllSystemLogs(): Promise<SystemLog[]>;
  getRecentSystemLogs(limit?: number): Promise<SystemLog[]>;
  
  // Server Connections
  createOrUpdateServerConnection(connection: InsertServerConnection): Promise<ServerConnection>;
  getAllServerConnections(): Promise<ServerConnection[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize server connections if they don't exist
    this.initializeServerConnections();
  }

  private async initializeServerConnections() {
    try {
      const existingConnections = await db.select().from(serverConnections);
      
      if (existingConnections.length === 0) {
        await db.insert(serverConnections).values([
          {
            serverType: "aws",
            status: "connected",
          },
          {
            serverType: "ubuntu",
            status: "connected",
          }
        ]);
      }
    } catch (error) {
      console.error('Error initializing server connections:', error);
    }
  }

  // Sensor Data methods
  async createSensorData(data: InsertSensorData): Promise<SensorData> {
    const [result] = await db.insert(sensorData).values({
      nodeId: data.nodeId,
      sensorType: data.sensorType,
      value: data.value,
      unit: data.unit,
      status: data.status,
      threshold: data.threshold ?? null,
      maxValue: data.maxValue ?? null,
    }).returning();
    return result;
  }

  async getAllSensorData(): Promise<SensorData[]> {
    return await db.select().from(sensorData).orderBy(desc(sensorData.timestamp));
  }

  async getLatestSensorData(): Promise<SensorData[]> {
    // Get the latest sensor reading for each nodeId
    const result = await db.select().from(sensorData);
    const grouped = new Map<string, SensorData>();
    
    result.forEach(data => {
      const existing = grouped.get(data.nodeId);
      if (!existing || data.timestamp > existing.timestamp) {
        grouped.set(data.nodeId, data);
      }
    });
    
    return Array.from(grouped.values());
  }

  async getSensorDataByType(sensorType: string): Promise<SensorData[]> {
    return await db.select()
      .from(sensorData)
      .where(eq(sensorData.sensorType, sensorType))
      .orderBy(desc(sensorData.timestamp));
  }

  // Alert methods
  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [result] = await db.insert(alerts).values({
      sensorNodeId: alert.sensorNodeId,
      alertType: alert.alertType,
      message: alert.message,
      isActive: alert.isActive ?? true,
    }).returning();
    return result;
  }

  async getAllAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).orderBy(desc(alerts.timestamp));
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return await db.select()
      .from(alerts)
      .where(eq(alerts.isActive, true))
      .orderBy(desc(alerts.timestamp));
  }

  async deactivateAlert(id: number): Promise<void> {
    await db.update(alerts)
      .set({ isActive: false })
      .where(eq(alerts.id, id));
  }

  // AI Recommendations methods
  async createAiRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation> {
    const [result] = await db.insert(aiRecommendations).values({
      title: recommendation.title,
      description: recommendation.description,
      priority: recommendation.priority,
      confidence: recommendation.confidence,
      category: recommendation.category,
    }).returning();
    return result;
  }

  async getAllAiRecommendations(): Promise<AiRecommendation[]> {
    return await db.select().from(aiRecommendations).orderBy(desc(aiRecommendations.timestamp));
  }

  async getRecentAiRecommendations(limit = 10): Promise<AiRecommendation[]> {
    return await db.select()
      .from(aiRecommendations)
      .orderBy(desc(aiRecommendations.timestamp))
      .limit(limit);
  }

  // System Logs methods
  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    const [result] = await db.insert(systemLogs).values({
      level: log.level,
      message: log.message,
      source: log.source,
    }).returning();
    return result;
  }

  async getAllSystemLogs(): Promise<SystemLog[]> {
    return await db.select().from(systemLogs).orderBy(desc(systemLogs.timestamp));
  }

  async getRecentSystemLogs(limit = 20): Promise<SystemLog[]> {
    return await db.select()
      .from(systemLogs)
      .orderBy(desc(systemLogs.timestamp))
      .limit(limit);
  }

  // Server Connections methods
  async createOrUpdateServerConnection(connection: InsertServerConnection): Promise<ServerConnection> {
    const [existing] = await db.select()
      .from(serverConnections)
      .where(eq(serverConnections.serverType, connection.serverType));
    
    if (existing) {
      const [updated] = await db.update(serverConnections)
        .set({
          status: connection.status,
          lastPing: new Date(),
        })
        .where(eq(serverConnections.serverType, connection.serverType))
        .returning();
      return updated;
    } else {
      const [newConnection] = await db.insert(serverConnections).values({
        serverType: connection.serverType,
        status: connection.status,
      }).returning();
      return newConnection;
    }
  }

  async getAllServerConnections(): Promise<ServerConnection[]> {
    return await db.select().from(serverConnections);
  }
}

export const storage = new DatabaseStorage();
