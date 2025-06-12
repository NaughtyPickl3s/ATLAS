import { Card } from "@/components/ui/card";
import { Brain, TriangleAlert, Lightbulb, CheckCircle } from "lucide-react";
import type { AiRecommendation } from "@shared/schema";

interface AiRecommendationsProps {
  recommendations: AiRecommendation[];
}

export default function AiRecommendations({ recommendations }: AiRecommendationsProps) {
  const getPriorityIcon = (priority: string, category: string) => {
    if (category === "anomaly") {
      return <TriangleAlert className="h-5 w-5 text-status-warning mt-1" />;
    }
    if (category === "optimization") {
      return <Lightbulb className="h-5 w-5 text-primary-blue mt-1" />;
    }
    return <CheckCircle className="h-5 w-5 text-status-normal mt-1" />;
  };

  const getPriorityColors = (priority: string, category: string) => {
    if (category === "anomaly") {
      return {
        bg: "bg-status-warning/20",
        border: "border-status-warning",
      };
    }
    if (category === "optimization") {
      return {
        bg: "bg-primary-blue/20",
        border: "border-primary-blue",
      };
    }
    return {
      bg: "bg-status-normal/20", 
      border: "border-status-normal",
    };
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Card className="bg-dark-surface border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Brain className="h-6 w-6 text-primary-blue mr-2" />
        AI Recommendations
      </h3>
      
      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>AI analysis in progress...</p>
            <p className="text-sm mt-1">Recommendations will appear here</p>
          </div>
        ) : (
          recommendations.slice(0, 3).map((recommendation) => {
            const colors = getPriorityColors(recommendation.priority, recommendation.category);
            
            return (
              <div
                key={recommendation.id}
                className={`${colors.bg} border-l-4 ${colors.border} p-4 rounded-r`}
              >
                <div className="flex items-start space-x-3">
                  {getPriorityIcon(recommendation.priority, recommendation.category)}
                  <div className="flex-1">
                    <h4 className="font-medium">{recommendation.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      {recommendation.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500">
                        Confidence: {Math.round(recommendation.confidence)}% | 
                        Priority: {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(recommendation.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
