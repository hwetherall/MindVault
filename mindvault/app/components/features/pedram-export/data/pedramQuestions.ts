import { InvestmentMemoQuestion } from "../../investment-memo/types";

export interface PedramQuestion extends Omit<InvestmentMemoQuestion, 'id'> {
  question: string;
  model: string;
  instructionType: 'custom' | 'predefined';
  instructions?: string;
  category: string;
  description: string;
}

export const PEDRAM_QUESTIONS: PedramQuestion[] = [
  // Venture Basics
  {
    question: "What is the full legal name of the venture?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify the complete legal name of the company as it appears in official documents.",
    category: "Venture Basics",
    description: "Identify the legal entity name of the company"
  },
  {
    question: "When was the company founded?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Locate the specific founding date of the company, including month and year if available.",
    category: "Venture Basics",
    description: "Establish the founding date to understand company maturity"
  },
  {
    question: "What is the company's mission statement?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Extract the official mission statement that describes the company's purpose and vision.",
    category: "Venture Basics",
    description: "Understand the core purpose and vision of the company"
  },
  {
    question: "What is the current development stage of the venture?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Determine the company's current stage (ideation, MVP, product-market fit, scaling, etc.).",
    category: "Venture Basics",
    description: "Determine where the company sits in its lifecycle (idea, prototype, MVP, scaling, etc.)"
  },
  
  // Leadership
  {
    question: "Who is the executive lead/CEO of the venture?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify the current CEO or primary executive leader of the company.",
    category: "Leadership",
    description: "Identify the primary decision maker and leader of the venture"
  },
  {
    question: "Who are the founders and what is their relevant experience?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "List all founders and detail their background, expertise, and industry experience.",
    category: "Leadership",
    description: "Evaluate the founders' background, expertise, and track record in relevant industries"
  },
  {
    question: "What is the current team composition and key roles?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Outline the organizational structure, key team members, and their responsibilities.",
    category: "Leadership",
    description: "Understand the organizational structure and identify skill gaps"
  },
  
  // Market & Opportunity
  {
    question: "What specific problem is the venture trying to solve?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Clearly articulate the pain point or market gap the company is addressing.",
    category: "Market Opportunity",
    description: "Clarify the pain point or market gap being addressed"
  },
  {
    question: "What is the total addressable market (TAM) size?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Find the specific TAM size in revenue terms and how it was calculated.",
    category: "Market",
    description: "Quantify the maximum market opportunity in revenue terms"
  },
  {
    question: "What is the serviceable addressable market (SAM) size?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify the portion of TAM that the company's business model can realistically target.",
    category: "Market",
    description: "Identify the portion of TAM that the business model can realistically target"
  },
  {
    question: "What is the serviceable obtainable market (SOM) size?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Calculate the realistic market share the company can capture in the near term.",
    category: "Market",
    description: "Estimate the realistic portion of the market the venture can capture"
  },
  {
    question: "Who are the primary target customers/users?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Define specific customer segments the venture is targeting, with demographic details.",
    category: "Market",
    description: "Define the specific customer segments the venture is targeting"
  },
  {
    question: "What are the key pain points for each target customer segment?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify specific problems faced by each customer group that the product addresses.",
    category: "Market Opportunity",
    description: "Detail the specific problems faced by each customer group"
  },
  {
    question: "What are the market growth trends in the target industry?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Provide data on industry growth rates, trends, and future projections.",
    category: "Market",
    description: "Analyze industry growth trends and future projections"
  },
  {
    question: "What market validation studies or research support the business case?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify third-party research or studies that validate the market need and opportunity.",
    category: "Market",
    description: "Identify third-party research or studies that validate market need and opportunity"
  },
  
  // Product
  {
    question: "What is the venture's primary solution or product offering?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Describe the core product or service and how it addresses the identified problem.",
    category: "Product",
    description: "Define the core product or service and how it addresses the identified problem"
  },
  {
    question: "What is the venture's unique value proposition?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Articulate the unique benefits that differentiate the offering from competitors.",
    category: "Product",
    description: "Articulate the unique benefits that differentiate the offering from competitors"
  },
  {
    question: "What customer feedback mechanisms are in place?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Outline the systems for gathering and incorporating user feedback into product development.",
    category: "Product",
    description: "Outline systems for gathering and incorporating user feedback"
  },
  
  // Competition
  {
    question: "Who are the direct competitors in this space?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "List companies offering similar solutions to the same customer segments.",
    category: "Competition",
    description: "Identify companies offering similar solutions to the same customer segments"
  },
  {
    question: "Who are the indirect competitors in this space?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify alternative solutions or workarounds that customers currently use.",
    category: "Competition",
    description: "Identify alternative solutions or workarounds that customers currently use"
  },
  {
    question: "What is the competitive advantage or moat?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify sustainable differentiators that protect the business against competition.",
    category: "Competition",
    description: "Identify sustainable differentiators that protect against competition"
  },
  {
    question: "What are the barriers to entry for new competitors?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Analyze factors that make it difficult for new entrants to compete effectively in this market.",
    category: "Competition",
    description: "Analyze factors that make it difficult for new entrants to compete effectively"
  },
  {
    question: "What are the sustainable competitive advantages in the long term?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Analyze lasting advantages that will persist as the market matures.",
    category: "Competition",
    description: "Analyze lasting advantages that will persist as the market matures"
  },
  
  // Business Model
  {
    question: "What is the pricing model and revenue structure?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Detail how the company charges customers and generates revenue.",
    category: "Business Model",
    description: "Detail how the company charges customers and generates revenue"
  },
  {
    question: "What are the key revenue streams?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify all sources of revenue for the business with percentage breakdown if available.",
    category: "Business Model",
    description: "Identify all sources of revenue for the business"
  },
  
  // Financials
  {
    question: "What are the gross margins for each revenue stream?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Calculate the profitability of each revenue source after direct costs.",
    category: "Financials",
    description: "Calculate the profitability of each revenue source after direct costs"
  },
  {
    question: "What are the current customer acquisition costs (CAC)?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Determine the average cost to acquire a new customer across all channels.",
    category: "Financials",
    description: "Determine the cost to acquire a new customer"
  },
  {
    question: "What is the estimated lifetime value (LTV) of a customer?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Calculate the total revenue expected from an average customer relationship.",
    category: "Financials",
    description: "Calculate the total revenue expected from an average customer relationship"
  },
  {
    question: "What is the LTV to CAC ratio?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Calculate the ratio between customer lifetime value and acquisition cost.",
    category: "Financials",
    description: "Assess the efficiency of the business model via the LTV/CAC ratio"
  },
  {
    question: "What is the current monthly burn rate?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify the rate at which the company is spending capital each month.",
    category: "Financials",
    description: "Identify the rate at which the company is spending capital"
  },
  {
    question: "What is the current runway with existing funds?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Calculate how many months the company can operate with current capital.",
    category: "Financials",
    description: "Calculate how long the company can operate with current capital"
  },
  {
    question: "What is the current cap table structure?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Outline the ownership structure and previous investment rounds.",
    category: "Financials",
    description: "Outline the ownership structure and previous investment rounds"
  },
  {
    question: "What is the total funding raised to date?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Sum all investment capital previously secured with details of each round.",
    category: "Financials",
    description: "Sum all investment capital previously secured"
  },
  {
    question: "Who are the current investors?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "List existing investors and their level of involvement in the company.",
    category: "Financials",
    description: "List existing investors and their level of involvement"
  },
  {
    question: "What is the expected timeline to reach profitability?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Project when the company will achieve positive cash flow.",
    category: "Financials",
    description: "Project when the company will achieve positive cash flow"
  },
  {
    question: "What are the 3-5 year financial projections?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Summarize revenue, expenses, and profitability forecasts over the medium term.",
    category: "Financials",
    description: "Forecast revenue, expenses, and profitability over the medium term"
  },
  {
    question: "What are the key assumptions in the financial projections?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify critical variables that drive the financial model and forecast.",
    category: "Financials",
    description: "Identify critical variables that drive the financial model"
  },
  {
    question: "What is the unit economics breakdown?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Detail the costs and revenue associated with a single unit of the product/service.",
    category: "Financials",
    description: "Detail the costs and revenue associated with a single unit of the product/service"
  },
  {
    question: "What are the key operating expenses by category?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Break down major expense categories (R&D, sales, marketing, G&A, etc.).",
    category: "Financials",
    description: "Break down major expense categories (R&D, sales, marketing, G&A, etc.)"
  },
  {
    question: "What is the expected break-even point?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Project when revenue will equal total costs on both a unit and company-wide basis.",
    category: "Financials",
    description: "Project when revenue will equal total costs"
  },
  
  // Go-to-Market
  {
    question: "What is the customer acquisition strategy?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Outline the plan for attracting and converting new customers.",
    category: "Go-to-Market",
    description: "Outline the plan for attracting and converting new customers"
  },
  {
    question: "What is the go-to-market strategy?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Detail the plan for bringing the product to market and scaling adoption.",
    category: "Go-to-Market",
    description: "Detail the plan for bringing the product to market and scaling adoption"
  },
  {
    question: "What is the sales cycle length for target customers?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Determine the average time from initial contact to closed sale.",
    category: "Go-to-Market",
    description: "Determine the average time from initial contact to closed sale"
  },
  {
    question: "What are the key customer objections during the sales process?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify common hesitations or concerns raised by potential customers.",
    category: "Go-to-Market",
    description: "Identify common hesitations or concerns raised by potential customers"
  },
  {
    question: "What channels will be used to reach target customers?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify marketing and distribution channels for customer acquisition.",
    category: "Go-to-Market",
    description: "Identify marketing and distribution channels for customer acquisition"
  },
  
  // Metrics & Traction
  {
    question: "What are the key performance indicators (KPIs) the venture tracks?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify the most important metrics used to measure business success.",
    category: "Metrics",
    description: "Identify the most important metrics used to measure business success"
  },
  {
    question: "What is the current traction (users, revenue, growth rate)?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Quantify current business momentum with key metrics and growth rates.",
    category: "Traction",
    description: "Quantify current business momentum with key metrics"
  },
  {
    question: "What are the key milestones achieved to date?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "List significant accomplishments that demonstrate progress and execution ability.",
    category: "Traction",
    description: "List significant accomplishments that demonstrate progress and execution ability"
  },
  {
    question: "What is the customer retention rate or churn rate?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Measure the percentage of customers who continue using the product/service over time.",
    category: "Metrics",
    description: "Measure the percentage of customers who continue using the product/service over time"
  },
  {
    question: "What customer validation has been conducted?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Detail market research, customer interviews, or pilot programs that validate demand.",
    category: "Traction",
    description: "Detail market research, customer interviews, or pilot programs that validate demand"
  },
  {
    question: "What are the key customer testimonials or case studies?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Share specific examples of customer success with the product/service.",
    category: "Traction",
    description: "Share specific examples of customer success with the product/service"
  },
  {
    question: "What is the net promoter score (NPS) or customer satisfaction metrics?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Quantify customer satisfaction and likelihood to recommend the product/service.",
    category: "Metrics",
    description: "Quantify customer satisfaction and likelihood to recommend the product/service"
  },
  {
    question: "What are the specific success metrics for any proposed pilot programs?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Define measurable criteria to evaluate pilot program success.",
    category: "Metrics",
    description: "Define measurable criteria to evaluate pilot program success"
  },
  
  // Roadmap & Strategy
  {
    question: "What are the next major milestones for the venture?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify upcoming critical objectives and their timeline.",
    category: "Roadmap",
    description: "Identify upcoming critical objectives and their timeline"
  },
  {
    question: "What are the key strategic partnerships in place or planned?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify important business relationships that provide competitive advantage or accelerate growth.",
    category: "Strategy",
    description: "Identify important business relationships that provide competitive advantage or accelerate growth"
  },
  {
    question: "What is the exit strategy or long-term vision?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Outline potential paths to liquidity for investors or long-term company independence.",
    category: "Strategy",
    description: "Outline potential paths to liquidity for investors or long-term company independence"
  },
  {
    question: "What is the international expansion strategy and timeline?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Detail plans for geographic expansion beyond initial market.",
    category: "Strategy",
    description: "Detail plans for geographic expansion beyond initial market"
  },
  {
    question: "What are the key success factors for this venture?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify critical elements that will determine business success.",
    category: "Strategy",
    description: "Identify critical elements that will determine business success"
  },
  
  // Technology
  {
    question: "What intellectual property does the company own or is developing?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Detail patents, trademarks, copyrights, or trade secrets that provide competitive advantage.",
    category: "Assets",
    description: "Detail patents, trademarks, copyrights, or trade secrets that provide competitive advantage"
  },
  {
    question: "What technology stack is used and why?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Detail the core technologies employed and the rationale for these choices.",
    category: "Technology",
    description: "Detail the core technologies employed and the rationale for these choices"
  },
  {
    question: "What is the technical development roadmap?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Outline upcoming technical milestones and feature development plans.",
    category: "Technology",
    description: "Outline upcoming technical milestones and feature development plans"
  },
  {
    question: "What is the product development methodology?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Detail the approach to developing and improving the product.",
    category: "Technology",
    description: "Detail the approach to developing and improving the product"
  },
  
  // Risk & Regulatory
  {
    question: "What regulatory requirements or compliance issues affect the business?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify legal and regulatory considerations that impact operations or scaling.",
    category: "Regulatory",
    description: "Identify legal and regulatory considerations that impact operations or scaling"
  },
  {
    question: "What are the primary risks to the business?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Detail potential threats to successful execution of the business plan.",
    category: "Risk",
    description: "Detail potential threats to successful execution of the business plan"
  },
  {
    question: "What strategies are in place to mitigate identified risks?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Outline plans to address or minimize key business risks.",
    category: "Risk",
    description: "Outline plans to address or minimize key business risks"
  },
  {
    question: "What external factors could significantly impact the business?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify macroeconomic, political, or industry-specific factors that could affect success.",
    category: "Risk",
    description: "Identify macroeconomic, political, or industry-specific factors that could affect success"
  },
  
  // Investment
  {
    question: "What is the amount of new funding being sought?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Specify the capital being requested in the current round.",
    category: "Investment Ask",
    description: "Specify the capital being requested in the current round"
  },
  {
    question: "What is the planned use of funds?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Detail how the requested capital will be allocated across different areas.",
    category: "Investment Ask",
    description: "Detail how the requested capital will be allocated"
  },
  {
    question: "What is the company's valuation and how was it determined?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Specify the proposed company valuation and methodology used to calculate it.",
    category: "Investment Ask",
    description: "Specify the proposed company valuation and methodology used"
  },
  {
    question: "What are the terms of the current investment round?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Detail investment instrument, investor rights, and other key terms.",
    category: "Investment Ask",
    description: "Detail investment instrument, investor rights, and other key terms"
  },
  
  // Operations
  {
    question: "What is the hiring plan for the next 12-24 months?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Outline planned team expansion and key roles to be filled.",
    category: "Operations",
    description: "Outline planned team expansion and key roles to be filled"
  },
  {
    question: "What are the scaling challenges the venture anticipates?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Identify potential bottlenecks or hurdles to growth.",
    category: "Operations",
    description: "Identify potential bottlenecks or hurdles to growth"
  },
  {
    question: "What is the organizational structure and reporting relationships?",
    model: "llama-3.2-1b-preview",
    instructionType: "predefined",
    instructions: "Detail how the team is organized and key reporting lines.",
    category: "Operations",
    description: "Detail how the team is organized and key reporting lines"
  }
];