import { InvestmentMemoQuestion } from "../types";
import { getDocumentPriorityForQuestion, getQuestionById } from "../data/questions";
import { getTemplateForCategory } from "./promptTemplates";

/**
 * Generates a detailed AI prompt for a specific investment memo question
 * 
 * @param questionId The ID of the question to generate a prompt for
 * @param customPrompt Optional custom prompt to use instead of the default
 * @returns A detailed prompt string for the AI
 */
export function generatePromptForQuestion(questionId: string, customPrompt?: string): string {
  // If a custom prompt is provided, use that
  if (customPrompt && customPrompt.trim()) {
    return customPrompt;
  }
  
  // Get the question details
  const question = getQuestionById(questionId);
  if (!question) {
    console.error(`Question with ID "${questionId}" not found`);
    return '';
  }
  
  // Get document priority for this question
  const docPriority = getDocumentPriorityForQuestion(questionId);
  
  // Get category-specific template if available
  const categoryTemplate = getTemplateForCategory(question.category);
  
  // Generate the prompt
  return `
    Based on ALL the available documents, please answer this question:
    ${question.question}
    
    IMPORTANT: You MUST use BOTH document types in your analysis:
    ${docPriority.primary === 'pdf' ? 
        '- PRIMARY SOURCE: The PDF pitch deck is your main source for this question.\n- SECONDARY SOURCE: Also check the Excel financial data for any supporting information.' : 
        docPriority.primary === 'excel' ? 
            '- PRIMARY SOURCE: The Excel financial data is your main source for this question.\n- SECONDARY SOURCE: Also check the PDF pitch deck for any supporting information.' :
            '- Both document types are equally important for this question.'}
    
    For this specific question about "${question.question}", you MUST:
    1. First thoroughly examine the ${docPriority.primary === 'pdf' ? 'PDF pitch deck' : 
                                    docPriority.primary === 'excel' ? 'Excel financial data' : 
                                    'PDF pitch deck AND Excel financial data'}
    2. Then examine the ${docPriority.secondary === 'pdf' ? 'PDF pitch deck' : 
                         docPriority.secondary === 'excel' ? 'Excel financial data' : 
                         'remaining documents'} for supporting details
    3. Integrate information from both sources into your answer
    4. NEVER claim information is missing if you've only checked one document type
    
    ${categoryTemplate ? `CATEGORY-SPECIFIC GUIDANCE:\n${categoryTemplate}\n` : ''}
    
    Your answer MUST be structured in the following format:

    Summary: 
    A concise 1-2 sentence summary that directly answers the question with key facts. This will always be shown to the user.

    DETAILS:
    A more comprehensive explanation with supporting information, calculations, and specific data points from the documents. Include source references where appropriate. This section will be hidden by default and only shown when the user clicks "Show Details".
    
    ${question.instructions ? `Detailed instructions:\n${question.instructions}\n` : ''}
    
    DOCUMENT USAGE REQUIREMENTS:
    1. For management team information: The PDF pitch deck will contain this information
    2. For financial metrics: The Excel data will contain this information
    3. You must check BOTH document types before concluding information is unavailable
    4. In your answer, specify what information came from which document type
    
    Format your response to be clear and readable, focusing only on answering this specific question using ALL available documents.
    Ensure there's a clear separation between the Summary and DETAILS sections.
  `;
}

/**
 * Generates a simple prompt for a question without detailed instructions
 * Used as a fallback when no specific instructions are available
 * 
 * @param question The question object
 * @returns A simple prompt string for the AI
 */
export function generateSimplePrompt(question: InvestmentMemoQuestion): string {
  // Get category-specific template if available
  const categoryTemplate = getTemplateForCategory(question.category);
  
  return `I need a thorough analysis of the documents regarding this specific question: 
"${question.question}"

${question.description ? `Additional context: ${question.description}` : ''}

${categoryTemplate ? `CATEGORY-SPECIFIC GUIDANCE:\n${categoryTemplate}\n` : ''}

Please structure your response in TWO distinct parts as follows:

1. SUMMARY: 
A concise 1-2 sentence summary of the answer that directly addresses the question.
Do NOT include the word "SUMMARY" in your response.

2. DETAILS: 
A comprehensive analysis with 3-5 paragraphs of findings, supporting evidence, and implications. Include specific data points from the documents where available.
Do NOT include the word "DETAILS" in your response.

Focus specifically on this question and provide the most accurate answer based solely on the uploaded documents.`;
} 