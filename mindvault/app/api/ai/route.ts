import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Check for API key - server-side only, not exposed to client
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// Extract project ID from the API key if it's a project-based key
// Project-based keys start with "sk-proj-"
let projectId = null;
if (apiKey.startsWith('sk-proj-')) {
  // The project ID is embedded in the key
  // We don't need to extract it, the OpenAI client will handle it
  console.log('Using project-based API key');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey
});

export const maxDuration = 60; // Set maximum duration to 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { messages, model = "o3-mini", temperature = 1, max_completion_tokens = 40000 } = await request.json();

    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_completion_tokens: max_completion_tokens
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      { error: 'AI request failed', details: (error as Error).message },
      { status: 500 }
    );
  }
} 