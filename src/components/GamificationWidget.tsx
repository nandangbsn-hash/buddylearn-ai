import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Star, TrendingUp } from "lucide-react";

export const GamificationWidget = () => {
  const [progress, setProgress] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    fetchProgress();
    fetchBadges();
  }, []);

  const fetchProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) {
      // Create initial progress
      await supabase.from("user_progress").insert({
        user_id: user.id,
        total_xp: 0,
        level: 1,
        current_streak: 0,
      });
      fetchProgress();
    } else {
      setProgress(data);
    }
  };

  const fetchBadges = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", user.id);

    setBadges(data || []);
  };

  if (!progress) return null;

  const xpToNextLevel = progress.level * 100;
  const xpProgress = (progress.total_xp % 100);

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Level {progress.level}</span>
            <span className="text-sm text-muted-foreground">{xpProgress}/{xpToNextLevel} XP</span>
          </div>
          <Progress value={(xpProgress / xpToNextLevel) * 100} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{progress.current_streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{progress.total_xp}</p>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </div>
          </div>
        </div>

        {badges.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Recent Badges</p>
            <div className="flex flex-wrap gap-2">
              {badges.slice(0, 3).map((userBadge) => (
                <Badge key={userBadge.id} variant="secondary">
                  {userBadge.badges.icon} {userBadge.badges.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
