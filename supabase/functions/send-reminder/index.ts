import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting reminder sending process...');

    // Get current hour in UTC
    const currentHour = new Date().getUTCHours();
    console.log(`Current UTC hour: ${currentHour}:00`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get ALL study plans (completed and incomplete, past and future) for comprehensive reporting
    const { data: plans, error: plansError } = await supabase
      .from('study_plans')
      .select(`
        *,
        subjects(name)
      `)
      .order('due_date', { ascending: true });

    if (plansError) throw plansError;

    // Get user details and email preferences
    const userIds = [...new Set(plans?.map(p => p.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);
    
    const { data: emailPrefs } = await supabase
      .from('email_preferences')
      .select('*')
      .in('user_id', userIds);

    // Group plans by user (filter only incomplete plans for email)
    const plansByUser = new Map();
    for (const plan of plans || []) {
      if (!plan.completed) {
        if (!plansByUser.has(plan.user_id)) {
          plansByUser.set(plan.user_id, []);
        }
        plansByUser.get(plan.user_id).push(plan);
      }
    }

    const results = [];
    
    // Send one daily digest email per user with all their tasks
    for (const [userId, userPlans] of plansByUser.entries()) {
      try {
        const profile = profiles?.find(p => p.id === userId);
        if (!profile?.email) {
          console.log(`Skipping user ${userId}: No email found`);
          continue;
        }

        // Get user email preferences
        const userPrefs = emailPrefs?.find(p => p.user_id === userId);
        if (userPrefs && !userPrefs.daily_digest_enabled) {
          console.log(`Skipping user ${userId}: Daily digest disabled`);
          continue;
        }

        // Check if current hour matches user's preferred delivery time
        if (userPrefs?.digest_time) {
          const prefHour = parseInt(userPrefs.digest_time.split(':')[0]);
          if (prefHour !== currentHour) {
            console.log(`Skipping user ${userId}: Not their preferred time (wants ${prefHour}:00, current is ${currentHour}:00 UTC)`);
            continue;
          }
        }

        // Categorize tasks based on user preferences
        const now = new Date();
        const overdueTasks: any[] = [];
        const todayTasks: any[] = [];
        const thisWeekTasks: any[] = [];
        const laterTasks: any[] = [];
        
        userPlans.forEach((plan: any) => {
          const dueDate = new Date(plan.due_date);
          const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dueDate < now) {
            overdueTasks.push(plan);
          } else if (daysDiff === 0) {
            todayTasks.push(plan);
          } else if (daysDiff <= 7) {
            thisWeekTasks.push(plan);
          } else {
            laterTasks.push(plan);
          }
        });

        // Apply user preferences filter
        const includeOverdue = userPrefs?.include_overdue ?? true;
        const includeToday = userPrefs?.include_today ?? true;
        const includeWeek = userPrefs?.include_this_week ?? true;
        const includeUpcoming = userPrefs?.include_upcoming ?? true;

        const renderTaskSection = (tasks: any[], title: string, color: string, shouldInclude: boolean) => {
          if (tasks.length === 0 || !shouldInclude) return '';
          
          return `
            <div style="margin: 20px 0;">
              <h3 style="color: ${color}; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid ${color}; padding-bottom: 8px;">
                ${title} (${tasks.length})
              </h3>
              ${tasks.map((plan: any) => {
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
                    <h4 style="margin: 0 0 8px 0; font-size: 16px;">${plan.title}</h4>
                    <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Subject:</strong> ${subjectName}</p>
                    <p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Due:</strong> ${dueDate}</p>
                    <p style="margin: 5px 0; color: ${priorityColor}; font-size: 14px; font-weight: 600;"><strong>Priority:</strong> ${plan.priority.toUpperCase()}</p>
                    ${plan.description ? `<p style="margin: 10px 0 0 0; color: #374151; font-size: 14px;">${plan.description}</p>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `;
        };

        const taskListHtml = `
          ${renderTaskSection(overdueTasks, '🚨 OVERDUE - Immediate Action Required', '#dc2626', includeOverdue)}
          ${renderTaskSection(todayTasks, '⏰ Due Today', '#f59e0b', includeToday)}
          ${renderTaskSection(thisWeekTasks, '📅 Due This Week', '#2563eb', includeWeek)}
          ${renderTaskSection(laterTasks, '📋 Coming Up', '#6b7280', includeUpcoming)}
        `;
        
        // Send email with retry logic
        let emailSent = false;
        let lastError = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'Buddy Study Companion <onboarding@resend.dev>',
                to: [profile.email],
                subject: `📚 Daily Study Digest - ${userPlans.length} Task${userPlans.length !== 1 ? 's' : ''} ${overdueTasks.length > 0 ? `(${overdueTasks.length} Overdue!)` : ''}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 28px;">📚 Daily Study Digest</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                      <h2 style="color: #111827; margin-top: 0;">Hey ${profile.full_name || 'there'}! 👋</h2>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6;">Here's your comprehensive task overview for today:</p>
                      
                      <div style="margin: 25px 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                        <div style="background: ${overdueTasks.length > 0 ? '#fee2e2' : '#f0fdf4'}; padding: 15px; border-radius: 8px; text-align: center;">
                          <p style="font-size: 32px; font-weight: bold; margin: 0; color: ${overdueTasks.length > 0 ? '#dc2626' : '#16a34a'};">${overdueTasks.length}</p>
                          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 13px;">Overdue</p>
                        </div>
                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
                          <p style="font-size: 32px; font-weight: bold; margin: 0; color: #f59e0b;">${todayTasks.length}</p>
                          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 13px;">Due Today</p>
                        </div>
                        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center;">
                          <p style="font-size: 32px; font-weight: bold; margin: 0; color: #2563eb;">${thisWeekTasks.length}</p>
                          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 13px;">This Week</p>
                        </div>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
                          <p style="font-size: 32px; font-weight: bold; margin: 0; color: #6b7280;">${userPlans.length}</p>
                          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 13px;">Total Pending</p>
                        </div>
                      </div>

                      ${taskListHtml}

                      <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #667eea;">
                        <p style="color: #374151; margin: 0; font-size: 15px;">💡 <strong>Tip:</strong> Focus on overdue and high-priority tasks first to stay on track!</p>
                      </div>

                      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
                        <p style="color: #374151; font-size: 16px; margin: 0;">Keep up the great work! 🎓</p>
                        <p style="color: #9ca3af; font-size: 12px; margin-top: 15px;">- Your Buddy Study Companion</p>
                        <p style="color: #d1d5db; font-size: 11px; margin-top: 10px;">This is an automated daily digest. You're receiving this because you have upcoming tasks in your study planner.</p>
                      </div>
                    </div>
                  </div>
                `,
              }),
            });

            if (!emailResponse.ok) {
              const errorText = await emailResponse.text();
              throw new Error(`Resend API error ${emailResponse.status}: ${errorText}`);
            }

            emailSent = true;
            console.log(`✅ Email sent successfully to ${profile.email} (attempt ${attempt}/${MAX_RETRIES})`);
            break;
          } catch (error) {
            lastError = error;
            console.error(`❌ Email attempt ${attempt}/${MAX_RETRIES} failed for ${profile.email}:`, error);
            
            if (attempt < MAX_RETRIES) {
              console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
              await delay(RETRY_DELAY);
            }
          }
        }

        if (!emailSent) {
          throw lastError || new Error('Failed to send email after all retries');
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