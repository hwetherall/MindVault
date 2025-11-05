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
 * Designed for VC investment analysis
 */
export const STANDARD_OUTPUT_FORMAT = `
Your answer MUST be structured in the following format:

# Source
CRITICAL: You MUST provide SPECIFIC, ACTIONABLE citations. Never use generic phrases like "combined results" or "available documents". Instead:

For EACH data point you cite, include:
- Exact document filename (e.g., "Go1_Pitch_Deck.pdf")
- Specific page number for PDFs (e.g., "page 12, Revenue Growth slide")
- Exact sheet name for Excel files (e.g., "sheet 'Historical Metrics'")
- Specific cell reference or column/row when possible (e.g., "cell B15" or "March 2021 column")
- Section or slide title if applicable (e.g., "Financial Highlights section, page 8")

BAD example: "Combined results from available document analyses"
GOOD example: "Go1_Pitch_Deck.pdf, page 12, 'Revenue Growth' slide shows ARR growth metrics; Financial_Data.xlsx, sheet 'Historical Metrics', March 2021 column (cell range B10:B15) contains ARR figures for comparison period"

# Analysis
Provide 3-5 bullet points with ACTIONABLE INSIGHTS that a VC would care about. Each bullet should:

- Focus on WHAT the data shows, not document availability
- Include specific figures with proper formatting (e.g., "109% YoY growth" not "growth was high")
- Provide context and trends (e.g., "Growth accelerated from 75% in 2020 to 109% in 2021")
- Highlight implications or comparisons when relevant (e.g., "This exceeds typical SaaS benchmarks of 40-60%")
- Note any important caveats or time periods

BAD example: "Analysis was performed on available documents. Excel analysis: Available. PDF analysis: Available."
GOOD example: 
- "ARR grew 109% YoY from March 2020 to March 2021, accelerating from 75% growth in the prior period"
- "Customer base expanded 47.88% YoY, indicating strong acquisition momentum alongside revenue growth"
- "Growth rate significantly exceeds typical Series B SaaS benchmarks of 40-60% YoY"

Format numbers with currency codes using million/billion suffixes (e.g., "40.49m AUD" not "40,485,584.91 AUD")

# Conclusion
Provide a direct, concise answer that a VC partner would want to see. Include:
- The specific metric requested with exact figures
- Time period (e.g., "as of March 2021" or "for FY2021")
- Currency when applicable
- One sentence of context if it adds value (e.g., comparison to benchmarks or trend direction)

BAD example: "The Year-over-Year (YoY) growth rate for ARR is 109% as of March 2021. The customer base also grew by 47.88% YoY."
GOOD example: "The Year-over-Year (YoY) growth rate for ARR is 109% as of March 2021, up from 75% in the prior period. The customer base grew 47.88% YoY over the same period, indicating strong product-market fit and efficient scaling."

DO NOT include your thinking process, document availability status, or explain your approach. Focus ONLY on delivering insights from the documents.
`;

/**
 * Example of good output format (VC-focused)
 */
export const EXAMPLE_GOOD_OUTPUT = `
# Source
- Go1_Pitch_Deck.pdf, page 12, "Revenue Growth" slide: YoY growth metrics and historical ARR figures
- Financial_Data.xlsx, sheet "Historical Metrics", March 2021 column (cells B10-B15): ARR figures for current and prior year periods
- Go1_Pitch_Deck.pdf, page 15, "Customer Metrics" section: Customer count data for YoY comparison

# Analysis
- ARR grew 109% YoY from March 2020 to March 2021, accelerating from 75% growth in the prior period, indicating strong momentum
- Customer base expanded 47.88% YoY over the same period, demonstrating both acquisition efficiency and retention strength
- Growth rate significantly exceeds typical Series B SaaS benchmarks of 40-60% YoY, positioning the company favorably for next funding round
- The acceleration from 75% to 109% suggests the company is hitting an inflection point in market penetration

# Conclusion
The Year-over-Year (YoY) growth rate for ARR is 109% as of March 2021, up from 75% in the prior period. The customer base grew 47.88% YoY over the same period, indicating strong product-market fit and efficient scaling.
`;

/**
 * Example of bad output format (to guide AI)
 */
export const EXAMPLE_BAD_OUTPUT = `
# Source
Combined results from available document analyses.

# Analysis
- Analysis was performed on available documents
- Excel analysis: Available
- PDF analysis: Available
- Some document types may have been unavailable for analysis

# Conclusion
The Year-over-Year (YoY) growth rate for ARR is 109% as of March 2021. The customer base also grew by 47.88% YoY.
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
1. Source section includes SPECIFIC citations (document names, page numbers, sheet names, cell references) - NEVER use generic phrases like "combined results" or "available documents"
2. Analysis section contains 3-5 ACTIONABLE INSIGHTS with specific figures - NOT document availability status
3. Analysis bullets focus on WHAT the data shows (trends, comparisons, implications) not HOW you analyzed it
4. Conclusion provides a direct, factual answer with specific figures and context
5. All financial figures include currency codes
6. Numbers are formatted using million/billion suffixes when appropriate (e.g., "40.49m" not "40,485,584")
7. No generic phrases like "Analysis was performed" or "Documents were analyzed"
8. Every data point in Analysis has a corresponding citation in Source
9. If trends exist, note acceleration/deceleration patterns
10. If benchmarks are available, include comparisons
`;

