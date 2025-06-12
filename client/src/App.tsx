import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import SensorsPage from "@/pages/sensors";
import AlertsPage from "@/pages/alerts";
import AnalyticsPage from "@/pages/analytics";
import LogsPage from "@/pages/logs";
import DevicesPage from "@/pages/devices";
import DeviceManagementPage from "@/pages/device-management";
import NetworkPage from "@/pages/network";
import AIChatPage from "@/pages/ai-chat";
import ScenariosPage from "@/pages/scenarios";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/sensors" component={SensorsPage} />
      <Route path="/alerts" component={AlertsPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/logs" component={LogsPage} />
      <Route path="/devices" component={DevicesPage} />
      <Route path="/device-management" component={DeviceManagementPage} />
      <Route path="/network" component={NetworkPage} />
      <Route path="/ai-chat" component={AIChatPage} />
      <Route path="/scenarios" component={ScenariosPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
