/* eslint-disable no-undef */
// Helper function to call our secure API endpoint
async function callOpenAI(messages, model = "deepseek-r1-distill-llama-70b", temperature = 1, max_completion_tokens = 8000) {
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
  // Your existing methods will now use the updated callOpenAI function
};