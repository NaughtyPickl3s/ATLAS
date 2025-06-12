import { pgTable, text, serial, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sensorData = pgTable("sensor_data", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").notNull(),
  sensorType: text("sensor_type").notNull(), // temperature, pressure, radiation, coolant_flow, neutron_flux, control_rods
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  status: text("status").notNull(), // normal, warning, critical
  threshold: real("threshold"),
  maxValue: real("max_value"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  sensorNodeId: text("sensor_node_id").notNull(),
  alertType: text("alert_type").notNull(), // warning, critical
  message: text("message").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const aiRecommendations = pgTable("ai_recommendations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // high, medium, low, info
  confidence: real("confidence").notNull(), // 0-100
  category: text("category").notNull(), // anomaly, optimization, performance
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  level: text("level").notNull(), // info, warning, error
  message: text("message").notNull(),
  source: text("source").notNull(),
});

export const serverConnections = pgTable("server_connections", {
  id: serial("id").primaryKey(),
  serverType: text("server_type").notNull(), // aws, ubuntu
  status: text("status").notNull(), // connected, disconnected, error
  lastPing: timestamp("last_ping").defaultNow().notNull(),
});

export const insertSensorDataSchema = createInsertSchema(sensorData).omit({
  id: true,
  timestamp: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
});

export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  timestamp: true,
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  timestamp: true,
});

export const insertServerConnectionSchema = createInsertSchema(serverConnections).omit({
  id: true,
  lastPing: true,
});

export type SensorData = typeof sensorData.$inferSelect;
export type InsertSensorData = z.infer<typeof insertSensorDataSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAiRecommendation = z.infer<typeof insertAiRecommendationSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type ServerConnection = typeof serverConnections.$inferSelect;
export type InsertServerConnection = z.infer<typeof insertServerConnectionSchema>;
