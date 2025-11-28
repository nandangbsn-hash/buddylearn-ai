import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, ArrowLeft, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { parseFlashcards, parseMermaidDiagram } from "@/utils/parseAIResponse";

type Message = { role: "user" | "assistant"; content: string };

const AIChat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("explain");
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMaterials();
    // Auto-select material from URL if provided
    const materialIdFromUrl = searchParams.get("materialId");
    if (materialIdFromUrl) {
      setSelectedMaterial(materialIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMaterials = async () => {
    const { data } = await supabase
      .from("materials")
      .select("id, title")
      .order("created_at", { ascending: false });
    setMaterials(data || []);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            materialId: selectedMaterial || undefined,
            mode,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        setMessages(prev => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantMessage += content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = assistantMessage;
                    return newMessages;
                  });
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">AI Study Assistant</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 flex-1 flex flex-col gap-4">
        <div className="flex gap-4">
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="explain">Explain Concepts</SelectItem>
              <SelectItem value="quiz">Flashcards</SelectItem>
              <SelectItem value="flowchart">Flowchart</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMaterial || "none"} onValueChange={(val) => setSelectedMaterial(val === "none" ? "" : val)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select study material (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No material (general questions)</SelectItem>
              {materials.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedMaterial && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm font-semibold text-primary">
                📚 Selected: {materials.find(m => m.id === selectedMaterial)?.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AI will analyze your uploaded file and any notes you added
              </p>
            </div>
          )}
        </div>

        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold">Ask me anything about your study materials!</p>
                    <p className="text-sm mt-2">I can explain concepts, create quizzes, or help with research.</p>
                    {selectedMaterial && (
                      <div className="mt-4 p-3 bg-primary/10 text-primary rounded-lg max-w-md mx-auto">
                        <p className="text-sm font-semibold">📚 Selected Material: {materials.find(m => m.id === selectedMaterial)?.title}</p>
                        <p className="text-xs mt-1">I'll use this material's content to answer your questions!</p>
                      </div>
                    )}
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const flashcards = msg.role === "assistant" ? parseFlashcards(msg.content) : null;
                  const mermaidDiagram = msg.role === "assistant" ? parseMermaidDiagram(msg.content) : null;

                  return (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {flashcards ? (
                        <div className="w-full">
                          <FlashcardViewer flashcards={flashcards} />
                        </div>
                      ) : mermaidDiagram ? (
                        <div className="w-full">
                          <MermaidDiagram chart={mermaidDiagram} />
                          {msg.content.replace(/```mermaid[\s\S]+?```/, '').trim() && (
                            <div className="mt-4 bg-muted rounded-lg px-4 py-2 prose prose-sm max-w-none">
                              {msg.content.replace(/```mermaid[\s\S]+?```/, '').trim()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.content}
                        </div>
                      )}
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2 mt-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <Button onClick={sendMessage} disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIChat;
