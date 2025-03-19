import { InvestmentMemoQuestion } from "../types";
import { getTemplateForCategory } from "./promptTemplates";

/**
 * Generates custom instructions for a custom question using OpenAI
 * 
 * @param question The custom question object
 * @returns A string containing the generated instructions
 */
export async function generateCustomInstructions(question: InvestmentMemoQuestion): Promise<string> {

  const categoryTemplate = getTemplateForCategory(question.category); //At this moment this is not being used.
  
  //--GENERIC INSTRUCTIONS BASED ON CATEGORY	--
  //${categoryTemplate}
  //You might find this guidance useful to generate the instructions to answer the question.	
  
  const taskOrPrompt = `Generate detailed instructions to answer this investment question: "${question.
    question}" in the context of ${question.category} category. 
    
    The instructions should guide the analysis of the available document information in detail, providing what to search for, where this information might be found, alternative scenarios, how to handle information from multiple documents, and how to answer the question based on the information found. Always instruct to answer "No information found" if you cannot find the information in the documents. NEVER make up information.
    
    Here are 2 examples of great promts, <example 1> and <example 2>. Use these examples as base to build your prompt.
  
    <example 1>
    Question: What is the current Annual Recurring Revenue (ARR) of the company?
    Prompt:  
      "You are tasked with finding the company's current Annual Recurring Revenue (ARR). Remember: Any 
      financial figure extracted must be accompanied by the currency as listed in the source. Follow 
      these steps:
  
      1. **First, Search for ARR Data in Key Metrics Sections**: PRIORITIZE looking for ARR data in the 
      following sections (in order of priority):
      - **Key Metrics** or **KPI** sections/tabs
      - **Financial Dashboard** sections/tabs
      - **Revenue** or **ARR** specific tabs
      - **Executive Summary** sections
      
      Only if you cannot find ARR data in these sections, then look in general financial statements or 
      reports. Ensure these documents are NOT forecasted figures. Discard forecasts.
  
      2. **Check for Direct ARR Information**: If the document directly lists ARR, extract that number. 
      ARR is typically presented as:
      - A specific line item labeled "ARR" or "Annual Recurring Revenue"
      - A headline figure in KPI dashboards
      - A graph or chart showing ARR trends (extract the most recent value)
      - A value labeled as "Run Rate" (sometimes used interchangeably with ARR)
  
      3. **If ARR Is Not Explicitly Listed**: If you cannot find ARR directly, look for these 
      alternatives (in order of reliability):
      - **Monthly Recurring Revenue (MRR)**: Calculate ARR by multiplying MRR by 12 (ARR = MRR × 12)
      - **Quarterly Recurring Revenue**: Multiply by 4 to get ARR
      - **Subscription Revenue**: Verify if this represents all recurring revenue before using
      
      Ensure you verify that any figure used for calculation is truly recurring revenue (not one-time 
      payments or total revenue).
  
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
  
      6. **Provide the Current ARR**: Once you've found or calculated the ARR, provide the exact value 
      with the appropriate currency (e.g., USD, EUR, AUD). Format your answer as: "The current ARR is 
      [amount] [currency] as of [date/period if specified]."
  
      ### Tips:
      - ARR should only include recurring revenue components, not one-time sales or professional services
      - Be wary of forecast slides or tabs labeled as "Projections" or "Targets"
      - If you find significantly different ARR figures, explain the discrepancy and report both with 
      their sources
      - If only a graph is available without exact figures, estimate the value and clearly state it's an 
      approximation
      - If you need to perform a calculation to derive ARR, show your work clearly"
      </example 1>
  
      <example 2>
      Question: What problem is this company trying to solve?
      Prompt:
          "Using ONLY information contained in the provided documents, follow the steps to answer the 
          question: What problem is this company trying to solve? Take time to understand the question 
          and think step by step. Remember: Any product-related information extracted must be accompanied 
          by the source as listed in the documents.
  
          # Steps
  
          1. **Search for Value Proposition and Consumer Needs Statements**: Look for documents that 
          describe the company's value proposition or problems/needs customers face which they aim to 
          address, including pitch decks, strategy decks, product sheets, marketing materials, press 
          releases, or any other documents that provide insight into the company's mission and the issues 
          its products are designed to solve.
  
          2. **Identify the Problem the Company is Trying to Solve**: Identify which problem the company 
          is proposing to solve for its customers. Look for statements that outline how the products 
          improve customer situations, solve pain points, or create value for users.
  
          3. **Cross-Check with Customer Testimonials/Case Studies**: If available, examine customer 
          testimonials or case studies that mention how the products have helped solve real-world 
          problems for users. This could provide concrete examples of the problems being addressed. 
  
          4. **Consolidate Information**: If there are multiple problems the company is trying to 
          address, consolidate the information, ensuring there is no conflicting or redundant statements. 
          Prioritize the most recent and detailed sources.
  
          5. **Provide the Answer**: Once the problems the company proposes to address have been clearly 
          identified, list the specific problem(s) the company is trying to solve. Keep your answer short 
          and concise. Include any additional information gathered that helps clarify the company’s 
          approach or strategy.
  
          6. **Verify Source**: Ensure you reference the correct source for your information, especially 
          if the problem-solving capabilities of the products are described in specific sections or pages 
          of the documents.
  
          Generate your answer 3 times and compare for consistency and accuracy. If discrepancies arise, refine your synthesis and provide a final answer with the most precise and consistent data."
      </example 2>
    `;

  try {
    const response = await fetch('/api/generate-instructions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskOrPrompt }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate instructions');
    }

    const data = await response.json();
    return data.instructions;
  } catch (error) {
    console.error('Error generating custom instructions:', error);
    // Fallback to basic instructions if API call fails
    return `Please analyze this question: "${question.question}" in the context of ${question.category} 
    category.`;
  }
} 