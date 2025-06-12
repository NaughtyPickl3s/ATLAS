import { cn } from "@/lib/utils";

interface LoadingBubbleProps {
  className?: string;
}

export default function LoadingBubble({ className }: LoadingBubbleProps) {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-sm text-muted-foreground ml-2">Generating response...</span>
    </div>
  );
}