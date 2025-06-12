import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SystemLog } from "@shared/schema";

interface SystemLogsProps {
  logs: SystemLog[];
}

export default function SystemLogs({ logs }: SystemLogsProps) {
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

  const formatTimeAgo = (timestamp: Date) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  return (
    <Card className="bg-dark-surface border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent System Events</h3>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-primary-blue hover:text-blue-400"
        >
          View All Logs
        </Button>
      </div>
      
      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <i className="fas fa-list text-4xl mb-3 opacity-50"></i>
            <p>No recent system events</p>
          </div>
        ) : (
          logs.slice(0, 5).map((log) => (
            <div 
              key={log.id}
              className="flex items-center space-x-4 py-2 border-b border-gray-700 last:border-b-0"
            >
              <div className="text-xs text-gray-400 font-mono w-20">
                {formatTime(log.timestamp)}
              </div>
              <div className={`w-2 h-2 rounded-full ${getLevelColor(log.level)}`}></div>
              <div className="flex-1 text-sm">{log.message}</div>
              <div className="text-xs text-gray-500">
                {formatTimeAgo(log.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
