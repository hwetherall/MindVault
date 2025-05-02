/**
 * Shared OpenRouter API client to ensure consistent authentication and error handling
 */

// Function to make OpenRouter API calls
export async function callOpenRouterAPI(
  messages: any[],
  model: string = 'x-ai/grok-3-beta',
  temperature: number = 0.3,
  maxTokens: number = 1500
) {
  // Get API key from environment variables
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }
  
  console.log(`Using model: ${model} with API key starting with ${apiKey.substring(0, 5)}...`);
  
  // Make the request to the OpenRouter API
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://mindvault.app',
      'X-Title': 'MindVault Investment Memo'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Unknown error';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error?.message || errorData.message || 'Error calling OpenRouter API';
      console.error('OpenRouter API error details:', errorData);
    } catch (e) {
      console.error('OpenRouter API error (raw):', errorText);
      errorMessage = errorText || 'Error calling OpenRouter API';
    }
    
    throw new Error(`${response.status} - ${errorMessage}`);
  }
  
  const result = await response.json();
  return result.choices[0].message.content;
} 