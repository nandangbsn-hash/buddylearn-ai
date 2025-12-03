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
    const { messages, materialId, mode = 'explain' } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

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
        systemPrompt = `You are a flashcard creator. ALWAYS generate flashcards for any topic the student asks about.

**MANDATORY Format for ALL responses:**

FLASHCARD 1:
**Front:** [Question/Term]
**Back:** [Answer/Definition]

FLASHCARD 2:
**Front:** [Question/Term]
**Back:** [Answer/Definition]

FLASHCARD 3:
**Front:** [Question/Term]
**Back:** [Answer/Definition]

Continue this pattern. Generate 5-10 flashcards per topic. Focus on key concepts, definitions, and important facts.`;
        break;
      case 'flowchart':
        systemPrompt = `You are a flowchart diagram expert. When a student asks about a process, algorithm, or sequential topic, create a clear flowchart using Mermaid syntax.

**CRITICAL SYNTAX RULES - MUST FOLLOW:**
- NEVER use parentheses () in node labels - they break Mermaid syntax
- NEVER use apostrophes ' in node labels - use "is" instead of "'s"
- Keep node labels SHORT and SIMPLE - max 5-6 words
- Use only alphanumeric characters, spaces, and basic punctuation like commas and periods
- For equations or formulas, spell them out: "F equals ma" not "F=ma"

**ALWAYS respond with a flowchart using this format:**

\`\`\`mermaid
graph TD
    A[Start Topic] --> B[Step 1]
    B --> C{Decision Point}
    C -->|Yes| D[Action A]
    C -->|No| E[Action B]
    D --> F[Next Step]
    E --> F
    F --> G[End Result]
\`\`\`

Then provide a brief explanation of each step below the diagram. Use clear, descriptive labels and organize the flow logically.`;
        break;
      default:
        systemPrompt = 'You are a helpful study assistant.';
    }

    // Prepare AI messages with material context
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];
    
    // If materialId is provided, fetch and include the material
    if (materialId) {
      const { data: material } = await supabase
        .from('materials')
        .select('content, title, file_url, file_type')
        .eq('id', materialId)
        .single();
      
      if (material) {
        // Build context message with file if available
        const contextParts: any[] = [];
        
        // Add text context
        let textContext = `Study Material: "${material.title}"`;
        if (material.content) {
          textContext += `\n\nNotes:\n${material.content}`;
        }
        
        contextParts.push({
          type: "text",
          text: textContext
        });
        
        // Add file if available (images or PDFs)
        if (material.file_url && material.file_type) {
          // Process images and PDFs
          const isImage = material.file_type.startsWith('image/');
          const isPDF = material.file_type === 'application/pdf';
          
          if (isImage || isPDF) {
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
                
                contextParts.push({
                  type: "image_url",
                  image_url: {
                    url: `data:${fileData.type};base64,${base64}`
                  }
                });
              }
            }
          } else {
            // For non-image/PDF files, add a note
            textContext += `\n\n[Note: A ${material.file_type} file is attached but cannot be directly analyzed. Please refer to the notes above or provide text content for analysis.]`;
            contextParts[0].text = textContext;
          }
        }
        
        aiMessages.push({
          role: "system",
          content: contextParts
        });
      }
    }
    
    // Add user messages
    aiMessages.push(...messages);

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
      if (response.status === 503) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again in a moment." }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('AI API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `AI service error (${response.status}). Please try again.` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
