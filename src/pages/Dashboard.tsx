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
  Upload,
  Calendar,
  FileQuestion
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
                <FileQuestion className="h-5 w-5 text-primary" />
                <CardTitle>Homework Helper</CardTitle>
              </div>
              <CardDescription>Submit homework & get AI help</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate("/homework")}>
                <FileQuestion className="h-4 w-4 mr-2" />
                Get Help
              </Button>
            </CardContent>
          </Card>

          {/* Study Planner */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Study Planner</CardTitle>
              </div>
              <CardDescription>Schedule tasks & get email reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate("/planner")}>
                <Calendar className="h-4 w-4 mr-2" />
                Open Planner
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
              <CardDescription>View performance & analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate("/progress")}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Progress
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle>🎯 Your Learning Hub</CardTitle>
              <CardDescription>All your study tools in one place</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Study Materials
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload PDFs, docs, images, and URLs. AI automatically organizes and summarizes them.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Ask Your Notes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Chat with your materials. Get explanations, flashcards, and flowcharts.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileQuestion className="h-4 w-4" />
                    Homework Helper
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Submit homework for XP, get step-by-step help, and research topics with citations.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Study Planner
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Schedule tasks and get automatic email reminders before deadlines.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => navigate("/materials")}>
                  <Upload className="h-4 w-4 mr-2" />
                  Start Learning
                </Button>
                <Button variant="outline" onClick={() => navigate("/planner")}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Plan Studies
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
