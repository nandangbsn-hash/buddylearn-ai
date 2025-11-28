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
      
    } else if (fileType === 'pdf' || fileType === 'document' || fileType === 'image') {
      // Extract content from PDFs, documents, and images using AI vision
      try {
        console.log('Extracting from file:', url, 'type:', fileType);
        console.log('Starting file fetch...');
        
        // Fetch the file with proper headers and longer timeout
        const fileResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Buddy-Study-App/1.0',
            'Accept': '*/*'
          }
        });
        
        console.log('File response status:', fileResponse.status, fileResponse.statusText);
        console.log('File response headers:', Object.fromEntries(fileResponse.headers.entries()));
        
        if (!fileResponse.ok) {
          console.error('File fetch failed:', fileResponse.status, fileResponse.statusText);
          throw new Error(`Could not fetch file: ${fileResponse.status} ${fileResponse.statusText}`);
        }
        
        const fileBlob = await fileResponse.blob();
        const arrayBuffer = await fileBlob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        console.log('File fetched successfully, size:', fileBlob.size, 'type:', fileBlob.type);
        
        // Determine the appropriate prompt based on file type
        let extractionPrompt = '';
        if (fileType === 'pdf') {
          extractionPrompt = 'This is a PDF document. Extract ALL text content from every page. Include headings, paragraphs, bullet points, tables, captions, and any other text. Preserve the document structure using markdown formatting. Be comprehensive - extract every piece of educational content.';
        } else if (fileType === 'document') {
          extractionPrompt = 'This is a document file. Extract ALL text content including headings, paragraphs, bullet points, tables, and formatting. Preserve the document structure using markdown. Be comprehensive.';
        } else if (fileType === 'image') {
          extractionPrompt = 'Extract ALL visible text from this image (perform OCR on any text you see). Then describe in detail what the image shows - include all educational content, diagrams, charts, tables, or visual information. Format as clear markdown with headings and bullet points. Be comprehensive - this will be used as study material.';
        }
        
        console.log('Sending to AI for extraction...');
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
                    text: extractionPrompt
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
        
        console.log('AI response status:', aiResponse.status);

        if (!aiResponse.ok) {
          console.error('AI vision error:', aiResponse.status);
          const errorText = await aiResponse.text();
          console.error('Error details:', errorText);
          throw new Error(`AI vision API error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        extractedContent = aiData.choices[0].message.content;
        console.log('Successfully extracted content, length:', extractedContent.length);
      } catch (error) {
        console.error('File extraction error:', error);
        const fileTypeLabel = fileType === 'pdf' ? 'PDF' : fileType === 'document' ? 'Document' : 'Image';
        extractedContent = `[${fileTypeLabel} uploaded] Could not automatically extract content. Please add detailed notes about what's in this ${fileType} to the content field above.`;
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
