import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebSocket } from "@/lib/websocket";
import { 
  Plus, 
  Search, 
  Settings, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Zap,
  Thermometer,
  Gauge,
  Shield,
  Atom,
  Edit,
  Trash2
} from "lucide-react";
import type { ServerConnection, Alert } from "@shared/schema";

interface NuclearDevice {
  id: string;
  name: string;
  type: "sensor" | "controller" | "monitor" | "safety_system" | "instrumentation" | "protection";
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  zone: "reactor-core" | "primary-loop" | "steam-generator" | "containment" | "control-room" | "fuel-pool";
  status: "online" | "offline" | "maintenance" | "error" | "calibration";
  lastPing: Date;
  firmwareVersion: string;
  calibrationDate: Date;
  nextMaintenance: Date;
  safetyClass: "1E" | "Non-1E" | "BOP";
  seismicCategory: "I" | "II" | "Non-Seismic";
  qualificationLevel: "Harsh" | "Mild" | "Commercial";
  redundancyGroup: "A" | "B" | "C" | "N/A";
  specifications: {
    operatingTemp: string;
    operatingPressure: string;
    powerSupply: string;
    accuracy: string;
    responseTime: string;
    environmentalQualification: string;
  };
  maintenance: {
    lastService: Date;
    serviceInterval: number; // days
    nextService: Date;
    maintenanceProcedure: string;
  };
}

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<NuclearDevice[]>([]);
  const [serverConnections, setServerConnections] = useState<ServerConnection[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<NuclearDevice | null>(null);
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

  // Initialize with comprehensive nuclear device inventory
  useEffect(() => {
    const nuclearDevices: NuclearDevice[] = [
      {
        id: "dev-001",
        name: "Core Exit Thermocouple Assembly",
        type: "sensor",
        manufacturer: "Reuter-Stokes",
        model: "RSS-1000-CET",
        serialNumber: "CET-2024-001",
        location: "Reactor Vessel Head",
        zone: "reactor-core",
        status: "online",
        lastPing: new Date(),
        firmwareVersion: "v2.3.1",
        calibrationDate: new Date(2024, 0, 15),
        nextMaintenance: new Date(2024, 6, 15),
        safetyClass: "1E",
        seismicCategory: "I",
        qualificationLevel: "Harsh",
        redundancyGroup: "A",
        specifications: {
          operatingTemp: "0°C to 700°C",
          operatingPressure: "0 to 17.2 MPa",
          powerSupply: "24VDC",
          accuracy: "±1°C",
          responseTime: "< 1 second",
          environmentalQualification: "IEEE 323, 10CFR50.49"
        },
        maintenance: {
          lastService: new Date(2024, 0, 15),
          serviceInterval: 180,
          nextService: new Date(2024, 6, 15),
          maintenanceProcedure: "MP-INST-001"
        }
      },
      {
        id: "dev-002",
        name: "Wide Range Neutron Flux Monitor",
        type: "monitor",
        manufacturer: "Westinghouse",
        model: "WX-5000 WRNM",
        serialNumber: "WRNM-2024-002",
        location: "In-Core Instrument Guide Tube",
        zone: "reactor-core",
        status: "online",
        lastPing: new Date(),
        firmwareVersion: "v4.1.2",
        calibrationDate: new Date(2024, 1, 20),
        nextMaintenance: new Date(2024, 7, 20),
        safetyClass: "1E",
        seismicCategory: "I",
        qualificationLevel: "Harsh",
        redundancyGroup: "A",
        specifications: {
          operatingTemp: "40°C to 150°C",
          operatingPressure: "0 to 17.2 MPa",
          powerSupply: "120VAC",
          accuracy: "±2% of reading",
          responseTime: "< 2 seconds",
          environmentalQualification: "IEEE 323, 10CFR50.49"
        },
        maintenance: {
          lastService: new Date(2024, 1, 20),
          serviceInterval: 180,
          nextService: new Date(2024, 7, 20),
          maintenanceProcedure: "MP-NEUT-001"
        }
      },
      {
        id: "dev-003",
        name: "Reactor Protection System Processor",
        type: "protection",
        manufacturer: "Triconex",
        model: "TRICON TMR",
        serialNumber: "RPS-2024-003",
        location: "Main Control Room",
        zone: "control-room",
        status: "online",
        lastPing: new Date(),
        firmwareVersion: "v11.3",
        calibrationDate: new Date(2024, 2, 10),
        nextMaintenance: new Date(2024, 8, 10),
        safetyClass: "1E",
        seismicCategory: "I",
        qualificationLevel: "Mild",
        redundancyGroup: "A",
        specifications: {
          operatingTemp: "0°C to 60°C",
          operatingPressure: "Atmospheric",
          powerSupply: "120VAC/48VDC",
          accuracy: "±0.1% of span",
          responseTime: "< 100 milliseconds",
          environmentalQualification: "IEEE 323"
        },
        maintenance: {
          lastService: new Date(2024, 2, 10),
          serviceInterval: 90,
          nextService: new Date(2024, 8, 10),
          maintenanceProcedure: "MP-RPS-001"
        }
      },
      {
        id: "dev-004",
        name: "Steam Generator Level Transmitter",
        type: "sensor",
        manufacturer: "Rosemount",
        model: "3051SFA",
        serialNumber: "SGT-2024-004",
        location: "Steam Generator A",
        zone: "steam-generator",
        status: "online",
        lastPing: new Date(),
        firmwareVersion: "v6.2.0",
        calibrationDate: new Date(2024, 1, 5),
        nextMaintenance: new Date(2024, 7, 5),
        safetyClass: "1E",
        seismicCategory: "I",
        qualificationLevel: "Harsh",
        redundancyGroup: "A",
        specifications: {
          operatingTemp: "-40°C to 85°C",
          operatingPressure: "0 to 17.2 MPa",
          powerSupply: "24VDC",
          accuracy: "±0.075% of span",
          responseTime: "< 90 milliseconds",
          environmentalQualification: "IEEE 323, 10CFR50.49"
        },
        maintenance: {
          lastService: new Date(2024, 1, 5),
          serviceInterval: 180,
          nextService: new Date(2024, 7, 5),
          maintenanceProcedure: "MP-LEVEL-001"
        }
      },
      {
        id: "dev-005",
        name: "Containment Radiation Monitor",
        type: "monitor",
        manufacturer: "Mirion Technologies",
        model: "WRM-100",
        serialNumber: "CRM-2024-005",
        location: "Containment Building",
        zone: "containment",
        status: "online",
        lastPing: new Date(),
        firmwareVersion: "v3.4.1",
        calibrationDate: new Date(2024, 0, 30),
        nextMaintenance: new Date(2024, 6, 30),
        safetyClass: "1E",
        seismicCategory: "I",
        qualificationLevel: "Harsh",
        redundancyGroup: "B",
        specifications: {
          operatingTemp: "0°C to 60°C",
          operatingPressure: "0 to 0.5 MPa",
          powerSupply: "120VAC",
          accuracy: "±10% of reading",
          responseTime: "< 10 seconds",
          environmentalQualification: "IEEE 323, 10CFR50.49"
        },
        maintenance: {
          lastService: new Date(2024, 0, 30),
          serviceInterval: 180,
          nextService: new Date(2024, 6, 30),
          maintenanceProcedure: "MP-RAD-001"
        }
      },
      {
        id: "dev-006",
        name: "Emergency Diesel Generator Controller",
        type: "controller",
        manufacturer: "ASCO",
        model: "7000 Series",
        serialNumber: "EDG-2024-006",
        location: "Diesel Generator Building",
        zone: "control-room",
        status: "maintenance",
        lastPing: new Date(Date.now() - 3600000),
        firmwareVersion: "v8.1.3",
        calibrationDate: new Date(2024, 3, 12),
        nextMaintenance: new Date(2024, 9, 12),
        safetyClass: "1E",
        seismicCategory: "I",
        qualificationLevel: "Mild",
        redundancyGroup: "A",
        specifications: {
          operatingTemp: "-20°C to 70°C",
          operatingPressure: "Atmospheric",
          powerSupply: "125VDC",
          accuracy: "±1% of setpoint",
          responseTime: "< 10 seconds",
          environmentalQualification: "IEEE 323"
        },
        maintenance: {
          lastService: new Date(2024, 3, 12),
          serviceInterval: 180,
          nextService: new Date(2024, 9, 12),
          maintenanceProcedure: "MP-EDG-001"
        }
      }
    ];

    setDevices(nuclearDevices);
  }, []);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || device.type === selectedType;
    const matchesZone = selectedZone === 'all' || device.zone === selectedZone;
    const matchesStatus = selectedStatus === 'all' || device.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesZone && matchesStatus;
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'sensor': return Thermometer;
      case 'controller': return Settings;
      case 'monitor': return Gauge;
      case 'safety_system': return Shield;
      case 'instrumentation': return Atom;
      case 'protection': return AlertTriangle;
      default: return Wrench;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'maintenance': return 'text-yellow-500';
      case 'error': return 'text-red-600';
      case 'calibration': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getSafetyClassColor = (safetyClass: string) => {
    switch (safetyClass) {
      case '1E': return 'bg-red-500 text-white';
      case 'Non-1E': return 'bg-orange-500 text-white';
      case 'BOP': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleAddDevice = (deviceData: Partial<NuclearDevice>) => {
    const newDevice: NuclearDevice = {
      id: `dev-${Date.now()}`,
      name: deviceData.name || '',
      type: deviceData.type || 'sensor',
      manufacturer: deviceData.manufacturer || '',
      model: deviceData.model || '',
      serialNumber: deviceData.serialNumber || '',
      location: deviceData.location || '',
      zone: deviceData.zone || 'reactor-core',
      status: 'online',
      lastPing: new Date(),
      firmwareVersion: deviceData.firmwareVersion || 'v1.0.0',
      calibrationDate: new Date(),
      nextMaintenance: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      safetyClass: deviceData.safetyClass || '1E',
      seismicCategory: deviceData.seismicCategory || 'I',
      qualificationLevel: deviceData.qualificationLevel || 'Harsh',
      redundancyGroup: deviceData.redundancyGroup || 'A',
      specifications: deviceData.specifications || {
        operatingTemp: '',
        operatingPressure: '',
        powerSupply: '',
        accuracy: '',
        responseTime: '',
        environmentalQualification: ''
      },
      maintenance: deviceData.maintenance || {
        lastService: new Date(),
        serviceInterval: 180,
        nextService: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        maintenanceProcedure: ''
      }
    };

    setDevices(prev => [...prev, newDevice]);
    setIsAddDialogOpen(false);
  };

  const handleDeleteDevice = (deviceId: string) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
  };

  const activeAlerts = alerts.filter(a => a.isActive).length;

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
            <NavigationHeader 
              title="Nuclear Device Management"
              subtitle="Monitor and manage nuclear facility instrumentation and control systems"
            />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold text-green-500">
                        {devices.filter(d => d.status === 'online').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Online Devices</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                    <div>
                      <div className="text-2xl font-bold text-red-500">
                        {devices.filter(d => d.status === 'offline' || d.status === 'error').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Offline/Error</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-8 w-8 text-yellow-500" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-500">
                        {devices.filter(d => d.status === 'maintenance').length}
                      </div>
                      <div className="text-sm text-muted-foreground">In Maintenance</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold text-blue-500">
                        {devices.filter(d => d.safetyClass === '1E').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Class 1E Devices</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search devices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Device Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sensor">Sensors</SelectItem>
                        <SelectItem value="controller">Controllers</SelectItem>
                        <SelectItem value="monitor">Monitors</SelectItem>
                        <SelectItem value="safety_system">Safety Systems</SelectItem>
                        <SelectItem value="instrumentation">Instrumentation</SelectItem>
                        <SelectItem value="protection">Protection</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedZone} onValueChange={setSelectedZone}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Zones</SelectItem>
                        <SelectItem value="reactor-core">Reactor Core</SelectItem>
                        <SelectItem value="primary-loop">Primary Loop</SelectItem>
                        <SelectItem value="steam-generator">Steam Generator</SelectItem>
                        <SelectItem value="containment">Containment</SelectItem>
                        <SelectItem value="control-room">Control Room</SelectItem>
                        <SelectItem value="fuel-pool">Fuel Pool</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="calibration">Calibration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Device
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Add Nuclear Device</DialogTitle>
                      </DialogHeader>
                      <DeviceForm onSubmit={handleAddDevice} onCancel={() => setIsAddDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Device List */}
            <div className="grid grid-cols-1 gap-4">
              {filteredDevices.map((device) => {
                const Icon = getDeviceIcon(device.type);
                return (
                  <Card key={device.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${getStatusColor(device.status)} bg-current/10`}>
                            <Icon className={`h-6 w-6 ${getStatusColor(device.status)}`} />
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <h3 className="text-lg font-semibold">{device.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {device.manufacturer} {device.model} | S/N: {device.serialNumber}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge className={getSafetyClassColor(device.safetyClass)}>
                                Class {device.safetyClass}
                              </Badge>
                              <Badge variant="outline">
                                Seismic Cat {device.seismicCategory}
                              </Badge>
                              <Badge variant="outline">
                                Group {device.redundancyGroup}
                              </Badge>
                              <Badge variant="outline">
                                {device.qualificationLevel}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Location:</span>
                                <div className="font-medium">{device.location}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Zone:</span>
                                <div className="font-medium">{device.zone.replace('-', ' ').toUpperCase()}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Status:</span>
                                <div className={`font-medium ${getStatusColor(device.status)}`}>
                                  {device.status.toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Last Ping:</span>
                                <div className="font-medium">
                                  {device.lastPing.toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteDevice(device.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Device Form Component
function DeviceForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (data: Partial<NuclearDevice>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<NuclearDevice>>({
    name: '',
    type: 'sensor',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    zone: 'reactor-core',
    safetyClass: '1E',
    seismicCategory: 'I',
    qualificationLevel: 'Harsh',
    redundancyGroup: 'A',
    firmwareVersion: 'v1.0.0',
    specifications: {
      operatingTemp: '',
      operatingPressure: '',
      powerSupply: '',
      accuracy: '',
      responseTime: '',
      environmentalQualification: ''
    },
    maintenance: {
      lastService: new Date(),
      serviceInterval: 180,
      nextService: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      maintenanceProcedure: ''
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="technical">Technical Specs</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Device Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Core Exit Thermocouple Assembly"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Device Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sensor">Sensor</SelectItem>
                  <SelectItem value="controller">Controller</SelectItem>
                  <SelectItem value="monitor">Monitor</SelectItem>
                  <SelectItem value="safety_system">Safety System</SelectItem>
                  <SelectItem value="instrumentation">Instrumentation</SelectItem>
                  <SelectItem value="protection">Protection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer *</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                placeholder="Westinghouse, Reuter-Stokes, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="RSS-1000-CET"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                placeholder="CET-2024-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Reactor Vessel Head"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone">Zone *</Label>
              <Select 
                value={formData.zone} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, zone: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reactor-core">Reactor Core</SelectItem>
                  <SelectItem value="primary-loop">Primary Loop</SelectItem>
                  <SelectItem value="steam-generator">Steam Generator</SelectItem>
                  <SelectItem value="containment">Containment</SelectItem>
                  <SelectItem value="control-room">Control Room</SelectItem>
                  <SelectItem value="fuel-pool">Fuel Pool</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firmwareVersion">Firmware Version</Label>
              <Input
                id="firmwareVersion"
                value={formData.firmwareVersion}
                onChange={(e) => setFormData(prev => ({ ...prev, firmwareVersion: e.target.value }))}
                placeholder="v1.0.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="safetyClass">Safety Class</Label>
              <Select 
                value={formData.safetyClass} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, safetyClass: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1E">Class 1E</SelectItem>
                  <SelectItem value="Non-1E">Non-1E</SelectItem>
                  <SelectItem value="BOP">BOP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seismicCategory">Seismic Category</Label>
              <Select 
                value={formData.seismicCategory} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, seismicCategory: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="I">Category I</SelectItem>
                  <SelectItem value="II">Category II</SelectItem>
                  <SelectItem value="Non-Seismic">Non-Seismic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualificationLevel">Qualification</Label>
              <Select 
                value={formData.qualificationLevel} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, qualificationLevel: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Harsh">Harsh Environment</SelectItem>
                  <SelectItem value="Mild">Mild Environment</SelectItem>
                  <SelectItem value="Commercial">Commercial Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="redundancyGroup">Redundancy Group</Label>
              <Select 
                value={formData.redundancyGroup} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, redundancyGroup: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Group A</SelectItem>
                  <SelectItem value="B">Group B</SelectItem>
                  <SelectItem value="C">Group C</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operatingTemp">Operating Temperature</Label>
              <Input
                id="operatingTemp"
                value={formData.specifications?.operatingTemp}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  specifications: { ...prev.specifications!, operatingTemp: e.target.value }
                }))}
                placeholder="0°C to 700°C"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operatingPressure">Operating Pressure</Label>
              <Input
                id="operatingPressure"
                value={formData.specifications?.operatingPressure}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  specifications: { ...prev.specifications!, operatingPressure: e.target.value }
                }))}
                placeholder="0 to 17.2 MPa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="powerSupply">Power Supply</Label>
              <Input
                id="powerSupply"
                value={formData.specifications?.powerSupply}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  specifications: { ...prev.specifications!, powerSupply: e.target.value }
                }))}
                placeholder="24VDC, 120VAC, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accuracy">Accuracy</Label>
              <Input
                id="accuracy"
                value={formData.specifications?.accuracy}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  specifications: { ...prev.specifications!, accuracy: e.target.value }
                }))}
                placeholder="±1°C, ±0.075% of span"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responseTime">Response Time</Label>
              <Input
                id="responseTime"
                value={formData.specifications?.responseTime}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  specifications: { ...prev.specifications!, responseTime: e.target.value }
                }))}
                placeholder="< 1 second"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="environmentalQualification">Environmental Qualification</Label>
              <Input
                id="environmentalQualification"
                value={formData.specifications?.environmentalQualification}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  specifications: { ...prev.specifications!, environmentalQualification: e.target.value }
                }))}
                placeholder="IEEE 323, 10CFR50.49"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceInterval">Service Interval (days)</Label>
              <Input
                id="serviceInterval"
                type="number"
                value={formData.maintenance?.serviceInterval}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  maintenance: { ...prev.maintenance!, serviceInterval: parseInt(e.target.value) }
                }))}
                placeholder="180"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceProcedure">Maintenance Procedure</Label>
              <Input
                id="maintenanceProcedure"
                value={formData.maintenance?.maintenanceProcedure}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  maintenance: { ...prev.maintenance!, maintenanceProcedure: e.target.value }
                }))}
                placeholder="MP-INST-001"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Device
        </Button>
      </div>
    </form>
  );
}