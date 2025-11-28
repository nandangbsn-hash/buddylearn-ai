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
    const { url, fileType } = await req.json();
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    let extractedContent = '';

    if (fileType === 'link') {
      // Fetch and extract content from web page
      console.log('Fetching content from URL:', url);
      const response = await fetch(url);
      const html = await response.text();
      
      // Use AI to extract main content from HTML
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
              content: "Extract the main educational content from this HTML page. Remove navigation, ads, and formatting. Return only the core text content suitable for study."
            },
            {
              role: "user",
              content: `Extract the main content from this HTML:\n\n${html.substring(0, 50000)}`
            }
          ]
        })
      });

      if (!aiResponse.ok) {
        throw new Error(`AI API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      extractedContent = aiData.choices[0].message.content;
      
    } else if (fileType === 'pdf' || fileType === 'document') {
      // For PDFs and documents, fetch the file and extract text using AI vision
      console.log('Extracting content from file:', url);
      const fileResponse = await fetch(url);
      const fileBlob = await fileResponse.blob();
      const base64 = await blobToBase64(fileBlob);
      
      // Use AI with vision capabilities to extract text
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
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all text content from this document. Preserve the structure and formatting as markdown. Include all important information suitable for creating study materials."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${fileBlob.type};base64,${base64}`
                  }
                }
              ]
            }
          ]
        })
      });

      if (!aiResponse.ok) {
        throw new Error(`AI API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      extractedContent = aiData.choices[0].message.content;
    } else if (fileType === 'image') {
      // For images, use AI vision to describe and extract any text
      console.log('Extracting content from image:', url);
      const imageResponse = await fetch(url);
      const imageBlob = await imageResponse.blob();
      const base64 = await blobToBase64(imageBlob);
      
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
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all visible text from this image (OCR). Also describe any diagrams, charts, or visual information that would be useful for studying. Format as markdown."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${imageBlob.type};base64,${base64}`
                  }
                }
              ]
            }
          ]
        })
      });

      if (!aiResponse.ok) {
        throw new Error(`AI API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      extractedContent = aiData.choices[0].message.content;
    }

    return new Response(
      JSON.stringify({ success: true, content: extractedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        content: '' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
