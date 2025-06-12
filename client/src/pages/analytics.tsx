import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/lib/websocket";
import { Brain, TrendingUp, AlertTriangle, Activity, Zap, Thermometer, Droplets, Settings2 } from "lucide-react";
import type { AiRecommendation, SensorData } from "@shared/schema";

export default function AnalyticsPage() {
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);

  const { isConnected } = useWebSocket({
    onMessage: (data) => {
      switch (data.type) {
        case 'initial_data':
          setRecommendations(data.recommendations || []);
          setSensorData(data.sensorData || []);
          break;
        case 'ai_recommendation':
          setRecommendations(prev => [data.data, ...prev.slice(0, 9)]);
          break;
        case 'sensor_update':
          setSensorData(prev => {
            const filtered = prev.filter(s => s.nodeId !== data.data.nodeId);
            return [data.data, ...filtered];
          });
          break;
      }
    }
  });

  // Get latest sensor readings for plant diagram
  const latestSensors = sensorData.reduce((acc, sensor) => {
    if (!acc[sensor.nodeId] || sensor.timestamp > acc[sensor.nodeId].timestamp) {
      acc[sensor.nodeId] = sensor;
    }
    return acc;
  }, {} as Record<string, SensorData>);

  const getFlowColor = (value: number, threshold: number, maxValue?: number) => {
    if (!maxValue) return "#4CAF50";
    const percentage = (value / maxValue) * 100;
    if (percentage > 90) return "#F44336";
    if (percentage > 75) return "#FF9800";
    return "#4CAF50";
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 590) return "#F44336";
    if (temp > 580) return "#FF9800";
    return "#4CAF50";
  };

  const PlantDiagram = () => {
    const coreTemp = latestSensors["CORE-TEMP-01"]?.value || 580;
    const primaryPressure = latestSensors["PRES-PRI-01"]?.value || 15.5;
    const secondaryPressure = latestSensors["PRES-SEC-01"]?.value || 7.0;
    const primaryFlow = latestSensors["COOL-PRI-01"]?.value || 1247;
    const secondaryFlow = latestSensors["COOL-SEC-01"]?.value || 890;
    const neutronFlux = latestSensors["NEUT-FLUX-01"]?.value || 2.8e14;
    const controlRods = latestSensors["CTRL-ROD-01"]?.value || 68;

    return (
      <div className="relative bg-dark-card rounded-lg p-8 border border-gray-700">
        <svg viewBox="0 0 800 600" className="w-full h-96">
          {/* Primary Loop */}
          <g id="primary-loop">
            {/* Reactor Vessel */}
            <rect x="50" y="200" width="120" height="160" rx="10" 
                  fill="#2D2D2D" stroke={getTemperatureColor(coreTemp)} strokeWidth="3"/>
            <text x="110" y="270" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
              REACTOR
            </text>
            <text x="110" y="285" textAnchor="middle" fill="white" fontSize="10">
              CORE
            </text>
            
            {/* Core Temperature Indicator */}
            <circle cx="110" cy="300" r="8" fill={getTemperatureColor(coreTemp)}/>
            <text x="110" y="320" textAnchor="middle" fill="white" fontSize="8">
              {coreTemp.toFixed(1)}°C
            </text>

            {/* Control Rods */}
            <rect x="70" y="180" width="4" height="40" fill="#888" rx="2"/>
            <rect x="90" y="180" width="4" height="40" fill="#888" rx="2"/>
            <rect x="110" y="180" width="4" height="40" fill="#888" rx="2"/>
            <rect x="130" y="180" width="4" height="40" fill="#888" rx="2"/>
            <rect x="150" y="180" width="4" height="40" fill="#888" rx="2"/>
            <text x="110" y="175" textAnchor="middle" fill="white" fontSize="8">
              Control Rods: {controlRods.toFixed(1)}%
            </text>

            {/* Steam Generator */}
            <rect x="300" y="150" width="80" height="200" rx="40" 
                  fill="#2D2D2D" stroke="#4CAF50" strokeWidth="2"/>
            <text x="340" y="245" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
              STEAM
            </text>
            <text x="340" y="260" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
              GEN
            </text>

            {/* Primary Flow Lines */}
            <path d="M170 250 Q 235 250 300 200" 
                  stroke={getFlowColor(primaryFlow, 1180, 1400)} 
                  strokeWidth="6" fill="none" strokeDasharray="10,5">
              <animate attributeName="stroke-dashoffset" values="0;-15" dur="1s" repeatCount="indefinite"/>
            </path>
            <path d="M300 300 Q 235 300 170 320" 
                  stroke={getFlowColor(primaryFlow, 1180, 1400)} 
                  strokeWidth="6" fill="none" strokeDasharray="10,5">
              <animate attributeName="stroke-dashoffset" values="0;-15" dur="1.2s" repeatCount="indefinite"/>
            </path>

            {/* Primary Pump */}
            <circle cx="200" cy="350" r="25" fill="#2D2D2D" stroke="#1976D2" strokeWidth="2"/>
            <text x="200" y="355" textAnchor="middle" fill="white" fontSize="10">PUMP</text>
            <text x="200" y="385" textAnchor="middle" fill="white" fontSize="8">
              {primaryFlow.toFixed(0)} L/s
            </text>

            {/* Pressurizer */}
            <rect x="450" y="100" width="60" height="120" rx="30" 
                  fill="#2D2D2D" stroke="#FF9800" strokeWidth="2"/>
            <text x="480" y="155" textAnchor="middle" fill="white" fontSize="10">PRES</text>
            <text x="480" y="170" textAnchor="middle" fill="white" fontSize="8">
              {primaryPressure.toFixed(1)} MPa
            </text>
          </g>

          {/* Secondary Loop */}
          <g id="secondary-loop">
            {/* Secondary Flow Lines */}
            <path d="M380 180 Q 450 120 520 120" 
                  stroke={getFlowColor(secondaryFlow, 850, 950)} 
                  strokeWidth="4" fill="none" strokeDasharray="8,4">
              <animate attributeName="stroke-dashoffset" values="0;-12" dur="0.8s" repeatCount="indefinite"/>
            </path>
            <path d="M520 180 Q 450 240 380 240" 
                  stroke={getFlowColor(secondaryFlow, 850, 950)} 
                  strokeWidth="4" fill="none" strokeDasharray="8,4">
              <animate attributeName="stroke-dashoffset" values="0;-12" dur="0.9s" repeatCount="indefinite"/>
            </path>

            {/* Turbine */}
            <polygon points="550,100 600,120 600,160 550,180 520,150 520,130" 
                     fill="#2D2D2D" stroke="#4CAF50" strokeWidth="2"/>
            <text x="560" y="145" textAnchor="middle" fill="white" fontSize="10">TURBINE</text>

            {/* Generator */}
            <rect x="620" y="120" width="60" height="40" rx="5" 
                  fill="#2D2D2D" stroke="#1976D2" strokeWidth="2"/>
            <text x="650" y="145" textAnchor="middle" fill="white" fontSize="10">GEN</text>

            {/* Condenser */}
            <rect x="520" y="250" width="100" height="60" rx="10" 
                  fill="#2D2D2D" stroke="#4CAF50" strokeWidth="2"/>
            <text x="570" y="285" textAnchor="middle" fill="white" fontSize="10">CONDENSER</text>

            {/* Secondary Pump */}
            <circle cx="450" cy="280" r="20" fill="#2D2D2D" stroke="#1976D2" strokeWidth="2"/>
            <text x="450" y="285" textAnchor="middle" fill="white" fontSize="8">PUMP</text>
            <text x="450" y="305" textAnchor="middle" fill="white" fontSize="8">
              {secondaryFlow.toFixed(0)} L/s
            </text>
          </g>

          {/* Containment Structure */}
          <ellipse cx="280" cy="280" rx="200" ry="150" 
                   fill="none" stroke="#666" strokeWidth="2" strokeDasharray="5,5"/>
          <text x="280" y="450" textAnchor="middle" fill="#666" fontSize="12">
            CONTAINMENT STRUCTURE
          </text>

          {/* Neutron Flux Indicator */}
          <g id="neutron-flux">
            <circle cx="110" cy="230" r="15" fill="none" stroke="#FF9800" strokeWidth="2">
              <animate attributeName="r" values="15;20;15" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
            </circle>
            <text x="140" y="235" fill="white" fontSize="8">
              Neutron Flux: {(neutronFlux/1e14).toFixed(1)}×10¹⁴
            </text>
          </g>

          {/* Status Indicators */}
          <g id="status-indicators">
            <text x="50" y="30" fill="white" fontSize="14" fontWeight="bold">
              REACTOR SYSTEMS STATUS
            </text>
            
            <circle cx="70" cy="50" r="5" fill={getTemperatureColor(coreTemp)}/>
            <text x="85" y="55" fill="white" fontSize="10">Core Temperature</text>
            
            <circle cx="200" cy="50" r="5" fill={getFlowColor(primaryFlow, 1180, 1400)}/>
            <text x="215" y="55" fill="white" fontSize="10">Primary Flow</text>
            
            <circle cx="320" cy="50" r="5" fill={getFlowColor(secondaryFlow, 850, 950)}/>
            <text x="335" y="55" fill="white" fontSize="10">Secondary Flow</text>
          </g>
        </svg>
      </div>
    );
  };

  const getPriorityIcon = (priority: string, category: string) => {
    if (category === "anomaly") return <AlertTriangle className="h-5 w-5 text-status-warning" />;
    if (category === "optimization") return <TrendingUp className="h-5 w-5 text-primary-blue" />;
    return <Activity className="h-5 w-5 text-status-normal" />;
  };

  const getPriorityColors = (priority: string, category: string) => {
    if (category === "anomaly") return { bg: "bg-status-warning/20", border: "border-status-warning" };
    if (category === "optimization") return { bg: "bg-primary-blue/20", border: "border-primary-blue" };
    return { bg: "bg-status-normal/20", border: "border-status-normal" };
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="flex h-screen pt-16">
        <main className="flex-1 overflow-auto bg-dark-bg p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <Brain className="h-8 w-8 text-primary-blue mr-3" />
                  AI Analysis & System Visualization
                </h1>
                <p className="text-gray-400 mt-1">
                  Advanced reactor analysis with real-time system interconnection monitoring
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-status-normal animate-pulse-gentle' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-gray-400">
                  {isConnected ? 'AI Analysis Active' : 'Connecting...'}
                </span>
              </div>
            </div>

            {/* Analysis Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <Brain className="h-8 w-8 text-primary-blue" />
                  <div>
                    <p className="text-sm text-gray-400">AI Recommendations</p>
                    <p className="text-2xl font-bold text-primary-blue">{recommendations.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-status-warning" />
                  <div>
                    <p className="text-sm text-gray-400">Anomalies Detected</p>
                    <p className="text-2xl font-bold text-status-warning">
                      {recommendations.filter(r => r.category === "anomaly").length}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-8 w-8 text-status-normal" />
                  <div>
                    <p className="text-sm text-gray-400">Optimizations</p>
                    <p className="text-2xl font-bold text-status-normal">
                      {recommendations.filter(r => r.category === "optimization").length}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <Zap className="h-8 w-8 text-primary-blue" />
                  <div>
                    <p className="text-sm text-gray-400">Avg Confidence</p>
                    <p className="text-2xl font-bold text-primary-blue">
                      {recommendations.length > 0 
                        ? Math.round(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length)
                        : 0}%
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Plant System Diagram */}
            <Card className="bg-dark-surface border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings2 className="h-6 w-6 text-primary-blue mr-2" />
                Real-Time Plant Systems Visualization
              </h2>
              <PlantDiagram />
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Normal Operation</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Warning Threshold</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Critical Level</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* AI Recommendations */}
            <Card className="bg-dark-surface border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Brain className="h-6 w-6 text-primary-blue mr-2" />
                Latest AI Analysis Results
              </h2>
              <div className="space-y-4">
                {recommendations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>AI analysis in progress...</p>
                    <p className="text-sm mt-1">Recommendations will appear here</p>
                  </div>
                ) : (
                  recommendations.slice(0, 6).map((recommendation) => {
                    const colors = getPriorityColors(recommendation.priority, recommendation.category);
                    
                    return (
                      <div
                        key={recommendation.id}
                        className={`${colors.bg} border-l-4 ${colors.border} p-4 rounded-r`}
                      >
                        <div className="flex items-start space-x-3">
                          {getPriorityIcon(recommendation.priority, recommendation.category)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium">{recommendation.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {recommendation.category.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">
                              {recommendation.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                Confidence: {Math.round(recommendation.confidence)}% | 
                                Priority: {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(recommendation.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}