import { Button } from "@/components/ui/button";
import { Atom, Cloud, Server, Settings } from "lucide-react";
import type { ServerConnection } from "@shared/schema";

interface HeaderProps {
  serverConnections: ServerConnection[];
  isConnected: boolean;
}

export default function Header({ serverConnections, isConnected }: HeaderProps) {
  const getServerStatus = (serverType: string) => {
    const connection = serverConnections.find(conn => conn.serverType === serverType);
    return connection?.status === "connected";
  };

  const awsConnected = getServerStatus("aws");
  const ubuntuConnected = getServerStatus("ubuntu");

  const formatTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour12: false,
      timeZone: 'UTC'
    }) + ' UTC';
  };

  return (
    <header className="bg-dark-surface border-b border-gray-700 px-6 py-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Atom className="text-primary-blue text-2xl h-8 w-8" />
          <h1 className="text-xl font-semibold">Nuclear Reactor AI Monitoring System</h1>
          <div className="flex items-center space-x-2 ml-8">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-status-normal animate-pulse-gentle' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-300">
              {isConnected ? 'System Active' : 'Connecting...'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Server Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Cloud className={`h-4 w-4 ${awsConnected ? 'text-status-normal' : 'text-gray-500'}`} />
              <span className="text-sm">AWS</span>
              <div className={`w-2 h-2 rounded-full ${awsConnected ? 'bg-status-normal' : 'bg-gray-500'}`}></div>
            </div>
            <div className="flex items-center space-x-2">
              <Server className={`h-4 w-4 ${ubuntuConnected ? 'text-status-normal' : 'text-gray-500'}`} />
              <span className="text-sm">Ubuntu</span>
              <div className={`w-2 h-2 rounded-full ${ubuntuConnected ? 'bg-status-normal' : 'bg-gray-500'}`}></div>
            </div>
          </div>
          
          <div className="text-sm text-gray-300">
            <span>{formatTime()}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="bg-dark-card hover:bg-gray-600 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
