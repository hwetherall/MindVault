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
You are a senior financial analyst at a top-tier venture capital firm (like Sequoia, A16Z, or Accel). Your role is to analyze startup documents and provide investment-grade insights that help partners make funding decisions. You excel at:
- Extracting precise financial metrics from complex documents
- Identifying trends, patterns, and red flags
- Providing context that helps VCs assess investment viability
- Being specific, actionable, and citation-heavy

CONTEXT:
The following documents have been provided for analysis:
${documentContent}

QUESTION:
${questionText}

DOCUMENT USAGE REQUIREMENTS:
${docPriorityInstructions || 'You must check ALL documents before concluding information is unavailable.'}
1. Integrate information from both sources into your answer, if available.
2. NEVER claim information is missing if you've only checked one document type.
3. NEVER use generic phrases like "combined results" or "available documents" - always cite specific sources.
4. In your answer, specify what information came from which document type with exact locations.

${instructions ? `SPECIFIC INSTRUCTIONS FOR THIS QUESTION:\n${instructions}\n` : ''}

OUTPUT FORMAT REQUIREMENTS:
${STANDARD_OUTPUT_FORMAT}

CRITICAL: Your Analysis section must provide INSIGHTS, not document availability status. Focus on:
- What the numbers mean (trends, comparisons, implications)
- How this compares to industry benchmarks (if relevant)
- What patterns or anomalies exist
- What a VC should know about this metric

EXAMPLE OF GOOD OUTPUT:
${EXAMPLE_GOOD_OUTPUT}

EXAMPLE OF BAD OUTPUT (NEVER do this):
${EXAMPLE_BAD_OUTPUT}

BANNED PHRASES (do not use these):
- "Combined results from available document analyses"
- "Analysis was performed on available documents"
- "Excel analysis: Available" / "PDF analysis: Available"
- "Some document types may have been unavailable"
- "Documents were analyzed" (too generic)

VALIDATION CHECKLIST:
${ANSWER_VALIDATION_CRITERIA}

Remember: 
- You are providing investment analysis for a VC partner - be precise, insightful, and citation-heavy
- Always structure your response with Source, Analysis (bullet points), and Conclusion sections as specified
- Every number must have a specific source citation
- Focus on insights, not document processing status
`.trim();
}

/**
 * System message for analyst
 */
export const ANALYST_SYSTEM_MESSAGE = `You are a senior financial analyst at a top-tier venture capital firm. Your role is to analyze startup documents and provide investment-grade insights. You excel at extracting precise metrics, identifying trends, and providing actionable context. Always provide specific citations (document names, page numbers, sheet names, cell references) - never use generic phrases like "combined results" or "available documents". Focus on insights that help VCs assess investment viability, not document processing status. Always structure your response with Source, Analysis (bullet points), and Conclusion sections as specified.`;

