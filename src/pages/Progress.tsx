import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Target, Clock, Award } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

const Progress = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalXP: 0,
    level: 1,
    streak: 0,
    quizzesTaken: 0,
    avgScore: 0,
  });
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user progress
    const { data: progress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Get quiz attempts
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("*, quizzes(material_id, materials(subject_id, subjects(name)))")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(30);

    // Get study sessions
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("*, subjects(name)")
      .eq("user_id", user.id)
      .order("session_date", { ascending: false })
      .limit(10);

    if (progress) {
      setStats({
        totalXP: progress.total_xp || 0,
        level: progress.level || 1,
        streak: progress.current_streak || 0,
        quizzesTaken: attempts?.length || 0,
        avgScore: attempts?.length 
          ? Math.round((attempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / attempts.length))
          : 0,
      });
    }

    // Process performance data for chart
    if (attempts && attempts.length > 0) {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayAttempts = attempts.filter(a => 
          format(new Date(a.completed_at), "yyyy-MM-dd") === dateStr
        );
        
        return {
          date: format(date, "MMM dd"),
          score: dayAttempts.length > 0
            ? Math.round(dayAttempts.reduce((sum, a) => sum + (a.score / a.total_questions * 100), 0) / dayAttempts.length)
            : 0,
          quizzes: dayAttempts.length,
        };
      });
      setPerformanceData(last7Days);

      // Subject-wise performance
      const subjectMap = new Map();
      attempts.forEach(attempt => {
        const subjectName = attempt.quizzes?.materials?.subjects?.name || "General";
        const score = (attempt.score / attempt.total_questions) * 100;
        
        if (!subjectMap.has(subjectName)) {
          subjectMap.set(subjectName, { scores: [], count: 0 });
        }
        const subjectData = subjectMap.get(subjectName);
        subjectData.scores.push(score);
        subjectData.count++;
      });

      const subjectStats = Array.from(subjectMap.entries()).map(([name, data]: [string, any]) => ({
        subject: name,
        avgScore: Math.round(data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length),
        attempts: data.count,
      }));
      setSubjectPerformance(subjectStats);
    }

    setRecentSessions(sessions || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Your Progress</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total XP</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalXP}</div>
              <p className="text-xs text-muted-foreground">Level {stats.level}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.streak} days</div>
              <p className="text-xs text-muted-foreground">Keep it up!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.quizzesTaken}</div>
              <p className="text-xs text-muted-foreground">Total attempts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore}%</div>
              <p className="text-xs text-muted-foreground">Across all quizzes</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>7-Day Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Subject Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {subjectPerformance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Take some quizzes to see your performance by subject
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={subjectPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Study Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Study Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No study sessions recorded yet
                  </p>
                ) : (
                  recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{session.subjects?.name || "General Study"}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.session_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{session.duration_minutes} min</p>
                        {session.focus_score && (
                          <p className="text-sm text-muted-foreground">
                            Focus: {session.focus_score}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Progress;