import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get the API keys from environment variables
    const groqApiKey = process.env.GROQ_API_KEY || '';
    const openaiApiKey = process.env.OPENAI_API_KEY || '';
    
    // Create safe versions of the keys for debugging (show only first and last few characters)
    const safeGroqKey = groqApiKey 
      ? `${groqApiKey.substring(0, 10)}...${groqApiKey.substring(groqApiKey.length - 5)}`
      : 'Not set';
    const safeOpenaiKey = openaiApiKey 
      ? `${openaiApiKey.substring(0, 10)}...${openaiApiKey.substring(openaiApiKey.length - 5)}`
      : 'Not set';
    
    // Try to initialize the Groq client
    let groqInitialized = false;
    let groqModels: string[] = [];
    
    try {
      if (groqApiKey) {
        const groq = new Groq({
          apiKey: groqApiKey
        });
        
        groqInitialized = true;
        
        // Groq doesn't have a models.list method, so we'll add known models
        groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b", "llama-3.1-70b", "mixtral-8x7b"];
      }
    } catch (groqError) {
      console.error('Groq initialization error:', groqError);
    }
    
    // Try to initialize the OpenAI client for backward compatibility
    let openaiInitialized = false;
    let openaiModels: string[] = [];
    
    try {
      if (openaiApiKey) {
        const openai = new OpenAI({
          apiKey: openaiApiKey
        });
        
        openaiInitialized = true;
        
        // Try to list models as a simple API test
        const modelList = await openai.models.list();
        openaiModels = modelList.data.map(model => model.id).slice(0, 5); // Just get first 5 for brevity
      }
    } catch (openaiError) {
      console.error('OpenAI initialization error:', openaiError);
    }
    
    // Return debug information
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      groq: {
        apiKeyPresent: !!groqApiKey,
        apiKeySample: safeGroqKey,
        initialized: groqInitialized,
        modelsAvailable: groqModels.length > 0,
        modelSamples: groqModels
      },
      openai: {
        apiKeyPresent: !!openaiApiKey,
        apiKeySample: safeOpenaiKey,
        initialized: openaiInitialized,
        modelsAvailable: openaiModels.length > 0,
        modelSamples: openaiModels
      },
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