import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Mail, Clock, Loader2 } from "lucide-react";

const EmailPreferences = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    daily_digest_enabled: true,
    digest_time: "08:00",
    include_overdue: true,
    include_today: true,
    include_this_week: true,
    include_upcoming: true,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching preferences:", error);
        toast.error("Failed to load preferences");
      } else if (data) {
        setPreferences({
          daily_digest_enabled: data.daily_digest_enabled,
          digest_time: data.digest_time.substring(0, 5), // HH:MM format
          include_overdue: data.include_overdue,
          include_today: data.include_today,
          include_this_week: data.include_this_week,
          include_upcoming: data.include_upcoming,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("email_preferences")
        .upsert({
          user_id: user.id,
          daily_digest_enabled: preferences.daily_digest_enabled,
          digest_time: preferences.digest_time + ":00",
          include_overdue: preferences.include_overdue,
          include_today: preferences.include_today,
          include_this_week: preferences.include_this_week,
          include_upcoming: preferences.include_upcoming,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error("Error saving preferences:", error);
        toast.error("Failed to save preferences");
      } else {
        toast.success("Email preferences updated successfully!");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/planner")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Email Preferences</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Daily Digest Settings</CardTitle>
            <CardDescription>
              Customize when and how you receive your daily study reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable Daily Digest */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="daily-digest" className="text-base font-semibold">
                  Daily Digest Email
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive a daily summary of your tasks and deadlines
                </p>
              </div>
              <Switch
                id="daily-digest"
                checked={preferences.daily_digest_enabled}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, daily_digest_enabled: checked })
                }
              />
            </div>

            {/* Email Time */}
            <div className="space-y-2">
              <Label htmlFor="digest-time" className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Delivery Time (UTC)
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Choose what time you want to receive your daily digest
              </p>
              <Input
                id="digest-time"
                type="time"
                value={preferences.digest_time}
                onChange={(e) =>
                  setPreferences({ ...preferences, digest_time: e.target.value })
                }
                disabled={!preferences.daily_digest_enabled}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                ⓘ Time is in UTC. Your local time may differ based on your timezone.
              </p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-base font-semibold mb-4">Include in Email</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include-overdue">Overdue Tasks</Label>
                    <p className="text-sm text-muted-foreground">
                      Tasks that are past their due date
                    </p>
                  </div>
                  <Switch
                    id="include-overdue"
                    checked={preferences.include_overdue}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, include_overdue: checked })
                    }
                    disabled={!preferences.daily_digest_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include-today">Due Today</Label>
                    <p className="text-sm text-muted-foreground">
                      Tasks due within the next 24 hours
                    </p>
                  </div>
                  <Switch
                    id="include-today"
                    checked={preferences.include_today}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, include_today: checked })
                    }
                    disabled={!preferences.daily_digest_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include-week">Due This Week</Label>
                    <p className="text-sm text-muted-foreground">
                      Tasks due within the next 7 days
                    </p>
                  </div>
                  <Switch
                    id="include-week"
                    checked={preferences.include_this_week}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, include_this_week: checked })
                    }
                    disabled={!preferences.daily_digest_enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include-upcoming">Upcoming Tasks</Label>
                    <p className="text-sm text-muted-foreground">
                      Tasks due later than 7 days from now
                    </p>
                  </div>
                  <Switch
                    id="include-upcoming"
                    checked={preferences.include_upcoming}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, include_upcoming: checked })
                    }
                    disabled={!preferences.daily_digest_enabled}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving || !preferences.daily_digest_enabled}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailPreferences;
