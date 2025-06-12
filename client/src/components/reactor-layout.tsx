import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCcw, Thermometer, Gauge, Zap, Shield, Wrench } from 'lucide-react';
import { Link } from 'wouter';

interface SensorData {
  id: number;
  nodeId: string;
  sensorType: string;
  value: number;
  unit: string;
  status: string;
  threshold: number | null;
  maxValue: number | null;
  timestamp: Date;
  location?: {
    x: number;
    y: number;
    zone: string;
  };
}

interface ReactorLayoutProps {
  sensorData: SensorData[];
  onSensorSelect?: (sensor: SensorData) => void;
  onZoneSelect?: (zone: string) => void;
}

export default function ReactorLayout({ sensorData, onSensorSelect, onZoneSelect }: ReactorLayoutProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  // Define reactor zones and their positions
  const reactorZones = {
    'reactor-core': { x: 200, y: 200, width: 120, height: 120, label: 'Reactor Core' },
    'primary-loop': { x: 100, y: 100, width: 320, height: 320, label: 'Primary Loop' },
    'steam-generator': { x: 400, y: 150, width: 80, height: 120, label: 'Steam Generator' },
    'pressurizer': { x: 50, y: 150, width: 60, height: 100, label: 'Pressurizer' },
    'containment': { x: 20, y: 20, width: 480, height: 400, label: 'Containment' },
    'control-room': { x: 550, y: 50, width: 100, height: 80, label: 'Control Room' },
  };

  // Assign sensor positions based on type and node
  const getSensorPosition = (sensor: SensorData) => {
    const basePositions: Record<string, { x: number; y: number; zone: string }> = {
      'CORE-TEMP-01': { x: 230, y: 230, zone: 'reactor-core' },
      'CORE-TEMP-02': { x: 270, y: 230, zone: 'reactor-core' },
      'CORE-TEMP-03': { x: 250, y: 270, zone: 'reactor-core' },
      'NEUTRON-01': { x: 250, y: 250, zone: 'reactor-core' },
      'NEUTRON-02': { x: 250, y: 200, zone: 'reactor-core' },
      'PRIMARY-PRESS-01': { x: 180, y: 180, zone: 'primary-loop' },
      'PRIMARY-PRESS-02': { x: 320, y: 180, zone: 'primary-loop' },
      'COOLANT-FLOW-01': { x: 180, y: 320, zone: 'primary-loop' },
      'COOLANT-FLOW-02': { x: 320, y: 320, zone: 'primary-loop' },
      'STEAM-PRESS-01': { x: 440, y: 180, zone: 'steam-generator' },
      'STEAM-TEMP-01': { x: 440, y: 220, zone: 'steam-generator' },
      'CONTROL-ROD-01': { x: 230, y: 200, zone: 'reactor-core' },
      'CONTROL-ROD-02': { x: 270, y: 200, zone: 'reactor-core' },
      'RAD-MONITOR-01': { x: 100, y: 100, zone: 'containment' },
      'RAD-MONITOR-02': { x: 400, y: 100, zone: 'containment' },
    };

    return basePositions[sensor.nodeId] || { x: 300, y: 300, zone: 'containment' };
  };

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType.toLowerCase()) {
      case 'temperature': return Thermometer;
      case 'pressure': return Gauge;
      case 'neutron_flux': return Zap;
      case 'radiation': return Shield;
      case 'control_rods': return Wrench;
      default: return Gauge;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'normal': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      case 'offline': return 'text-gray-500';
      default: return 'text-blue-500';
    }
  };

  const handleZoomIn = () => setZoom(Math.min(zoom * 1.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.2, 0.5));
  const handleReset = () => {
    setZoom(1);
    setSelectedZone(null);
  };

  const handleZoneClick = (zoneName: string) => {
    setSelectedZone(selectedZone === zoneName ? null : zoneName);
    onZoneSelect?.(zoneName);
  };

  const filteredSensors = selectedZone 
    ? sensorData.filter(sensor => getSensorPosition(sensor).zone === selectedZone)
    : sensorData;

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Interactive Reactor Layout</h3>
            {selectedZone && (
              <Badge variant="outline" className="ml-2">
                {reactorZones[selectedZone as keyof typeof reactorZones]?.label}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLabels(!showLabels)}
            >
              {showLabels ? 'Hide Labels' : 'Show Labels'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Reactor Visualization */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-blue-900 rounded-lg border">
          <div 
            className="relative transition-transform duration-300 ease-in-out"
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
              width: '700px',
              height: '500px',
              margin: '0 auto'
            }}
          >
            {/* Reactor Zones */}
            {Object.entries(reactorZones).map(([zoneName, zone]) => (
              <div
                key={zoneName}
                className={`absolute border-2 border-dashed cursor-pointer transition-all duration-200 rounded-lg ${
                  selectedZone === zoneName 
                    ? 'border-blue-500 bg-blue-100/30 dark:bg-blue-900/30' 
                    : 'border-gray-400 hover:border-gray-600 hover:bg-gray-100/20'
                }`}
                style={{
                  left: zone.x,
                  top: zone.y,
                  width: zone.width,
                  height: zone.height,
                }}
                onClick={() => handleZoneClick(zoneName)}
              >
                {showLabels && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
                    {zone.label}
                  </div>
                )}
              </div>
            ))}

            {/* Core Reactor Structure */}
            <div className="absolute" style={{ left: 220, top: 220, width: 80, height: 80 }}>
              <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg animate-pulse">
                <div className="absolute inset-2 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full">
                  <div className="absolute inset-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-full">
                    <div className="absolute inset-2 bg-gradient-to-br from-red-400 to-red-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Loop Piping */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Hot leg */}
              <path
                d="M 320 260 Q 360 260 380 220 Q 400 180 440 180"
                stroke="url(#pipeGradient)"
                strokeWidth="8"
                fill="none"
                filter="url(#glow)"
              />
              
              {/* Cold leg */}
              <path
                d="M 440 240 Q 400 240 380 280 Q 360 320 320 320 Q 280 320 240 320 Q 200 320 180 280 Q 160 240 180 200 Q 200 160 240 160"
                stroke="url(#pipeGradient)"
                strokeWidth="8"
                fill="none"
                filter="url(#glow)"
              />
            </svg>

            {/* Sensor Nodes */}
            {filteredSensors.map((sensor) => {
              const position = getSensorPosition(sensor);
              const SensorIcon = getSensorIcon(sensor.sensorType);
              
              return (
                <Link
                  key={sensor.id}
                  href={`/sensors?node=${sensor.nodeId}`}
                >
                  <div
                    className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-110 ${getStatusColor(sensor.status)}`}
                    style={{
                      left: position.x,
                      top: position.y,
                    }}
                    onClick={() => onSensorSelect?.(sensor)}
                  >
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg ${
                        sensor.status === 'normal' ? 'bg-green-100 border-green-500' :
                        sensor.status === 'warning' ? 'bg-yellow-100 border-yellow-500' :
                        sensor.status === 'critical' ? 'bg-red-100 border-red-500' :
                        'bg-gray-100 border-gray-500'
                      }`}>
                        <SensorIcon className="h-4 w-4" />
                      </div>
                      
                      {/* Sensor status indicator */}
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                        sensor.status === 'normal' ? 'bg-green-500' :
                        sensor.status === 'warning' ? 'bg-yellow-500' :
                        sensor.status === 'critical' ? 'bg-red-500 animate-pulse' :
                        'bg-gray-500'
                      }`}></div>
                      
                      {/* Sensor info tooltip */}
                      {showLabels && (
                        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg border min-w-max z-10">
                          <div className="font-medium">{sensor.nodeId}</div>
                          <div className="text-muted-foreground">
                            {sensor.value}{sensor.unit}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Zone Filter Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={selectedZone === null ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedZone(null);
              onZoneSelect?.('all');
            }}
          >
            All Zones
          </Button>
          {Object.entries(reactorZones).map(([zoneName, zone]) => {
            const zonesensors = sensorData.filter(sensor => getSensorPosition(sensor).zone === zoneName);
            return (
              <Button
                key={zoneName}
                variant={selectedZone === zoneName ? "default" : "outline"}
                size="sm"
                onClick={() => handleZoneClick(zoneName)}
                className="flex items-center gap-1"
              >
                {zone.label}
                <Badge variant="secondary" className="ml-1">
                  {zonesensors.length}
                </Badge>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}