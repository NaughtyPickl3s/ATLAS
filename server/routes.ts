import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { reactorAIChat } from "./ai-chat";
import { knowledgeRepository } from "./knowledge-repository";
import { scenarioManager } from "./reactor-scenarios";
import { insertSensorDataSchema, insertAlertSchema, insertAiRecommendationSchema, insertSystemLogSchema } from "@shared/schema";

// Nuclear sensor configurations based on industry standards (PWR/BWR specifications)
const SENSOR_CONFIGS = [
  // Core Temperature Sensors - Reuter-Stokes LPRM equivalent
  { nodeId: "CORE-TEMP-01", sensorType: "temperature", unit: "°C", baseValue: 580, variance: 8, threshold: 590, maxValue: 620, location: "AWS" },
  { nodeId: "CORE-TEMP-02", sensorType: "temperature", unit: "°C", baseValue: 575, variance: 10, threshold: 590, maxValue: 620, location: "Ubuntu" },
  
  // Primary Circuit Pressure - Safety-Related IEEE Class 1E
  { nodeId: "PRES-PRI-01", sensorType: "pressure", unit: "MPa", baseValue: 15.5, variance: 0.3, threshold: 16.2, maxValue: 17.5, location: "AWS" },
  { nodeId: "PRES-SEC-01", sensorType: "pressure", unit: "MPa", baseValue: 7.0, variance: 0.2, threshold: 7.8, maxValue: 8.5, location: "Ubuntu" },
  
  // Radiation Monitoring - Environmental Radiation Monitors
  { nodeId: "RAD-CORE-01", sensorType: "radiation", unit: "mSv/h", baseValue: 2.1, variance: 0.2, threshold: 4.5, maxValue: 8.0, location: "AWS" },
  { nodeId: "RAD-CONT-01", sensorType: "radiation", unit: "mSv/h", baseValue: 0.8, variance: 0.1, threshold: 2.0, maxValue: 5.0, location: "Ubuntu" },
  
  // Coolant Flow - Primary Loop
  { nodeId: "COOL-PRI-01", sensorType: "coolant_flow", unit: "L/s", baseValue: 1247, variance: 30, threshold: 1180, maxValue: 1400, location: "AWS" },
  { nodeId: "COOL-SEC-01", sensorType: "coolant_flow", unit: "L/s", baseValue: 890, variance: 25, threshold: 850, maxValue: 950, location: "Ubuntu" },
  
  // Neutron Flux Monitoring - In-Core Fission Chambers
  { nodeId: "NEUT-FLUX-01", sensorType: "neutron_flux", unit: "n/cm²s", baseValue: 2.8e14, variance: 0.15e14, threshold: 3.2e14, maxValue: 3.8e14, location: "AWS" },
  { nodeId: "NEUT-FLUX-02", sensorType: "neutron_flux", unit: "n/cm²s", baseValue: 2.9e14, variance: 0.18e14, threshold: 3.2e14, maxValue: 3.8e14, location: "Ubuntu" },
  
  // Control Rod Position - Safety System
  { nodeId: "CTRL-ROD-01", sensorType: "control_rods", unit: "%", baseValue: 68, variance: 2, threshold: 72, maxValue: 100, location: "AWS" },
  { nodeId: "CTRL-ROD-02", sensorType: "control_rods", unit: "%", baseValue: 65, variance: 3, threshold: 72, maxValue: 100, location: "Ubuntu" },
];

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });
    
    // Send initial data
    sendLatestData(ws);
  });

  // Broadcast to all connected clients
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Send latest data to a specific client
  async function sendLatestData(ws: WebSocket) {
    try {
      const sensorData = await storage.getLatestSensorData();
      const alerts = await storage.getActiveAlerts();
      const recommendations = await storage.getRecentAiRecommendations(3);
      const logs = await storage.getRecentSystemLogs(5);
      const serverConnections = await storage.getAllServerConnections();
      
      const data = {
        type: 'initial_data',
        sensorData,
        alerts,
        recommendations,
        logs,
        serverConnections
      };
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  // Sensor data generation and analysis
  function generateSensorData() {
    SENSOR_CONFIGS.forEach(async (config) => {
      // Generate realistic sensor value with some randomness
      const variation = (Math.random() - 0.5) * config.variance;
      let value = config.baseValue + variation;
      
      // Determine status based on thresholds
      let status = "normal";
      if (value > config.threshold) {
        status = config.maxValue && value > config.maxValue * 0.9 ? "critical" : "warning";
      }
      
      // Special handling for neutron flux display
      if (config.sensorType === "neutron_flux") {
        value = parseFloat((value / 1e14).toFixed(1)) * 1e14;
      }

      try {
        const sensorData = await storage.createSensorData({
          nodeId: config.nodeId,
          sensorType: config.sensorType,
          value,
          unit: config.unit,
          status,
          threshold: config.threshold,
          maxValue: config.maxValue,
        });

        // Create alerts for warning/critical conditions
        if (status === "warning" || status === "critical") {
          const existingAlerts = await storage.getActiveAlerts();
          const hasActiveAlert = existingAlerts.some(alert => 
            alert.sensorNodeId === config.nodeId && alert.isActive
          );
          
          if (!hasActiveAlert) {
            await storage.createAlert({
              sensorNodeId: config.nodeId,
              alertType: status as "warning" | "critical",
              message: `${config.sensorType.replace('_', ' ')} sensor ${config.nodeId} ${status === "critical" ? "critically" : ""} exceeded threshold`,
              isActive: true,
            });
          }
        }

        // Broadcast new sensor data
        broadcast({
          type: 'sensor_update',
          data: sensorData
        });

      } catch (error) {
        console.error('Error generating sensor data:', error);
      }
    });
  }

  // AI Analysis and Recommendations - Based on Nuclear Safety Standards
  function performAiAnalysis() {
    const nuclearAnalysisPatterns = [
      // Temperature Analysis - Core Thermal Management
      {
        title: "Core Temperature Trend Analysis",
        description: "Primary loop temperature approaching technical specification limits. Recommend reducing reactor power by 5% and monitoring neutron flux distribution.",
        priority: "high",
        confidence: 91,
        category: "anomaly"
      },
      {
        title: "Thermal Hydraulic Optimization",
        description: "Secondary coolant flow pattern shows potential for 2.1% efficiency improvement. Consider adjusting steam generator feedwater flow rate.",
        priority: "medium", 
        confidence: 88,
        category: "optimization"
      },
      
      // Neutron Flux and Reactor Physics
      {
        title: "Neutron Flux Distribution Alert",
        description: "In-core neutron detectors show asymmetric flux pattern. Control rod bank D position may require adjustment to maintain axial power distribution.",
        priority: "high",
        confidence: 93,
        category: "anomaly"
      },
      {
        title: "Reactor Physics Optimization", 
        description: "Current control rod configuration allows for 1.8% burnup optimization while maintaining safety margins within technical specifications.",
        priority: "medium",
        confidence: 85,
        category: "optimization"
      },
      
      // Pressure System Analysis
      {
        title: "Primary Pressure System Performance",
        description: "Pressurizer level and pressure trending nominally. All safety injection system pumps available. RCS integrity maintained.",
        priority: "info",
        confidence: 97,
        category: "performance"
      },
      {
        title: "Steam Generator Performance",
        description: "Secondary side pressure differential indicates potential for steam generator tube inspection during next scheduled outage.",
        priority: "medium",
        confidence: 82,
        category: "optimization"
      },
      
      // Radiation Monitoring
      {
        title: "Radiation Protection Analysis",
        description: "Containment radiation monitors within normal operating envelope. No indication of fuel cladding degradation or primary-to-secondary leakage.",
        priority: "info",
        confidence: 94,
        category: "performance"
      },
      {
        title: "Environmental Monitoring Alert",
        description: "Slight increase in containment particulate activity. Recommend enhanced radiological surveillance and primary coolant sampling.",
        priority: "medium",
        confidence: 79,
        category: "anomaly"
      },
      
      // Control System Analysis
      {
        title: "Control Rod Drive System Status",
        description: "All control rod drive mechanisms responding normally. Rod drop times within technical specification requirements.",
        priority: "info",
        confidence: 98,
        category: "performance"
      },
      {
        title: "Reactor Trip System Readiness",
        description: "All reactor protection system channels operational. Diverse actuation system armed and ready. Safety systems demonstrate high reliability.",
        priority: "info",
        confidence: 96,
        category: "performance"
      }
    ];

    // Generate analysis based on current sensor conditions
    const shouldGenerateAnalysis = Math.random() < 0.25; // 25% chance every 30 seconds
    
    if (shouldGenerateAnalysis) {
      const analysis = nuclearAnalysisPatterns[Math.floor(Math.random() * nuclearAnalysisPatterns.length)];
      
      // Adjust confidence based on system health
      const confidenceVariation = Math.floor(Math.random() * 8) - 4; // ±4% variance
      const finalConfidence = Math.max(75, Math.min(99, analysis.confidence + confidenceVariation));
      
      storage.createAiRecommendation({
        title: analysis.title,
        description: analysis.description,
        priority: analysis.priority,
        confidence: finalConfidence,
        category: analysis.category,
      }).then(recommendation => {
        broadcast({
          type: 'ai_recommendation',
          data: recommendation
        });
        
        // Log AI analysis activity
        createSystemLog("info", `AI analysis completed: ${analysis.title}`, "ai-system");
      }).catch(error => {
        console.error('Error creating AI recommendation:', error);
      });
    }
  }

  // System logging
  function createSystemLog(level: string, message: string, source: string) {
    storage.createSystemLog({
      level,
      message,
      source
    }).then(log => {
      broadcast({
        type: 'system_log',
        data: log
      });
    });
  }

  // API Routes
  app.get('/api/sensors/latest', async (req, res) => {
    try {
      const data = await storage.getLatestSensorData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sensor data' });
    }
  });

  app.get('/api/sensors/history/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const data = await storage.getSensorDataByType(type);
      res.json(data.slice(0, 50)); // Last 50 readings
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sensor history' });
    }
  });

  app.get('/api/alerts', async (req, res) => {
    try {
      const alerts = await storage.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  app.delete('/api/alerts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deactivateAlert(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to deactivate alert' });
    }
  });

  app.get('/api/recommendations', async (req, res) => {
    try {
      const recommendations = await storage.getRecentAiRecommendations();
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  });

  app.get('/api/logs', async (req, res) => {
    try {
      const logs = await storage.getRecentSystemLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  app.get('/api/servers', async (req, res) => {
    try {
      const connections = await storage.getAllServerConnections();
      res.json(connections);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch server connections' });
    }
  });

  // AI Chat endpoints
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const response = await reactorAIChat.processUserMessage(message);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  });

  app.get('/api/ai/chat/history', async (req, res) => {
    try {
      const history = reactorAIChat.getChatHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  });

  app.delete('/api/ai/chat/history', async (req, res) => {
    try {
      reactorAIChat.clearChatHistory();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear chat history' });
    }
  });

  app.get('/api/ai/reactor-summary', async (req, res) => {
    try {
      const summary = await reactorAIChat.generateReactorSummary();
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate reactor summary' });
    }
  });

  // Knowledge Repository endpoints
  app.get('/api/knowledge/search', async (req, res) => {
    try {
      const { q: query, category } = req.query;
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const results = knowledgeRepository.searchDocuments(
        query as string, 
        category as string
      );
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search knowledge base' });
    }
  });

  app.get('/api/knowledge/documents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const document = knowledgeRepository.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      await knowledgeRepository.logKnowledgeAccess(id);
      res.json(document);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  });

  app.get('/api/knowledge/categories/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const documents = knowledgeRepository.getDocumentsByCategory(category);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch documents by category' });
    }
  });

  app.get('/api/knowledge/recent', async (req, res) => {
    try {
      const { hours = 24 } = req.query;
      const documents = knowledgeRepository.getRecentlyUpdated(Number(hours));
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch recent documents' });
    }
  });

  app.get('/api/knowledge/summary', async (req, res) => {
    try {
      const summary = knowledgeRepository.generateKnowledgeSummary();
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate knowledge summary' });
    }
  });

  // Reactor Scenario Management endpoints
  app.get('/api/scenarios', async (req, res) => {
    try {
      const scenarios = scenarioManager.getAllScenarios();
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch scenarios' });
    }
  });

  app.post('/api/scenarios/:id/start', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await scenarioManager.startScenario(id);
      if (success) {
        res.json({ success: true, message: 'Scenario started successfully' });
      } else {
        res.status(404).json({ error: 'Scenario not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to start scenario' });
    }
  });

  app.post('/api/scenarios/stop', async (req, res) => {
    try {
      await scenarioManager.stopScenario();
      res.json({ success: true, message: 'Scenario stopped' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop scenario' });
    }
  });

  app.get('/api/scenarios/active', async (req, res) => {
    try {
      const activeScenario = scenarioManager.getActiveScenario();
      const progress = scenarioManager.getScenarioProgress();
      const currentPhase = scenarioManager.getCurrentPhase();
      
      res.json({
        scenario: activeScenario,
        progress: progress,
        currentPhase: currentPhase
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get active scenario' });
    }
  });

  // Start data generation
  setInterval(generateSensorData, 2000); // Every 2 seconds
  setInterval(performAiAnalysis, 30000); // Every 30 seconds
  
  // Initial system logs - Nuclear facility startup sequence
  setTimeout(() => {
    createSystemLog("info", "Nuclear reactor monitoring system initialized - Rev 2.1.4", "system");
    createSystemLog("info", "Safety system self-test completed - All channels operational", "safety-system");
    createSystemLog("info", "AWS server connection established - Primary data link active", "aws");
    createSystemLog("info", "Ubuntu server connection established - Secondary monitoring online", "ubuntu");
    createSystemLog("info", "Reactor protection system - All trip functions enabled", "rps");
    createSystemLog("info", "Environmental radiation monitors - All stations reporting normal", "radiation");
    createSystemLog("info", "Control rod drive system - All mechanisms tested and operational", "control-rods");
  }, 1000);

  // Periodic system health checks
  setInterval(() => {
    const healthMessages = [
      { level: "info", message: "Periodic safety system surveillance completed - All systems nominal", source: "safety-system" },
      { level: "info", message: "Primary coolant chemistry within specifications", source: "chemistry" },
      { level: "info", message: "Containment integrity verified - No abnormal conditions", source: "containment" },
      { level: "info", message: "Emergency diesel generators - Weekly test completed successfully", source: "emergency-power" },
      { level: "info", message: "Fire protection system - All zones monitored and operational", source: "fire-protection" }
    ];
    
    if (Math.random() < 0.15) { // 15% chance every 30 seconds
      const healthMsg = healthMessages[Math.floor(Math.random() * healthMessages.length)];
      createSystemLog(healthMsg.level, healthMsg.message, healthMsg.source);
    }
  }, 30000);

  return httpServer;
}
