import { Card } from "@/components/ui/card";
import type { SensorData } from "@shared/schema";

interface SensorCardProps {
  sensor: SensorData;
}

export default function SensorCard({ sensor }: SensorCardProps) {
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

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-status-normal";
      case "warning":
        return "bg-status-warning";
      case "critical":
        return "bg-status-critical";
      default:
        return "bg-gray-400";
    }
  };

  const getSensorTitle = (sensorType: string) => {
    switch (sensorType) {
      case "temperature":
        return "Core Temperature";
      case "pressure":
        return "Primary Pressure";
      case "radiation":
        return "Radiation Level";
      case "coolant_flow":
        return "Coolant Flow";
      case "neutron_flux":
        return "Neutron Flux";
      case "control_rods":
        return "Control Rods";
      default:
        return sensorType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatValue = (value: number, unit: string, sensorType: string) => {
    if (sensorType === "neutron_flux") {
      return `${(value / 1e14).toFixed(1)}×10¹⁴`;
    }
    return `${value.toFixed(1)}${unit}`;
  };

  const getThresholdDisplay = (sensor: SensorData) => {
    if (sensor.sensorType === "control_rods") {
      return "65-70%";
    }
    if (sensor.sensorType === "pressure") {
      return "15.0-16.5 MPa";
    }
    if (sensor.threshold) {
      if (sensor.sensorType === "neutron_flux") {
        return `${(sensor.threshold / 1e14).toFixed(1)}×10¹⁴`;
      }
      return `${sensor.threshold}${sensor.unit}`;
    }
    return "N/A";
  };

  const getProgressPercentage = (sensor: SensorData) => {
    if (!sensor.threshold && !sensor.maxValue) return 50;
    
    const max = sensor.maxValue || sensor.threshold;
    if (!max) return 50;
    
    return Math.min((sensor.value / max) * 100, 100);
  };

  const timeAgo = new Date(sensor.timestamp).getTime();
  const now = Date.now();
  const secondsAgo = Math.floor((now - timeAgo) / 1000);

  return (
    <Card className="bg-dark-surface border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{getSensorTitle(sensor.sensorType)}</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusBgColor(sensor.status)}`}></div>
          <span className={`text-sm capitalize ${getStatusColor(sensor.status)}`}>
            {sensor.status}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Current</span>
          <span className={`font-mono font-bold ${getStatusColor(sensor.status)}`}>
            {formatValue(sensor.value, sensor.unit, sensor.sensorType)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">
            {sensor.sensorType === "control_rods" ? "Target" : 
             sensor.sensorType === "pressure" ? "Target Range" : "Threshold"}
          </span>
          <span className="font-mono text-gray-300">
            {getThresholdDisplay(sensor)}
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getStatusBgColor(sensor.status)}`}
            style={{ width: `${getProgressPercentage(sensor)}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Node ID: {sensor.nodeId}</span>
          <div className="flex items-center space-x-2">
            <span>Last: {secondsAgo}s ago</span>
            {sensor.nodeId.includes("01") && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-400">AWS</span>
              </div>
            )}
            {sensor.nodeId.includes("02") && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-orange-400">Ubuntu</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
