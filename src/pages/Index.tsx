import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, BookOpen, Target, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-8">
            <Brain className="h-20 w-20 text-primary animate-pulse" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Meet Buddy
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered adaptive study companion that transforms how you learn
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-lg bg-card border">
              <BookOpen className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Smart Organization</h3>
              <p className="text-sm text-muted-foreground">
                Upload and organize study materials with AI-powered tagging
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card border">
              <Target className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Adaptive Learning</h3>
              <p className="text-sm text-muted-foreground">
                Personalized study paths that adapt to your pace and style
              </p>
            </div>
            
            <div className="p-6 rounded-lg bg-card border">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">AI Assistance</h3>
              <p className="text-sm text-muted-foreground">
                Chat with your notes and get instant explanations
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
