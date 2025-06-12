import { Link, useLocation } from "wouter";
import { 
  Gauge, 
  Thermometer, 
  AlertTriangle, 
  Brain, 
  List,
  Atom,
  Settings,
  Network,
  MessageSquare,
  Play
} from "lucide-react";

interface SidebarProps {
  activeAlerts: number;
}

export default function Sidebar({ activeAlerts }: SidebarProps) {
  const [location] = useLocation();
  
  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Gauge,
      current: location === "/" || location === "/dashboard",
    },
    {
      name: "Sensor Nodes", 
      href: "/sensors",
      icon: Thermometer,
      current: location === "/sensors",
    },
    {
      name: "Alerts",
      href: "/alerts", 
      icon: AlertTriangle,
      current: location === "/alerts",
      badge: activeAlerts > 0 ? activeAlerts : undefined,
    },
    {
      name: "AI Analysis",
      href: "/analytics",
      icon: Brain,
      current: location === "/analytics",
    },
    {
      name: "AI Chat",
      href: "/ai-chat",
      icon: MessageSquare,
      current: location === "/ai-chat",
    },
    {
      name: "Nuclear Scenarios",
      href: "/scenarios",
      icon: Play,
      current: location === "/scenarios",
    },
    {
      name: "System Logs",
      href: "/logs",
      icon: List,
      current: location === "/logs",
    },
    {
      name: "Device Management",
      href: "/devices",
      icon: Settings,
      current: location === "/devices",
    },
    {
      name: "Network Config",
      href: "/network",
      icon: Network,
      current: location === "/network",
    },
  ];

  return (
    <aside className="w-64 bg-dark-surface border-r border-gray-700">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <div className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer
                ${item.current 
                  ? 'bg-primary-blue text-white' 
                  : 'text-gray-300 hover:bg-dark-card'
                }
              `}>
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
                {item.badge && (
                  <span className="bg-status-critical text-white text-xs px-2 py-1 rounded-full ml-auto">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
