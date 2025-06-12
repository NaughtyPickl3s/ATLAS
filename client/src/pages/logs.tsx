import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/lib/websocket";
import { List, Search, Filter, Download, AlertCircle, Info, AlertTriangle, Clock } from "lucide-react";
import type { SystemLog } from "@shared/schema";

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<"all" | "error" | "warning" | "info">("all");
  const [filterSource, setFilterSource] = useState<"all" | string>("all");

  const { isConnected } = useWebSocket({
    onMessage: (data) => {
      switch (data.type) {
        case 'initial_data':
          setLogs(data.logs || []);
          break;
        case 'system_log':
          setLogs(prev => [data.data, ...prev.slice(0, 199)]); // Keep last 200 logs
          break;
      }
    }
  });

  // Get unique sources for filter
  const uniqueSources = Array.from(new Set(logs.map(log => log.source))).sort();

  // Filter logs based on search, level, and source
  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterLevel !== "all") {
      filtered = filtered.filter(log => log.level === filterLevel);
    }

    if (filterSource !== "all") {
      filtered = filtered.filter(log => log.source === filterSource);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, filterLevel, filterSource]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-status-critical" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-status-warning" />;
      case "info":
        return <Info className="h-4 w-4 text-primary-blue" />;
      default:
        return <Info className="h-4 w-4 text-status-normal" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-status-critical";
      case "warning":
        return "bg-status-warning";
      case "info":
        return "bg-primary-blue";
      default:
        return "bg-status-normal";
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp: Date) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportLogs = () => {
    const csvContent = [
      "Timestamp,Level,Source,Message",
      ...filteredLogs.map(log => 
        `"${new Date(log.timestamp).toISOString()}","${log.level}","${log.source}","${log.message}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reactor-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const errorLogs = logs.filter(log => log.level === "error");
  const warningLogs = logs.filter(log => log.level === "warning");
  const infoLogs = logs.filter(log => log.level === "info");

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="flex h-screen pt-16">
        <main className="flex-1 overflow-auto bg-dark-bg p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <List className="h-8 w-8 text-primary-blue mr-3" />
                  System Logs
                </h1>
                <p className="text-gray-400 mt-1">
                  Monitor reactor system events and operational history
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-status-normal animate-pulse-gentle' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-gray-400">
                  {isConnected ? 'Live Logging' : 'Connecting...'}
                </span>
              </div>
            </div>

            {/* Log Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <List className="h-8 w-8 text-primary-blue" />
                  <div>
                    <p className="text-sm text-gray-400">Total Logs</p>
                    <p className="text-2xl font-bold text-primary-blue">{logs.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-8 w-8 text-status-critical" />
                  <div>
                    <p className="text-sm text-gray-400">Errors</p>
                    <p className="text-2xl font-bold text-status-critical">{errorLogs.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-status-warning" />
                  <div>
                    <p className="text-sm text-gray-400">Warnings</p>
                    <p className="text-2xl font-bold text-status-warning">{warningLogs.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <Info className="h-8 w-8 text-status-normal" />
                  <div>
                    <p className="text-sm text-gray-400">Info</p>
                    <p className="text-2xl font-bold text-status-normal">{infoLogs.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Filters and Controls */}
            <Card className="bg-dark-surface border-gray-700 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-dark-bg border-gray-600 text-white w-64"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value as any)}
                      className="bg-dark-bg border border-gray-600 rounded px-3 py-2 text-sm text-white"
                    >
                      <option value="all">All Levels</option>
                      <option value="error">Error Only</option>
                      <option value="warning">Warning Only</option>
                      <option value="info">Info Only</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={filterSource}
                      onChange={(e) => setFilterSource(e.target.value)}
                      className="bg-dark-bg border border-gray-600 rounded px-3 py-2 text-sm text-white"
                    >
                      <option value="all">All Sources</option>
                      {uniqueSources.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-400">
                    Showing {filteredLogs.length} of {logs.length} logs
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportLogs}
                    className="text-primary-blue border-primary-blue hover:bg-primary-blue hover:text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </Card>

            {/* Log Entries */}
            <Card className="bg-dark-surface border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Log Entries</h2>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <List className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg">No logs found</p>
                    <p className="text-sm mt-1">
                      {searchTerm || filterLevel !== "all" || filterSource !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "No system events recorded"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {filteredLogs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-4 p-4 hover:bg-dark-bg transition-colors">
                        <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
                          <div className="text-xs text-gray-400 font-mono w-20">
                            {formatTime(log.timestamp)}
                          </div>
                          <div className="flex items-center space-x-1">
                            {getLevelIcon(log.level)}
                            <Badge 
                              className={`${getLevelColor(log.level)} text-white text-xs`}
                            >
                              {log.level.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-300">{log.source}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-300 break-words">{log.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}