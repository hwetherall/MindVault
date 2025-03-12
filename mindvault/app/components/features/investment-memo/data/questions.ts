import { InvestmentMemoQuestion } from "../types";

/**
 * Document type priority mapping
 * Defines which document type (PDF or Excel) should be prioritized for each question
 */
export type DocumentPriority = {
  primary: 'pdf' | 'excel' | 'both';
  secondary: 'pdf' | 'excel' | 'both';
};

/**
 * Document priority mapping for each question
 * This helps guide the AI to focus on the right document type for each question
 */
export const QUESTION_DOCUMENT_MAPPING: Record<string, DocumentPriority> = {
  'arr': { primary: 'excel', secondary: 'pdf' },
  'growth_rate': { primary: 'excel', secondary: 'pdf' },
  'valuation': { primary: 'pdf', secondary: 'excel' },
  'burn_rate': { primary: 'excel', secondary: 'pdf' },
  'runway': { primary: 'excel', secondary: 'pdf' },
  'business_model': { primary: 'pdf', secondary: 'excel' },
  'customers': { primary: 'pdf', secondary: 'excel' },
  'competition': { primary: 'pdf', secondary: 'excel' },
  'differentiation': { primary: 'pdf', secondary: 'excel' },
  'team': { primary: 'pdf', secondary: 'excel' },
  'risks': { primary: 'both', secondary: 'both' },
  'funding_history': { primary: 'pdf', secondary: 'excel' },
  'problem': { primary: 'pdf', secondary: 'excel' }
};

/**
 * Complete list of investment memo questions with detailed definitions
 * Each question includes:
 * - id: Unique identifier
 * - question: The actual question text
 * - description: Brief description of what the question is asking for
 * - category: Category for grouping questions (Financial, Business, Market, etc.)
 * - complexity: Estimated complexity of answering the question (low, medium, high)
 * - recommended: Array of recommended document types for answering this question
 * - instructions: Detailed instructions for the AI on how to answer the question
 */
