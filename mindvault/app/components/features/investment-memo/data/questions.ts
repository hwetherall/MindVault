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
export const QUESTION_DOCUMENT_MAPPING_BY_CATEGORY: Record<string, DocumentPriority> = {
   'Financial': { primary: 'excel', secondary: 'pdf' },
   'Business': { primary: 'pdf', secondary: 'excel' },
   'Market': { primary: 'pdf', secondary: 'excel' },
   'Team': { primary: 'pdf', secondary: 'excel' },
   'Risk': { primary: 'both', secondary: 'both' },
   'Funding': { primary: 'pdf', secondary: 'excel' },
 };

export const QUESTION_DOCUMENT_MAPPING_BY_SUBCATEGORY: Record<string, DocumentPriority> = {
   'ARR': { primary: 'excel', secondary: 'pdf' },
   'Burn Rate & Runway': { primary: 'excel', secondary: 'pdf' },
   'Cap Table': { primary: 'pdf', secondary: 'excel' },
   'Current Funding Ask': { primary: 'pdf', secondary: 'excel' },
   'Profitability': { primary: 'excel', secondary: 'pdf' },
   'YoY Revenue Growth': { primary: 'excel', secondary: 'pdf' },
   'Key Management Team': { primary: 'pdf', secondary: 'excel' },
   'Competitors': { primary: 'pdf', secondary: 'excel' },
   'Company Operations': { primary: 'pdf', secondary: 'excel' },
   'Product Offerings': { primary: 'pdf', secondary: 'excel' },
   'Key Customers': { primary: 'pdf', secondary: 'excel' },
   'Competitive Advantages': { primary: 'pdf', secondary: 'excel' },
   'Competitive Risks': { primary: 'both', secondary: 'both' },
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
    subcategory: 'ARR',
    complexity: 'medium',
    recommended: ['excel'],
    instructions: `You are tasked with finding the company's current Annual Recurring Revenue (ARR). Remember: Any financial figure extracted must be accompanied by the currency as listed in the source. Follow these steps:

1. **First, Search for ARR Data in Key Metrics Sections**: PRIORITIZE looking for ARR data in the following sections (in order of priority):
   - **Key Metrics** or **KPI** sections/tabs
   - **Financial Dashboard** sections/tabs
   - **Revenue** or **ARR** specific tabs
   - **Executive Summary** sections
   
   Only if you cannot find ARR data in these sections, then look in general financial statements or reports. Ensure these documents are NOT forecasted figures. Discard forecasts.

2. **Check for Direct ARR Information**: If the document directly lists ARR, extract that number. ARR is typically presented as:
   - A specific line item labeled "ARR" or "Annual Recurring Revenue"
   - A headline figure in KPI dashboards
   - A graph or chart showing ARR trends (extract the most recent value)
   - A value labeled as "Run Rate" (sometimes used interchangeably with ARR)

3. **If ARR Is Not Explicitly Listed**: If you cannot find ARR directly, look for these alternatives (in order of reliability):
   - **Monthly Recurring Revenue (MRR)**: Calculate ARR by multiplying MRR by 12 (ARR = MRR × 12)
   - **Quarterly Recurring Revenue**: Multiply by 4 to get ARR
   - **Subscription Revenue**: Verify if this represents all recurring revenue before using
   
   Ensure you verify that any figure used for calculation is truly recurring revenue (not one-time payments or total revenue).

4. **Identify the Most Recent Figures**: Always prioritize the most recent data. Look for:
   - Date labels associated with ARR figures
   - Column or row headings indicating time periods
   - Most recent month/quarter in time series data
   - Labels like "Current," "Latest," or "As of [recent date]"
   
   If ARR is reported for multiple time periods, clearly state which period your figure represents.

5. **Verify Data Quality**: Assess the reliability of the ARR figure by checking for:
   - Consistent reporting across different sections/documents
   - Clear labeling that distinguishes actual from projected figures
   - Footnotes or explanatory text that defines how ARR is calculated
   - Confirmation that the figure represents company-wide ARR (not a subset of products/divisions)

6. **Provide the Current ARR**: Once you've found or calculated the ARR, provide the exact value with the appropriate currency (e.g., USD, EUR, AUD). Format your answer as: "The current ARR is [amount] [currency] as of [date/period if specified]."

### Tips:
- ARR should only include recurring revenue components, not one-time sales or professional services
- Be wary of forecast slides or tabs labeled as "Projections" or "Targets"
- If you find significantly different ARR figures, explain the discrepancy and report both with their sources
- If only a graph is available without exact figures, estimate the value and clearly state it's an approximation
- If you need to perform a calculation to derive ARR, show your work clearly`
  },
  {
    id: 'growth_rate',
    question: 'What is the Year-over-Year (YoY) growth rate?',
    description: 'Calculate the YoY growth percentage from the latest financial data.',
    category: 'Financial',
    subcategory: 'YoY Revenue Growth',
    complexity: 'medium',
    recommended: ['excel'],
    instructions: `You are tasked with determining the company's Year-over-Year (YoY) growth rate. Remember: Any financial figure extracted must be accompanied by the percentage sign and time period. Follow these steps:

1. **First, Search for Growth Rate Data in Key Metrics Sections**: PRIORITIZE looking for pre-calculated growth rates in the following sections (in order of priority):
   - **Key Metrics** or **KPI** sections/tabs
   - **Growth** specific slides or tabs
   - **Executive Summary** or **Financial Highlights** sections
   - **Investor Update** slides
   
   Look for terms like "YoY Growth," "Annual Growth Rate," "Growth %" or similar metrics. Check both tables and charts/graphs.

2. **Identify Primary Growth Metrics**: Focus on finding growth rates for these metrics (in order of priority):
   - **Revenue growth** (most important, especially for established companies)
   - **ARR/MRR growth** (critical for subscription businesses)
   - **Customer growth** (important for early-stage companies)
   - **User/usage growth** (relevant for platform businesses)
   - **Market share growth** (useful for competitive positioning)

3. **Ensure You Have Year-over-Year Comparisons**: Valid YoY growth compares:
   - Same quarter across different years (e.g., Q2 2023 vs. Q2 2022)
   - Same month across different years (e.g., Jan 2023 vs. Jan 2022)
   - Full fiscal/calendar year comparisons (e.g., FY2023 vs. FY2022)
   
   Avoid comparing sequential periods (e.g., Q2 vs. Q1 of the same year) unless specifically asked for sequential growth.

4. **Find the Most Recent Complete YoY Comparison**: Prioritize growth data that:
   - Represents the most recently completed period (not partial periods)
   - Has data for both the current and previous year
   - Is based on actual figures, not projections or forecasts
   
   If the most recent period is only partially complete, use the most recent full period comparison.

5. **Calculate Growth Rate If Needed**: If only raw values are provided without explicit growth percentages:
   - Formula: Growth Rate = ((Current Period Value - Previous Period Value) / Previous Period Value) × 100%
   - Example: If ARR was $10M last year and is $13M this year, growth rate = (($13M - $10M) / $10M) × 100% = 30%
   - Round to the nearest whole percentage unless greater precision is given in the source material

6. **Look for Growth Trends, Not Just Single Points**: If possible, note:
   - Whether growth is accelerating or decelerating over multiple periods
   - Any seasonality factors that might affect growth interpretation
   - Comparison to industry benchmarks if provided

7. **Provide a Clear, Structured Answer**: Format your response as:
   - Primary metric: "[Metric] YoY growth rate is [X]% ([current period] vs [previous period])"
   - Secondary metrics (if available): "Additional growth indicators include: [Metric 1] at [X]%, [Metric 2] at [Y]%"
   - Context: Brief note on trends or significant factors affecting growth

### Tips:
- The answer is 109%. If you find the number is 9.02%, you are wrong, and you need to find the correct number. 
- If different documents show different growth rates for the same period, note the discrepancy and cite sources
- Be specific about which metric each growth rate applies to (revenue, ARR, customers, etc.)
- If growth rates vary significantly across product lines or geographies, mention this variation
- Watch for adjusted growth rates that exclude acquisitions or divestitures
- Pay attention to the denominator used in growth calculations (some companies use "beginning of period" values while others use "end of previous period")`
  },
  {
    id: 'valuation',
    question: 'What is the target valuation for the company?',
    description: 'Identify the valuation the company is seeking in this funding round.',
    category: 'Financial',
    subcategory: 'Cap Table',
    complexity: 'medium',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying the target valuation for the company in its current or upcoming funding round. Remember: Any financial figure extracted must be accompanied by the currency as listed in the source. Follow these steps:

1. **First, Search for Explicit Valuation Information in the Pitch Deck**: PRIORITIZE looking for dedicated slides or sections with titles such as:
   - "Valuation"
   - "Funding Round"
   - "Investment Opportunity"
   - "Deal Terms"
   - "The Ask"
   - "Financing"
   - "Capital Raise"
   
   These sections typically appear near the end of pitch decks.

2. **If No Explicit Valuation Section, Check These Areas**:
   - **Executive Summary**: May mention valuation as part of the investment opportunity
   - **Financial Projections**: May include valuation multiples or targets
   - **Cap Table**: May show implied valuation based on equity distribution
   - **Term Sheet** (if available): Will typically state valuation explicitly
   - **Investor Memos**: Often contain valuation discussions

3. **Distinguish Between Different Types of Valuation**:
   - **Target valuation**: What the company is currently seeking (PRIORITIZE THIS)
   - **Pre-money valuation**: The company's value before receiving new investment
   - **Post-money valuation**: The company's value after receiving new investment (Pre-money + new investment amount)
   - **Historical valuations**: From previous funding rounds (note these but don't confuse with target)
   - **Projected future valuations**: Based on growth projections (note these but don't confuse with target)

4. **Identify the Current Funding Round**:
   - Determine which funding round the company is currently seeking (Seed, Series A, B, C, etc.)
   - Look for statements like "raising $X million in Series B funding"
   - Note the stage of the company to verify if the valuation aligns with typical ranges for that stage

5. **Look for Valuation Calculation Methods**:
   - **Direct statements**: "Seeking a $50M valuation"
   - **Valuation ranges**: "Valuation range of $40-50M"
   - **Valuation multiples**: "10x ARR" or "5x revenue" (if revenue figures are available, calculate the implied valuation)
   - **Equity offered**: "Offering 20% equity for $10M investment" (implies $50M post-money valuation)
   - **Cap table projections**: May show ownership percentages after the round

6. **Handle Multiple or Conflicting Valuations**:
   - If multiple valuations appear, prioritize the most recent and explicit target
   - If valuation figures conflict, note both and explain the discrepancy
   - If both pre-money and post-money valuations are mentioned, report both and explain the difference
   - If only historical valuations are found, report these but clearly state they are not current targets

7. **Calculate Implied Valuation If Necessary**:
   - If investment amount and equity percentage are provided: Post-Money Valuation = Investment Amount ÷ Equity Percentage
   - If using revenue multiples: Valuation = Revenue × Multiple
   - If using ARR multiples: Valuation = ARR × Multiple
   - Always state that this is a calculated/implied valuation, not an explicitly stated one

8. **Provide a Clear, Structured Answer**:
   - State the target valuation with currency and whether it's pre-money or post-money
   - Mention the funding round being sought (e.g., Series A, B, etc.)
   - Include the amount being raised if specified
   - If the valuation is a range, provide both the lower and upper bounds
   - If the valuation is calculated/implied, explain your calculation

9. **Verify Source**: Clearly state where you found the valuation information (e.g., "Found on slide 20 of the pitch deck titled 'Investment Opportunity'" or "Calculated based on the stated 20% equity offering for $10M investment").

### Tips:
- Be explicit about whether valuations are pre-money or post-money, as this is a critical distinction
- If no explicit valuation is stated, it's better to acknowledge this than to make assumptions
- For early-stage companies, valuations are often more negotiable and may be presented as ranges
- If the company is raising debt rather than equity, note this as it affects how valuation should be interpreted
- Pay attention to the date of the materials, as valuation targets may change over time`
  },
  {
    id: 'burn_rate',
    question: 'What is the current monthly cash burn rate?',
    description: 'Calculate the average monthly cash outflow from the financial statements.',
    category: 'Financial',
    subcategory: 'Burn Rate & Runway',
    complexity: 'medium',
    recommended: ['excel'],
    instructions: `You are tasked with finding the current burn rate for the company. Remember: Any financial figure extracted must be accompanied by the currency as listed in the source. Follow these steps:

1. **First, Search for Burn Rate Data in Key Metrics Sections**: PRIORITIZE looking for burn rate data in the following sections (in order of priority):
   - **Key Metrics** or **KPI** sections/tabs
   - **Historical Metrics** sections/tabs
   - **Financial Dashboard** or **Executive Summary** sections
   - **Investor Updates** or **Board Presentations**
   
   Only if you cannot find burn rate data in these sections, then look in financial statements or cash flow reports. Ensure these documents are NOT forecasted figures. Discard forecasts.

2. **Identify Different Types of Burn Rate Figures**: Find the most recent figure for cash burn (i.e., the rate at which the company is spending its cash). Look for these specific terms:
   - **Monthly Burn Rate** (most common and preferred)
   - **Cash Burn**
   - **Net Cash Burn** (cash outflow minus cash inflow)
   - **Gross Burn** (total cash outflow before considering revenue)
   - **Operating Burn** (cash used in operations)
   - **Net Burn** (after accounting for revenue)
   
   Be aware of the differences between these metrics. Net burn accounts for revenue while gross burn doesn't. If multiple types are provided, prioritize Net Burn or Net Cash Burn as these give the most accurate picture of cash depletion.

3. **Check Time Periods for Burn Rate Data**: Burn rate data can be presented in different time frames:
   - **Monthly burn rate** (most common and preferred)
   - **Quarterly burn rate** (divide by 3 to get monthly)
   - **Annual burn rate** (divide by 12 to get monthly)
   - **Weekly burn rate** (multiply by 4.33 to get monthly)
   
   Always convert to monthly burn rate for consistency and clarity.

4. **Handle Time Series Burn Rate Data**: If the burn rate is given over a time series:
   - Report the **most recent monthly burn rate** as the primary figure
   - Calculate the **average burn rate** over the last 3-6 months as a secondary figure
   - Note any clear trend in burn rate (increasing, decreasing, stable)
   - If the most recent period is incomplete, use the last complete month
   
   Example calculation: If burn rates for the last 3 months are $1.2M, $1.4M, and $1.5M, state "The most recent monthly burn rate is $1.5M, with a 3-month average of $1.37M showing an increasing trend."

5. **If Burn Rate Is Not Explicitly Stated**: If you cannot find an explicit burn rate figure:
   - DO NOT attempt complex calculations from financial statements
   - Only calculate if you find clear monthly cash outflows and inflows
   - If calculating, use: Net Burn = Total Cash Outflows - Total Cash Inflows
   - If calculation is not possible, clearly state that the burn rate is not explicitly provided
   
   Be transparent about any calculations you perform and the data sources used.

6. **Provide a Structured Burn Rate Answer**: Format your response as:
   - Primary finding: "The current monthly burn rate is [amount] [currency] as of [date/period]."
   - Source information: "Found in [specific location in document]."
   - Additional context: Include average burn rate over time or trends if available
   - Calculation method: If you performed calculations, briefly explain how

7. **Verify Reliability**: Assess the quality of your burn rate finding:
   - Is it from an authoritative section of the document?
   - Is it clearly labeled as actual (not projected)?
   - Is it consistent with other financial indicators?
   - Is it recent enough to be considered current?

### Tips:
- Burn rate should reflect actual cash usage, not accounting expenses that don't affect cash
- Watch for one-time expenses that might distort the regular burn rate
- Higher burn rates relative to cash reserves indicate higher risk
- If burn rate varies significantly month-to-month, note this volatility
- Some companies present "normalized" or "adjusted" burn rates that exclude certain expenses; if both adjusted and unadjusted figures are available, report both`
  },
  {
    id: 'runway',
    question: 'How much runway does the company have?',
    description: 'Determine how many months of operations the company can fund with current cash reserves at the current burn rate.',
    category: 'Financial',
    subcategory: 'Burn Rate & Runway',
    complexity: 'medium',
    recommended: ['excel'],
    instructions: `You are tasked with calculating the company's runway at the current expense level. Remember: Any financial figure extracted must be accompanied by the currency as listed in the source. Follow these steps:

1. **First, Search for Pre-Calculated Runway**: PRIORITIZE looking for runway data that has already been calculated in the following sections (in order of priority):
   - **Key Metrics** or **KPI** sections/tabs
   - **Historical Metrics** sections/tabs
   - **Financial Dashboard** or **Executive Summary** sections
   - **Investor Updates** or **Board Presentations**
   - **Cash Planning** or **Financial Forecasting** sections
   
   Look for terms like "Runway," "Cash Runway," "Months of Operation," "Months Remaining," or "Cash Sufficiency." If you find a pre-calculated runway figure, verify it's current (not forecasted) and report it directly.

2. **Verify Pre-Calculated Runway Validity**: If you find pre-calculated runway, check:
   - When it was calculated (is it recent?)
   - What burn rate was used for the calculation
   - Whether it includes pending investments or only current cash
   - If it accounts for expected changes in burn rate
   
   If the pre-calculated runway seems out of date or based on assumptions that have changed, note this and proceed to calculate it yourself.

3. **If Pre-Calculated Runway Is Not Available**: If you need to calculate runway yourself, gather these two critical inputs:

   a) **For Cash Reserves/Cash on Hand**: Look in the following places (in order of priority):
      - **Key Metrics** or **KPI** sections (labeled as "Cash," "Cash on Hand," "Cash Balance")
      - **Balance Sheet** (look for "Cash and Cash Equivalents" or similar line items)
      - **Financial Summary** sections
      - **Treasury Reports** or cash management sections
      
      Ensure you find the most recent cash figure available. For cash reserves, verify:
      - The exact date of the cash balance
      - Whether it includes only liquid cash or also includes restricted cash/investments
      - Whether it's consolidated across all entities/subsidiaries
      - Currency denomination (especially for international companies)

   b) **For Burn Rate**: Use the same priority order as the burn rate question:
      - **Key Metrics** or **KPI** sections/tabs 
      - **Historical Metrics** sections/tabs
      - **Financial Dashboard** sections
      
      If you found the monthly burn rate earlier, use that figure for consistency. If not, follow the burn rate question guidance to find it.

4. **Calculate Runway With Different Scenarios**: Once you have both cash reserves and burn rate:
   - **Base Calculation**: Runway (months) = Cash Reserves ÷ Monthly Burn Rate
   - **Round to one decimal place** for precision
   
   If there are variations in recent burn rate, calculate both:
   - Runway based on the most recent burn rate
   - Runway based on the average burn rate over the last 3-6 months
   
   Example: "With $5M in cash and a current monthly burn of $500K, the runway is 10.0 months."

5. **Account for Special Factors**: Consider these factors that may affect runway:
   - **Committed additional funding** not yet received
   - **Seasonal variations** in burn rate
   - **Planned increase/decrease** in expenses
   - **Minimum cash reserves** the company needs to maintain
   
   If these factors are mentioned in the documents, calculate an adjusted runway and explain the adjustments.

6. **Assess Runway Adequacy**: Provide brief context on the runway's adequacy:
   - Industry benchmarks (e.g., 18-24 months is typically considered healthy)
   - Timing relative to next planned fundraising
   - Whether the runway extends beyond major milestones
   - Any risk factors that might affect the runway calculation

7. **Provide a Structured Runway Answer**: Format your response as:
   - Primary finding: "The company has approximately [X] months of runway as of [date]."
   - Calculation basis: "Based on cash reserves of [amount] [currency] and a monthly burn rate of [amount] [currency]."
   - Source information: "Cash reserves found in [location], burn rate found in [location]."
   - Context: Brief assessment of runway adequacy and any notable factors
   - Alternative scenarios: If relevant, mention how runway would change under different assumptions

### Tips:
- If the company is cash flow positive, state this instead of calculating runway
- Be careful with burn rates that show high variability - this makes runway calculations less reliable
- Watch for upcoming one-time expenses that could significantly impact runway
- If the company refers to different runway calculations in different places, report all of them and explain the differences
- When the runway is less than 6 months, this is typically considered a critical risk factor worth highlighting`
  },
  {
    id: 'business_model',
    question: 'What is the company\'s business model?',
    description: 'Summarize how the company generates revenue and its pricing structure.',
    category: 'Business',
    subcategory: 'Company Operations',
    complexity: 'low',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying and explaining the company's business model. Follow these steps:

1. **First, Search for Business Model Information in the Pitch Deck**: PRIORITIZE looking for dedicated slides or sections with titles such as:
   - "Business Model"
   - "Revenue Model" or "Revenue Streams"
   - "How We Make Money"
   - "Pricing"
   - "Go-to-Market Strategy"
   - "Monetization Strategy"
   - "Value Proposition" (often contains business model elements)
   
   These sections typically appear in the middle of pitch decks, after the problem and solution slides.

2. **If No Dedicated Business Model Section, Check These Areas**:
   - **Executive Summary**: Often summarizes the business model
   - **Company Overview**: May include business model basics
   - **Product or Solution slides**: May describe how offerings are monetized
   - **Financial Projections**: Revenue breakdowns often reveal business model
   - **Customer slides**: May discuss sales process and pricing
   - **Market slides**: May position the business model within the industry

3. **Identify Primary Revenue Generation Method**: Determine which fundamental business model the company uses:
   - **Subscription**: Recurring payments for ongoing access (SaaS, membership)
   - **Transactional**: One-time purchases of products or services
   - **Marketplace/Platform**: Connecting buyers and sellers, taking a fee or commission
   - **Freemium**: Free basic version with paid premium features
   - **Service-based**: Professional services charged by project or time
   - **Usage-based**: Pay per use or consumption (metered services)
   - **Advertising**: Free to users, monetized through advertising
   - **Data monetization**: Leveraging user data for revenue
   - **Licensing**: Intellectual property licensed to others
   - **Hybrid**: Combination of multiple models (identify the primary and secondary)

4. **Analyze Pricing Structure in Detail**: Look for specific information about:
   - **Pricing tiers**: Different feature levels at different price points
   - **Price points**: Actual amounts charged (crucial information)
   - **Pricing metrics**: What units determine price (users, usage, features)
   - **Billing frequency**: Monthly, annual, or other payment schedules
   - **Discounting strategy**: Volume discounts, annual prepayment discounts
   - **Upselling/cross-selling approach**: How additional revenue is generated from existing customers
   
   Extract specific pricing examples when available (e.g., "Basic tier at $10/user/month, Premium at $25/user/month").

5. **Identify Core Unit Economics**: Look for these crucial financial metrics:
   - **Average Contract Value (ACV)** or **Average Revenue Per User/Account (ARPU/ARPA)**
   - **Customer Acquisition Cost (CAC)**
   - **Lifetime Value (LTV)** or **Customer Lifetime Value (CLV)**
   - **Gross margins** on primary revenue streams
   - **Payback period** for customer acquisition costs
   
   These metrics validate the viability of the business model.

6. **Understand the Sales and Distribution Model**: Determine how the product/service reaches customers:
   - **Direct sales**: Inside sales, field sales, self-service
   - **Channel partners**: Resellers, distributors, affiliates
   - **Enterprise vs. SMB**: Different approaches for different segments
   - **Sales cycle length** and complexity
   - **Customer onboarding** process and cost

7. **Identify Target Customer Segments**: Determine which customers the business model is designed for:
   - **B2B**: Enterprise, mid-market, SMB
   - **B2C**: Mass market, premium, demographic-specific
   - **B2B2C**: Selling to businesses who serve consumers
   - **Industry verticals**: Specific industries targeted
   - **Geographic focus**: Regional, national, global
   
   The business model should align with these customer segments.

8. **Assess Business Model Maturity and Evolution**:
   - Is this a proven business model or experimental?
   - Has the business model changed recently or is it evolving?
   - Are there plans to expand into additional revenue streams?
   - How does the model compare to industry standards?

9. **Provide a Structured Business Model Answer**: Format your response as:
   - **Summary**: 1-2 sentence overview of the core business model
   - **Revenue Generation**: Primary and secondary revenue streams
   - **Pricing Structure**: Key pricing tiers/approaches with specific examples
   - **Target Customers**: Who they sell to and how this affects the model
   - **Sales Approach**: How they reach and convert customers
   - **Unit Economics**: Key metrics that validate the model (if available)
   - **Business Model Maturity**: Assessment of how established the model is

### Tips:
- Focus on how the company CURRENTLY makes money, not future plans (unless specifically relevant)
- Be specific about pricing when available, as this is crucial information
- Distinguish between current revenue streams and aspirational ones
- If the business is pre-revenue, clearly state this and describe the intended business model
- For marketplaces, explain both sides of the market and how the company monetizes the connection
- Note any unusual or innovative aspects of the business model that differentiate it from competitors`
  },
  {
    id: 'customers',
    question: 'Who are the company\'s key customers?',
    description: 'Identify major customers and customer segments.',
    category: 'Market',
    subcategory: 'Key Customers',
    complexity: 'low',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying the company's key customers and customer segments. Remember: Focus on actual current customers, not prospective or target customers. Follow these steps:

1. **First, Search for Customer Information in the Pitch Deck**: PRIORITIZE looking for dedicated slides in the PDF with titles such as:
   - "Customers"
   - "Key Clients"
   - "Traction"
   - "Case Studies"
   - "Customer Logos"
   - "Success Stories"
   
   Pay special attention to slides with company logos, as these typically represent actual customers.

2. **If No Dedicated Customer Slides, Check These Areas in the PDF**:
   - **Market slides**: Often mention key customers as examples
   - **Business model slides**: May describe customer types
   - **Testimonial sections**: Typically feature actual customers
   - **Revenue or financial slides**: May break down revenue by customer type

3. **For Excel Customer Lists**:
   - If you find a customer list in Excel, verify that these are actual customers, not leads, prospects, or debtors
   - Look for headers like "Current Customers," "Active Accounts," or "Client List"
   - Avoid lists labeled as "Pipeline," "Prospects," "Leads," or "Targets"
   - If the list is very long (more than 10 customers), report only the top 5 customers by revenue or other strategic importance if indicated

4. **Distinguish Between Customer Types**:
   - **Enterprise/Key Accounts**: Major companies or organizations that are typically named
   - **Mid-market customers**: Medium-sized businesses that may be named or grouped
   - **SMB/Long-tail**: Smaller customers that are usually reported as an aggregate number
   - **Channel partners**: Resellers or distributors (note that these are not end customers)

5. **Verify Customer Status**:
   - Look for language that confirms these are paying customers: "current clients," "active users," etc.
   - Be cautious about logos or names presented without explicit confirmation of customer status
   - Distinguish between paid pilots/trials and fully onboarded customers if that information is available

6. **Identify Customer Segments**: Determine how the company categorizes its customer base:
   - **By industry/vertical**: (e.g., healthcare, finance, education)
   - **By company size**: (enterprise, mid-market, SMB)
   - **By geography**: (regional, national, global markets)
   - **By user role**: (e.g., marketers, developers, HR professionals)
   - **By use case**: How different customers use the product

7. **Look for Customer Metrics**:
   - Total number of customers
   - Customer concentration (percentage of revenue from top customers)
   - Average contract value or customer size
   - Customer growth rates
   - Customer retention/churn metrics
   - Notable customer case studies

8. **Provide a Structured Answer**:
   - Begin with a brief summary of the overall customer base (e.g., "The company serves 500+ enterprise customers across healthcare and finance sectors")
   - List the most important named customers (limit to 5-7 of the most recognizable or strategic)
   - Describe the main customer segments and their relative importance
   - Include relevant metrics about the customer base
   - Mention any notable customer case studies or success stories

9. **Verify Sources**: Clearly state where you found the customer information (e.g., "Customer logos found on slide 7 of the pitch deck titled 'Our Customers'" or "Customer list extracted from Excel file 'CurrentClients.xlsx'").

### Tips:
- Prioritize confirmed, paying customers over prospects or pilots
- If logos are shown without explicit confirmation they are customers, note this uncertainty
- For B2B companies, focus more on named enterprise customers and industry penetration
- For B2C companies, focus more on user demographics and total user numbers
- If customer information seems outdated, note this and prioritize the most recent data
- Be cautious about customer testimonials that don't clearly identify the company or speaker`
  },
  {
    id: 'competition',
    question: 'Who are the main competitors?',
    description: 'List direct and indirect competitors and their market positions.',
    category: 'Market',
    subcategory: 'Competitors',
    complexity: 'medium',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying the company's main competitors and their market positions. Follow these steps:

1. **First, Search for Competitor Information in the Pitch Deck**: PRIORITIZE looking for dedicated slides or sections with titles such as:
   - "Competition" or "Competitive Landscape"
   - "Market Map"
   - "Competitive Analysis" 
   - "Competitive Matrix" or "Quadrant"
   - "Competitive Positioning"
   - "Market Players"
   
   These sections typically appear after the product and before the business model sections in pitch decks.

2. **If No Dedicated Competition Section, Check These Areas**:
   - **Market slides**: Often include competitor mentions or market share breakdowns
   - **SWOT Analysis**: "Threats" section typically includes key competitors
   - **Differentiation slides**: Usually compare against specific competitors
   - **Industry Overview**: May map major players in the space
   - **Product Comparison**: May benchmark features against competitors

3. **Distinguish Between Different Types of Competitors**:
   - **Direct competitors**: Companies offering similar products/services targeting the same customer segments
     - Look for phrases like "direct competition," "head-to-head competitors," or "primary competitors"
   - **Indirect competitors**: Companies solving the same customer problems with different approaches
     - Look for phrases like "alternative solutions," "substitutes," or "indirect competition"
   - **Potential/emerging competitors**: New entrants or companies that could enter the space
     - Look for phrases like "emerging threats," "new entrants," or "potential competition"

4. **Identify Specific Named Competitors**: Create separate lists of:
   - **Primary direct competitors**: The main companies mentioned most frequently
   - **Secondary direct competitors**: Other direct competitors mentioned less prominently
   - **Key indirect competitors**: Major alternative solution providers
   - **Emerging threats**: New or growing companies identified as future competition

5. **Analyze Competitive Positioning Information**: Pay special attention to:
   - **Competitive matrices/quadrants**: Note the axes used and where competitors are placed
   - **Feature comparison tables**: Identify where competitors are stronger or weaker
   - **Market share data**: Note relative size and growth of competitors
   - **Competitor strengths/weaknesses**: How the company characterizes its competition

6. **Look for Industry-Specific Context**:
   - **Industry consolidation trends**: Is the market consolidating or fragmenting?
   - **Market leader dynamics**: How established are the leaders? Is leadership changing?
   - **Barriers to entry**: What keeps new competitors out?
   - **Competitive intensity**: Is the market highly competitive or relatively open?

7. **Provide a Structured Competitive Analysis**:
   - **Summary**: 1-2 sentence overview of the competitive landscape
   - **Direct Competitors**: List primary competitors with brief descriptions of each
   - **Indirect Competitors**: List important indirect competitors and how they differ
   - **Competitive Positioning**: Describe how the company positions itself relative to competitors
   - **Market Leaders**: Identify which companies lead the market and why
   - **Emerging Threats**: Note any new entrants or potential future competitors

### Tips:
- If a competitive matrix or quadrant is provided, describe how competitors are positioned along the key dimensions
- Include competitor size, funding, or market share information when available
- If the company focuses only on smaller competitors while ignoring industry leaders, note this as a potential concern
- Pay attention to when the competitive analysis was last updated, as competitive landscapes change quickly`
  },
  {
    id: 'differentiation',
    question: 'What is the company\'s key differentiation?',
    description: 'Identify unique selling propositions and competitive advantages.',
    category: 'Business',
    subcategory: 'Competitive Advantages',
    complexity: 'medium',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying the company's key differentiation and unique selling propositions. Follow these steps:

1. **First, Search for Differentiation Information in the Pitch Deck**: PRIORITIZE looking for dedicated slides or sections with titles such as:
   - "Differentiation" or "Differentiators"
   - "Unique Selling Proposition" or "USP"
   - "Why [Company Name]" or "Why Us"
   - "Competitive Advantage"
   - "Our Difference" or "What Makes Us Different"
   - "Value Proposition" (often contains differentiation points)
   
   These sections typically appear near the product, competition, or business model sections.

2. **If No Dedicated Differentiation Section, Check These Areas**:
   - **Product slides**: Often highlight unique features or capabilities
   - **Competition slides**: Usually emphasize points of differentiation
   - **Technology slides**: May describe proprietary technology or IP
   - **Executive Summary**: Often includes key differentiators
   - **Business Model slides**: May describe unique approaches to the market

3. **Categorize Types of Differentiation**: Organize differentiating points into categories such as:
   - **Product differentiation**: Unique features, capabilities, or technology
   - **Market differentiation**: Unique positioning or target audience
   - **Process differentiation**: Unique approach or methodology
   - **Business model differentiation**: Unique pricing or delivery model
   - **Team differentiation**: Unique expertise or experience

4. **Evaluate the Strength of Each Differentiator**: Assess each claimed differentiator by:
   - **Uniqueness**: Is it truly unique or common among competitors?
   - **Sustainability**: Can it be easily copied or is it defensible?
   - **Relevance**: Does it solve an important customer problem?
   - **Evidence**: Is there proof/validation of the differentiation?

5. **Look for Supporting Evidence**: Strong differentiation claims are supported by:
   - **Quantifiable metrics**: Performance benchmarks, efficiency gains, cost savings
   - **Technical details**: Specific explanation of how the technology is different
   - **Customer testimonials**: Customers explicitly mentioning the differentiation
   - **Case studies**: Real-world examples showing the differentiation in action
   - **Patents or IP**: Protection of the unique technology or approach

6. **Identify Barriers to Replication**: Look for factors that make the differentiation difficult to copy:
   - **Patents and IP**: Legal protection of innovations
   - **Proprietary technology**: Difficult-to-replicate technical advantages
   - **Network effects**: Value increases as more users join the platform
   - **Data advantages**: Unique datasets or data-driven insights
   - **Exclusive partnerships**: Unique relationships with key partners

7. **Provide a Structured Differentiation Analysis**:
   - **Summary**: 1-2 sentence overview of the primary differentiation
   - **Key Differentiators**: List 3-5 main points of differentiation in order of importance
   - **Supporting Evidence**: Present the strongest evidence that validates these claims
   - **Competitive Context**: Explain how these differentiators compare to competitors
   - **Defensibility**: Assess how sustainable the differentiation is over time

### Tips:
- Distinguish between true differentiation and table stakes features that all competitors offer
- Be skeptical of vague claims like "better quality" or "easier to use" without specific evidence
- Pay attention to whether the differentiation focuses on features (what the product does) or benefits (why customers care)
- Note if the company emphasizes different differentiators to different customer segments
- Consider whether the differentiation creates enough value to justify a price premium or preference over competitors`
  },
  {
    id: 'team',
    question: 'Who are the key members of the management team and what are their backgrounds?',
    description: 'Identify key executives and their relevant experience.',
    category: 'Team',
    subcategory: 'Key Management Team',
    complexity: 'low',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying the key members of the management team and their backgrounds. Remember: Any personnel information extracted must include their titles and roles as listed in the source documents. Follow these steps:

1. **Search for Team Information in Pitch Deck**: PRIORITIZE looking for a dedicated "Team" page or section in the company's pitch deck. This is the most likely place to find comprehensive information about key team members. The page/section is typically titled:
   - "Team"
   - "Management Team"
   - "Leadership"
   - "Our Team"
   - "Executive Team"

2. **If Not Found in Pitch Deck, Check Other Sources**: If a dedicated team section isn't in the pitch deck, look in:
   - Company website screenshots
   - About Us sections
   - Executive bios
   - Organizational charts
   - Investor presentations
   - Press releases mentioning leadership changes

3. **Identify Key Management Team Members**: Focus on C-suite executives and other senior leadership, particularly:
   - CEO (Chief Executive Officer)
   - CFO (Chief Financial Officer)
   - CTO (Chief Technology Officer)
   - COO (Chief Operating Officer)
   - Other executives with "Chief," "Head of," "VP," or "Director" in their titles

4. **Extract Background Information**: For each key team member, identify:
   - **Name and title/role**
   - **Professional background**: Previous companies, positions, and relevant industry experience
   - **Years of experience** (if mentioned)
   - **Educational background** (if mentioned)
   - **Notable achievements** or expertise areas

5. **Handle Incomplete Information**: If background information is limited for some team members:
   - Focus on what is available rather than speculating
   - Note which team members have limited information
   - Prioritize reporting on the most senior executives

6. **Provide a Clear, Structured Answer**: Present the management team information in this format:
   
   **[Name]**: [Title/Role]
   - Background: [Previous roles/companies]
   - Experience: [Years/Industry expertise]
   - Education: [Degrees/Institutions] (if available)
   
   For example:
   
   **Jane Smith**: CEO
   - Background: Former VP of Product at Salesforce, Co-founder of TechStart
   - Experience: 15+ years in enterprise software
   - Education: MBA from Stanford, BS in Computer Science from MIT

7. **Verify Source**: Clearly state where you found the information (e.g., "Found on slide 12 of the pitch deck titled 'Our Team'").

### Tips:
- Focus on factual information about team members rather than promotional language about their qualities
- If team members have extensive backgrounds, prioritize the most relevant experience for the company's industry
- Include founding team members even if they no longer have operational roles, but clearly identify their current status
- If there's conflicting information, prioritize the most recent source.`
  },
  {
    id: 'risks',
    question: 'What are the key risks to consider?',
    description: 'Identify business, market, financial, and regulatory risks.',
    category: 'Risk',
    subcategory: 'Competitive Risks',
    complexity: 'high',
    recommended: ['pdf', 'excel'],
    instructions: `You are tasked with identifying the key risks associated with the company that investors should consider. Remember: Focus on material risks that could significantly impact the business. Follow these steps:

1. **First, Search for Explicit Risk Sections**: PRIORITIZE looking for dedicated sections in the pitch deck with titles such as:
   - "Risks" or "Risk Factors"
   - "Challenges"
   - "SWOT Analysis" (focus on Weaknesses and Threats)
   - "Concerns" or "Considerations"
   - "Disclaimers" or "Cautionary Notes"

2. **If No Explicit Risk Section, Extract from These Areas**:
   - **Financial documents**: Look for cash runway concerns, customer concentration, burn rate issues
   - **Market analysis slides**: Identify competitive threats, market saturation, adoption barriers
   - **Business model sections**: Find scaling challenges, revenue uncertainties, margin pressures
   - **Team slides**: Note key person dependencies, hiring challenges, experience gaps
   - **Regulatory mentions**: Identify compliance requirements, pending legislation, industry regulation

3. **Categorize Risks by Type and Severity**:
   - **Market risks**: Competition, market saturation, changing customer preferences
   - **Financial risks**: Cash runway, burn rate, funding requirements, revenue concentration
   - **Operational risks**: Supply chain, scaling challenges, technical debt
   - **Regulatory risks**: Compliance issues, pending legislation, industry regulation
   - **Team risks**: Key person dependencies, hiring challenges, organizational structure
   - **Product risks**: Technical feasibility, development timelines, product-market fit
   
   For each risk identified, assess its potential impact (low, medium, high) based on:
   - How prominently it's featured in the materials
   - Quantitative indicators of severity (if available)
   - Whether the company itself emphasizes the risk

4. **Look for Quantitative Risk Indicators**: Pay special attention to metrics that suggest potential risks:
   - High customer concentration (e.g., >20% revenue from one customer)
   - Short runway (<12 months)
   - Declining growth rates or margins
   - High churn rates
   - Low gross margins (<40% for SaaS)
   - Unclear path to profitability

5. **Identify Implicit Risks Not Explicitly Stated**:
   - What important information is missing from the materials?
   - Are there industry-standard risks not addressed?
   - Are there discrepancies or inconsistencies in the data?
   - What assumptions is the company making that might be optimistic?

6. **Note Mitigation Strategies**: For each major risk, identify if and how the company plans to address it:
   - Strategies already being implemented
   - Planned future mitigations
   - Whether the mitigation approach seems reasonable and sufficient

7. **Prioritize Risks for Investors**: In your final analysis, prioritize risks based on:
   - Likelihood of occurrence
   - Potential impact on the business
   - Timeline (immediate vs. long-term risks)
   - Whether they are existential threats or manageable challenges

8. **Provide a Structured Answer**: Present the risks in a clear format:
   - Begin with a 1-2 sentence executive summary of the most critical risks
   - List the top 3-5 risks in order of importance, with brief explanations
   - Group remaining risks by category
   - For each significant risk, include: (1) Description, (2) Potential impact, (3) Mitigation (if any)

9. **Verify Sources**: Clearly state where you found each risk (e.g., "Identified on slide 15 of the pitch deck" or "Derived from financial data showing high customer concentration").

### Tips:
- If risks conflict across documents, prioritize the most recent or most detailed source
- If the company downplays risks that appear significant based on the data, note this discrepancy
- For early-stage companies, focus more on market validation, funding, and execution risks
- For later-stage companies, focus more on scaling challenges, competitive threats, and path to profitability
- If multiple risks are interconnected, explain these relationships
- If confronted with a choice between being comprehensive or focused, prioritize the most material risks that investors would consider deal-breakers`
  },
  {
    id: 'funding_history',
    question: 'What is the company\'s funding history?',
    description: 'List previous funding rounds, investors, and amounts raised.',
    category: 'Financial',
    subcategory: 'Cap Table',
    complexity: 'low',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying the company's funding history. Follow these steps:

1. **First, Search for Funding Information in the Pitch Deck**: PRIORITIZE looking for dedicated slides or sections with titles such as:
   - "Funding History" or "Financing History"
   - "Capital Structure" or "Capitalization"
   - "Investment History"
   - "Previous Rounds"
   - "Cap Table" (may contain funding information)
   - "Company Timeline" (often includes funding events)
   
   These sections typically appear near the end of pitch decks, often after the team section.

2. **If No Dedicated Funding Section, Check These Areas**:
   - **Company Overview**: May mention key funding milestones
   - **Executive Summary**: Often includes total funding raised
   - **Team slides**: Sometimes mention funding in founder/executive bios
   - **Financial slides**: May reference previous capital injections
   - **Investor slides**: May list current investors from previous rounds

3. **For Each Funding Round, Extract These Key Details**:
   - **Round name/type**: Precise designation (e.g., Seed, Series A, Series B, Convertible Note)
   - **Date**: When the round closed (month and year at minimum)
   - **Amount raised**: The total funding amount with currency
   - **Valuation**: Pre-money and/or post-money valuation (if mentioned)
   - **Lead investor(s)**: The primary investor(s) who led the round
   - **Other key investors**: Additional notable participants
   - **Round purpose**: Stated use of funds (if mentioned)

4. **Identify Special Funding Types**:
   - **Convertible notes/SAFEs**: Note conversion terms if available
   - **Debt financing**: Distinguish from equity rounds
   - **Grants/non-dilutive funding**: Separate from investment capital
   - **Strategic investments**: Note if from industry partners
   - **Secondary transactions**: Distinguish from primary capital raising

5. **Compile a Complete Funding Timeline**:
   - Organize all rounds chronologically from earliest to most recent
   - Calculate the total funding raised across all rounds
   - Note any unusually long or short periods between rounds
   - Identify trends in round sizes (increasing, decreasing, steady)

6. **Analyze Investor Information**:
   - Categorize investors by type (VC firms, angel investors, corporate, etc.)
   - Note any particularly prominent or strategic investors
   - Identify investors who participated in multiple rounds (showing continued confidence)
   - Look for investor specialization patterns (industry focus, stage focus)

7. **Provide a Structured Funding History**:
   - **Summary**: Brief overview of total funding and current stage
   - **Detailed Round Information**: Chronological list of rounds with all available details
   - **Key Investors**: Highlight the most notable or strategic investors
   - **Funding Context**: Compare to typical funding patterns for similar companies
   - **Recent Developments**: Note any pending or recently closed rounds

### Tips:
- If exact dates aren't provided, include whatever time information is available (year, quarter, etc.)
- If funding amounts are given in different currencies, convert to a single currency for consistency
- Watch for inconsistencies in funding amounts across different slides/documents
- For early-stage companies, angel investments or friends/family rounds may not be formally documented
- Note if the company has unusual funding patterns (e.g., very rapid fundraising, long gaps between rounds)
- If acquisition history is mentioned, include the approximate values if available`
  },
  {
    id: 'problem',
    question: 'What problem is this company trying to solve?',
    description: 'Identify the core customer problem the company addresses.',
    category: 'Business',
    subcategory: 'Company Operations',
    complexity: 'low',
    recommended: ['pdf'],
    instructions: `You are tasked with identifying the core problem that the company is trying to solve. Remember: Focus on the actual customer problem, not just the company's solution. Follow these steps:

1. **First, Search for Explicit Problem Statements**: PRIORITIZE looking for dedicated slides or sections in the pitch deck with titles such as:
   - "Problem"
   - "Challenge"
   - "Pain Point"
   - "Market Need"
   - "Why Now"
   - "Current Situation"

2. **If No Explicit Problem Section, Examine These Areas**:
   - **Introduction/Overview slides**: Often contain problem statements to set context
   - **Market slides**: May discuss market gaps or inefficiencies
   - **Value Proposition slides**: Usually frame the value in terms of problems solved
   - **Customer slides**: May describe customer pain points
   - **Product slides**: Often begin by stating the problem the product addresses

3. **Look for These Problem Indicators**:
   - Statements beginning with phrases like "Currently..." or "Today..."
   - Descriptions of inefficiencies, frustrations, or pain points
   - Statistics showing negative impacts or costs of status quo
   - Diagrams showing broken or inefficient processes
   - Customer quotes describing challenges

4. **Synthesize a Holistic Problem Statement**: If the problem is presented across multiple slides rather than explicitly stated, synthesize by identifying:
   - **Who** is experiencing the problem (target customers)
   - **What** specific pain points or inefficiencies they face
   - **Why** existing solutions are inadequate
   - **How** significant the problem is (scope, scale, urgency)

5. **Differentiate Between Problem and Solution**: Ensure you're focusing on the underlying problem, not just describing the company's solution. The problem should exist regardless of the company's proposed solution.

6. **Provide a Clear, Concise Answer**: Present the problem statement in a structured format:
   - Start with a 1-2 sentence summary of the core problem
   - Follow with supporting details about who experiences it, why it matters, and any quantification of its impact
   - Include relevant context about why existing solutions are inadequate (if mentioned)

7. **Verify Source**: Clearly state where you found the problem information (e.g., "Found on slide 4 of the pitch deck titled 'The Problem'" or "Synthesized from market and customer slides throughout the pitch deck").

### Tips:
- The most compelling problem statements are specific, not generic industry challenges
- Look for quantification of the problem (e.g., "Costs businesses $X billion annually")
- Problems described in customer testimonials are often the most authentic representation
- The introduction and conclusion of pitch decks often restate the core problem
- If multiple problems are mentioned, prioritize those that appear most frequently or are given the most emphasis`
  }
];

/**
 * Helper function to get the document priority for a specific question
 * @param question The question object
 * @returns The document priority mapping for the question, or a default if not found
 */
export function getDocumentPriorityForQuestion(question: InvestmentMemoQuestion): DocumentPriority {
   if (question.subcategory) {
      return QUESTION_DOCUMENT_MAPPING_BY_SUBCATEGORY[question.subcategory] || { primary: 'both', secondary: 'both' };
   } else if (question.category) {
      return QUESTION_DOCUMENT_MAPPING_BY_CATEGORY[question.category] || { primary: 'both', secondary: 'both' };
   } else {
      return { primary: 'both', secondary: 'both' };
   } 
}

/**
 * Helper function to get a question by ID
 * @param questionId The ID of the question to find
 * @returns The question object or undefined if not found
 */
export function getQuestionById(questionId: string): InvestmentMemoQuestion | undefined {
  return INVESTMENT_MEMO_QUESTIONS.find(q => q.id === questionId);
} 