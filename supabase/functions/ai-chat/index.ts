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
    const { messages, context, mode = 'explain' } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    let systemPrompt = '';
    
    switch (mode) {
      case 'explain':
        systemPrompt = `You are an expert tutor who excels at explaining complex concepts. Use rich formatting:

**Formatting Guidelines:**
- Use ## for main headings
- Use ### for subheadings  
- Use **bold** for emphasis
- Use bullet points with - or *
- Use numbered lists for steps (1. 2. 3.)
- Separate sections with blank lines
- Use > for important notes/tips

**Explanation Styles:**
Choose the best approach based on the question:
- Simple language for quick understanding
- Step-by-step breakdowns for processes
- Real-world analogies and examples
- Visual descriptions (imagine diagrams, flowcharts)

**For Process/Sequence Questions:**
When explaining a process, sequence, or algorithm, format it as a clear flowchart using this structure:

\`\`\`mermaid
graph TD
    A[Start] --> B[Step 1]
    B --> C{Decision?}
    C -->|Yes| D[Path A]
    C -->|No| E[Path B]
    D --> F[End]
    E --> F
\`\`\`

Always be encouraging and patient.`;
        break;
      case 'quiz':
        systemPrompt = `You are a quiz master. Create engaging multiple-choice questions, flashcards, and practice exercises.

**For flashcards**, format them clearly:

FLASHCARD 1:
**Front:** [Question/Term]
**Back:** [Answer/Definition]

FLASHCARD 2:
**Front:** [Question/Term]
**Back:** [Answer/Definition]

Use spaced repetition principles - focus on areas where the student struggles.`;
        break;
      case 'research':
        systemPrompt = `You are a research assistant. Help students find reliable resources, summarize articles, and provide citations. Recommend learning materials that match their level.`;
        break;
      default:
        systemPrompt = 'You are a helpful study assistant.';
    }

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(context ? [{ role: "system", content: `Study material context:\n${context}` }] : []),
      ...messages
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
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
