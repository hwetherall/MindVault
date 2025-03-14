import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Check for API key - server-side only, not exposed to client
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error('GROQ_API_KEY is not set in environment variables');
}

// Initialize Groq client
const groq = new Groq({
  apiKey
});

export const maxDuration = 120; // Increased to 2 minutes for larger responses
export const dynamic = 'force-dynamic';

// Model-specific token limits
const MODEL_LIMITS = {
  "deepseek-r1-distill-llama-70b": 120000,
  "llama-3.1-8b-instant": 8000,
  "llama-3-70b-8192": 8000,
  "mixtral-8x7b-32768": 32000
};

// More accurate token estimation function
function estimateTokens(text: string | null | undefined): number {
  if (!text) return 0;
  
  // Count words (more accurate than character count)
  const wordCount = text.split(/\s+/).length;
  
  // Average English words are about 1.3 tokens
  const estimatedTokens = Math.ceil(wordCount * 1.3);
  
  // Add extra for code blocks which tend to use more tokens
  let codeBlockTokens = 0;
  
  // Find all code blocks using regex
  const codeBlockRegex = /```[\s\S]*?```/g;
  let match: RegExpExecArray | null;
  
  // Use exec in a loop to find all matches
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const codeBlock = match[0];
    // Code tends to use more tokens per character
    codeBlockTokens += Math.ceil(codeBlock.length / 3);
  }
  
  return estimatedTokens + codeBlockTokens;
}

export async function POST(request: Request) {
  try {
    const { messages, model = "deepseek-r1-distill-llama-70b", temperature = 1, max_completion_tokens = 100000 } = await request.json();

    // Get model-specific token limit or use default
    const modelLimit = MODEL_LIMITS[model] || 100000;
    
    // Ensure max_tokens doesn't exceed model limits
    const max_tokens = Math.min(max_completion_tokens, modelLimit);
    
    // Log details about the request
    console.log(`Using model: ${model} with max_tokens: ${max_tokens}`);
    
    // Estimate total tokens in the request
    let totalEstimatedTokens = 0;
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        const msgTokens = estimateTokens(msg.content);
        totalEstimatedTokens += msgTokens;
        
        // Log individual message token estimates for debugging
        if (msgTokens > 10000) {
          console.log(`Large message detected: ~${msgTokens} tokens`);
        }
      }
    }
    
    console.log(`Estimated input tokens: ${totalEstimatedTokens}`);
    
    // Check if we might exceed context window
    const modelContextWindow = model.includes("llama-3.1-8b") ? 16000 : 
                              model.includes("deepseek") ? 128000 : 
                              32000; // Default for other models
    
    if (totalEstimatedTokens + max_tokens > modelContextWindow) {
      console.warn(`Warning: Total tokens (${totalEstimatedTokens + max_tokens}) may exceed model context window (${modelContextWindow})`);
    }

    // Make the API call
    const response = await groq.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens
    });

    // Log success information
    console.log(`Response received with ${estimateTokens(response.choices[0].message.content || '')} estimated tokens`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error:', error);
    
    // Provide more detailed error response
    let statusCode = 500;
    let errorMessage = 'AI request failed';
    let errorDetails = (error as Error).message;
    let suggestion = "Try reducing the size of your documents or asking a more specific question.";
    
    // Check for specific error types
    if (errorDetails.includes('rate_limit') || errorDetails.includes('capacity')) {
      statusCode = 429; // Too Many Requests
      errorMessage = 'Rate limit or capacity exceeded';
      suggestion = "Please wait a moment and try again.";
    } else if (errorDetails.includes('context length') || errorDetails.includes('maximum context length')) {
      statusCode = 413; // Payload Too Large
      errorMessage = 'Context length exceeded';
      suggestion = "Try using a smaller document or asking about a more specific section.";
    } else if (errorDetails.includes('authentication') || errorDetails.includes('api key')) {
      statusCode = 401; // Unauthorized
      errorMessage = 'Authentication error';
      suggestion = "Please check your API configuration.";
    } else if (errorDetails.includes('not found') || errorDetails.includes('model not found')) {
      statusCode = 404; // Not Found
      errorMessage = 'Model not found';
      suggestion = "The requested AI model is not available. Try a different model.";
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails,
        suggestion
      },
      { status: statusCode }
    );
  }
}