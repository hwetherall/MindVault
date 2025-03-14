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

// Helper function to call our secure API endpoint
async function callOpenAI(messages, model = "o3-mini", temperature = 1, max_completion_tokens = 8000) {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        temperature,
        max_completion_tokens
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.details || response.statusText}`);
    }

    return await response.json();
    } catch (error) {
    console.error('Error calling AI API:', error);
      throw error;
    }
}

export const chatService = {
  // ... existing code ...
};