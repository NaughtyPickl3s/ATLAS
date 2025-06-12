import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSensorValue(value: number, sensorType: string, unit: string): string {
  if (sensorType === "neutron_flux") {
    return `${(value / 1e14).toFixed(1)}×10¹⁴`;
  }
  
  if (sensorType === "temperature" || sensorType === "pressure") {
    return `${value.toFixed(1)}${unit}`;
  }
  
  if (sensorType === "control_rods") {
    return `${Math.round(value)}${unit}`;
  }
  
  return `${value.toFixed(1)}${unit}`;
}

export function getStatusColor(status: string): string {
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
}

export function getStatusBackgroundColor(status: string): string {
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
}

export function formatTimeAgo(timestamp: Date): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diffSeconds = Math.floor((now - time) / 1000);
  
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export function calculateSystemHealth(sensorData: any[]): number {
  if (sensorData.length === 0) return 0;
  
  const normalSensors = sensorData.filter(sensor => sensor.status === "normal").length;
  return (normalSensors / sensorData.length) * 100;
}

export function generateSensorId(sensorType: string, index: number = 1): string {
  const prefixes: Record<string, string> = {
    temperature: "CORE-TEMP",
    pressure: "PRES-PRI", 
    radiation: "RAD-MON",
    coolant_flow: "COOL-FLOW",
    neutron_flux: "NEUT-FLUX",
    control_rods: "CTRL-ROD",
  };
  
  const prefix = prefixes[sensorType] || "SENSOR";
  return `${prefix}-${index.toString().padStart(2, '0')}`;
}
