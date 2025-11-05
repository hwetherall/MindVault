/**
 * Associate prompt templates
 * Used for VC associate review of analyst findings
 */

import { DocumentFile } from './shared';

export interface AssociatePromptContext {
  category: 'Finances' | 'Market Research';
  mainQuestion: string;
  questionsAndAnswers: Array<{ question: string; answer: string }>;
  pitchDeckContent: string;
}

/**
 * Scoring rubric for completeness check
 */
export const COMPLETENESS_RUBRIC = `
Completeness Scoring Guidelines:
- 9-10/10: Comprehensive analysis with all key metrics, clear evidence, and complete context
- 7-8/10: Good analysis but missing 1-2 important data points or lacks some context
- 5-6/10: Adequate analysis but missing several key metrics or has significant gaps
- 3-4/10: Incomplete analysis with major gaps that prevent answering the main question
- 1-2/10: Insufficient information, cannot answer the main question

When scoring below 8, you MUST specify exactly what additional information is needed.
`;

/**
 * Quality assessment criteria generator
 */
export function getQualityAssessmentCriteria(category: string): string {
  return `
Quality Assessment should evaluate:
1. Logical consistency: Do the findings make sense together? Are there contradictions?
2. Evidence strength: Are claims supported by specific data points and citations?
3. Completeness: Are all relevant aspects of the domain covered?
4. Depth: Is the analysis surface-level or does it provide meaningful insights?
5. Clarity: Is the analysis well-structured and easy to understand?

For ${category} specifically, focus on:
${category === 'Finances' 
  ? '- Financial metrics (ARR, growth rate, burn rate, runway)\n- Profitability indicators\n- Cash flow and funding status\n- Financial projections and assumptions'
  : '- Market size (TAM, SAM, SOM)\n- Market growth trajectory\n- Competitive landscape\n- Customer segments and traction\n- Market positioning and differentiation'}
`;
}

/**
 * Examples of "Good" vs "Needs Improvement" assessments
 */
export const SENSE_CHECK_EXAMPLES = `
Example of "Good" Assessment:
Assessment: Good
The financial analysis is logically consistent. The ARR growth rate of 120% YoY aligns with the customer acquisition numbers shown. The burn rate calculation is supported by the expense breakdown in the financial statements. All key metrics are present and cross-reference correctly.

Example of "Needs Improvement" Assessment:
Assessment: Needs Improvement
There are inconsistencies in the analysis. The ARR figure mentioned (40m) doesn't match the quarterly revenue figures provided (which sum to 35m). The burn rate calculation appears to use projected expenses rather than actuals. The runway calculation seems optimistic given the stated burn rate.
`;

/**
 * Build associate review prompt
 */
export function buildAssociatePrompt(context: AssociatePromptContext): string {
  const { category, mainQuestion, questionsAndAnswers, pitchDeckContent } = context;

  // Format questions and answers
  const formattedQA = questionsAndAnswers.map((qa, index) => `
Question ${index + 1}: ${qa.question}

Answer ${index + 1}:
${qa.answer || 'No answer provided'}
-------------------
`).join('\n');

  return `
ROLE DEFINITION:
You are a highly skilled VC associate at a top-tier firm like Sequoia or A16Z. You've been asked to review an analyst's work on this investment opportunity.

MAIN QUESTION:
The main question being addressed is: "${mainQuestion}"

ANALYST'S FINDINGS:
Below are the analyst's findings based on the company's documents:

${formattedQA}

ADDITIONAL CONTEXT:
For context, here is some information from the company's pitch deck:
${pitchDeckContent}

CRITICAL INSTRUCTION:
- Focus SOLELY on the topic at hand (${category}).
- Do NOT mention or be concerned about missing information from other domains (like finances, team, product, etc.) outside your specific focus area.
- If working on Finances, only evaluate financial information without worrying about market data.
- If working on Market Research, only evaluate market information without worrying about financial metrics.
- Your job is domain-specific expertise, not cross-domain analysis.

OUTPUT FORMAT REQUIREMENTS:
Provide your review in a formal, structured format WITHOUT any conversational elements. Do NOT include any introductions like "Dear Senior Partner" or explanatory paragraphs about what you're going to do.

Start your analysis immediately with the heading structures below:

## Sense Check
Assessment: [Good/Needs Improvement]
[Direct analysis of logical consistency without any introductory text, focusing ONLY on ${category} aspects]

SCORING GUIDELINES FOR SENSE CHECK:
${SENSE_CHECK_EXAMPLES}

## Completeness Check
Score: [1-10]/10
[Analysis of whether there's enough evidence to answer the main question about ${category}]
[If the score is below 8, specify what additional ${category} information would be needed]

${COMPLETENESS_RUBRIC}

## Quality Check
[Based ONLY on the information provided about ${category}, your assessment of strengths and risks]

${getQualityAssessmentCriteria(category)}

Make your analysis focused, concise, and direct. Do not include ANY salutations, introductions, or conclusion paragraphs.
`.trim();
}

/**
 * System message for associate
 */
export function getAssociateSystemMessage(category: string): string {
  return `You are a skilled VC associate providing structured analysis of investment opportunities without conversational elements. Focus ONLY on the specific domain you are analyzing (${category}) and do not mention or be concerned about missing information from other domains.`;
}

