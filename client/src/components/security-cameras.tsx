import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Maximize2,
  Volume2,
  VolumeX,
  Circle,
  Square
} from 'lucide-react';

interface SecurityCamera {
  id: string;
  name: string;
  location: string;
  zone: 'reactor-hall' | 'control-room' | 'steam-generator' | 'containment' | 'fuel-pool' | 'turbine-hall';
  status: 'online' | 'offline' | 'maintenance';
  resolution: string;
  nightVision: boolean;
  ptzCapable: boolean;
  recordingStatus: 'recording' | 'standby';
  streamUrl: string;
  thumbnailUrl?: string;
}

interface SecurityCamerasProps {
  sensorData?: any[];
}

export default function SecurityCameras({ sensorData = [] }: SecurityCamerasProps) {
  const [selectedCamera, setSelectedCamera] = useState<string>('cam-001');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [isRecording, setIsRecording] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [cameraZoom, setCameraZoom] = useState(1);

  // Nuclear facility security cameras
  const cameras: SecurityCamera[] = [
    {
      id: 'cam-001',
      name: 'Reactor Hall - Main View',
      location: 'Reactor Building Level 1',
      zone: 'reactor-hall',
      status: 'online',
      resolution: '4K UHD',
      nightVision: true,
      ptzCapable: true,
      recordingStatus: 'recording',
      streamUrl: '/api/camera/stream/reactor-hall-main',
      thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SZWFjdG9yIEhhbGwgLSBMaXZlIEZlZWQ8L3RleHQ+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTIwIiByPSI0MCIgZmlsbD0iIzM0OGY1MCIgb3BhY2l0eT0iMC4zIi8+PHRleHQgeD0iMjAwIiB5PSIxMjUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk9OTElORTwvdGV4dD48L3N2Zz4='
    },
    {
      id: 'cam-002',
      name: 'Reactor Vessel Overhead',
      location: 'Reactor Building Ceiling',
      zone: 'reactor-hall',
      status: 'online',
      resolution: '4K UHD',
      nightVision: true,
      ptzCapable: true,
      recordingStatus: 'recording',
      streamUrl: '/api/camera/stream/reactor-vessel-overhead',
      thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SZWFjdG9yIFZlc3NlbCAtIE92ZXJoZWFkPC90ZXh0PjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEyMCIgcj0iNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzNiODJmNiIgc3Ryb2tlLXdpZHRoPSIzIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTIwIiByPSIyMCIgZmlsbD0iI2Y1OWU0MiIvPjwvc3ZnPg=='
    },
    {
      id: 'cam-003',
      name: 'Control Room - Operations',
      location: 'Main Control Room',
      zone: 'control-room',
      status: 'online',
      resolution: '1080p HD',
      nightVision: false,
      ptzCapable: false,
      recordingStatus: 'recording',
      streamUrl: '/api/camera/stream/control-room-ops',
      thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Db250cm9sIFJvb20gLSBPcGVyYXRpb25zPC90ZXh0PjxyZWN0IHg9IjEwMCIgeT0iODAiIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiIGZpbGw9IiMzNzQxNTEiLz48cmVjdCB4PSIxMjAiIHk9IjEwMCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzRmNDZlNSIvPjwvc3ZnPg=='
    },
    {
      id: 'cam-004',
      name: 'Steam Generator Room',
      location: 'Steam Generator Building',
      zone: 'steam-generator',
      status: 'online',
      resolution: '4K UHD',
      nightVision: true,
      ptzCapable: true,
      recordingStatus: 'recording',
      streamUrl: '/api/camera/stream/steam-generator',
      thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TdGVhbSBHZW5lcmF0b3IgUm9vbTwvdGV4dD48cmVjdCB4PSIxNDAiIHk9IjYwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzY2NjY2NiIgcng9IjEwIi8+PHJlY3QgeD0iMTYwIiB5PSI4MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iIzMzMzMzMyIgcng9IjUiLz48L3N2Zz4='
    },
    {
      id: 'cam-005',
      name: 'Containment Entrance',
      location: 'Containment Building Airlock',
      zone: 'containment',
      status: 'online',
      resolution: '4K UHD',
      nightVision: true,
      ptzCapable: false,
      recordingStatus: 'recording',
      streamUrl: '/api/camera/stream/containment-entrance',
      thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Db250YWlubWVudCBFbnRyYW5jZTwvdGV4dD48cmVjdCB4PSIxNTAiIHk9IjgwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI2RjMjYyNiIgcng9IjUiLz48cmVjdCB4PSIxNzAiIHk9IjEwMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIgcng9IjMiLz48L3N2Zz4='
    },
    {
      id: 'cam-006',
      name: 'Fuel Pool Area',
      location: 'Spent Fuel Pool',
      zone: 'fuel-pool',
      status: 'online',
      resolution: '4K UHD',
      nightVision: true,
      ptzCapable: true,
      recordingStatus: 'recording',
      streamUrl: '/api/camera/stream/fuel-pool',
      thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5GdWVsIFBvb2wgQXJlYTwvdGV4dD48cmVjdCB4PSIxMDAiIHk9IjgwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iIzA2OTFkYyIgcng9IjEwIi8+PHJlY3QgeD0iMTIwIiB5PSIxMDAiIHdpZHRoPSIxNjAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMTI5M2Y1IiByeD0iNSIvPjwvc3ZnPg=='
    }
  ];

  const filteredCameras = selectedZone === 'all' 
    ? cameras 
    : cameras.filter(cam => cam.zone === selectedZone);

  const currentCamera = cameras.find(cam => cam.id === selectedCamera);

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'reactor-hall': return 'bg-red-500';
      case 'control-room': return 'bg-blue-500';
      case 'steam-generator': return 'bg-orange-500';
      case 'containment': return 'bg-purple-500';
      case 'fuel-pool': return 'bg-cyan-500';
      case 'turbine-hall': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'maintenance': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Nuclear Facility Security Cameras
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-500">
              {cameras.filter(c => c.status === 'online').length} Online
            </Badge>
            <Badge variant="outline" className="text-red-500">
              {cameras.filter(c => c.status === 'offline').length} Offline
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Zone Filter */}
        <div className="flex items-center gap-4">
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              <SelectItem value="reactor-hall">Reactor Hall</SelectItem>
              <SelectItem value="control-room">Control Room</SelectItem>
              <SelectItem value="steam-generator">Steam Generator</SelectItem>
              <SelectItem value="containment">Containment</SelectItem>
              <SelectItem value="fuel-pool">Fuel Pool</SelectItem>
              <SelectItem value="turbine-hall">Turbine Hall</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRecording(!isRecording)}
              className={isRecording ? 'text-red-500' : ''}
            >
              {isRecording ? <Square className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Camera View */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{currentCamera?.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{currentCamera?.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getZoneColor(currentCamera?.zone || '')}>
                      {currentCamera?.zone.replace('-', ' ').toUpperCase()}
                    </Badge>
                    <div className={`flex items-center gap-1 ${getStatusColor(currentCamera?.status || '')}`}>
                      <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      <span className="text-sm font-medium">{currentCamera?.status.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Camera Feed */}
                <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border">
                  {currentCamera?.thumbnailUrl ? (
                    <img 
                      src={currentCamera.thumbnailUrl} 
                      alt={currentCamera.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Camera className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                        <p className="text-gray-500">Live Feed Unavailable</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Camera Controls Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {currentCamera?.ptzCapable && (
                        <>
                          <Button variant="secondary" size="sm">
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button variant="secondary" size="sm">
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          <Button variant="secondary" size="sm">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                      {currentCamera?.recordingStatus === 'recording' && (
                        <div className="flex items-center gap-1 bg-red-500 px-2 py-1 rounded text-white text-xs">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          REC
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live indicator */}
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-1 bg-red-500 px-2 py-1 rounded text-white text-xs">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      LIVE
                    </div>
                  </div>

                  {/* Camera info */}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded px-2 py-1 text-white text-xs">
                    {currentCamera?.resolution} | {currentCamera?.nightVision ? 'Night Vision' : 'Standard'}
                  </div>
                </div>

                {/* Camera Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-dark-surface rounded p-3">
                    <div className="text-sm text-muted-foreground">Resolution</div>
                    <div className="font-medium">{currentCamera?.resolution}</div>
                  </div>
                  <div className="bg-dark-surface rounded p-3">
                    <div className="text-sm text-muted-foreground">Night Vision</div>
                    <div className="font-medium">
                      {currentCamera?.nightVision ? (
                        <span className="text-green-500">Enabled</span>
                      ) : (
                        <span className="text-gray-500">Disabled</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-dark-surface rounded p-3">
                    <div className="text-sm text-muted-foreground">PTZ Control</div>
                    <div className="font-medium">
                      {currentCamera?.ptzCapable ? (
                        <span className="text-green-500">Available</span>
                      ) : (
                        <span className="text-gray-500">Fixed</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-dark-surface rounded p-3">
                    <div className="text-sm text-muted-foreground">Recording</div>
                    <div className="font-medium">
                      {currentCamera?.recordingStatus === 'recording' ? (
                        <span className="text-red-500">Active</span>
                      ) : (
                        <span className="text-yellow-500">Standby</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Camera List */}
          <div className="space-y-4">
            <h3 className="font-medium">Available Cameras</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredCameras.map((camera) => (
                <Card 
                  key={camera.id}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    selectedCamera === camera.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedCamera(camera.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {camera.thumbnailUrl ? (
                          <img 
                            src={camera.thumbnailUrl} 
                            alt={camera.name}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-slate-700 rounded flex items-center justify-center">
                            <Camera className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                          camera.status === 'online' ? 'bg-green-500' :
                          camera.status === 'offline' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{camera.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{camera.location}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-xs ${getZoneColor(camera.zone)} text-white`}>
                            {camera.zone.replace('-', ' ')}
                          </Badge>
                          {camera.recordingStatus === 'recording' && (
                            <div className="flex items-center gap-1 text-xs text-red-500">
                              <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                              REC
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}