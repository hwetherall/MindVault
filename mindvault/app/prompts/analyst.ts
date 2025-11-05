/**
 * Analyst prompt templates
 * Used for initial question answering by the analyst AI
 */

import {
  DocumentFile,
  PromptContext,
  STANDARD_OUTPUT_FORMAT,
  EXAMPLE_GOOD_OUTPUT,
  EXAMPLE_BAD_OUTPUT,
  getDocumentPriorityInstructions,
  formatDocumentsForPrompt,
  ANSWER_VALIDATION_CRITERIA
} from './shared';
import { InvestmentMemoQuestion } from '../components/features/investment-memo/types';
import { getDocumentPriorityForQuestion } from '../components/features/investment-memo/data/questions';

/**
 * Build analyst prompt with standardized structure
 */
export function buildAnalystPrompt(
  question: InvestmentMemoQuestion | string,
  files: DocumentFile[],
  customInstructions?: string
): string {
  const questionText = typeof question === 'string' ? question : question.question;
  const questionObj = typeof question === 'object' ? question : null;
  
  // Get document priority if question object provided
  let docPriorityInstructions = '';
  if (questionObj) {
    const docPriority = getDocumentPriorityForQuestion(questionObj);
    docPriorityInstructions = getDocumentPriorityInstructions(
      docPriority.primary,
      docPriority.secondary
    );
  }

  // Use custom instructions or question-specific instructions
  const instructions = customInstructions || 
    (questionObj?.instructions || '');

  // Format documents
  const documentContent = formatDocumentsForPrompt(files);

  // Build the prompt with consistent structure
  return `
ROLE DEFINITION:
You are a financial analyst assistant specializing in analyzing company documents to extract financial information and insights. Your task is to answer questions about a company based on the documents provided.

CONTEXT:
The following documents have been provided for analysis:
${documentContent}

QUESTION:
${questionText}

DOCUMENT USAGE REQUIREMENTS:
${docPriorityInstructions || 'You must check ALL documents before concluding information is unavailable.'}
1. Integrate information from both sources into your answer, if available.
2. NEVER claim information is missing if you've only checked one document type.
3. In your answer, specify what information came from which document type.

${instructions ? `SPECIFIC INSTRUCTIONS FOR THIS QUESTION:\n${instructions}\n` : ''}

OUTPUT FORMAT REQUIREMENTS:
${STANDARD_OUTPUT_FORMAT}

EXAMPLE OF GOOD OUTPUT:
${EXAMPLE_GOOD_OUTPUT}

EXAMPLE OF BAD OUTPUT (avoid this style):
${EXAMPLE_BAD_OUTPUT}

VALIDATION CHECKLIST:
${ANSWER_VALIDATION_CRITERIA}

Remember: Always structure your response with Source, Analysis (bullet points), and Conclusion sections as specified.
`.trim();
}

/**
 * System message for analyst
 */
export const ANALYST_SYSTEM_MESSAGE = `You are a financial analyst assistant, specializing in analyzing company documents to extract financial information and insights. Your task is to answer questions about a company based on the documents provided. Always structure your response with Source, Analysis (bullet points), and Conclusion sections as specified.`;

