import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/lib/websocket";
import { Network, Server, Cloud, Wifi, Lock, AlertTriangle, CheckCircle2, Router, Shield, Clock } from "lucide-react";
import type { ServerConnection } from "@shared/schema";

interface NetworkInterface {
  id: string;
  name: string;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  status: "active" | "inactive" | "error";
  type: "ethernet" | "fiber" | "wireless";
  speed: string;
  duplex: "full" | "half";
  mtu: number;
  vlan?: number;
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  rules: string[];
}

export default function NetworkPage() {
  const [serverConnections, setServerConnections] = useState<ServerConnection[]>([]);
  const [networkInterfaces, setNetworkInterfaces] = useState<NetworkInterface[]>([]);
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);

  const { isConnected } = useWebSocket({
    onMessage: (data) => {
      switch (data.type) {
        case 'initial_data':
          setServerConnections(data.serverConnections || []);
          break;
      }
    }
  });

  // Initialize network configuration data
  useEffect(() => {
    const mockInterfaces: NetworkInterface[] = [
      {
        id: "eth0",
        name: "Primary Management Interface",
        ipAddress: "192.168.1.100",
        subnetMask: "255.255.255.0",
        gateway: "192.168.1.1",
        status: "active",
        type: "ethernet",
        speed: "1 Gbps",
        duplex: "full",
        mtu: 1500,
        vlan: 100
      },
      {
        id: "eth1", 
        name: "AWS Cloud Connection",
        ipAddress: "10.0.1.50",
        subnetMask: "255.255.255.0",
        gateway: "10.0.1.1",
        status: "active",
        type: "fiber",
        speed: "10 Gbps",
        duplex: "full",
        mtu: 9000
      },
      {
        id: "eth2",
        name: "Ubuntu Server Link",
        ipAddress: "172.16.1.10",
        subnetMask: "255.255.255.0", 
        gateway: "172.16.1.1",
        status: "active",
        type: "ethernet",
        speed: "1 Gbps",
        duplex: "full",
        mtu: 1500,
        vlan: 200
      },
      {
        id: "wlan0",
        name: "Emergency Wireless Backup",
        ipAddress: "192.168.100.50",
        subnetMask: "255.255.255.0",
        gateway: "192.168.100.1",
        status: "inactive",
        type: "wireless",
        speed: "300 Mbps",
        duplex: "half",
        mtu: 1500
      }
    ];

    const mockPolicies: SecurityPolicy[] = [
      {
        id: "pol-001",
        name: "Nuclear Safety Network Isolation",
        description: "Isolates safety-critical nuclear systems from general plant networks",
        enabled: true,
        priority: 1,
        rules: [
          "DENY all traffic from external networks to safety systems",
          "ALLOW only authenticated safety system communications",
          "LOG all safety system network activity",
          "ENCRYPT all inter-system communications"
        ]
      },
      {
        id: "pol-002", 
        name: "Server Access Control",
        description: "Controls access between AWS and Ubuntu monitoring servers",
        enabled: true,
        priority: 2,
        rules: [
          "ALLOW sensor data transmission from servers",
          "REQUIRE mutual TLS authentication",
          "RATE LIMIT to prevent data flooding",
          "MONITOR for unusual traffic patterns"
        ]
      },
      {
        id: "pol-003",
        name: "Emergency Communications",
        description: "Ensures communication pathways during emergency conditions",
        enabled: true,
        priority: 3,
        rules: [
          "PRIORITIZE emergency system traffic",
          "MAINTAIN redundant communication paths",
          "ACTIVATE backup wireless if primary fails",
          "NOTIFY operators of communication failures"
        ]
      },
      {
        id: "pol-004",
        name: "Intrusion Detection",
        description: "Monitors for unauthorized network access attempts",
        enabled: true,
        priority: 4,
        rules: [
          "SCAN for unauthorized devices",
          "DETECT anomalous traffic patterns",
          "BLOCK suspicious IP addresses",
          "ALERT security personnel immediately"
        ]
      }
    ];

    setNetworkInterfaces(mockInterfaces);
    setSecurityPolicies(mockPolicies);
  }, []);

  const getInterfaceIcon = (type: NetworkInterface["type"]) => {
    switch (type) {
      case "ethernet": return <Network className="h-5 w-5" />;
      case "fiber": return <Wifi className="h-5 w-5" />;
      case "wireless": return <Wifi className="h-5 w-5" />;
      default: return <Network className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: NetworkInterface["status"]) => {
    switch (status) {
      case "active": return "bg-status-normal";
      case "inactive": return "bg-gray-500";
      case "error": return "bg-status-critical";
      default: return "bg-gray-500";
    }
  };

  const getServerStatus = (serverType: string) => {
    const connection = serverConnections.find(conn => conn.serverType === serverType);
    return connection?.status === "connected";
  };

  const activeInterfaces = networkInterfaces.filter(i => i.status === "active").length;
  const inactiveInterfaces = networkInterfaces.filter(i => i.status === "inactive").length;
  const enabledPolicies = securityPolicies.filter(p => p.enabled).length;

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="flex h-screen pt-16">
        <main className="flex-1 overflow-auto bg-dark-bg p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <Network className="h-8 w-8 text-primary-blue mr-3" />
                  Network Configuration
                </h1>
                <p className="text-gray-400 mt-1">
                  Manage network connectivity and security for reactor monitoring systems
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-status-normal animate-pulse-gentle' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-gray-400">
                  {isConnected ? 'Network Monitoring Active' : 'Connecting...'}
                </span>
              </div>
            </div>

            {/* Network Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-8 w-8 text-status-normal" />
                  <div>
                    <p className="text-sm text-gray-400">Active Interfaces</p>
                    <p className="text-2xl font-bold text-status-normal">{activeInterfaces}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <Server className="h-8 w-8 text-primary-blue" />
                  <div>
                    <p className="text-sm text-gray-400">Server Connections</p>
                    <p className="text-2xl font-bold text-primary-blue">{serverConnections.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-status-normal" />
                  <div>
                    <p className="text-sm text-gray-400">Security Policies</p>
                    <p className="text-2xl font-bold text-status-normal">{enabledPolicies}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-dark-surface border-gray-700 p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-400">Inactive Links</p>
                    <p className="text-2xl font-bold text-gray-500">{inactiveInterfaces}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Server Connection Status */}
            <Card className="bg-dark-surface border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Server className="h-6 w-6 text-primary-blue mr-2" />
                Server Connection Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Cloud className={`h-8 w-8 ${getServerStatus("aws") ? 'text-status-normal' : 'text-gray-500'}`} />
                    <div>
                      <h3 className="font-medium">AWS Cloud Server</h3>
                      <p className="text-sm text-gray-400">Primary monitoring infrastructure</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getServerStatus("aws") ? 'bg-status-normal' : 'bg-gray-500'}`}></div>
                    <Badge className={getServerStatus("aws") ? "bg-status-normal" : "bg-gray-500"}>
                      {getServerStatus("aws") ? "CONNECTED" : "DISCONNECTED"}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Server className={`h-8 w-8 ${getServerStatus("ubuntu") ? 'text-status-normal' : 'text-gray-500'}`} />
                    <div>
                      <h3 className="font-medium">Ubuntu Server</h3>
                      <p className="text-sm text-gray-400">Secondary monitoring backup</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getServerStatus("ubuntu") ? 'bg-status-normal' : 'bg-gray-500'}`}></div>
                    <Badge className={getServerStatus("ubuntu") ? "bg-status-normal" : "bg-gray-500"}>
                      {getServerStatus("ubuntu") ? "CONNECTED" : "DISCONNECTED"}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Network Interfaces */}
            <Card className="bg-dark-surface border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Router className="h-6 w-6 text-primary-blue mr-2" />
                  Network Interfaces
                </h2>
                <Button className="bg-primary-blue hover:bg-blue-600">
                  Configure Interface
                </Button>
              </div>
              
              <div className="space-y-4">
                {networkInterfaces.map((networkInterface) => (
                  <div key={networkInterface.id} className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-primary-blue">
                        {getInterfaceIcon(networkInterface.type)}
                      </div>
                      <div>
                        <h3 className="font-medium">{networkInterface.name}</h3>
                        <p className="text-sm text-gray-400">{networkInterface.ipAddress}/{networkInterface.subnetMask}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>{networkInterface.type.toUpperCase()}</span>
                          <span>•</span>
                          <span>{networkInterface.speed}</span>
                          <span>•</span>
                          <span>{networkInterface.duplex} duplex</span>
                          {networkInterface.vlan && (
                            <>
                              <span>•</span>
                              <span>VLAN {networkInterface.vlan}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Gateway: {networkInterface.gateway}</p>
                        <p className="text-xs text-gray-500">MTU: {networkInterface.mtu}</p>
                      </div>
                      <Badge className={`${getStatusColor(networkInterface.status)} text-white`}>
                        {networkInterface.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Security Policies */}
            <Card className="bg-dark-surface border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Shield className="h-6 w-6 text-primary-blue mr-2" />
                  Security Policies
                </h2>
                <Button className="bg-primary-blue hover:bg-blue-600">
                  Add Policy
                </Button>
              </div>
              
              <div className="space-y-4">
                {securityPolicies.map((policy) => (
                  <div key={policy.id} className="p-4 bg-dark-bg rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Lock className={`h-5 w-5 ${policy.enabled ? 'text-status-normal' : 'text-gray-500'}`} />
                        <div>
                          <h3 className="font-medium">{policy.name}</h3>
                          <p className="text-sm text-gray-400">{policy.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Priority: {policy.priority}</span>
                        <Badge className={policy.enabled ? "bg-status-normal" : "bg-gray-500"}>
                          {policy.enabled ? "ENABLED" : "DISABLED"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="ml-8">
                      <h4 className="text-sm font-medium mb-2 text-gray-300">Policy Rules:</h4>
                      <ul className="space-y-1">
                        {policy.rules.map((rule, index) => (
                          <li key={index} className="text-xs text-gray-400 flex items-center">
                            <span className="w-2 h-2 bg-primary-blue rounded-full mr-2"></span>
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Network Diagnostics */}
            <Card className="bg-dark-surface border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Clock className="h-6 w-6 text-primary-blue mr-2" />
                Network Diagnostics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-dark-bg rounded-lg">
                  <p className="text-2xl font-bold text-status-normal">{"< 1ms"}</p>
                  <p className="text-sm text-gray-400">Latency to AWS</p>
                </div>
                <div className="text-center p-4 bg-dark-bg rounded-lg">
                  <p className="text-2xl font-bold text-status-normal">{"< 0.5ms"}</p>
                  <p className="text-sm text-gray-400">Latency to Ubuntu</p>
                </div>
                <div className="text-center p-4 bg-dark-bg rounded-lg">
                  <p className="text-2xl font-bold text-status-normal">99.9%</p>
                  <p className="text-sm text-gray-400">Network Uptime</p>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}