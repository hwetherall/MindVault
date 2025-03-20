/**
 * Service for handling Pedram analysis questions
 */

// Helper function to call our secure API endpoint
async function callLLM(messages, model = "llama-3.2-1b-preview", temperature = 0.7) {
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
        max_completion_tokens: model.includes('70b') ? 32000 : 8000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
}

/**
 * Service to handle analysis questions for the Pedram analysis flow
 */
export const pedramAnswerService = {
  /**
   * Send a message to be processed by a lightweight LLM
   * @param message The prompt message to send
   * @param files Array of files to use for context
   * @param model The model to use (defaults to llama-3.2-1b-preview)
   * @returns The LLM response
   */
  async sendMessage(message, files = [], model = "llama-3.2-1b-preview") {
    try {
      console.log(`Processing Pedram question with ${model}`);
      const startTime = Date.now();
      
      // Check if any files are available
      if (!files || files.length === 0) {
        console.warn('No files available for analysis');
        return {
          text: "I don't see any uploaded documents to analyze. Please upload relevant documents first."
        };
      }

      // Create a context message based on files
      let contextMessage = '';
      
      if (files && files.length > 0) {
        console.log("Files detected:", files.map(f => `${f.name} (${f.type})`).join(', '));
        
        // Filter for document types
        const relevantFiles = files.filter(file => 
          file.type !== 'note'
        );

        // Add file names as context
        if (relevantFiles.length > 0) {
          contextMessage += `\nDocuments: ${relevantFiles.map(f => f.name).join(', ')}\n`;
        }

        // Add content from files (limiting to avoid token usage)
        for (const file of relevantFiles) {
          if (file.content && file.content.length > 0) {
            // Smart content extraction
            let fileContent = file.content;
            const contentLength = fileContent.length;
            
            // Log the total size of the content
            console.log(`File ${file.name} content length: ${contentLength} characters`);
            
            // If content is very large, take a sample
            if (contentLength > 20000) {
              // Take the first 10K chars and last 5K chars
              fileContent = fileContent.substring(0, 10000) + "\n[...content truncated...]\n" + 
                fileContent.substring(contentLength - 5000);
            }
            
            contextMessage += `\n--- Content from ${file.name} ---\n${fileContent}\n--- End of content ---\n\n`;
          }
        }
      }

      // Combine the context and user message
      const fullMessage = contextMessage 
        ? `I have the following documents to analyze:\n${contextMessage}\n\nBased on these documents, please answer this question:\n\n${message}`
        : message;

      console.log("Context message length:", contextMessage.length);
      
      // Create a system prompt for focused investment analysis
      const systemPrompt = `You are an expert investment analyst reviewing pitch decks and financial documents for a potential investment. 
Answer the following question with specific information from the documents provided. 
Be concise but thorough. Focus only on facts from the documents, not general knowledge.
If the information isn't clearly present in the documents, say "Information not found in documents."`;

      try {
        const response = await callLLM([
          { 
            role: "system", 
            content: systemPrompt
          },
          { 
            role: "user", 
            content: fullMessage 
          }
        ], model, 0.7);

        if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
          throw new Error(`Received invalid response structure from ${model}`);
        }

        // Get the response text
        const responseText = response.choices[0].message.content;
        
        return { 
          text: responseText,
          modelUsed: model,
          timeTaken: Date.now() - startTime,
          messageLength: fullMessage.length,
          answerLength: responseText.length,
          documentContext: contextMessage,
          finalPrompt: fullMessage,
          rawOutput: responseText
        };
      } catch (apiError) {
        console.error(`API Error with ${model}:`, apiError);
        
        // Return a more user-friendly error message
        return {
          text: "I encountered an issue while analyzing your documents. Please try again."
        };
      }
    } catch (error) {
      console.error('Error in Pedram analysis:', error);
      throw error;
    }
  },

  /**
   * Send a message to be processed by a high-quality LLM
   * @param message The prompt message to send
   * @param model The model to use (defaults to deepseek-r1-distill-llama-70b)
   * @returns The LLM response
   */
  async sendHighQualityMessage(message, model = "deepseek-r1-distill-llama-70b") {
    try {
      console.log(`Processing with high-quality model: ${model}`);
      const startTime = Date.now();
      
      // System prompt for investment memo generation
      const systemPrompt = `You are an expert investment analyst who creates professional investment memos based on analyzed data.
Your task is to synthesize information into a comprehensive, well-structured investment memo that provides
clear insights and recommendations. Format your response as HTML with appropriate styling.`;

      try {
        const response = await callLLM([
          { 
            role: "system", 
            content: systemPrompt
          },
          { 
            role: "user", 
            content: message 
          }
        ], model, 0.7);

        if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
          throw new Error(`Received invalid response structure from ${model}`);
        }

        // Get the response text
        const responseText = response.choices[0].message.content;
        
        return { 
          text: responseText,
          modelUsed: model,
          timeTaken: Date.now() - startTime,
          messageLength: message.length,
          answerLength: responseText.length,
          documentContext: "Investment memo context",
          finalPrompt: message,
          rawOutput: responseText
        };
      } catch (apiError) {
        console.error(`API Error with ${model}:`, apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('Error in high-quality analysis:', error);
      throw error;
    }
  }
}; 