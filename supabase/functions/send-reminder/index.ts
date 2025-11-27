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

    // Get ALL upcoming incomplete study plans (not just those due in 24 hours)
    const { data: plans, error: plansError } = await supabase
      .from('study_plans')
      .select(`
        *,
        subjects(name)
      `)
      .eq('completed', false)
      .gt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });

    if (plansError) throw plansError;

    // Get user details for each plan
    const userIds = [...new Set(plans?.map(p => p.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    // Group plans by user
    const plansByUser = new Map();
    for (const plan of plans || []) {
      if (!plansByUser.has(plan.user_id)) {
        plansByUser.set(plan.user_id, []);
      }
      plansByUser.get(plan.user_id).push(plan);
    }

    const results = [];
    
    // Send one daily digest email per user with all their upcoming tasks
    for (const [userId, userPlans] of plansByUser.entries()) {
      try {
        const profile = profiles?.find(p => p.id === userId);
        if (!profile?.email) {
          console.log(`Skipping user ${userId}: No email found`);
          continue;
        }

        // Build task list HTML
        const taskListHtml = userPlans.map((plan: any) => {
          const dueDate = new Date(plan.due_date).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
          const subjectName = plan.subjects?.name || 'General';
          const priorityColor = plan.priority === 'high' ? '#dc2626' : plan.priority === 'medium' ? '#2563eb' : '#6b7280';
          
          return `
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid ${priorityColor};">
              <h3 style="margin: 0 0 8px 0; font-size: 16px;">${plan.title}</h3>
              <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Subject:</strong> ${subjectName}</p>
              <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Due:</strong> ${dueDate}</p>
              <p style="margin: 5px 0; color: ${priorityColor}; font-size: 14px; font-weight: 600;"><strong>Priority:</strong> ${plan.priority.toUpperCase()}</p>
              ${plan.description ? `<p style="margin: 10px 0 0 0; color: #374151; font-size: 14px;">${plan.description}</p>` : ''}
            </div>
          `;
        }).join('');
        
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Buddy Study Companion <onboarding@resend.dev>',
            to: [profile.email],
            subject: `Daily Study Digest - ${userPlans.length} Upcoming Task${userPlans.length !== 1 ? 's' : ''}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #111827;">Hey ${profile.full_name || 'there'}! 👋</h2>
                <p style="color: #374151; font-size: 16px;">Here's your daily summary of upcoming tasks and homework:</p>
                
                <div style="margin: 20px 0;">
                  <p style="background: #dbeafe; padding: 12px; border-radius: 6px; color: #1e40af; font-weight: 600; margin: 0;">
                    📚 You have ${userPlans.length} upcoming task${userPlans.length !== 1 ? 's' : ''} to complete
                  </p>
                </div>

                ${taskListHtml}

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #374151;">Stay organized and keep up the great work! 🎓</p>
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">- Your Buddy Study Companion</p>
                </div>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          throw new Error(`Resend API error: ${emailResponse.status}`);
        }

        results.push({ user_id: userId, tasks_count: userPlans.length, status: 'sent' });
        console.log(`Sent daily digest to ${profile.email} with ${userPlans.length} tasks`);
      } catch (error) {
        console.error(`Failed to send daily digest to user ${userId}:`, error);
        results.push({ user_id: userId, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    return new Response(
      JSON.stringify({ 
        success: true, 
        digests_sent: successCount,
        total_users: results.length,
        results 
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