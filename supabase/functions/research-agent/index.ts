import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, depth = 'detailed' } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    let systemPrompt = `You are an expert research assistant for students. Provide comprehensive, well-structured research on any topic with:

1. **Overview**: Clear introduction to the topic
2. **Key Concepts**: Main ideas broken down simply
3. **Detailed Explanation**: In-depth coverage with examples
4. **Real-World Applications**: How this applies in practice
5. **Sources & Further Reading**: List reliable resources

Format your response with:
- Clear headings (use ##, ###)
- Bullet points for lists
- Examples in separate paragraphs
- **Bold** for emphasis
- Simple citations like [Source: Wikipedia] or [Research: MIT Study 2023]

Keep explanations student-friendly but academically rigorous.`;

    if (depth === 'quick') {
      systemPrompt = 'Provide a concise but informative summary of the topic. Include key points, simple explanation, and 2-3 reliable sources. Use clear formatting with headings and bullet points.';
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Research topic: ${topic}` }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});