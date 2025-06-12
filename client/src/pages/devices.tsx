import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/lib/websocket";
import { Settings, Plus, Edit, Trash2, Wifi, WifiOff, HardDrive, Cpu, Thermometer, Activity, Shield, Power } from "lucide-react";
import type { ServerConnection } from "@shared/schema";

interface Device {
  id: string;
  name: string;
  type: "sensor" | "controller" | "monitor" | "safety_system";
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  status: "online" | "offline" | "maintenance" | "error";
  lastPing: Date;
  firmwareVersion: string;
  calibrationDate: Date;
  nextMaintenance: Date;
  specifications: Record<string, string>;
}

export default function DevicesPage() {
  const [serverConnections, setServerConnections] = useState<ServerConnection[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | Device["type"]>("all");

  const { isConnected } = useWebSocket({
    onMessage: (data) => {
      switch (data.type) {
        case 'initial_data':
          setServerConnections(data.serverConnections || []);
          break;
      }
    }
  });

  // Initialize mock devices for demonstration
  useEffect(() => {
    const mockDevices: Device[] = [
      {
        id: "dev-001",
        name: "Core Temperature Sensor LPRM-01",
        type: "sensor",
        manufacturer: "Reuter-Stokes",
        model: "RS-P4-0812-201",
        serialNumber: "RS2024001",
        location: "AWS Server - Reactor Core",
        status: "online",
        lastPing: new Date(Date.now() - 5000),
        firmwareVersion: "v2.4.1",
        calibrationDate: new Date("2024-01-15"),
        nextMaintenance: new Date("2024-07-15"),
        specifications: {
          "Operating Temperature": "-40°C to +650°C",
          "Pressure Rating": "17.5 MPa",
          "Response Time": "< 2 seconds",
          "Accuracy": "±0.1°C",
          "Safety Classification": "IEEE Class 1E"
        }
      },
      {
        id: "dev-002", 
        name: "Neutron Flux Detector MIC-01",
        type: "sensor",
        manufacturer: "Reuter-Stokes",
        model: "RS-C6-0904-105",
        serialNumber: "RS2024002",
        location: "Ubuntu Server - In-Core",
        status: "online",
        lastPing: new Date(Date.now() - 3000),
        firmwareVersion: "v3.1.0",
        calibrationDate: new Date("2024-02-01"),
        nextMaintenance: new Date("2024-08-01"),
        specifications: {
          "Neutron Sensitivity": "2.1 × 10⁻¹⁴ A/(n/cm²s)",
          "Gamma Rejection": "> 10⁴",
          "Operating Life": "> 20 years",
          "Burn-up Tolerance": "10²¹ n/cm²",
          "Temperature Range": "0°C to +700°C"
        }
      },
      {
        id: "dev-003",
        name: "Primary Pressure Transmitter", 
        type: "sensor",
        manufacturer: "Rosemount",
        model: "3051S-CD",
        serialNumber: "RM2024003",
        location: "AWS Server - Primary Loop",
        status: "online",
        lastPing: new Date(Date.now() - 7000),
        firmwareVersion: "v4.2.3",
        calibrationDate: new Date("2024-01-20"),
        nextMaintenance: new Date("2024-07-20"),
        specifications: {
          "Pressure Range": "0-20 MPa",
          "Accuracy": "±0.075%",
          "Output Signal": "4-20 mA HART",
          "Process Temperature": "-40°C to +121°C",
          "Safety Certification": "SIL 2/3"
        }
      },
      {
        id: "dev-004",
        name: "Control Rod Drive Controller",
        type: "controller", 
        manufacturer: "Westinghouse",
        model: "CRDM-7300",
        serialNumber: "WH2024004",
        location: "AWS Server - Control System",
        status: "online",
        lastPing: new Date(Date.now() - 2000),
        firmwareVersion: "v5.1.2",
        calibrationDate: new Date("2024-02-10"),
        nextMaintenance: new Date("2024-08-10"),
        specifications: {
          "Control Rods": "48 assemblies",
          "Step Resolution": "0.625 inches",
          "Drive Speed": "72 steps/minute",
          "Scram Time": "< 2.2 seconds",
          "Position Accuracy": "±1 step"
        }
      },
      {
        id: "dev-005",
        name: "Radiation Area Monitor",
        type: "monitor",
        manufacturer: "Thermo Scientific",
        model: "FH40GL-10",
        serialNumber: "TS2024005", 
        location: "Ubuntu Server - Containment",
        status: "maintenance",
        lastPing: new Date(Date.now() - 300000),
        firmwareVersion: "v2.8.1",
        calibrationDate: new Date("2023-12-01"),
        nextMaintenance: new Date("2024-06-01"),
        specifications: {
          "Detection Range": "0.1 μSv/h to 10 Sv/h",
          "Energy Response": "80 keV to 1.3 MeV",
          "Response Time": "< 10 seconds",
          "Operating Temperature": "-20°C to +50°C",
          "IP Rating": "IP65"
        }
      },
      {
        id: "dev-006",
        name: "Emergency Core Cooling System",
        type: "safety_system",
        manufacturer: "General Electric",
        model: "ECCS-Mark-III",
        serialNumber: "GE2024006",
        location: "AWS Server - Safety Systems", 
        status: "online",
        lastPing: new Date(Date.now() - 1000),
        firmwareVersion: "v6.0.1",
        calibrationDate: new Date("2024-01-05"),
        nextMaintenance: new Date("2024-07-05"),
        specifications: {
          "Flow Rate": "1,500 L/s",
          "Pressure Rating": "25 MPa",
          "Actuation Time": "< 30 seconds",
          "Redundancy": "100% backup",
          "Safety Class": "Class 1"
        }
      }
    ];
    setDevices(mockDevices);
  }, []);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || device.type === filterType;
    return matchesSearch && matchesType;
  });

  const getDeviceIcon = (type: Device["type"]) => {
    switch (type) {
      case "sensor": return <Thermometer className="h-5 w-5" />;
      case "controller": return <Cpu className="h-5 w-5" />;
      case "monitor": return <Activity className="h-5 w-5" />;
      case "safety_system": return <Shield className="h-5 w-5" />;
      default: return <HardDrive className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: Device["status"]) => {
    switch (status) {
      case "online": return <Wifi className="h-4 w-4 text-status-normal" />;
      case "offline": return <WifiOff className="h-4 w-4 text-gray-500" />;
      case "maintenance": return <Settings className="h-4 w-4 text-status-warning" />;
      case "error": return <WifiOff className="h-4 w-4 text-status-critical" />;
      default: return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Device["status"]) => {
    switch (status) {
      case "online": return "bg-status-normal";
      case "offline": return "bg-gray-500";
      case "maintenance": return "bg-status-warning";
      case "error": return "bg-status-critical";
      default: return "bg-gray-500";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = Date.now();
    const time = date.getTime();
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const onlineDevices = devices.filter(d => d.status === "online").length;
  const offlineDevices = devices.filter(d => d.status === "offline").length;
  const maintenanceDevices = devices.filter(d => d.status === "maintenance").length;
  const errorDevices = devices.filter(d => d.status === "error").length;

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="flex h-screen pt-16">
        <main className="flex-1 overflow-auto bg-dark-bg p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <Settings className="h-8 w-8 text-primary-blue mr-3" />
                  Device Management
                </h1>
                <p className="text-gray-400 mt-1">
                  Configure and monitor nuclear instrumentation hardware
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-status-normal animate-pulse-gentle' : 'bg-gray-500'}`}></div>
                  <span className="text-sm text-gray-400">
                    {isConnected ? 'Device Monitoring Active' : 'Connecting...'}
                  </span>
                </div>
                <Button className="bg-primary-blue hover:bg-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </div>
            </div>

            {/* Device Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <Power className="h-8 w-8 text-status-normal" />
                  <div>
                    <p className="text-sm text-gray-400">Online</p>
                    <p className="text-2xl font-bold text-status-normal">{onlineDevices}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <WifiOff className="h-8 w-8 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-400">Offline</p>
                    <p className="text-2xl font-bold text-gray-500">{offlineDevices}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <Settings className="h-8 w-8 text-status-warning" />
                  <div>
                    <p className="text-sm text-gray-400">Maintenance</p>
                    <p className="text-2xl font-bold text-status-warning">{maintenanceDevices}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <WifiOff className="h-8 w-8 text-status-critical" />
                  <div>
                    <p className="text-sm text-gray-400">Error</p>
                    <p className="text-2xl font-bold text-status-critical">{errorDevices}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-dark-surface border-gray-700 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                  <Input
                    placeholder="Search devices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-dark-bg border-gray-600 text-white w-64"
                  />
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="bg-dark-bg border border-gray-600 rounded px-3 py-2 text-sm text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="sensor">Sensors</option>
                    <option value="controller">Controllers</option>
                    <option value="monitor">Monitors</option>
                    <option value="safety_system">Safety Systems</option>
                  </select>
                </div>
                
                <span className="text-sm text-gray-400">
                  Showing {filteredDevices.length} of {devices.length} devices
                </span>
              </div>
            </Card>

            {/* Device List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDevices.map((device) => (
                <Card key={device.id} className="bg-dark-surface border-gray-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-primary-blue">
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{device.name}</h3>
                        <p className="text-sm text-gray-400">{device.manufacturer} {device.model}</p>
                        <p className="text-xs text-gray-500">S/N: {device.serialNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(device.status)}
                      <Badge className={`${getStatusColor(device.status)} text-white`}>
                        {device.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Location:</span>
                      <span>{device.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Firmware:</span>
                      <span>{device.firmwareVersion}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Last Ping:</span>
                      <span>{formatTimeAgo(device.lastPing)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Next Maintenance:</span>
                      <span>{device.nextMaintenance.toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Key Specifications */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 text-gray-300">Key Specifications</h4>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {Object.entries(device.specifications).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-400">{key}:</span>
                          <span className="text-gray-300">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-400">
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}