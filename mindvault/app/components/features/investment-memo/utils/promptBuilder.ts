import { InvestmentMemoQuestion } from "../types";
import { getDocumentPriorityForQuestion } from "../data/questions";

/**
 * Builds a detailed AI prompt for a specific investment memo question
 * 
 * @param question The question object
 * @returns A detailed prompt string for the AI
 */
export function buildPromptForQuestion(question: InvestmentMemoQuestion): string {
  // Get document priority for this question
  const docPriority = getDocumentPriorityForQuestion(question);
  
  // Build the prompt
  return `
    Based on ALL the available document information in <documents>, please answer this question:
    ${question.question}
    
    IMPORTANT: You MUST use BOTH document types in your analysis:
    ${docPriority.primary === 'pdf' ? 
        '- PRIMARY SOURCE: The PDF pitch deck is your main source for this question.\n- SECONDARY SOURCE: Also check the Excel financial data for any supporting information.' : 
        docPriority.primary === 'excel' ? 
            '- PRIMARY SOURCE: The Excel financial data is your main source for this question.\n- SECONDARY SOURCE: Also check the PDF pitch deck for any supporting information.' :
            '- Both document types are equally important for this question.'}

    DOCUMENT USAGE REQUIREMENTS:
    1. Integrate information from both sources into your answer, if available.
    2. You must check ALL documents before concluding information is unavailable. NEVER claim information is missing if you've only checked one document type
    3. In your answer, specify what information came from which document type
    
    Your answer MUST be structured in the following format:

    Summary: 
    A concise 1-2 sentence summary that directly answers the question with key facts. This will always be shown to the user.

    DETAILS:
    A section to provide comprehensive explanation with supporting information, calculations, and specific data points from the documents. Opt for bullet points and lists to make the answer more readable. It should ALWAYS follow the structure:
      - Source: Source of the information used to answer the question including the document(s) name(s) with page number for PDFs and sheet name for Excel files
      - Thinking process: Explain the thinking process to reach the answer. This is the answer in detail where the thought process to reach the answer is included. Calculations, considerations,	and any other supporting information should be included here. IF you include a calculation, include the formula used when applicable. IF you include the formula ALWAYS make sure to wrap that formula in a <calculation-formula> tag and represent it .
      - Conclusion: The final answer to the question.
    Source, Thinking process and Conclusion dividers MUST be present in the answer to separate the subsections of DETAILS. Output the dividers in bold.

    ${question.instructions ? `Detailed instructions:\n${question.instructions}\n` : ''}

    Format your response to be clear and readable, focusing only on answering this specific question using ALL available documents.

    Ensure there's a clear separation between the Summary and DETAILS sections.
  `;
}

export function buildPromptForPedramQuestion(question: string, instructions?: string) {
  // Master prompt for Pedram's analysis
  const masterPrompt = `You are an expert financial analyst specializing in investment analysis. 
Your task is to analyze the provided documents with a specific focus on ${question}.
Follow these critical requirements:
1. Use ONLY information from the provided documents
2. Be thorough and detailed in your analysis
3. Support your findings with specific data points when available
4. Maintain a structured and clear response format
5. If information is not found, clearly state this rather than making assumptions
${instructions ? `\nInstructions for this specific analysis:\n${instructions}` : ''}

Please analyze the following question:
${question}`;

  return masterPrompt;
}