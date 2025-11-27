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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get upcoming study plans that need reminders (due in next 24 hours)
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    const { data: plans, error: plansError } = await supabase
      .from('study_plans')
      .select(`
        *,
        subjects(name)
      `)
      .eq('completed', false)
      .eq('reminder_sent', false)
      .lt('due_date', tomorrow.toISOString())
      .gt('due_date', new Date().toISOString());

    if (plansError) throw plansError;

    // Get user details for each plan
    const userIds = [...new Set(plans?.map(p => p.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    // Create a map of user profiles
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const results = [];
    
    for (const plan of plans || []) {
      try {
        const profile = profileMap.get(plan.user_id);
        if (!profile?.email) {
          console.log(`Skipping plan ${plan.id}: No email found for user`);
          continue;
        }

        const dueDate = new Date(plan.due_date).toLocaleString();
        const subjectName = plan.subjects?.name || 'General';
        
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Buddy Study Companion <onboarding@resend.dev>',
            to: [profile.email],
            subject: `Reminder: ${plan.title} due soon!`,
            html: `
              <h2>Hey ${profile.full_name || 'there'}!</h2>
              <p>This is a friendly reminder about your upcoming task:</p>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">${plan.title}</h3>
                <p style="margin: 5px 0;"><strong>Subject:</strong> ${subjectName}</p>
                <p style="margin: 5px 0;"><strong>Due:</strong> ${dueDate}</p>
                <p style="margin: 5px 0;"><strong>Priority:</strong> ${plan.priority.toUpperCase()}</p>
                ${plan.description ? `<p style="margin: 10px 0 0 0;">${plan.description}</p>` : ''}
              </div>
              <p>Good luck with your studies! 🎓</p>
              <p style="color: #666; font-size: 12px;">- Your Buddy Study Companion</p>
            `,
          }),
        });

        if (!emailResponse.ok) {
          throw new Error(`Resend API error: ${emailResponse.status}`);
        }

        // Mark reminder as sent
        await supabase
          .from('study_plans')
          .update({ reminder_sent: true })
          .eq('id', plan.id);

        results.push({ id: plan.id, status: 'sent' });
      } catch (error) {
        console.error(`Failed to send reminder for plan ${plan.id}:`, error);
        results.push({ id: plan.id, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: results.length, results }),
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