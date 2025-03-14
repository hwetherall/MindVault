import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Check for API key - server-side only, not exposed to client
const apiKey = process.env.OPENAI_API_KEY;
// The project ID might be causing issues - let's make it optional
const projectId = process.env.OPENAI_PROJECT_ID;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// Initialize OpenAI client - try without the project parameter first
const openai = new OpenAI({
  apiKey
  // Remove the project parameter to see if that resolves the issue
  // If the API key is already associated with a project, we don't need to specify it
});

export const maxDuration = 60; // Set maximum duration to 60 seconds (Vercel hobby plan limit)
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { messages, model = "o3-mini", temperature = 1, max_tokens = 40000 } = await request.json();

    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens
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