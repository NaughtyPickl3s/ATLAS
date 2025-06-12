import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Bot, User, Send, Trash2, Search, BookOpen, Database, Shield, FileText, Wrench } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reactorData?: any;
}

interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;
  url: string;
  content: string;
  category: 'regulation' | 'safety' | 'technical' | 'procedure' | 'standard';
  lastUpdated: Date;
  relevanceScore: number;
  tags: string[];
}

export default function AIChatPage() {
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch chat history
  const { data: chatHistory = [] } = useQuery<ChatMessage[]>({
    queryKey: ['/api/ai/chat/history'],
  });

  // Fetch reactor summary
  const { data: reactorSummaryData } = useQuery<{ summary: string }>({
    queryKey: ['/api/ai/reactor-summary'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch knowledge repository summary
  const { data: knowledgeSummaryData } = useQuery<{ summary: string }>({
    queryKey: ['/api/knowledge/summary'],
  });

  // Search knowledge documents
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['/api/knowledge/search', searchQuery, selectedCategory],
    enabled: searchQuery.length > 2,
  });

  // Get documents by category
  const { data: categoryDocuments = [] } = useQuery({
    queryKey: ['/api/knowledge/categories', selectedCategory],
    enabled: selectedCategory !== 'all' && !searchQuery,
  });

  // Send chat message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });
      setMessage('');
    },
  });

  // Clear chat history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/chat/history', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to clear history');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/chat/history'] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleClearHistory = () => {
    clearHistoryMutation.mutate();
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'regulation': return <Shield className="h-4 w-4" />;
      case 'safety': return <AlertCircle className="h-4 w-4" />;
      case 'technical': return <Database className="h-4 w-4" />;
      case 'procedure': return <FileText className="h-4 w-4" />;
      case 'standard': return <Wrench className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'regulation': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'safety': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'technical': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'procedure': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'standard': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuclear AI Assistant</h1>
        <p className="text-muted-foreground">
          Real-time reactor analysis with regulatory knowledge integration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                NUCLEAR-AI Assistant
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                disabled={clearHistoryMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col gap-4 p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-4">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Welcome to Nuclear AI Assistant</p>
                      <p className="text-sm">Ask me about reactor operations, safety procedures, or regulatory requirements.</p>
                    </div>
                  )}
                  
                  {chatHistory.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-green-500 text-white'
                        }`}>
                          {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        
                        <div className={`rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                          }`}>
                            {formatTime(new Date(msg.timestamp))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask about reactor operations, safety procedures, or regulations..."
                    disabled={sendMessageMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!message.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Repository & Reactor Status */}
        <div className="space-y-6">
          {/* Reactor Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Current Reactor Status</CardTitle>
            </CardHeader>
            <CardContent>
              {reactorSummaryData?.summary ? (
                <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-3 rounded">
                  {reactorSummaryData.summary}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">Loading reactor status...</p>
              )}
            </CardContent>
          </Card>

          {/* Knowledge Repository */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Nuclear Knowledge Repository</CardTitle>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Search className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <Input
                    placeholder="Search regulations, standards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8"
                  />
                </div>
                
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="grid w-full grid-cols-3 h-8">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="regulation" className="text-xs">Regs</TabsTrigger>
                    <TabsTrigger value="safety" className="text-xs">Safety</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-3">
                  {knowledgeSummaryData?.summary && (
                    <div className="text-xs text-muted-foreground mb-4 p-2 bg-muted rounded">
                      {knowledgeSummaryData.summary}
                    </div>
                  )}

                  {isSearching && searchQuery && (
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground">Searching...</div>
                    </div>
                  )}

                  {searchQuery && searchResults.length === 0 && !isSearching && (
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground">No documents found</div>
                    </div>
                  )}

                  {(searchQuery ? searchResults : categoryDocuments).map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {getCategoryIcon(doc.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium leading-tight">{doc.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className={`text-xs ${getCategoryColor(doc.category)}`}>
                              {doc.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{doc.source}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {doc.content.substring(0, 150)}...
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Score: {doc.relevanceScore}</span>
                        <span>{new Date(doc.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}