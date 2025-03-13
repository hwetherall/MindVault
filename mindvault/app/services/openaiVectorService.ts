/* eslint-disable no-undef */
// Remove direct OpenAI import as we'll use our API endpoint
// import { OpenAI } from 'openai';

// Remove direct API key usage
// const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// if (!OPENAI_API_KEY) {
//   throw new Error('OpenAI API key is required');
// }

// No longer create OpenAI client directly
// const openai = new OpenAI({
//   apiKey: OPENAI_API_KEY,
//   dangerouslyAllowBrowser: true
// });

// Create a new API endpoint for vector operations
async function callVectorAPI(endpoint: string, data: any) {
  try {
    const response = await fetch(`/api/vector/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.details || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling vector API (${endpoint}):`, error);
    throw error;
  }
}

// ... existing code ... 