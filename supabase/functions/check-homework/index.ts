import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get submission details
    const { data: submission, error: fetchError } = await supabase
      .from('homework_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError) throw fetchError;

    // Use AI to verify completion
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a homework verification assistant. Analyze submissions and determine if they appear complete and worthy of XP rewards. Return a JSON response with: { completed: boolean, xp: number (10-50 based on quality), feedback: string }"
          },
          {
            role: "user",
            content: `Analyze this homework submission:
Title: ${submission.title}
Description: ${submission.description || 'No description provided'}
File Type: ${submission.file_type || 'No file'}

Determine if this looks like a completed homework submission and assign appropriate XP (10-50).`
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const result = JSON.parse(aiData.choices[0].message.content);

    // Award XP and update submission
    const xpToAward = Math.min(50, Math.max(10, result.xp));
    
    const { error: updateError } = await supabase
      .from('homework_submissions')
      .update({
        status: result.completed ? 'approved' : 'rejected',
        xp_awarded: result.completed ? xpToAward : 0,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // Award XP to user if approved
    if (result.completed) {
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', submission.user_id)
        .maybeSingle();

      if (progress) {
        const newXP = progress.total_xp + xpToAward;
        const newLevel = Math.floor(newXP / 100) + 1;

        // Calculate streak
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const lastActivityDate = progress.last_activity_date;

        let currentStreak = progress.current_streak || 0;
        let longestStreak = progress.longest_streak || 0;

        if (lastActivityDate === today) {
          // Already active today, no change
          console.log("Already active today, streak unchanged");
        } else if (lastActivityDate === yesterday) {
          // Streak continues
          currentStreak += 1;
          console.log(`Streak continues! Now at ${currentStreak} days`);
        } else {
          // Streak broken or first activity
          currentStreak = 1;
          console.log("Starting new streak");
        }

        // Update longest streak if needed
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }

        await supabase
          .from('user_progress')
          .update({
            total_xp: newXP,
            level: newLevel,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_activity_date: today
          })
          .eq('user_id', submission.user_id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        approved: result.completed,
        xp_awarded: result.completed ? xpToAward : 0,
        feedback: result.feedback
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});