import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, ZoomIn, ZoomOut, Play, Pause, Eye } from 'lucide-react';

interface SensorData {
  id: number;
  nodeId: string;
  sensorType: string;
  value: number;
  unit: string;
  status: string;
  timestamp: Date;
}

interface Reactor3DViewProps {
  sensorData: SensorData[];
  width?: number;
  height?: number;
}

export default function Reactor3DView({ sensorData, width = 800, height = 600 }: Reactor3DViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationId, setAnimationId] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [viewMode, setViewMode] = useState<'heat' | 'neutron' | 'pressure' | 'core'>('heat');
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Nuclear fuel assembly grid (17x17 PWR configuration)
  const FUEL_ASSEMBLIES = 193; // Standard Westinghouse 4-loop PWR
  const GRID_SIZE = 17;
  const CONTROL_ROD_POSITIONS = [
    [4, 4], [4, 8], [4, 12],
    [8, 4], [8, 8], [8, 12],
    [12, 4], [12, 8], [12, 12]
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const animate = () => {
      if (!isAnimating) return;
      
      // Clear canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Draw reactor core based on view mode
      drawReactorCore(ctx);
      
      if (isAnimating) {
        setRotation(prev => ({ 
          x: prev.x + 0.01, 
          y: prev.y + 0.005 
        }));
        const id = requestAnimationFrame(animate);
        setAnimationId(id);
      }
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [sensorData, viewMode, isAnimating, rotation, zoom, width, height]);

  const drawReactorCore = (ctx: CanvasRenderingContext2D) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = 150 * zoom;

    // Draw containment vessel
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.8, 0, Math.PI * 2);
    ctx.stroke();

    // Draw reactor pressure vessel
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.4, 0, Math.PI * 2);
    ctx.stroke();

    // Draw fuel assembly grid
    const assemblySize = (baseRadius * 2) / GRID_SIZE;
    const startX = centerX - baseRadius;
    const startY = centerY - baseRadius;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = startX + col * assemblySize;
        const y = startY + row * assemblySize;
        
        // Skip corner positions (not used in PWR)
        if (isCornerPosition(row, col)) continue;

        drawFuelAssembly(ctx, x, y, assemblySize, row, col);
      }
    }

    // Draw control rod positions
    CONTROL_ROD_POSITIONS.forEach(([row, col]) => {
      const x = startX + col * assemblySize;
      const y = startY + row * assemblySize;
      drawControlRod(ctx, x, y, assemblySize);
    });

    // Draw instrumentation tubes
    drawInstrumentationTubes(ctx, centerX, centerY, baseRadius);

    // Draw coolant flow indicators
    drawCoolantFlow(ctx, centerX, centerY, baseRadius);
  };

  const isCornerPosition = (row: number, col: number): boolean => {
    const corners = [
      [0, 0], [0, 1], [0, 15], [0, 16],
      [1, 0], [1, 16],
      [15, 0], [15, 16],
      [16, 0], [16, 1], [16, 15], [16, 16]
    ];
    return corners.some(([r, c]) => r === row && c === col);
  };

  const drawFuelAssembly = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, row: number, col: number) => {
    const temp = getTemperatureForPosition(row, col);
    const neutronFlux = getNeutronFluxForPosition(row, col);
    const pressure = getPressureForPosition(row, col);

    let color: string;
    switch (viewMode) {
      case 'heat':
        color = getHeatMapColor(temp);
        break;
      case 'neutron':
        color = getNeutronFluxColor(neutronFlux);
        break;
      case 'pressure':
        color = getPressureColor(pressure);
        break;
      default:
        color = '#3b82f6';
    }

    // Draw fuel assembly
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size - 1, size - 1);

    // Add glow effect for high values
    if (viewMode === 'heat' && temp > 580) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillRect(x, y, size - 1, size - 1);
      ctx.shadowBlur = 0;
    }

    // Draw fuel rod pattern
    ctx.fillStyle = '#1f2937';
    const rodSize = size / 6;
    for (let i = 1; i < 6; i++) {
      for (let j = 1; j < 6; j++) {
        ctx.fillRect(x + i * rodSize, y + j * rodSize, 1, 1);
      }
    }
  };

  const drawControlRod = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const controlRodData = sensorData.find(s => s.sensorType === 'control_rods');
    const insertion = controlRodData ? controlRodData.value : 10;
    
    // Control rod guide tube
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + size/4, y, size/2, size);

    // Control rod (insertion level)
    const rodHeight = (insertion / 100) * size;
    ctx.fillStyle = insertion > 50 ? '#dc2626' : '#059669';
    ctx.fillRect(x + size/4 + 2, y, size/2 - 4, rodHeight);

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.fillText(`${insertion.toFixed(0)}%`, x + 2, y + size - 2);
  };

  const drawInstrumentationTubes = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
    // Neutron flux detectors
    const detectorPositions = [
      { angle: 0, radius: radius * 0.3 },
      { angle: Math.PI / 2, radius: radius * 0.5 },
      { angle: Math.PI, radius: radius * 0.3 },
      { angle: 3 * Math.PI / 2, radius: radius * 0.5 }
    ];

    detectorPositions.forEach(pos => {
      const x = centerX + Math.cos(pos.angle) * pos.radius;
      const y = centerY + Math.sin(pos.angle) * pos.radius;

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing effect for active detectors
      const pulseRadius = 4 + Math.sin(Date.now() * 0.01) * 2;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
    });
  };

  const drawCoolantFlow = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
    const flowData = sensorData.find(s => s.sensorType === 'coolant_flow');
    const flowRate = flowData ? flowData.value : 1000;
    
    // Flow animation speed based on flow rate
    const flowSpeed = (flowRate / 1250) * 0.1;
    const time = Date.now() * flowSpeed;

    // Draw flow patterns
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time;
      const x1 = centerX + Math.cos(angle) * radius * 0.8;
      const y1 = centerY + Math.sin(angle) * radius * 0.8;
      const x2 = centerX + Math.cos(angle) * radius * 1.2;
      const y2 = centerY + Math.sin(angle) * radius * 1.2;

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Flow arrows
      const arrowX = x1 + (x2 - x1) * 0.7;
      const arrowY = y1 + (y2 - y1) * 0.7;
      drawArrow(ctx, arrowX, arrowY, angle, 5);
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-size, -size/2);
    ctx.lineTo(0, 0);
    ctx.lineTo(-size, size/2);
    ctx.stroke();
    ctx.restore();
  };

  const getTemperatureForPosition = (row: number, col: number): number => {
    const coreTemp = sensorData.find(s => s.sensorType === 'temperature')?.value || 550;
    const distanceFromCenter = Math.sqrt(Math.pow(row - 8, 2) + Math.pow(col - 8, 2));
    const tempVariation = (8 - distanceFromCenter) * 10;
    return coreTemp + tempVariation + (Math.random() - 0.5) * 20;
  };

  const getNeutronFluxForPosition = (row: number, col: number): number => {
    const baseFlux = sensorData.find(s => s.sensorType === 'neutron_flux')?.value || 2.5e14;
    const distanceFromCenter = Math.sqrt(Math.pow(row - 8, 2) + Math.pow(col - 8, 2));
    const fluxProfile = Math.exp(-distanceFromCenter * 0.1);
    return baseFlux * fluxProfile;
  };

  const getPressureForPosition = (row: number, col: number): number => {
    const basePressure = sensorData.find(s => s.sensorType === 'pressure')?.value || 15.5;
    return basePressure + (Math.random() - 0.5) * 0.5;
  };

  const getHeatMapColor = (temp: number): string => {
    // Temperature color scale (blue to red)
    const minTemp = 500;
    const maxTemp = 620;
    const normalized = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));
    
    if (normalized < 0.25) return `rgb(${Math.floor(normalized * 4 * 255)}, 0, 255)`;
    if (normalized < 0.5) return `rgb(255, ${Math.floor((normalized - 0.25) * 4 * 255)}, ${255 - Math.floor((normalized - 0.25) * 4 * 255)})`;
    if (normalized < 0.75) return `rgb(255, 255, 0)`;
    return `rgb(255, ${255 - Math.floor((normalized - 0.75) * 4 * 255)}, 0)`;
  };

  const getNeutronFluxColor = (flux: number): string => {
    const minFlux = 1e14;
    const maxFlux = 4e14;
    const normalized = Math.max(0, Math.min(1, (flux - minFlux) / (maxFlux - minFlux)));
    return `rgb(${Math.floor(normalized * 255)}, ${Math.floor(normalized * 255)}, 255)`;
  };

  const getPressureColor = (pressure: number): string => {
    const minPressure = 15.0;
    const maxPressure = 16.0;
    const normalized = Math.max(0, Math.min(1, (pressure - minPressure) / (maxPressure - minPressure)));
    return `rgb(0, ${Math.floor(normalized * 255)}, ${Math.floor((1 - normalized) * 255)})`;
  };

  const handleReset = () => {
    setRotation({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            3D Reactor Core Visualization
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {FUEL_ASSEMBLIES} Assemblies
            </Badge>
            <Badge variant="outline">
              PWR Configuration
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="heat">Heat Map</TabsTrigger>
            <TabsTrigger value="neutron">Neutron Flux</TabsTrigger>
            <TabsTrigger value="pressure">Pressure</TabsTrigger>
            <TabsTrigger value="core">Core View</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAnimating(!isAnimating)}
            >
              {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(zoom * 1.2, 3))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(zoom / 1.2, 0.5))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Zoom: {Math.round(zoom * 100)}% | Animation: {isAnimating ? 'ON' : 'OFF'}
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="relative border rounded-lg overflow-hidden bg-slate-900">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ background: 'linear-gradient(45deg, #0f172a, #1e293b)' }}
          />
          
          {/* Overlay Information */}
          <div className="absolute top-4 left-4 space-y-2">
            <div className="bg-black/50 backdrop-blur-sm rounded px-3 py-2 text-sm">
              <div className="font-medium text-white">Mode: {viewMode.toUpperCase()}</div>
              <div className="text-gray-300">
                {viewMode === 'heat' && 'Temperature Distribution (°C)'}
                {viewMode === 'neutron' && 'Neutron Flux Density (n/cm²·s)'}
                {viewMode === 'pressure' && 'Pressure Distribution (MPa)'}
                {viewMode === 'core' && 'Core Assembly Layout'}
              </div>
            </div>
            
            {/* Real-time data */}
            <div className="bg-black/50 backdrop-blur-sm rounded px-3 py-2 text-xs space-y-1">
              {sensorData.slice(0, 4).map(sensor => (
                <div key={sensor.id} className="flex justify-between text-gray-300">
                  <span>{sensor.sensorType.replace('_', ' ').toUpperCase()}:</span>
                  <span className="text-white font-mono">
                    {sensor.value.toFixed(1)}{sensor.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Color Legend */}
          <div className="absolute bottom-4 right-4">
            <div className="bg-black/50 backdrop-blur-sm rounded px-3 py-2 text-xs">
              <div className="font-medium text-white mb-2">Legend</div>
              <div className="flex items-center space-x-2">
                {viewMode === 'heat' && (
                  <>
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-300">Cool</span>
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-gray-300">Normal</span>
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-gray-300">Hot</span>
                  </>
                )}
                {viewMode === 'neutron' && (
                  <>
                    <div className="w-3 h-3 bg-blue-900 rounded"></div>
                    <span className="text-gray-300">Low</span>
                    <div className="w-3 h-3 bg-blue-300 rounded"></div>
                    <span className="text-gray-300">High</span>
                  </>
                )}
                {viewMode === 'pressure' && (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-300">Normal</span>
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-300">High</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Core Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-surface rounded p-3">
            <div className="text-sm text-muted-foreground">Avg Core Temp</div>
            <div className="text-lg font-bold text-orange-400">
              {sensorData.find(s => s.sensorType === 'temperature')?.value.toFixed(1) || '---'}°C
            </div>
          </div>
          <div className="bg-dark-surface rounded p-3">
            <div className="text-sm text-muted-foreground">Neutron Flux</div>
            <div className="text-lg font-bold text-blue-400">
              {(sensorData.find(s => s.sensorType === 'neutron_flux')?.value / 1e14).toFixed(2) || '---'}e14
            </div>
          </div>
          <div className="bg-dark-surface rounded p-3">
            <div className="text-sm text-muted-foreground">Control Rods</div>
            <div className="text-lg font-bold text-green-400">
              {sensorData.find(s => s.sensorType === 'control_rods')?.value.toFixed(0) || '---'}%
            </div>
          </div>
          <div className="bg-dark-surface rounded p-3">
            <div className="text-sm text-muted-foreground">Coolant Flow</div>
            <div className="text-lg font-bold text-cyan-400">
              {sensorData.find(s => s.sensorType === 'coolant_flow')?.value.toFixed(0) || '---'} kg/s
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}