import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const updateStreak = async (userId: string) => {
  try {
    // Fetch current progress
    const { data: progress, error: fetchError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let currentStreak = progress?.current_streak || 0;
    let longestStreak = progress?.longest_streak || 0;
    const lastActivityDate = progress?.last_activity_date;

    // Calculate streak
    if (lastActivityDate === today) {
      // Already active today, no change needed
      console.log("Already active today, streak unchanged");
      return { streak: currentStreak, isNewRecord: false };
    } else if (lastActivityDate === yesterday) {
      // Streak continues! Increment by 1
      currentStreak += 1;
      console.log(`Streak continues! Now at ${currentStreak} days`);
    } else {
      // Streak broken or first activity, reset to 1
      currentStreak = 1;
      console.log("Starting new streak");
    }

    // Check if this is a new personal record
    const isNewRecord = currentStreak > longestStreak;
    if (isNewRecord) {
      longestStreak = currentStreak;
    }

    // Update the database
    const { error: updateError } = await supabase
      .from("user_progress")
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    // Show streak milestone notifications
    if (currentStreak === 2) {
      toast({
        title: "🔥 Day 2 streak!",
        description: "Keep the momentum going!",
      });
    } else if (currentStreak === 7) {
      toast({
        title: "🔥 7-day streak!",
        description: "One week of consistent learning!",
      });
    } else if (currentStreak === 30) {
      toast({
        title: "🔥 30-day streak!",
        description: "A full month of dedication!",
      });
    } else if (isNewRecord && currentStreak > 2) {
      toast({
        title: `🏆 New personal best: ${currentStreak}-day streak!`,
        description: "You're on fire!",
      });
    }

    return { streak: currentStreak, isNewRecord };
  } catch (error) {
    console.error("Error updating streak:", error);
    return { streak: 0, isNewRecord: false };
  }
};
