import { useEffect, useState } from "react";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebSocket } from "@/lib/websocket";
import { AlertTriangle, X, Clock, Filter, Search, CheckCircle2, XCircle, Eye, Zap, Thermometer, Gauge, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Alert, SensorData, ServerConnection } from "@shared/schema";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [serverConnections, setServerConnections] = useState<ServerConnection[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "critical" | "warning">("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const { isConnected } = useWebSocket({
    onMessage: (data) => {
      switch (data.type) {
        case 'initial_data':
          setAlerts(data.alerts || []);
          break;
      }
    }
  });

  // Filter alerts based on search and type
  useEffect(() => {
    let filtered = alerts;

    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.sensorNodeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(alert => alert.alertType === filterType);
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, filterType]);

  const dismissAlert = async (alertId: number) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, isActive: false } : alert
        ));
      }
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const getAlertIcon = (alertType: string) => {
    return alertType === "critical" ? 
      <XCircle className="h-5 w-5 text-status-critical" /> : 
      <AlertTriangle className="h-5 w-5 text-status-warning" />;
  };

  const getAlertBadgeColor = (alertType: string) => {
    return alertType === "critical" ? "bg-status-critical" : "bg-status-warning";
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const activeAlerts = alerts.filter(alert => alert.isActive);
  const criticalAlerts = activeAlerts.filter(alert => alert.alertType === "critical");
  const warningAlerts = activeAlerts.filter(alert => alert.alertType === "warning");

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="flex h-screen pt-16">
        <main className="flex-1 overflow-auto bg-dark-bg p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Alert Management</h1>
                <p className="text-gray-400 mt-1">
                  Monitor and manage reactor safety alerts and notifications
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-status-normal animate-pulse-gentle' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-gray-400">
                  {isConnected ? 'Live Monitoring' : 'Connecting...'}
                </span>
              </div>
            </div>

            {/* Alert Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-status-warning" />
                  <div>
                    <p className="text-sm text-gray-400">Total Active</p>
                    <p className="text-2xl font-bold text-status-warning">{activeAlerts.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <XCircle className="h-8 w-8 text-status-critical" />
                  <div>
                    <p className="text-sm text-gray-400">Critical</p>
                    <p className="text-2xl font-bold text-status-critical">{criticalAlerts.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-status-warning" />
                  <div>
                    <p className="text-sm text-gray-400">Warning</p>
                    <p className="text-2xl font-bold text-status-warning">{warningAlerts.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-8 w-8 text-status-normal" />
                  <div>
                    <p className="text-sm text-gray-400">Resolved Today</p>
                    <p className="text-2xl font-bold text-status-normal">
                      {alerts.filter(alert => !alert.isActive).length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="bg-dark-surface border-gray-700 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search alerts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-dark-bg border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="bg-dark-bg border border-gray-600 rounded px-3 py-2 text-sm text-white"
                    >
                      <option value="all">All Alerts</option>
                      <option value="critical">Critical Only</option>
                      <option value="warning">Warning Only</option>
                    </select>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400">
                  Showing {filteredAlerts.length} of {alerts.length} alerts
                </div>
              </div>
            </Card>

            {/* Alert List */}
            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <Card className="bg-dark-surface border-gray-700 p-8">
                  <div className="text-center text-gray-400">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg">No alerts found</p>
                    <p className="text-sm mt-1">
                      {searchTerm || filterType !== "all" 
                        ? "Try adjusting your search or filter criteria"
                        : "All systems are operating normally"
                      }
                    </p>
                  </div>
                </Card>
              ) : (
                filteredAlerts.map((alert) => (
                  <Card key={alert.id} className="bg-dark-surface border-gray-700">
                    <div className="flex items-center justify-between p-6">
                      <div className="flex items-start space-x-4">
                        {getAlertIcon(alert.alertType)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-lg">{alert.sensorNodeId}</h3>
                            <Badge 
                              className={`${getAlertBadgeColor(alert.alertType)} text-white`}
                            >
                              {alert.alertType.toUpperCase()}
                            </Badge>
                            {!alert.isActive && (
                              <Badge variant="outline" className="text-gray-400">
                                RESOLVED
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-300 mb-2">{alert.message}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTimeAgo(alert.timestamp)}</span>
                            </div>
                            <span>•</span>
                            <span>{new Date(alert.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {alert.isActive && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dismissAlert(alert.id)}
                            className="text-gray-400 hover:text-white"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}