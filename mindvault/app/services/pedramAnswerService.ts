import { answerService } from './answerService';

interface File {
  name: string;
  type: string;
  content?: string;
}

interface Response {
  text: string;
  suggestedQuestions?: string[];
}

/**
 * Service for handling Pedram export question answers
 */
export const pedramAnswerService = {
  /**
   * Sends a message to get an answer for a Pedram export question
   * 
   * @param prompt The prompt for the question
   * @param files Array of files to provide context
   * @param model Optional model name to use
   * @returns Promise with the response
   */
  sendMessage: async (prompt: string, files: File[], model?: string): Promise<Response> => {
    // Use the standard answerService with the provided model or default
    return answerService.sendMessage(prompt, files, false, model);
  },

  /**
   * Sends a message to a high quality model for generating complete analysis
   * 
   * @param prompt The prompt to send
   * @param model Optional model name to use
   * @returns Promise with the response
   */
  sendHighQualityMessage: async (prompt: string, model?: string): Promise<Response> => {
    // Use anthropic/claude-3.7-sonnet:thinking by default for high quality responses
    const modelToUse = model || "anthropic/claude-3.7-sonnet:thinking";
    
    // Call regular sendMessage with empty files array and the specified model
    return answerService.sendMessage(prompt, [], false, modelToUse);
  }
}; 