import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
}

export default function NavigationHeader({ 
  title, 
  subtitle, 
  showBack = true, 
  backHref = "/dashboard" 
}: NavigationHeaderProps) {
  const [, navigate] = useLocation();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {showBack && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(backHref)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </Link>
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}