import { InvestmentMemoQuestion } from "./utils/pdfExport";

/**
 * List of investment memo questions with details
 */
export const INVESTMENT_MEMO_QUESTIONS: InvestmentMemoQuestion[] = [
  {
    id: 'arr',
    question: 'What is the current Annual Recurring Revenue (ARR) of the company?',
    description: 'Find the most recent ARR figure with currency.',
    category: 'Financial',
    complexity: 'medium',
    recommended: ['excel']
  },
  {
    id: 'growth_rate',
    question: 'What is the Year-over-Year (YoY) growth rate?',
    description: 'Calculate the YoY growth percentage from the latest financial data.',
    category: 'Financial',
    complexity: 'medium',
    recommended: ['excel']
  },
  {
    id: 'valuation',
    question: 'What is the target valuation for the company?',
    description: 'Identify the valuation the company is seeking in this funding round.',
    category: 'Financial',
    complexity: 'medium',
    recommended: ['pdf']
  },
  {
    id: 'burn_rate',
    question: 'What is the current monthly cash burn rate?',
    description: 'Calculate the average monthly cash outflow from the financial statements.',
    category: 'Financial',
    complexity: 'medium',
    recommended: ['excel']
  },
  {
    id: 'runway',
    question: 'How much runway does the company have?',
    description: 'Determine how many months of operations the company can fund with current cash reserves at the current burn rate.',
    category: 'Financial',
    complexity: 'medium',
    recommended: ['excel']
  },
  {
    id: 'business_model',
    question: 'What is the company\'s business model?',
    description: 'Summarize how the company generates revenue and its pricing structure.',
    category: 'Business',
    complexity: 'low',
    recommended: ['pdf']
  },
  {
    id: 'customers',
    question: 'Who are the company\'s key customers?',
    description: 'Identify major customers and customer segments.',
    category: 'Market',
    complexity: 'low',
    recommended: ['pdf']
  },
  {
    id: 'competition',
    question: 'Who are the main competitors?',
    description: 'List direct and indirect competitors and their market positions.',
    category: 'Market',
    complexity: 'medium',
    recommended: ['pdf']
  },
  {
    id: 'differentiation',
    question: 'What is the company\'s key differentiation?',
    description: 'Identify unique selling propositions and competitive advantages.',
    category: 'Business',
    complexity: 'medium',
    recommended: ['pdf']
  },
  {
    id: 'team',
    question: 'Who are the key team members and what is their background?',
    description: 'Summarize the management team\'s experience and expertise.',
    category: 'Team',
    complexity: 'low',
    recommended: ['pdf']
  },
  {
    id: 'risks',
    question: 'What are the key risks to consider?',
    description: 'Identify business, market, financial, and regulatory risks.',
    category: 'Risk',
    complexity: 'high',
    recommended: ['pdf', 'excel']
  },
  {
    id: 'funding_history',
    question: 'What is the company\'s funding history?',
    description: 'List previous funding rounds, investors, and amounts raised.',
    category: 'Financial',
    complexity: 'low',
    recommended: ['pdf']
  }
]; 