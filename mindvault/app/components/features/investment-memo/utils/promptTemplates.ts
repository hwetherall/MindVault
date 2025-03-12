/**
 * Prompt templates for different investment memo question types
 * These templates provide structured guidance for AI to answer specific types of questions
 */

/**
 * Financial metrics prompt template
 * Used for questions about ARR, growth rate, burn rate, etc.
 */
export const FINANCIAL_METRICS_TEMPLATE = `
You are analyzing financial metrics for an investment opportunity. 
Focus on extracting precise numerical data from the financial documents.

When answering:
1. Prioritize the Excel financial data as your primary source
2. Cross-reference with any mentions in the pitch deck
3. Include the specific currency and time period with all financial figures
4. If calculating metrics (e.g., growth rates), show your calculation method
5. Cite specific tabs, cells, or sections where you found the information

Your answer must include:
- The most recent value for the requested metric
- The time period this value represents (e.g., Q1 2023, FY2022)
- Any relevant trends if historical data is available
- The source of the information (specific document, tab, section)
`;

/**
 * Business model prompt template
 * Used for questions about business model, differentiation, etc.
 */
export const BUSINESS_MODEL_TEMPLATE = `
You are analyzing the business fundamentals of an investment opportunity.
Focus on understanding how the company creates and captures value.

When answering:
1. Prioritize the pitch deck as your primary source
2. Look for explicit statements about business strategy, revenue model, and competitive advantages
3. Identify specific customer segments and value propositions
4. Note any metrics that validate the business model (e.g., retention rates, margins)
5. Consider how the financial data supports or contradicts claims in the pitch deck

Your answer must include:
- A clear explanation of how the company makes money
- The key differentiators or competitive advantages
- Any evidence of product-market fit or traction
- Potential challenges or weaknesses in the business model
`;

/**
 * Market analysis prompt template
 * Used for questions about market size, competition, etc.
 */
export const MARKET_ANALYSIS_TEMPLATE = `
You are analyzing the market opportunity for an investment.
Focus on understanding the competitive landscape and market dynamics.

When answering:
1. Look for market size estimates (TAM, SAM, SOM) in the pitch deck
2. Identify named competitors and their relative positioning
3. Note any market trends, growth drivers, or regulatory factors
4. Consider barriers to entry and the company's market penetration strategy
5. Evaluate whether financial projections align with market opportunity claims

Your answer must include:
- The defined market segment(s) the company is targeting
- Key competitors and the company's competitive positioning
- Market growth rate and overall opportunity size
- Any significant market risks or challenges
`;

/**
 * Team assessment prompt template
 * Used for questions about the management team, etc.
 */
export const TEAM_ASSESSMENT_TEMPLATE = `
You are assessing the management team for an investment opportunity.
Focus on evaluating the team's experience, expertise, and fit for the business.

When answering:
1. Identify key team members and their roles from the pitch deck
2. Note relevant prior experience, especially in the same industry
3. Look for any notable achievements, exits, or credentials
4. Consider whether the team has the right mix of skills for this business
5. Identify any key gaps in the team or hiring priorities

Your answer must include:
- Background information on key executives (CEO, CTO, etc.)
- Assessment of the team's relevant experience for this specific business
- Any notable advisors or board members
- Potential concerns about team composition or experience gaps
`;

/**
 * Risk assessment prompt template
 * Used for questions about risks, challenges, etc.
 */
export const RISK_ASSESSMENT_TEMPLATE = `
You are conducting a risk assessment for an investment opportunity.
Focus on identifying potential challenges that could impact success.

When answering:
1. Look for explicitly stated risks in both the pitch deck and financial data
2. Consider implicit risks based on business model, market, and financial projections
3. Categorize risks (market, execution, financial, regulatory, etc.)
4. Note any risk mitigation strategies mentioned
5. Assess the realism of financial projections and assumptions

Your answer must include:
- The most significant risks categorized by type
- Assessment of which risks could be most impactful
- Any red flags in the financial projections or assumptions
- Potential risk mitigation approaches
`;

/**
 * Get the appropriate template for a question category
 * @param category The category of the question
 * @returns The template string for that category
 */
export function getTemplateForCategory(category?: string): string {
  if (!category) return '';
  
  switch (category.toLowerCase()) {
    case 'financial':
      return FINANCIAL_METRICS_TEMPLATE;
    case 'business':
      return BUSINESS_MODEL_TEMPLATE;
    case 'market':
      return MARKET_ANALYSIS_TEMPLATE;
    case 'team':
      return TEAM_ASSESSMENT_TEMPLATE;
    case 'risk':
      return RISK_ASSESSMENT_TEMPLATE;
    default:
      return '';
  }
} 