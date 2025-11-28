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
    const { materialId, content } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate summary and key points using Lovable AI with structured output
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
            content: "You are a study assistant. Analyze study materials and extract key information."
          },
          {
            role: "user",
            content: `Analyze this study material and provide:
1. A concise summary (2-3 sentences)
2. 5-7 key points (as bullet points)
3. List of main topics/concepts covered

Material:
${content}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_material",
              description: "Analyze study material and extract summary, key points, and topics",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "A concise summary of the material (2-3 sentences)"
                  },
                  key_points: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-7 key points from the material"
                  },
                  topics: {
                    type: "array",
                    items: { type: "string" },
                    description: "Main topics/concepts covered"
                  }
                },
                required: ["summary", "key_points", "topics"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_material" } }
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI Response:", JSON.stringify(aiData, null, 2));
    
    // Extract structured output from tool call
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call returned from AI");
    }
    
    const result = JSON.parse(toolCall.function.arguments);

    // Save summary to database
    const { error: summaryError } = await supabase
      .from('material_summaries')
      .insert({
        material_id: materialId,
        summary: result.summary,
        key_points: result.key_points,
        topic_dependencies: result.topics
      });

    if (summaryError) throw summaryError;

    return new Response(
      JSON.stringify({ success: true, data: result }),
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
