/**
 * Shared prompt components and utilities
 * Common instructions and formatting used across all prompts
 */

export interface DocumentFile {
  name: string;
  type: string;
  content: string;
}

export interface PromptContext {
  documents: DocumentFile[];
  question: string;
  instructions?: string;
  category?: string;
}

/**
 * Standard output format instructions for analyst responses
 */
export const STANDARD_OUTPUT_FORMAT = `
Your answer MUST be structured in the following format:

# Source
CRITICAL: You MUST provide specific citations for every piece of information you use. Include:
- Document name(s) - Use the exact filename (e.g., "Go1_Pitch_Deck.pdf")
- Page numbers for PDFs - Always include page numbers (e.g., "Pitch Deck, page 5")
- Sheet names for Excel files - Always include sheet name (e.g., "Financial Data, sheet 'Revenue'")
- Cell references when specific data points are referenced - Include cell reference or column/row (e.g., "cell B10" or "Q2 2023 column")
- Section names if applicable (e.g., "Financial Overview section, page 12")

Example good citation: "Go1_Pitch_Deck.pdf, page 5, Revenue Metrics section; Financial_Data.xlsx, sheet 'Historical Metrics', cell B10"

# Analysis
- Provide 3-5 bullet points with key findings from your analysis
- Each bullet should be concise and focused on a specific insight
- Include relevant figures, dates, or metrics when available
- Format numbers with currency codes using million/billion suffixes (e.g., "40.49m AUD" not "40,485,584.91 AUD")
- Always include the currency code (USD, AUD, EUR, etc.) with financial figures

# Conclusion
Provide a 1-2 sentence direct answer to the question. Be specific and include exact figures when available. Always include currency codes with financial figures.

DO NOT include your thinking process or explain your approach. Focus only on providing the requested sections with relevant information found in the documents.
`;

/**
 * Example of good output format
 */
export const EXAMPLE_GOOD_OUTPUT = `
# Source
- Pitch Deck, page 5: Revenue metrics section
- Financial Data Excel, sheet "Historical Metrics", cell B10: ARR figure for Q4 2023

# Analysis
- Current ARR is 40.49m AUD as of Q4 2023, representing a 120% year-over-year growth
- The company has achieved consistent quarterly growth averaging 15% per quarter
- Revenue breakdown shows 80% from subscriptions and 20% from professional services
- The company projects ARR to reach 60m AUD by end of Q2 2024

# Conclusion
The company's current ARR is 40.49m AUD as of Q4 2023, with strong growth trajectory indicating strong product-market fit.
`;

/**
 * Example of bad output format (to guide AI)
 */
export const EXAMPLE_BAD_OUTPUT = `
I found some information about revenue in the documents. The company seems to be doing well financially. 
There's a number around 40 million but I'm not sure of the exact currency or timeframe.
`;

/**
 * Document priority instructions
 */
export function getDocumentPriorityInstructions(
  primary: 'pdf' | 'excel' | 'both',
  secondary: 'pdf' | 'excel' | 'both'
): string {
  if (primary === 'pdf') {
    return `- PRIMARY SOURCE: The PDF pitch deck is your main source for this question.
- SECONDARY SOURCE: Also check the Excel financial data for any supporting information.
- You must check BOTH document types before concluding information is unavailable.`;
  } else if (primary === 'excel') {
    return `- PRIMARY SOURCE: The Excel financial data is your main source for this question.
- SECONDARY SOURCE: Also check the PDF pitch deck for any supporting information.
- You must check BOTH document types before concluding information is unavailable.`;
  } else {
    return `- Both document types are equally important for this question.
- You must check ALL documents before concluding information is unavailable.`;
  }
}

/**
 * Format document content for prompt inclusion
 */
export function formatDocumentsForPrompt(
  files: DocumentFile[],
  maxLength: number = 10000
): string {
  if (!files || files.length === 0) {
    return 'No documents provided.';
  }

  let documentContent = '';
  files.forEach((file, index) => {
    const truncated = file.content.length > maxLength
      ? file.content.substring(0, maxLength) + '... (content truncated)'
      : file.content;
    
    documentContent += `
Document ${index + 1}: ${file.name}
Type: ${file.type}
Content:
${truncated}
-------------------
`;
  });

  return documentContent.trim();
}

/**
 * Validation criteria for answers
 */
export const ANSWER_VALIDATION_CRITERIA = `
Before finalizing your answer, verify:
1. Source section includes specific document names and locations (page/sheet/cell)
2. Analysis section contains 3-5 specific, data-driven bullet points
3. Conclusion provides a direct, factual answer with specific figures
4. All financial figures include currency codes
5. Numbers are formatted using million/billion suffixes when appropriate (e.g., "40.49m" not "40,485,584")
6. No assumptions are made - only information explicitly found in documents is used
`;

