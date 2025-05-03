import { NextRequest, NextResponse } from 'next/server';

// Fallback response function for when API calls fail
const generateFallbackResponse = (question: string): string => {
  return `# Source
Unable to access documents due to authentication issues.

# Analysis
- Authentication with the document storage service failed
- This could be due to environment variable configuration issues
- Access to Supabase storage might require reconfiguration
- The application can still function with manually uploaded documents

# Conclusion
To analyze this question properly, please upload documents directly or check the system configuration for Supabase authentication.`;
};

/**
 * API route to analyze documents and answer questions using Groq API
 */
export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    const { question, files, instructions, model } = body;
    
    console.log(`[Analyze] Processing question: "${question}"`);
    console.log(`[Analyze] Files provided: ${files?.length || 0}`);
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }
    
    // Get API key from environment variables
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('[Analyze] GROQ_API_KEY is not configured');
      // Return fallback response instead of error
      return NextResponse.json({ 
        answer: generateFallbackResponse(question),
        fallback: true
      });
    }
    
    // Use the model from the request or fallback to the environment variable
    const modelToUse = model || process.env.GROQ_API_MODEL || 'deepseek-r1-distill-llama-70b';
    
    // Prepare document content for the prompt
    let documentContent = '';
    if (files && files.length > 0) {
      // Limit document content to avoid exceeding context length
      files.forEach((file: any, index: number) => {
        const filePreview = `
Document ${index + 1}: ${file.name}
Type: ${file.type}
Content:
${file.content.substring(0, 10000)}
${file.content.length > 10000 ? '... (content truncated)' : ''}
-------------------
`;
        documentContent += filePreview;
      });
    } else {
      documentContent = 'No documents provided.';
    }
    
    // Construct the prompt for the AI
    const prompt = `
${instructions}

Here are the documents to analyze:
${documentContent}

Question: ${question}

Your answer MUST be structured in the following format:

# Source
Specify which document(s) and sections you used to find the answer.

# Analysis
- Provide 3-5 bullet points with key findings from your analysis
- Each bullet should be concise and focused on a specific insight
- Include relevant figures, dates, or metrics when available

# Conclusion
Provide a 1-2 sentence direct answer to the question. Be specific and include exact figures when available.

DO NOT include your thinking process or explain your approach. Focus only on providing the requested sections with relevant information found in the documents.
`;
    
    try {
      // Make the request to the Groq API
      const apiUrl = process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1';
      console.log(`[Analyze] Calling Groq API with model: ${modelToUse}`);
      
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: 'You are a financial analyst assistant, specializing in analyzing company documents to extract financial information and insights. Your task is to answer questions about a company based on the documents provided. Always structure your response with Source, Analysis (bullet points), and Conclusion sections as specified.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 20000,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Analyze] Groq API error:', errorData);
        return NextResponse.json({ 
          answer: generateFallbackResponse(question),
          fallback: true
        });
      }
      
      const result = await response.json();
      const answer = result.choices[0].message.content;
      console.log('[Analyze] Successfully processed question');
      
      return NextResponse.json({ answer });
    } catch (apiError) {
      console.error('[Analyze] Error calling Groq API:', apiError);
      return NextResponse.json({ 
        answer: generateFallbackResponse(question),
        fallback: true
      });
    }
  } catch (error) {
    console.error('[Analyze] Error processing document analysis:', error);
    
    // Return a fallback response instead of an error
    return NextResponse.json({ 
      answer: generateFallbackResponse("your question"),
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 