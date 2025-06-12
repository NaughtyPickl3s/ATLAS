import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BreadcrumbNav from "@/components/breadcrumb-nav";
import ReactorLayout from "@/components/reactor-layout";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { useWebSocket } from "@/lib/websocket";
import { Thermometer, Activity, MapPin, Wifi, AlertCircle, CheckCircle2, Clock, Search, Filter, Gauge, Zap, Shield, Wrench } from "lucide-react";
import { useLocation } from "wouter";
import type { SensorData, ServerConnection, Alert } from "@shared/schema";

export default function SensorsPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [serverConnections, setServerConnections] = useState<ServerConnection[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');
  const [location] = useLocation();
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const selectedNodeId = urlParams.get('node');
  const zoneFilter = urlParams.get('zone');

  const { isConnected } = useWebSocket({
    onMessage: (data) => {
      switch (data.type) {
        case 'initial_data':
          setSensorData(data.sensorData || []);
          setServerConnections(data.serverConnections || []);
          setAlerts(data.alerts || []);
          break;
        case 'sensor_update':
          setSensorData(prev => {
            const filtered = prev.filter(s => s.nodeId !== data.data.nodeId);
            return [data.data, ...filtered];
          });
          break;
        case 'alert_update':
          setAlerts(data.alerts || []);
          break;
      }
    }
  });

  // Apply URL-based filters
  useEffect(() => {
    if (zoneFilter) {
      setSelectedZone(zoneFilter);
    }
  }, [zoneFilter]);

  // Filter sensors based on search and selections
  const filteredSensors = sensorData.filter(sensor => {
    const matchesSearch = sensor.nodeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sensor.sensorType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || sensor.sensorType === selectedType;
    const matchesStatus = selectedStatus === 'all' || sensor.status === selectedStatus;
    
    // Zone-based filtering (simplified mapping)
    const sensorZone = getSensorZone(sensor.nodeId);
    const matchesZone = selectedZone === 'all' || sensorZone === selectedZone;
    
    return matchesSearch && matchesType && matchesStatus && matchesZone;
  });

  // Highlight selected sensor
  const highlightedSensor = selectedNodeId ? 
    sensorData.find(s => s.nodeId === selectedNodeId) : null;

  // Get sensor zone mapping
  function getSensorZone(nodeId: string): string {
    if (nodeId.includes('CORE') || nodeId.includes('NEUTRON') || nodeId.includes('CONTROL-ROD')) {
      return 'reactor-core';
    } else if (nodeId.includes('PRIMARY') || nodeId.includes('COOLANT')) {
      return 'primary-loop';
    } else if (nodeId.includes('STEAM')) {
      return 'steam-generator';
    } else if (nodeId.includes('RAD-MONITOR')) {
      return 'containment';
    }
    return 'containment';
  }

  // Group sensors by server location
  const awsSensors = filteredSensors.filter(sensor => sensor.nodeId.includes("01"));
  const ubuntuSensors = filteredSensors.filter(sensor => sensor.nodeId.includes("02"));

  // Get sensor icon
  const getSensorIcon = (sensorType: string) => {
    switch (sensorType.toLowerCase()) {
      case 'temperature': return Thermometer;
      case 'pressure': return Gauge;
      case 'neutron_flux': return Zap;
      case 'radiation': return Shield;
      case 'control_rods': return Wrench;
      default: return Activity;
    }
  };

  // Get active alerts count
  const activeAlerts = alerts.filter(a => a.isActive).length;

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Sensor Nodes', href: '/sensors', current: !selectedNodeId && !zoneFilter },
  ];

  if (zoneFilter) {
    breadcrumbItems.push({ 
      label: `${zoneFilter.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Zone`, 
      href: `/sensors?zone=${zoneFilter}`,
      current: !selectedNodeId 
    });
  }

  if (selectedNodeId) {
    breadcrumbItems.push({ 
      label: selectedNodeId,
      href: `/sensors?node=${selectedNodeId}`, 
      current: true 
    });
  }

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
              <h1 className="text-3xl font-bold tracking-tight">Sensor Node Management</h1>
              <p className="text-muted-foreground">
                Monitor and manage nuclear reactor sensor instrumentation
              </p>
            </div>

            {/* Highlighted Sensor (if selected via URL) */}
            {highlightedSensor && (
              <Card className="bg-blue-900/20 border-blue-500">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      {(() => {
                        const Icon = getSensorIcon(highlightedSensor.sensorType);
                        return <Icon className="h-5 w-5 text-white" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{highlightedSensor.nodeId}</h3>
                      <p className="text-sm text-muted-foreground">
                        {highlightedSensor.sensorType.replace('_', ' ').toUpperCase()} Sensor
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      Selected
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Value</p>
                      <p className="text-xl font-bold">
                        {highlightedSensor.value}{highlightedSensor.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={
                        highlightedSensor.status === 'normal' ? 'bg-green-500' :
                        highlightedSensor.status === 'warning' ? 'bg-yellow-500' :
                        highlightedSensor.status === 'critical' ? 'bg-red-500' :
                        'bg-gray-500'
                      }>
                        {highlightedSensor.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Zone</p>
                      <p className="font-medium">
                        {getSensorZone(highlightedSensor.nodeId).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Update</p>
                      <p className="font-medium">
                        {new Date(highlightedSensor.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Interactive Reactor Layout */}
            <ReactorLayout 
              sensorData={sensorData}
              onSensorSelect={(sensor) => {
                window.history.pushState({}, '', `/sensors?node=${sensor.nodeId}`);
              }}
              onZoneSelect={(zone) => {
                setSelectedZone(zone);
                if (zone !== 'all') {
                  window.history.pushState({}, '', `/sensors?zone=${zone}`);
                } else {
                  window.history.pushState({}, '', '/sensors');
                }
              }}
            />

            {/* Search and Filter Controls */}
            <Card>
              <div className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search sensors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sensor Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="temperature">Temperature</SelectItem>
                      <SelectItem value="pressure">Pressure</SelectItem>
                      <SelectItem value="neutron_flux">Neutron Flux</SelectItem>
                      <SelectItem value="radiation">Radiation</SelectItem>
                      <SelectItem value="control_rods">Control Rods</SelectItem>
                      <SelectItem value="coolant_flow">Coolant Flow</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedZone} onValueChange={setSelectedZone}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Zones</SelectItem>
                      <SelectItem value="reactor-core">Reactor Core</SelectItem>
                      <SelectItem value="primary-loop">Primary Loop</SelectItem>
                      <SelectItem value="steam-generator">Steam Generator</SelectItem>
                      <SelectItem value="containment">Containment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Sensor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSensors.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No sensors found</p>
                  <p>Try adjusting your search criteria</p>
                </div>
              ) : (
                filteredSensors.map((sensor) => {
                  const Icon = getSensorIcon(sensor.sensorType);
                  return (
                    <Card 
                      key={sensor.id} 
                      className={`cursor-pointer transition-all hover:scale-105 ${
                        selectedNodeId === sensor.nodeId ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => {
                        window.history.pushState({}, '', `/sensors?node=${sensor.nodeId}`);
                      }}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              sensor.status === 'normal' ? 'bg-green-500' :
                              sensor.status === 'warning' ? 'bg-yellow-500' :
                              sensor.status === 'critical' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{sensor.nodeId}</h3>
                              <p className="text-sm text-muted-foreground">
                                {sensor.sensorType.replace('_', ' ').toUpperCase()}
                              </p>
                            </div>
                          </div>
                          
                          <Badge className={
                            sensor.nodeId.includes('01') ? 'bg-blue-500' : 'bg-orange-500'
                          }>
                            {sensor.nodeId.includes('01') ? 'AWS' : 'Ubuntu'}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Value:</span>
                            <span className="font-medium">{sensor.value}{sensor.unit}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <Badge variant="outline" className={
                              sensor.status === 'normal' ? 'border-green-500 text-green-500' :
                              sensor.status === 'warning' ? 'border-yellow-500 text-yellow-500' :
                              sensor.status === 'critical' ? 'border-red-500 text-red-500' :
                              'border-gray-500 text-gray-500'
                            }>
                              {sensor.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Zone:</span>
                            <span className="text-sm font-medium">
                              {getSensorZone(sensor.nodeId).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Updated:</span>
                            <span className="text-sm">
                              {new Date(sensor.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  const getSensorTypeIcon = (sensorType: string) => {
    switch (sensorType) {
      case "temperature":
        return <Thermometer className="h-5 w-5" />;
      case "pressure":
        return <Activity className="h-5 w-5" />;
      case "radiation":
        return <AlertCircle className="h-5 w-5" />;
      case "coolant_flow":
        return <Activity className="h-5 w-5" />;
      case "neutron_flux":
        return <Activity className="h-5 w-5" />;
      case "control_rods":
        return <Activity className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "text-status-normal";
      case "warning":
        return "text-status-warning";
      case "critical":
        return "text-status-critical";
      default:
        return "text-gray-400";
    }
  };

  const formatValue = (value: number, unit: string, sensorType: string) => {
    if (sensorType === "neutron_flux") {
      return `${(value / 1e14).toFixed(1)}×10¹⁴ ${unit}`;
    }
    return `${value.toFixed(1)} ${unit}`;
  };

  const SensorCard = ({ sensor }: { sensor: SensorData }) => (
    <Card className="bg-dark-surface border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={getStatusColor(sensor.status)}>
            {getSensorTypeIcon(sensor.sensorType)}
          </div>
          <div>
            <h4 className="font-medium">{sensor.nodeId}</h4>
            <p className="text-sm text-gray-400 capitalize">
              {sensor.sensorType.replace("_", " ")}
            </p>
          </div>
        </div>
        <Badge 
          variant={sensor.status === "normal" ? "default" : "destructive"}
          className={sensor.status === "normal" ? "bg-status-normal" : 
                    sensor.status === "warning" ? "bg-status-warning" : "bg-status-critical"}
        >
          {sensor.status}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Value:</span>
          <span className="font-mono">{formatValue(sensor.value, sensor.unit, sensor.sensorType)}</span>
        </div>
        {sensor.threshold && (
          <div className="flex justify-between">
            <span className="text-gray-400">Threshold:</span>
            <span className="font-mono text-gray-300">
              {sensor.sensorType === "neutron_flux" 
                ? `${(sensor.threshold / 1e14).toFixed(1)}×10¹⁴ ${sensor.unit}`
                : `${sensor.threshold} ${sensor.unit}`
              }
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-400">Last Update:</span>
          <span className="text-sm">{new Date(sensor.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-700">
        <Button variant="outline" size="sm" className="w-full">
          Configure Sensor
        </Button>
      </div>
    </Card>
  );

  const ServerSection = ({ title, sensors, serverType, connectionStatus }: {
    title: string;
    sensors: SensorData[];
    serverType: string;
    connectionStatus: boolean;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connectionStatus ? 'bg-status-normal' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-400">
              {connectionStatus ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">{sensors.length} sensors</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map(sensor => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div>
    </div>
  );

  const awsConnected = serverConnections.find(conn => conn.serverType === "aws")?.status === "connected";
  const ubuntuConnected = serverConnections.find(conn => conn.serverType === "ubuntu")?.status === "connected";

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="flex h-screen pt-16">
        <main className="flex-1 overflow-auto bg-dark-bg p-6">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Sensor Node Management</h1>
                <p className="text-gray-400 mt-1">
                  Monitor and configure nuclear reactor instrumentation across server infrastructure
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Wifi className={`h-5 w-5 ${isConnected ? 'text-status-normal' : 'text-gray-500'}`} />
                <span className="text-sm">
                  {isConnected ? 'Real-time Data' : 'Connecting...'}
                </span>
              </div>
            </div>

            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-dark-surface border-gray-700 p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-8 w-8 text-status-normal" />
                  <div>
                    <p className="text-sm text-gray-400">Active Sensors</p>
                    <p className="text-xl font-bold">{sensorData.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-8 w-8 text-status-warning" />
                  <div>
                    <p className="text-sm text-gray-400">Warning Status</p>
                    <p className="text-xl font-bold">
                      {sensorData.filter(s => s.status === "warning").length}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-primary-blue" />
                  <div>
                    <p className="text-sm text-gray-400">Update Rate</p>
                    <p className="text-xl font-bold">2.0s</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-4">
                <div className="flex items-center space-x-3">
                  <Wifi className="h-8 w-8 text-status-normal" />
                  <div>
                    <p className="text-sm text-gray-400">Server Nodes</p>
                    <p className="text-xl font-bold">2</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* AWS Server Section */}
            <ServerSection
              title="AWS Server - Primary Monitoring"
              sensors={awsSensors}
              serverType="aws"
              connectionStatus={awsConnected}
            />

            {/* Ubuntu Server Section */}
            <ServerSection
              title="Ubuntu Server - Secondary Monitoring"
              sensors={ubuntuSensors}
              serverType="ubuntu"
              connectionStatus={ubuntuConnected}
            />
          </div>
        </main>
      </div>
    </div>
  );
}