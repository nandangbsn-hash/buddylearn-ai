import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Brain, 
  BookOpen, 
  Target, 
  BarChart3, 
  MessageSquare, 
  LogOut,
  Upload
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GamificationWidget } from "@/components/GamificationWidget";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
      }
    });
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data || { full_name: "Student" });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  if (!session || !profile) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Buddy</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile.full_name || "Student"}!
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Gamification Widget */}
          <div className="lg:col-span-3">
            <GamificationWidget />
          </div>

          {/* Study Materials */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <CardTitle>Study Materials</CardTitle>
              </div>
              <CardDescription>Upload and organize your notes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate("/materials")}>
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Materials
              </Button>
            </CardContent>
          </Card>

          {/* AI Chat */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle>Ask Your Notes</CardTitle>
              </div>
              <CardDescription>Chat with your study materials</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate("/ai-chat")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            </CardContent>
          </Card>

          {/* Homework Helper */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>Homework Helper</CardTitle>
              </div>
              <CardDescription>Upload homework & get research help</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate("/homework")}>
                <BookOpen className="h-4 w-4 mr-2" />
                Get Help
              </Button>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle>Progress</CardTitle>
              </div>
              <CardDescription>Track your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
          <Button className="w-full" variant="outline" onClick={() => navigate("/progress")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Progress
          </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Begin your personalized learning journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Welcome to Buddy! Start by uploading your study materials, and let our AI help you learn more effectively.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => navigate("/materials")}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Material
                </Button>
                <Button variant="outline" onClick={() => navigate("/ai-chat")}>
                  Take a Tour
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
