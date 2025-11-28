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
    
    console.log('Extracting content from:', url, 'type:', fileType);
    let extractedContent = '';

    if (fileType === 'link') {
      // Fetch and extract content from web page
      try {
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
                content: "Extract the main educational content from this HTML page. Remove navigation, ads, scripts, and formatting. Return only the core text content suitable for study. Format as clean markdown."
              },
              {
                role: "user",
                content: `Extract content from this HTML (first 40000 chars):\n\n${html.substring(0, 40000)}`
              }
            ]
          })
        });

        if (!aiResponse.ok) {
          console.error('AI API error:', aiResponse.status);
          throw new Error(`AI API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        extractedContent = aiData.choices[0].message.content;
        console.log('Extracted from link, length:', extractedContent.length);
      } catch (error) {
        console.error('Link extraction error:', error);
        throw new Error('Could not extract content from link. Please copy and paste the text manually.');
      }
      
    } else if (fileType === 'pdf') {
      // For PDFs, inform user to paste content manually
      extractedContent = '[PDF uploaded] Please copy and paste the text content from your PDF into the content field above. PDF text extraction coming soon!';
      console.log('PDF detected - requesting manual input');
      
    } else if (fileType === 'document') {
      // For documents, inform user to paste content manually  
      extractedContent = '[Document uploaded] Please copy and paste the text content from your document into the content field above.';
      console.log('Document detected - requesting manual input');
      
    } else if (fileType === 'image') {
      // For images, try to extract visible text using AI vision if the file is accessible
      try {
        extractedContent = '[Image uploaded] Please describe or type out any text/content from this image in the content field above. Automatic image text extraction coming soon!';
        console.log('Image detected - requesting manual input');
      } catch (error) {
        console.error('Image extraction error:', error);
        extractedContent = '[Image uploaded] Please describe the content of this image in the field above.';
      }
    } else {
      extractedContent = '[File uploaded] Please add any notes or content related to this file in the content field above.';
    }

    console.log('Final extracted content length:', extractedContent.length);
    
    return new Response(
      JSON.stringify({ success: true, content: extractedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Extract content error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        content: '[Error extracting content] Please add your study notes manually in the content field.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
