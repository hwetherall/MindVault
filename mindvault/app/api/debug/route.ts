import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY || '';
    
    // Check if it's a project-based key
    const isProjectKey = apiKey.startsWith('sk-proj-');
    
    // Create a safe version of the key for debugging (show only first and last few characters)
    const safeKey = apiKey 
      ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`
      : 'Not set';
    
    // Try to initialize the OpenAI client
    let openaiInitialized = false;
    let models: string[] = [];
    
    try {
      const openai = new OpenAI({
        apiKey
      });
      
      openaiInitialized = true;
      
      // Try to list models as a simple API test
      const modelList = await openai.models.list();
      models = modelList.data.map(model => model.id).slice(0, 5); // Just get first 5 for brevity
    } catch (openaiError) {
      console.error('OpenAI initialization error:', openaiError);
    }
    
    // Return debug information
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      apiKeyPresent: !!apiKey,
      apiKeyType: isProjectKey ? 'Project-based key' : 'Standard key',
      apiKeySample: safeKey,
      openaiInitialized,
      modelsAvailable: models.length > 0,
      modelSamples: models,
      vercelEnvironment: process.env.VERCEL_ENV || 'Not detected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Debug endpoint error', details: (error as Error).message },
      { status: 500 }
    );
  }
} 