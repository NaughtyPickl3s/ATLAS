import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import BreadcrumbNav from "@/components/breadcrumb-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebSocket } from "@/lib/websocket";
import { 
  Play, 
  Square, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Zap, 
  Flame, 
  Snowflake,
  Shield,
  Activity,
  FileText,
  Settings
} from "lucide-react";
import type { Alert as AlertType, ServerConnection } from "@shared/schema";

interface ReactorScenario {
  id: string;
  name: string;
  description: string;
  duration: number;
  phases: ScenarioPhase[];
  safeguards: string[];
  procedures: string[];
}

interface ScenarioPhase {
  name: string;
  duration: number;
  sensorModifications: SensorModification[];
  alertConditions: AlertCondition[];
  procedureSteps: string[];
}

interface SensorModification {
  nodeId: string;
  valueChange: number;
  statusChange?: string;
  reason: string;
}

interface AlertCondition {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  nodeId?: string;
  triggerCondition: string;
}

interface ActiveScenarioStatus {
  scenario: ReactorScenario | null;
  progress: { current: number; total: number; phase: string } | null;
  currentPhase: ScenarioPhase | null;
}

export default function ScenariosPage() {
  const [serverConnections, setServerConnections] = useState<ServerConnection[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const queryClient = useQueryClient();

  const { isConnected } = useWebSocket({
    onMessage: (data) => {
      switch (data.type) {
        case 'initial_data':
          setServerConnections(data.serverConnections || []);
          setAlerts(data.alerts || []);
          break;
        case 'alert_update':
          setAlerts(data.alerts || []);
          break;
      }
    }
  });

  // Fetch available scenarios
  const { data: scenarios = [] } = useQuery<ReactorScenario[]>({
    queryKey: ['/api/scenarios'],
  });

  // Fetch active scenario status
  const { data: activeStatus, refetch: refetchActiveStatus } = useQuery<ActiveScenarioStatus>({
    queryKey: ['/api/scenarios/active'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Start scenario mutation
  const startScenarioMutation = useMutation({
    mutationFn: async (scenarioId: string) => {
      const response = await fetch(`/api/scenarios/${scenarioId}/start`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to start scenario');
      return response.json();
    },
    onSuccess: () => {
      refetchActiveStatus();
    },
  });

  // Stop scenario mutation
  const stopScenarioMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/scenarios/stop', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to stop scenario');
      return response.json();
    },
    onSuccess: () => {
      refetchActiveStatus();
    },
  });

  const getScenarioIcon = (scenarioId: string) => {
    switch (scenarioId) {
      case 'refueling-outage': return Snowflake;
      case 'steam-line-break': return Flame;
      case 'station-blackout': return Zap;
      default: return Activity;
    }
  };

  const getScenarioColor = (scenarioId: string) => {
    switch (scenarioId) {
      case 'refueling-outage': return 'text-blue-500';
      case 'steam-line-break': return 'text-red-500';
      case 'station-blackout': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const activeAlerts = alerts.filter(a => a.isActive).length;

  const breadcrumbItems = [
    { label: 'Nuclear Scenarios', href: '/scenarios', current: true },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header 
        serverConnections={serverConnections}
        isConnected={isConnected}
      />
      
      <div className="flex h-screen pt-16">
        <Sidebar activeAlerts={activeAlerts} />
        
        <main className="flex-1 overflow-auto bg-dark-bg">
          <div className="p-6 space-y-6">
            {/* Breadcrumb Navigation */}
            <BreadcrumbNav items={breadcrumbItems} />

            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nuclear Reactor Scenarios</h1>
              <p className="text-muted-foreground">
                Simulate reactor operations, emergencies, and maintenance procedures
              </p>
            </div>

            {/* Active Scenario Status */}
            {activeStatus?.scenario && (
              <Alert className="border-blue-500 bg-blue-900/20">
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Active Scenario: {activeStatus.scenario.name}</span>
                      {activeStatus.progress && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          Phase {activeStatus.progress.current}/{activeStatus.progress.total}: {activeStatus.progress.phase}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => stopScenarioMutation.mutate()}
                      disabled={stopScenarioMutation.isPending}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stop Scenario
                    </Button>
                  </div>
                  {activeStatus.progress && (
                    <div className="mt-2">
                      <Progress 
                        value={(activeStatus.progress.current / activeStatus.progress.total) * 100} 
                        className="w-full"
                      />
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="available" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="available">Available Scenarios</TabsTrigger>
                <TabsTrigger value="active">Active Status</TabsTrigger>
                <TabsTrigger value="procedures">Emergency Procedures</TabsTrigger>
                <TabsTrigger value="safeguards">Safety Systems</TabsTrigger>
              </TabsList>

              {/* Available Scenarios */}
              <TabsContent value="available" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {scenarios.map((scenario) => {
                    const Icon = getScenarioIcon(scenario.id);
                    const colorClass = getScenarioColor(scenario.id);
                    
                    return (
                      <Card key={scenario.id} className="relative">
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-dark-surface ${colorClass}`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{scenario.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Duration: {Math.round(scenario.duration / 60)} hours
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {scenario.description}
                          </p>
                          
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Scenario Phases ({scenario.phases.length})</h4>
                            <div className="space-y-1">
                              {scenario.phases.slice(0, 3).map((phase, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <span>{phase.name}</span>
                                  <span className="text-muted-foreground">
                                    ({phase.duration} min)
                                  </span>
                                </div>
                              ))}
                              {scenario.phases.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{scenario.phases.length - 3} more phases...
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Key Procedures</h4>
                            <div className="flex flex-wrap gap-1">
                              {scenario.procedures.slice(0, 2).map((proc, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {proc.split(':')[0]}
                                </Badge>
                              ))}
                              {scenario.procedures.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{scenario.procedures.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button
                            className="w-full"
                            onClick={() => startScenarioMutation.mutate(scenario.id)}
                            disabled={startScenarioMutation.isPending || activeStatus?.scenario !== null}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Scenario
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Active Status */}
              <TabsContent value="active" className="space-y-6">
                {activeStatus?.scenario ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Phase Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Current Phase
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {activeStatus.currentPhase && (
                          <>
                            <div>
                              <h3 className="font-medium">{activeStatus.currentPhase.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Duration: {activeStatus.currentPhase.duration} minutes
                              </p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-2">Procedure Steps</h4>
                              <ScrollArea className="h-32">
                                <ul className="space-y-1">
                                  {activeStatus.currentPhase.procedureSteps.map((step, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ul>
                              </ScrollArea>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-2">Sensor Modifications</h4>
                              <ScrollArea className="h-24">
                                <div className="space-y-1">
                                  {activeStatus.currentPhase.sensorModifications.map((mod, index) => (
                                    <div key={index} className="text-xs bg-dark-surface p-2 rounded">
                                      <span className="font-medium">{mod.nodeId}</span>
                                      <span className="text-muted-foreground ml-2">
                                        {mod.valueChange > 0 ? '+' : ''}{mod.valueChange} - {mod.reason}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Scenario Progress */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Scenario Progress
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="font-medium">{activeStatus.scenario.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {activeStatus.scenario.description}
                          </p>
                        </div>

                        {activeStatus.progress && (
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Phase {activeStatus.progress.current} of {activeStatus.progress.total}</span>
                              <span>{Math.round((activeStatus.progress.current / activeStatus.progress.total) * 100)}%</span>
                            </div>
                            <Progress 
                              value={(activeStatus.progress.current / activeStatus.progress.total) * 100} 
                              className="w-full"
                            />
                          </div>
                        )}

                        <div>
                          <h4 className="text-sm font-medium mb-2">All Phases</h4>
                          <ScrollArea className="h-32">
                            <div className="space-y-2">
                              {activeStatus.scenario.phases.map((phase, index) => (
                                <div 
                                  key={index} 
                                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                                    activeStatus.progress && index < activeStatus.progress.current 
                                      ? 'bg-green-900/20 border border-green-500' 
                                      : activeStatus.progress && index === activeStatus.progress.current - 1
                                      ? 'bg-blue-900/20 border border-blue-500'
                                      : 'bg-dark-surface'
                                  }`}
                                >
                                  <div className={`w-3 h-3 rounded-full ${
                                    activeStatus.progress && index < activeStatus.progress.current 
                                      ? 'bg-green-500' 
                                      : activeStatus.progress && index === activeStatus.progress.current - 1
                                      ? 'bg-blue-500'
                                      : 'bg-gray-500'
                                  }`}></div>
                                  <span className="flex-1">{phase.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {phase.duration}m
                                  </span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Active Scenario</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        Select a scenario from the Available Scenarios tab to begin simulation
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Emergency Procedures */}
              <TabsContent value="procedures" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {scenarios.map((scenario) => (
                    <Card key={scenario.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {scenario.name} Procedures
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <div className="space-y-3">
                            {scenario.procedures.map((procedure, index) => (
                              <div key={index} className="p-3 bg-dark-surface rounded">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {procedure.split(':')[0]}
                                  </Badge>
                                </div>
                                <p className="text-sm">{procedure.split(':')[1]?.trim()}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Safety Systems */}
              <TabsContent value="safeguards" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {scenarios.map((scenario) => (
                    <Card key={scenario.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          {scenario.name} Safeguards
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <div className="space-y-2">
                            {scenario.safeguards.map((safeguard, index) => (
                              <div key={index} className="flex items-start gap-2 p-2 bg-dark-surface rounded">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{safeguard}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}