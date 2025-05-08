/**
 * Shared OpenRouter API client to ensure consistent authentication and error handling
 */

// Constants
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 45000; // 45 seconds in milliseconds

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
  
  let lastError = null;
  // Implement retry logic
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for OpenRouter API call`);
      }
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      // Determine if we're using a thinking model
      const isThinkingModel = model.includes(':thinking');
      
      // Create the request body with appropriate configuration
      const requestBody: any = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      };
      
      // Add special configuration for thinking models
      if (isThinkingModel) {
        requestBody.stop_sequences = ["</answer>"];
        requestBody.top_p = 0.9;
      }
      
      // Make the request to the OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://mindvault.app',
          'X-Title': 'MindVault Investment Memo'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
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
      const responseContent = result.choices[0].message.content;
      
      // For thinking models, extract the final answer if available
      if (isThinkingModel) {
        // Look for <answer>...</answer> tags
        const answerMatch = responseContent.match(/<answer>([\s\S]*?)<\/answer>/);
        if (answerMatch && answerMatch[1]) {
          console.log("Extracted final answer from thinking model output");
          return answerMatch[1].trim();
        }
        
        // If no tags but we have recognizable structure, return as is
        // The rendering function will handle further cleanup
        console.log("Thinking model response doesn't contain explicit answer tags");
      }
      
      return responseContent;
      
    } catch (error) {
      lastError = error;
      console.error(`OpenRouter API call failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, error);
      
      // Don't retry if it's an authorization error
      if (error.message && error.message.includes('401')) {
        throw error;
      }
      
      // If it's the last attempt, throw the error
      if (attempt === MAX_RETRIES) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delayMs = Math.min(1000 * Math.pow(2, attempt), 8000);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError || new Error('Failed to call OpenRouter API after retries');
} 