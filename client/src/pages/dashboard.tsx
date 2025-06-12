import { useEffect, useState } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import SensorCard from "@/components/sensor-card";
import TemperatureChart from "@/components/temperature-chart";
import AiRecommendations from "@/components/ai-recommendations";
import SystemLogs from "@/components/system-logs";
import ReactorLayout from "@/components/reactor-layout";
import Reactor3DView from "@/components/reactor-3d-view";
import SecurityCameras from "@/components/security-cameras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebSocket } from "@/lib/websocket";
import { AlertTriangle, X, Camera, Eye, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import type { SensorData, Alert, AiRecommendation, SystemLog, ServerConnection } from "@shared/schema";

export default function Dashboard() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [serverConnections, setServerConnections] = useState<ServerConnection[]>([]);
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [, navigate] = useLocation();

  const { isConnected } = useWebSocket({
    onMessage: (data) => {
      switch (data.type) {
        case 'initial_data':
          setSensorData(data.sensorData || []);
          setAlerts(data.alerts || []);
          setRecommendations(data.recommendations || []);
          setLogs(data.logs || []);
          setServerConnections(data.serverConnections || []);
          break;
        case 'sensor_update':
          setSensorData(data.sensorData || []);
          break;
        case 'alert_update':
          setAlerts(data.alerts || []);
          const newActiveAlert = data.alerts?.find((a: Alert) => a.isActive && !currentAlert);
          if (newActiveAlert) {
            setCurrentAlert(newActiveAlert);
          }
          break;
        case 'recommendation_update':
          setRecommendations(data.recommendations || []);
          break;
        case 'log_update':
          setLogs(data.logs || []);
          break;
      }
    }
  });

  const sensorReadings = sensorData.map(sensor => ({
    nodeId: sensor.nodeId,
    sensorType: sensor.sensorType,
    value: sensor.value,
    unit: sensor.unit,
    status: sensor.status,
    timestamp: sensor.timestamp
  }));

  const activeAlerts = alerts.filter(a => a.isActive).length;

  const dismissAlert = () => {
    setCurrentAlert(null);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header 
        serverConnections={serverConnections}
        isConnected={isConnected}
      />
      
      <div className="flex h-screen pt-16">
        <Sidebar activeAlerts={activeAlerts} />
        
        <main className="flex-1 overflow-auto bg-dark-bg">
          {/* Alert Banner */}
          {currentAlert && (
            <div className="bg-status-warning/20 border-l-4 border-status-warning p-4 m-6 rounded-r-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-status-warning" />
                  <span className="font-medium">{currentAlert.message}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissAlert}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Enhanced Dashboard with Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="3d-core">3D Core</TabsTrigger>
                <TabsTrigger value="security">Security Cameras</TabsTrigger>
                <TabsTrigger value="grid">Grid Integration</TabsTrigger>
                <TabsTrigger value="emergency">Emergency</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Interactive Reactor Layout */}
                <ReactorLayout 
                  sensorData={sensorData}
                  onSensorSelect={(sensor) => {
                    navigate(`/sensors?node=${sensor.nodeId}`);
                  }}
                  onZoneSelect={(zone) => {
                    setSelectedZone(zone);
                  }}
                />

                {/* System Overview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-dark-surface border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Active Sensors</p>
                        <p className="text-2xl font-bold text-primary">{sensorData.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-dark-surface border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Active Alerts</p>
                        <p className="text-2xl font-bold text-status-warning">{activeAlerts}</p>
                      </div>
                      <div className="w-12 h-12 bg-status-warning/20 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-status-warning" />
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-dark-surface border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Reactor Power</p>
                        <p className="text-2xl font-bold text-status-success">96.8%</p>
                      </div>
                      <div className="w-12 h-12 bg-status-success/20 rounded-lg flex items-center justify-center">
                        <Zap className="w-6 h-6 text-status-success" />
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-dark-surface border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Connected Servers</p>
                        <p className="text-2xl font-bold text-primary">{serverConnections.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Sensor Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sensorReadings.slice(0, 6).map((sensor) => (
                    <SensorCard key={sensor.nodeId} sensor={sensor} />
                  ))}
                </div>

                {/* Charts and Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TemperatureChart sensorData={sensorData} />
                  <AiRecommendations recommendations={recommendations} />
                </div>

                {/* System Logs */}
                <SystemLogs logs={logs} />
              </TabsContent>

              {/* 3D Core Visualization */}
              <TabsContent value="3d-core" className="space-y-6">
                <Reactor3DView sensorData={sensorData} />
                
                {/* Core Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Neutron Flux Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Peak Flux:</span>
                          <span className="font-mono">{(sensorData.find(s => s.sensorType === 'neutron_flux')?.value / 1e14)?.toFixed(2) || '2.85'}e14</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average:</span>
                          <span className="font-mono">2.35e14</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hot Spot Factor:</span>
                          <span className="font-mono">1.65</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-red-500" />
                        Core Temperature Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Hot Channel:</span>
                          <span className="font-mono">{sensorData.find(s => s.sensorType === 'temperature')?.value?.toFixed(1) || '582.3'}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average:</span>
                          <span className="font-mono">565.2°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delta T:</span>
                          <span className="font-mono">17.1°C</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-blue-500" />
                        Fuel Assembly Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Assemblies:</span>
                          <span className="font-mono">193</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fresh Fuel:</span>
                          <span className="font-mono">64</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Burnup (avg):</span>
                          <span className="font-mono">35.2 GWd/MTU</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Security Cameras */}
              <TabsContent value="security" className="space-y-6">
                <SecurityCameras sensorData={sensorData} />
              </TabsContent>

              {/* Grid Integration */}
              <TabsContent value="grid" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-green-500" />
                        Electrical Grid Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-surface rounded p-3">
                          <div className="text-sm text-muted-foreground">Gross Output</div>
                          <div className="text-2xl font-bold text-green-500">1,200 MW</div>
                        </div>
                        <div className="bg-dark-surface rounded p-3">
                          <div className="text-sm text-muted-foreground">Net Output</div>
                          <div className="text-2xl font-bold text-green-500">1,150 MW</div>
                        </div>
                        <div className="bg-dark-surface rounded p-3">
                          <div className="text-sm text-muted-foreground">Grid Frequency</div>
                          <div className="text-xl font-bold">60.0 Hz</div>
                        </div>
                        <div className="bg-dark-surface rounded p-3">
                          <div className="text-sm text-muted-foreground">Load Factor</div>
                          <div className="text-xl font-bold">96.8%</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Main Generator</span>
                            <span className="text-green-500">Online</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '97%' }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Grid Synchronization</span>
                            <span className="text-green-500">Synchronized</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Transmission Lines</span>
                            <span className="text-green-500">4/4 Active</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            <div className="bg-green-500 h-2 rounded"></div>
                            <div className="bg-green-500 h-2 rounded"></div>
                            <div className="bg-green-500 h-2 rounded"></div>
                            <div className="bg-green-500 h-2 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Load Following & Demand
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-dark-surface rounded p-4">
                        <div className="text-sm text-muted-foreground mb-2">Current Grid Demand</div>
                        <div className="text-3xl font-bold text-blue-400">45,780 MW</div>
                        <div className="text-sm text-green-500">↑ 2.3% from yesterday</div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Peak Demand Today</span>
                            <span>47,230 MW (14:30)</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Load Following Mode</span>
                            <Badge className="bg-green-500 text-white">Active</Badge>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Reactor Power Level</span>
                            <span>96.8% of Rated</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '97%' }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Reserve Margin</span>
                            <span className="text-green-500">18.5%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Emergency Procedures */}
              <TabsContent value="emergency" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Emergency Action Levels
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg border-green-500 bg-green-500/10">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-green-400">Normal Operations</span>
                            <Badge className="bg-green-500 text-white">Current</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            All systems operating within normal parameters
                          </p>
                        </div>

                        <div className="p-3 border rounded-lg border-blue-500 bg-blue-500/10">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-blue-400">Notification of Unusual Event</span>
                            <Badge variant="outline">NOUE</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Potential degradation in plant safety level
                          </p>
                        </div>

                        <div className="p-3 border rounded-lg border-yellow-500 bg-yellow-500/10">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-yellow-400">Alert</span>
                            <Badge className="bg-yellow-500 text-white">AL</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Substantial degradation in plant safety functions
                          </p>
                        </div>

                        <div className="p-3 border rounded-lg border-orange-500 bg-orange-500/10">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-orange-400">Site Area Emergency</span>
                            <Badge className="bg-orange-500 text-white">SAE</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Major failure of plant safety functions
                          </p>
                        </div>

                        <div className="p-3 border rounded-lg border-red-500 bg-red-500/10">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-red-400">General Emergency</span>
                            <Badge className="bg-red-500 text-white">GE</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Substantial core degradation with potential for loss of containment
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Critical Safety Functions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-dark-surface rounded">
                          <div>
                            <div className="font-medium">Subcriticality</div>
                            <div className="text-sm text-muted-foreground">Reactor shutdown status</div>
                          </div>
                          <Badge className="bg-green-500 text-white">SATISFIED</Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-dark-surface rounded">
                          <div>
                            <div className="font-medium">Core Cooling</div>
                            <div className="text-sm text-muted-foreground">Adequate heat removal</div>
                          </div>
                          <Badge className="bg-green-500 text-white">SATISFIED</Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-dark-surface rounded">
                          <div>
                            <div className="font-medium">Heat Sink</div>
                            <div className="text-sm text-muted-foreground">Ultimate heat sink availability</div>
                          </div>
                          <Badge className="bg-green-500 text-white">SATISFIED</Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-dark-surface rounded">
                          <div>
                            <div className="font-medium">RCS Integrity</div>
                            <div className="text-sm text-muted-foreground">Primary system pressure boundary</div>
                          </div>
                          <Badge className="bg-green-500 text-white">SATISFIED</Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-dark-surface rounded">
                          <div>
                            <div className="font-medium">Containment</div>
                            <div className="text-sm text-muted-foreground">Containment integrity</div>
                          </div>
                          <Badge className="bg-green-500 text-white">SATISFIED</Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-dark-surface rounded">
                          <div>
                            <div className="font-medium">Inventory Control</div>
                            <div className="text-sm text-muted-foreground">Radioactivity control</div>
                          </div>
                          <Badge className="bg-green-500 text-white">SATISFIED</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}