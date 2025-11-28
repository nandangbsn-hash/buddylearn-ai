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
    const { materialId, difficulty = 'medium', numQuestions = 5 } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get material with file info
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('content, title, user_id, file_url, file_type')
      .eq('id', materialId)
      .single();

    if (materialError) throw materialError;

    console.log(`Generating quiz for material: "${material.title}"`);

    // Prepare the AI message content
    let userContent: any[] = [];
    
    // Add text instruction
    const instruction = `Create ${numQuestions} multiple-choice questions based on this study material.
Difficulty: ${difficulty}
Material Title: "${material.title}"

${material.content ? `Additional Notes:\n${material.content}\n\n` : ''}

Generate questions with 4 options each, marking the correct answer index (0-3).
Focus on key concepts, definitions, and important facts from the material.`;

    userContent.push({
      type: "text",
      text: instruction
    });

    // If there's a file, download and add it to the content (only if it's an image)
    if (material.file_url && material.file_type) {
      const isImage = material.file_type.startsWith('image/');
      
      if (isImage) {
        console.log('Downloading image file:', material.file_url);
        
        const urlParts = material.file_url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
        if (urlParts) {
          const bucket = urlParts[1];
          const path = urlParts[2];
          
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(bucket)
            .download(path);
          
          if (!downloadError && fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            
            // Convert to base64 in chunks to avoid stack overflow with large files
            const uint8Array = new Uint8Array(arrayBuffer);
            const chunkSize = 0x8000; // 32KB chunks
            let binaryString = '';
            
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
              const chunk = uint8Array.subarray(i, i + chunkSize);
              binaryString += String.fromCharCode.apply(null, Array.from(chunk));
            }
            const base64 = btoa(binaryString);
            
            userContent.push({
              type: "image_url",
              image_url: {
                url: `data:${fileData.type};base64,${base64}`
              }
            });
            
            console.log('Image file added to quiz generation');
          }
        }
      } else {
        console.log(`Skipping non-image file (${material.file_type}). Using notes/content instead.`);
      }
    }

    // Generate quiz using Lovable AI with structured output
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
            content: "You are an expert quiz creator. Generate educational multiple-choice questions based on the provided study material (which may include images, PDFs, or text). Analyze all provided content thoroughly."
          },
          {
            role: "user",
            content: userContent
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_quiz",
              description: "Generate multiple-choice quiz questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: {
                          type: "string",
                          description: "The question text"
                        },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          minItems: 4,
                          maxItems: 4,
                          description: "Four answer options"
                        },
                        correct_answer: {
                          type: "integer",
                          minimum: 0,
                          maximum: 3,
                          description: "Index of the correct answer (0-3)"
                        },
                        explanation: {
                          type: "string",
                          description: "Explanation of why the answer is correct"
                        }
                      },
                      required: ["question", "options", "correct_answer", "explanation"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["questions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_quiz" } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI Response:", JSON.stringify(aiData, null, 2));
    
    // Extract structured output from tool call
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call returned from AI");
    }
    
    const { questions } = JSON.parse(toolCall.function.arguments);

    // Save quiz to database
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        material_id: materialId,
        user_id: material.user_id,
        questions: questions
      })
      .select()
      .single();

    if (quizError) throw quizError;

    return new Response(
      JSON.stringify({ success: true, quiz }),
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