export const INVESTMENT_MEMO_QUESTIONS: InvestmentMemoQuestion[] = [
  {
    id: 'arr',
    question: 'What is the current Annual Recurring Revenue (ARR) of the company?',
    description: 'Find the most recent ARR figure with currency.',
    category: 'Financial',
    complexity: 'medium',
    recommended: ['excel'],
    instructions: `You are tasked with finding the company's current Annual Recurring Revenue (ARR). Remember: Any financial figure extracted must be accompanied by the currency as listed in the source. Follow these steps:\n\n1. **Search for ARR Data**: Look for any documents or spreadsheets that reference ARR or contain data related to recurring revenue. Common places to check include financial reports, KPI reports, or specific revenue breakdowns. Ensure these documents are NOT forecasted figures. Discard forecasts.\n\n2. **Check for Direct ARR Information**: If the document directly lists ARR, extract that number. ARR is often presented as a top-level metric in financial statements, quarterly reports, or revenue charts.\n\n3. **If ARR Is Not Explicitly Listed**: If the document does not provide ARR directly, look for the **Monthly Recurring Revenue (MRR)** or any similar figures. ARR can be calculated by multiplying MRR by 12 (i.e., ARR = MRR \u00d7 12). Ensure you verify that the MRR provided is related to recurring revenue (i.e., not one-time payments).\n\n4. **Look for the Most Recent Figures**: Always make sure that you are referencing the most recent data available. If there are multiple versions of the report or data spread across different periods, prioritize the most recent one. For example, if there are figures for previous quarters or fiscal years, extract the most up-to-date ARR value.\n\n5. **Verify Source**: If you find the ARR figure in a specific tab, such as \u201cARR Info\u201d ensure you extract it from the correct place. Double-check that the value you find is for the correct period (e.g., current fiscal year or quarter).\n\n6. **Provide the Current ARR**: Once the ARR is found or calculated, provide the exact value. If there are any specific currencies mentioned (e.g., AUD, USD), include that in the answer. For example, \"The current ARR is $100m AUD.\"\n\n### Tips:\n- If working with multiple sources or documents, make sure to cross-check the ARR data to ensure consistency.\n- Pay attention to the time frame mentioned in the document to ensure the ARR is current and relevant.\n- Keep the answer precise and in the correct format (i.e., the numerical value followed by the currency).`
  },
  {
    id: 'growth_rate',
    question: 'What is the Year-over-Year (YoY) growth rate?',
    description: 'Calculate the YoY growth percentage from the latest financial data.',
    category: 'Financial',
    complexity: 'medium',
    recommended: ['excel'],
    instructions: `You are tasked with determining the company's Year-over-Year (YoY) growth rate. Remember: Any financial figure extracted must be accompanied by the percentage sign and time period. Follow these steps:\n\n1. **Search for Growth Rate Data**: Look for any documents or spreadsheets that contain data related to the company's growth metrics. This could include financial statements, investor presentations, or specific growth metrics summaries. Focus on finding year-over-year comparisons.\n\n2. **Identify Key Growth Metrics**: Look for growth rates for important metrics such as:\n   - Revenue growth (most common and important)\n   - Customer growth\n   - ARR/MRR growth\n   - Market share growth\n\n3. **Find the Most Recent Growth Figures**: Always prioritize the most recent growth data. If there are multiple periods shown, focus on the latest complete year-over-year comparison.\n\n4. **Calculate Growth Rate If Needed**: If the growth rate isn't explicitly stated but you have values for two comparable periods, calculate it using this formula:\n   Growth Rate = (Current Period Value - Previous Period Value) / Previous Period Value × 100%\n\n5. **Verify Time Periods**: Ensure you're comparing the same time periods (e.g., Q1 2023 vs. Q1 2022, or FY2023 vs. FY2022).\n\n6. **Provide the Growth Rate**: Once you've found or calculated the growth rate, provide the exact percentage with the appropriate time period reference. For example, "The YoY revenue growth rate is 37% (FY2023 vs. FY2022)."\n\n### Tips:\n- If multiple growth metrics are available, prioritize revenue growth as the primary metric, but mention other important growth indicators as well.\n- Be specific about which metric the growth rate applies to (revenue, customers, etc.).\n- If there are significant differences in growth rates across different periods, mention this trend.`
  },
  {
    id: 'valuation',
    question: 'What is the target valuation for the company?',
    description: 'Identify the valuation the company is seeking in this funding round.',
    category: 'Financial',
    complexity: 'medium',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying the target valuation for the company in its current or upcoming funding round. Remember: Any financial figure extracted must be accompanied by the currency as listed in the source. Follow these steps:\n\n1. **Search for Valuation Information**: Look for any documents that mention valuation, particularly in pitch decks, investor presentations, term sheets, or funding-related sections. Key terms to look for include "valuation," "pre-money," "post-money," "company value," or specific funding round details (e.g., "Series A at $X valuation").\n\n2. **Distinguish Between Pre-Money and Post-Money Valuation**: If both are mentioned, note the difference:\n   - **Pre-money valuation**: The company's value before receiving new investment\n   - **Post-money valuation**: The company's value after receiving new investment (Pre-money + new investment amount)\n\n3. **Identify the Current Funding Round**: Determine which funding round the company is currently seeking (Seed, Series A, B, C, etc.) and the associated valuation target for that specific round.\n\n4. **Look for Valuation Ranges**: Sometimes companies provide a range rather than a specific figure. If so, include both the lower and upper bounds of the target valuation.\n\n5. **Check for Valuation Multiples**: Some documents might mention valuation in terms of multiples (e.g., "seeking 10x revenue valuation"). If revenue figures are available, calculate the implied valuation.\n\n6. **Provide the Target Valuation**: Once you've found the valuation information, provide the exact figure with the appropriate currency. Specify whether it's pre-money or post-money if that information is available. For example, "The company is seeking a pre-money valuation of $50M USD in their Series B round."\n\n### Tips:\n- Pay attention to the context around valuation figures to ensure you're reporting the target valuation (what they're seeking), not historical valuations from previous rounds.\n- If multiple valuation figures appear in different documents, prioritize the most recent information.\n- If no explicit valuation is stated but there are details about investment amount and equity percentage, you can calculate the implied post-money valuation (Investment Amount ÷ Equity Percentage = Post-Money Valuation).`
  },
  {
    id: 'burn_rate',
    question: 'What is the current monthly cash burn rate?',
    description: 'Calculate the average monthly cash outflow from the financial statements.',
    category: 'Financial',
    complexity: 'medium',
    recommended: ['excel'],
    instructions: `You are tasked with finding the current burn rate for the company. Remember: Any financial figure extracted must be accompanied by the currency as listed in the source. Follow these steps:\n\n1. **Search for Burn Rate Data**: Look for any documents or spreadsheets that contain data related to the company\u2019s cash burn or expenditure. This could include financial statements, cash flow reports, or specific key metrics summaries. Ensure these documents are NOT forecasted figures. Discard forecasts.\n\nFor the selected documents:\n2. **Identify Burn Rate Figures**: Find the most recent figure for cash burn (i.e., the rate at which the company is spending its cash). This is typically provided as a monthly figure. Ensure there are not forecasted figures.\n\n3. **If Burn Rate Is Given Over Time**: If the burn rate is given over a time series (e.g., over multiple months), calculate both:\n   - The **most recent burn rate**.\n   - The **average burn rate** over the specified time period (e.g., last 3 months, last 6 months). Ensure you state how long the time period is if you\u2019re calculating an average.\n\n   The burn rate is usually given in terms of currency per month, but ensure you clarify the time frame (e.g., monthly, quarterly) if necessary.\n\n4. **Provide the Burn Rate**: Once you\u2019ve found or calculated the burn rate, provide the **current burn rate** as a number with the appropriate currency.\n\n5. **Verify Source**: Ensure you reference the correct section of the document where the burn rate data is found.\n\n### Tips:\n- Double-check that the burn rate corresponds to the most recent period (e.g., monthly) and ensure it\u2019s accurate.\n- If you are averaging over multiple periods, ensure you clearly state the time period used (e.g., \u201caverage monthly burn rate for the last 6 months\u201d).\n- Always include the currency for clarity.`
  },
  {
    id: 'runway',
    question: 'How much runway does the company have?',
    description: 'Determine how many months of operations the company can fund with current cash reserves at the current burn rate.',
    category: 'Financial',
    complexity: 'medium',
    recommended: ['excel'],
    instructions: `You are tasked with calculating the company's runway at the current expense level. Remember: Any financial figure extracted must be accompanied by the currency as listed in the source. Follow these steps:\n\n1. **Search for Cash on Hand and Burn Rate Data**: Look for any documents or spreadsheets that provide the most recent figures for both:\n   - **Cash on Hand**: The total amount of cash the company has available.\n   - **Burn Rate**: The company's monthly expenditure or cash burn.\nEnsure these documents are NOT forecasted figures. Discard forecasts.\n\n2. **Identify Latest Figures**: Find the most recent data for both cash on hand and burn rate. These numbers are often found in financial statements, cash flow reports, or specific key metric summaries. Ensure that these figures are current (e.g., for the most recent month or quarter). Ensure there are not forecasted figures.\n\n3. **Calculate Runway**: Use the following formula to calculate the runway:\n   \\[\n   \\text{Runway} = \\frac{\\text{Cash on Hand}}{\\text{Burn Rate}}\n   \\]\n   This will give the number of months the company can sustain its current expense level before running out of cash. If necessary, round the result to one decimal place.\n\n4. **Provide the Runway**: Once you have calculated the runway, provide the result in months.\n\n5. **Verify Source**: Ensure that the figures you use for cash on hand and burn rate come from the correct source, such as the relevant document and section (e.g., "Document X, Excel sheet: Key Metrics").\n\n### Tips:\n- Double-check that the figures for cash on hand and burn rate are the most up-to-date and relevant.\n- Ensure the runway calculation is correct and that the result is clear and easy to interpret.\n- If there is any indication of future changes in expenses or cash flow, make sure to note those in the answer, if applicable.`
  },
  {
    id: 'business_model',
    question: 'What is the company\'s business model?',
    description: 'Summarize how the company generates revenue and its pricing structure.',
    category: 'Business',
    complexity: 'low',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying and explaining the company's business model. Follow these steps:\n\n1. **Search for Business Model Information**: Look for sections in the documents that describe how the company makes money, its revenue streams, pricing models, and go-to-market strategy. These details are typically found in pitch decks, business plans, or executive summaries.\n\n2. **Identify Revenue Streams**: Determine the primary ways the company generates revenue. Common models include:\n   - Subscription-based (SaaS, recurring revenue)\n   - Transactional (pay-per-use, commission-based)\n   - Freemium (basic free version with paid premium features)\n   - Marketplace/Platform (connecting buyers and sellers, taking a cut)\n   - E-commerce (direct product sales)\n   - Advertising-based\n   - Licensing/IP-based\n\n3. **Understand the Pricing Structure**: Look for information about how the company prices its products or services:\n   - Tiered pricing (different feature sets at different price points)\n   - Usage-based pricing\n   - Seat-based pricing\n   - Value-based pricing\n   - One-time purchases vs. recurring revenue\n\n4. **Identify Customer Segments**: Determine which customer segments the company targets (B2B, B2C, enterprise, SMB, etc.) and how this affects their business model.\n\n5. **Look for Unit Economics**: Find information about key metrics like Customer Acquisition Cost (CAC), Lifetime Value (LTV), gross margins, or other relevant unit economics that explain the profitability of the business model.\n\n6. **Provide a Comprehensive Answer**: Synthesize this information into a clear explanation of how the company makes money, who they sell to, and what their pricing approach is.\n\n### Tips:\n- Focus on the current business model, not aspirational future plans (unless specifically asked about future strategy).\n- If the company has multiple revenue streams, identify which ones are primary vs. secondary.\n- Include specific pricing information if available (e.g., "Subscription tiers range from $10-$100 per user per month").`
  },
  {
    id: 'customers',
    question: 'Who are the company\'s key customers?',
    description: 'Identify major customers and customer segments.',
    category: 'Market',
    complexity: 'low',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying the company's key customers and customer segments. Follow these steps:\n\n1. **Search for Customer Information**: Look for sections in the documents that discuss customers, clients, users, or target markets. These details are typically found in pitch decks, marketing materials, or customer testimonials sections.\n\n2. **Identify Named Enterprise Customers**: Look for any specific companies mentioned as customers, especially well-known brands or logos that appear in customer showcase sections. Note if they're described as key accounts, flagship customers, or reference customers.\n\n3. **Identify Customer Segments**: Determine the main customer segments the company targets, which might be categorized by:\n   - Industry/vertical (e.g., healthcare, finance, education)\n   - Company size (enterprise, mid-market, SMB)\n   - Geography (regional, national, global markets)\n   - User role (e.g., marketers, developers, HR professionals)\n   - Consumer demographics (if B2C)\n\n4. **Look for Customer Metrics**: Find information about:\n   - Number of customers (total customer count)\n   - Customer concentration (percentage of revenue from top customers)\n   - Customer growth rates\n   - Customer retention/churn metrics\n\n5. **Identify Customer Case Studies**: Note any detailed customer success stories that illustrate how customers use the product and the value they derive.\n\n6. **Provide a Comprehensive Answer**: Synthesize this information to clearly describe who the company sells to, highlighting both named key accounts (if available) and the broader customer segments they target.\n\n### Tips:\n- If specific customer names are mentioned, include them in your answer, especially recognizable brands.\n- If the company serves both enterprise and smaller customers, clarify which segment represents their primary focus.\n- Include quantitative data about customers when available (e.g., "Over 500 enterprise customers including 30% of the Fortune 500").`
  },
  {
    id: 'competition',
    question: 'Who are the main competitors?',
    description: 'List direct and indirect competitors and their market positions.',
    category: 'Market',
    complexity: 'medium',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying the company's main competitors and their market positions. Follow these steps:\n\n1. **Search for Competitor Information**: Look for sections in the documents that discuss the competitive landscape, market analysis, or competitive differentiation. These are typically found in pitch decks, market analysis sections, or SWOT analyses.\n\n2. **Distinguish Between Direct and Indirect Competitors**:\n   - **Direct competitors**: Companies offering similar products/services targeting the same customer segments\n   - **Indirect competitors**: Companies solving the same customer problems with different approaches or technologies\n\n3. **Identify Named Competitors**: Make a list of specific companies mentioned as competitors, noting whether they're presented as direct or indirect competition.\n\n4. **Look for Competitive Positioning**: Determine how the company positions itself relative to competitors. Look for:\n   - Competitive matrices or quadrants (e.g., Gartner Magic Quadrant positioning)\n   - Feature comparison tables\n   - Statements about competitive advantages or differentiation\n\n5. **Identify Market Leaders**: Determine which competitors are described as market leaders, incumbents, or dominant players in the space.\n\n6. **Note Emerging Competitors**: Identify any mentions of new entrants, emerging competitors, or startups that might be disrupting the space.\n\n7. **Provide a Comprehensive Answer**: Synthesize this information to clearly describe the competitive landscape, listing the main competitors (both direct and indirect) and explaining their relative market positions.\n\n### Tips:\n- If a competitive matrix or quadrant is provided, describe how competitors are positioned along the key dimensions.\n- Include information about competitor size, funding, or market share when available.\n- If the company identifies specific competitive advantages over named competitors, include these points of differentiation.`
  },
  {
    id: 'differentiation',
    question: 'What is the company\'s key differentiation?',
    description: 'Identify unique selling propositions and competitive advantages.',
    category: 'Business',
    complexity: 'medium',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying the company's key differentiation and unique selling propositions. Follow these steps:\n\n1. **Search for Differentiation Information**: Look for sections in the documents that discuss competitive advantages, unique selling propositions (USPs), proprietary technology, or "why us" messaging. These are typically found in pitch decks, product descriptions, or competitive analysis sections.\n\n2. **Identify Explicit Differentiation Claims**: Look for statements where the company directly claims what makes them different or better than alternatives. These often appear as bullet points or highlighted statements in marketing materials.\n\n3. **Categorize Types of Differentiation**: Organize the differentiation points into categories such as:\n   - **Product differentiation**: Unique features, capabilities, or technology\n   - **Market differentiation**: Unique positioning or target audience\n   - **Process differentiation**: Unique approach or methodology\n   - **Business model differentiation**: Unique pricing or delivery model\n   - **Team differentiation**: Unique expertise or experience\n\n4. **Look for Supporting Evidence**: Find specific examples, metrics, or case studies that support the differentiation claims. Strong differentiation is backed by evidence rather than just assertions.\n\n5. **Identify Proprietary Elements**: Note any mentions of patents, proprietary technology, exclusive partnerships, or other barriers to entry that competitors cannot easily replicate.\n\n6. **Provide a Comprehensive Answer**: Synthesize this information to clearly describe what truly makes the company different from competitors, focusing on the most substantial and defensible points of differentiation.\n\n### Tips:\n- Distinguish between true differentiation and table stakes features that all competitors likely offer.\n- If the company claims multiple differentiators, prioritize those that appear most unique and valuable to customers.\n- Include specific technical or product details that support differentiation claims when available.`
  },
  {
    id: 'team',
    question: 'Who are the key members of the management team and what are their backgrounds?',
    description: 'Identify key executives and their relevant experience.',
    category: 'Team',
    complexity: 'low',
    recommended: ['pdf'],
    instructions: `Using ONLY information contained in the provided documents, follow the <steps> to answer the question: Who are the key members of the management team and what are their backgrounds? Take time to understand the question and think step by step. Remember: Any personnel-related information extracted must be accompanied by the source as listed in the documents. \n\n<steps>\n1. **Search for Management Team Information**: Look for documents such as organizational charts, company leadership bios, annual reports, investor presentations, press releases, or sections discussing the management team. These documents may specifically mention the key members of the team and provide details about their roles and backgrounds.\n\nFor the selected documents:\n2. **Identify Key Management Team Members**: Focus on identifying individuals who are referred to as the company's **key management members**, such as the CEO, CFO, CTO, COO, and other senior executives. Look for titles and roles that suggest they are part of the executive team or key decision-makers.\n\n3. **Extract Background Information**: For each key member, extract their **professional background**, including previous roles, relevant experience, and education (if provided). Pay attention to any previous companies they have worked for or notable achievements that highlight their expertise in the industry. Remember: This information must come from the provided documents.\n\n4. **Cross-Check for Multiple Mentions**: If multiple documents provide information about the same individuals, consolidate the details and ensure consistency. If there are discrepancies, prioritize the most recent document.\n\n5. **Provide the Answer**: Once you have identified the key management team members and their backgrounds, provide the information in the following format:  \n   - **[Name]**: [Title], [Background Information], [Education (if available)]  \n   - Include additional relevant details about their expertise or unique qualifications.\n\n6. **Verify Source**: Ensure you reference the correct source for your information, especially if management details are found in specific sections or pages of the documents.\n</steps>\n\nGenerate your answer 3 times and compare for consistency and accuracy. If discrepancies arise, refine your synthesis and provide a final answer with the most precise and consistent data.`
  },
  {
    id: 'risks',
    question: 'What are the key risks to consider?',
    description: 'Identify business, market, financial, and regulatory risks.',
    category: 'Risk',
    complexity: 'high',
    recommended: ['pdf', 'excel'],
    instructions: `You are tasked with identifying the key risks associated with the company. Follow these steps:\n\n1. **Search for Risk Information**: Look for sections in the documents that explicitly discuss risks, challenges, threats, or concerns. These might be found in risk assessment sections, SWOT analyses, or disclosure sections of investor materials.\n\n2. **Categorize Different Types of Risks**:\n   - **Market risks**: Competition, market saturation, changing customer preferences\n   - **Financial risks**: Cash runway, burn rate, funding requirements, revenue concentration\n   - **Operational risks**: Supply chain, scaling challenges, technical debt\n   - **Regulatory risks**: Compliance issues, pending legislation, industry regulation\n   - **Team risks**: Key person dependencies, hiring challenges, organizational structure\n   - **Product risks**: Technical feasibility, development timelines, product-market fit\n\n3. **Look for Quantitative Risk Indicators**: Identify metrics that suggest potential risks, such as:\n   - High customer concentration (e.g., >20% revenue from one customer)\n   - Short runway (<12 months)\n   - Declining growth rates or margins\n   - High churn rates\n\n4. **Identify Mitigation Strategies**: Note any information about how the company plans to address or mitigate the identified risks.\n\n5. **Look for Implied Risks**: Even if not explicitly stated as risks, look for challenges or obstacles mentioned throughout the documents that could represent significant risks.\n\n6. **Provide a Comprehensive Answer**: Synthesize this information to clearly describe the most significant risks facing the company, organized by category, with particular attention to those that could materially impact the business.\n\n### Tips:\n- If the company operates in a regulated industry, pay special attention to regulatory and compliance risks.\n- For early-stage companies, focus on execution risks, market validation, and funding risks.\n- For more established companies, focus on competitive threats, market changes, and scaling challenges.\n- Include both short-term and long-term risks in your assessment.`
  },
  {
    id: 'funding_history',
    question: 'What is the company\'s funding history?',
    description: 'List previous funding rounds, investors, and amounts raised.',
    category: 'Financial',
    complexity: 'low',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying the company's funding history. Follow these steps:\n\n1. **Search for Funding Information**: Look for sections in the documents that discuss previous financing, capital raises, investors, or funding rounds. These are typically found in pitch decks, company backgrounds, or financial history sections.\n\n2. **Identify Each Funding Round**: For each funding round mentioned, try to determine:\n   - **Round name/type**: (e.g., Seed, Series A, Series B, etc.)\n   - **Date**: When the round was completed\n   - **Amount raised**: The total funding amount for that round\n   - **Lead investor(s)**: The primary investor(s) who led the round\n   - **Other participating investors**: Additional investors who participated\n   - **Valuation**: Pre-money or post-money valuation (if mentioned)\n\n3. **Calculate Total Funding**: Add up all the funding rounds to determine the total amount of capital raised to date.\n\n4. **Identify Notable Investors**: Note any prominent venture capital firms, strategic investors, or angel investors that might lend credibility to the company.\n\n5. **Look for Non-Equity Funding**: Identify any non-dilutive funding such as grants, loans, or revenue-based financing that contributes to the company's capital structure.\n\n6. **Provide a Chronological Summary**: Present the funding history in chronological order, from earliest to most recent, with complete details for each round.\n\n### Tips:\n- If exact dates aren't provided, include whatever time information is available (year, quarter, etc.).\n- If funding amounts are given in different currencies, convert to a single currency for consistency, noting the original currency.\n- If the company has acquired other companies, note whether those acquisitions were cash, stock, or a combination.`
  },
  {
    id: 'problem',
    question: 'What problem is this company trying to solve?',
    description: 'Identify the core customer problem the company addresses.',
    category: 'Business',
    complexity: 'low',
    recommended: ['pdf'],
    instructions: `Using ONLY information contained in the provided documents, follow the <steps> to answer the question: What problem is this company trying to solve?. Take time to understand the question and think step by step. Remember: Any product-related information extracted must be accompanied by the source as listed in the documents.\n\n<steps>\n1. **Search for Value Proposition and Consumer Needs Statements**: Look for documents that describe the company's value proposition or problems/needs customers face which they aim to address, including pitch decks, strategy decks, product sheets, marketing materials, press releases, or any other documents that provide insight into the company's mission and the issues its products are designed to solve.\n\nFor the selected documents:\n2. **Identify the Problem the Company is Trying to Solve**: Identify which problem the company is proposing to solve for its customers. Look for statements that outline how the products improve customer situations, solve pain points, or create value for users.\n\n3. **Cross-Check with Customer Testimonials/Case Studies**: If available, examine customer testimonials or case studies that mention how the products have helped solve real-world problems for users. This could provide concrete examples of the problems being addressed. \n\n4. **Consolidate Information**: If there are multiple problems the company is trying to address, consolidate the information, ensuring there is no conflicting or redundant statements. Prioritize the most recent and detailed sources.\n\n5. **Provide the Answer**: Once the problems the company proposes to address have been clearly identified, list the specific problem(s) the company is trying to solve. Keep your answer short and concise. Include any additional information gathered that helps clarify the company's approach or strategy.\n\n7. **Verify Source**: Ensure you reference the correct source for your information, especially if the problem-solving capabilities of the products are described in specific sections or pages of the documents.\n</steps>\n\nGenerate your answer 3 times and compare for consistency and accuracy. If discrepancies arise, refine your synthesis and provide a final answer with the most precise and consistent data.`
  }
];

/**
 * Helper function to get the document priority for a specific question
 * @param questionId The ID of the question
 * @returns The document priority mapping for the question, or a default if not found
 */
export function getDocumentPriorityForQuestion(questionId: string): DocumentPriority {
  return QUESTION_DOCUMENT_MAPPING[questionId] || { primary: 'both', secondary: 'both' };
}

/**
 * Helper function to get a question by ID
 * @param questionId The ID of the question to find
 * @returns The question object or undefined if not found
 */
export function getQuestionById(questionId: string): InvestmentMemoQuestion | undefined {
  return INVESTMENT_MEMO_QUESTIONS.find(q => q.id === questionId);
} 