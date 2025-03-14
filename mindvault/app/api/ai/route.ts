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

// Simple token estimation function
function estimateTokens(text) {
  if (!text) return 0;
  // Rough estimate: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

export async function POST(request: Request) {
  try {
    const { messages, model = "deepseek-r1-distill-llama-70b", temperature = 1, max_completion_tokens = 100000 } = await request.json();

    // Ensure max_tokens doesn't exceed model limits
    const max_tokens = Math.min(max_completion_tokens, 120000);
    
    // Log details about the request
    console.log(`Using model: ${model} with max_tokens: ${max_tokens}`);
    
    // Optional: Estimate total tokens in the request
    let totalEstimatedTokens = 0;
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        totalEstimatedTokens += estimateTokens(msg.content);
      }
    }
    console.log(`Estimated input tokens: ${totalEstimatedTokens}`);

    // Make the API call
    const response = await groq.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens
    });

    // Log success information
    console.log(`Response received with ${estimateTokens(response.choices[0].message.content)} estimated tokens`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Error:', error);
    
    // Provide more detailed error response
    let statusCode = 500;
    let errorMessage = 'AI request failed';
    let errorDetails = (error as Error).message;
    
    // Check for specific error types
    if (errorDetails.includes('rate_limit') || errorDetails.includes('capacity')) {
      statusCode = 429; // Too Many Requests
      errorMessage = 'Rate limit or capacity exceeded';
    } else if (errorDetails.includes('context length')) {
      statusCode = 413; // Payload Too Large
      errorMessage = 'Context length exceeded';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails,
        suggestion: "Try reducing the size of your documents or asking a more specific question."
      },
      { status: statusCode }
    );
  }
}