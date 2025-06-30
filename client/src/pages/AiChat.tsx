import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Brain,
  Send,
  MessageSquare,
  Lightbulb,
  Sparkles,
  Bell,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export default function AiChat() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `Olá! Sou seu assistente nutricional com IA. Posso ajudar você com dúvidas sobre alimentação, sugestões de substituições, análise de refeições e muito mais.`,
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send introduction sequence as separate messages
  useEffect(() => {
    if (isAuthenticated && messages.length === 1) {
      const introSequence = [
        "💡 Perguntas comuns:",
        "• Como posso melhorar minha alimentação? 🥕\n• Quantas refeições por dia? 🍽️\n• Como posso substituir o açúcar nas receitas? 🍎",
        "Como posso ajudar hoje? 😄",
      ];

      introSequence.forEach((message, index) => {
        setTimeout(
          () => {
            const introMessage: Message = {
              id: `intro-${index + 2}`,
              content: message,
              role: "assistant",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, introMessage]);
          },
          (index + 1) * 500,
        ); // 1.5 seconds between each message
      });
    }
  }, [isAuthenticated, messages.length]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("Failed to get AI response");
      return response.json();
    },
    onSuccess: (data: { response: string }) => {
      // Always show complete response in a single message
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
        return;
      }

      toast({
        title: "Erro na conversa",
        description: "Não foi possível obter resposta da IA. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    sendMessageMutation.mutate(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "Quais alimentos são ricos em proteína?",
    "Como posso substituir o açúcar nas receitas?",
    "Qual a quantidade ideal de água por dia?",
    "Quais são os melhores lanches saudáveis?",
  ];

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Fixed Header - Mobile and Tablet */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 px-4 md:px-6 py-4 border-b z-40 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm md:text-base">N</span>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                NutrIA - Chat IA
              </h1>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Assistente Nutricional
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 md:w-10 md:h-10">
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col">


        <div className="flex-1 flex overflow-hidden md:pt-0 pt-16">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Fixed Chat Header - Assistente IA Nutricional */}
            <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-5 sticky top-0 z-30">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Assistente IA Nutricional
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tire suas dúvidas sobre nutrição e alimentação
                  </p>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 pb-32 md:pb-28 lg:pb-24">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}
                >
                  <div
                    className={`flex space-x-3 max-w-[85%] md:max-w-[75%] lg:max-w-2xl ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback
                        className={
                          message.role === "assistant"
                            ? "bg-green-500 text-white"
                            : "bg-blue-500 text-white"
                        }
                      >
                        {message.role === "assistant" ? (
                          <Brain className="w-4 h-4" />
                        ) : (
                          "U"
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-2xl px-4 py-3 break-words ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start mb-4">
                  <div className="flex space-x-3 max-w-[85%] lg:max-w-2xl">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-green-500 text-white">
                        <Brain className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>


          </div>

          {/* Sidebar with suggestions - Desktop Only */}
          <div className="hidden lg:block w-80 border-l border-border p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Perguntas Sugeridas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full text-left h-auto p-3 text-sm whitespace-normal break-words"
                    onClick={() => setInputMessage(question)}
                  >
                    <span className="block truncate">{question}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Dicas do Assistente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      Seja específico em suas perguntas para respostas mais
                      precisas
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      Posso ajudar com substituições alimentares e análise
                      nutricional
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      Para orientações médicas específicas, consulte sempre um
                      profissional
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Fixed Input Area - Desktop (after sidebar) */}
      <div className="hidden lg:block fixed bottom-0 left-64 right-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 z-50">
        <div className="flex space-x-3 items-end max-w-4xl">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta sobre nutrição..."
            className="flex-1 min-h-[44px] max-h-32 resize-none border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={
              !inputMessage.trim() || sendMessageMutation.isPending
            }
            size="icon"
            className="h-11 w-11 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fixed Input Area - Tablet (after sidebar on larger tablets) */}
      <div className="hidden md:block lg:hidden fixed bottom-0 left-64 right-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 z-50">
        <div className="flex space-x-3 items-end max-w-3xl">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta sobre nutrição..."
            className="flex-1 min-h-[44px] max-h-32 resize-none border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sendMessageMutation.isPending}
            size="icon"
            className="h-11 w-11 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-50 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fixed Input Area - Mobile */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 z-50">
        <div className="flex space-x-3 items-end">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta sobre nutrição..."
            className="flex-1 min-h-[44px] max-h-32 resize-none border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sendMessageMutation.isPending}
            size="icon"
            className="h-11 w-11 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-50 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
