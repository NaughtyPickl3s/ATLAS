import { Link, useLocation } from "wouter";
import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

export default function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      <Link href="/dashboard">
        <div className="flex items-center space-x-1 hover:text-foreground cursor-pointer">
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
        </div>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          {item.href && !item.current ? (
            <Link href={item.href}>
              <span className="hover:text-foreground cursor-pointer">{item.label}</span>
            </Link>
          ) : (
            <span className={item.current ? "text-foreground font-medium" : ""}>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}