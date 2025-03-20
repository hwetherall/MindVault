import { InvestmentMemoQuestion } from "../types";
import { INVESTMENT_MEMO_QUESTIONS } from "./questions";

export interface Template {
  id: string;
  name: string;
  description: string;
  logo: string; // Icon/logo for the template
  questions: string[];
}

// Utility function to log available question IDs - will run once on import
const displayAvailableQuestionInfo = () => {
  console.log(`Total questions available: ${INVESTMENT_MEMO_QUESTIONS.length}`);
  
  // Create a map of questions by category for easier reference
  const questionsByCategory: Record<string, InvestmentMemoQuestion[]> = {};
  
  INVESTMENT_MEMO_QUESTIONS.forEach(q => {
    const category = q.category || 'Uncategorized';
    if (!questionsByCategory[category]) {
      questionsByCategory[category] = [];
    }
    questionsByCategory[category].push(q);
  });
  
  // Log question counts by category
  console.log('Questions by category:');
  Object.entries(questionsByCategory).forEach(([category, questions]) => {
    console.log(`- ${category}: ${questions.length} questions`);
  });
  
  // Log a few sample questions with their IDs for reference
  console.log('Sample question IDs:');
  INVESTMENT_MEMO_QUESTIONS.slice(0, 10).forEach(q => {
    console.log(`- ${q.id}: ${q.question.substring(0, 40)}...`);
  });
};

// Uncomment to debug
displayAvailableQuestionInfo();

// Helper function to find question IDs by their text
const findQuestionIdsByText = (texts: string[]): string[] => {
  // Make a more flexible matching by normalizing text before comparing
  const normalizedTexts = texts.map(text => text.toLowerCase().trim());
  
  const matchedQuestions = INVESTMENT_MEMO_QUESTIONS.filter(q => 
    normalizedTexts.some(normalizedText => 
      q.question.toLowerCase().includes(normalizedText)
    )
  );
  
  // Log for debugging
  console.log(`Found ${matchedQuestions.length} questions matching templates`);
  
  return matchedQuestions.map(q => q.id);
};

// For "Quick Analysis", let's use specific IDs that we know exist in the system
const QUICK_ANALYSIS_FALLBACK_IDS = [
  'arr', // Annual Recurring Revenue
  'business_model', // Business model
  'customer_profile', // Key customers
  'competitors', // Main competitors
  'competitive_advantage', // Key differentiation
  'management_team', // Management team
  'problem_statement' // Problem solving
];

// Also ensure we handle empty results for all templates
const ensureNonEmptyQuestions = (questionIds: string[], fallbackIds: string[] = QUICK_ANALYSIS_FALLBACK_IDS): string[] => {
  if (questionIds.length === 0) {
    console.warn('No matching questions found, using fallback IDs');
    return fallbackIds;
  }
  return questionIds;
};

export const TEMPLATES: Template[] = [
  {
    id: 'full_analysis',
    name: 'Full Analysis',
    description: 'Comprehensive deep dive covering all aspects of the investment opportunity with detailed insights on market, financials, team, and execution strategy.',
    logo: '📊',
    questions: INVESTMENT_MEMO_QUESTIONS.map(q => q.id)
  },
  {
    id: 'quick_analysis',
    name: 'Quick Analysis',
    description: 'Essential investment insights in minutes. Covers core business fundamentals, market position, and key differentiators for rapid decision-making.',
    logo: '⚡',
    // Try text matching first, fallback to known IDs if needed
    questions: ensureNonEmptyQuestions(findQuestionIdsByText([
      'business model',
      'key customers',
      'competitors',
      'differentiation',
      'management team',
      'problem'
    ]))
  },
  {
    id: 'financial_deep_dive',
    name: 'Financial Deep Dive',
    description: 'In-depth analysis of financial health, revenue metrics, burn rate, and growth trajectory. Perfect for understanding the company\'s economic fundamentals.',
    logo: '💰',
    questions: ensureNonEmptyQuestions(findQuestionIdsByText([
      'Annual Recurring Revenue',
      'ARR',
      'growth rate',
      'YoY',
      'valuation',
      'cash burn',
      'runway',
      'business model',
      'funding history'
    ]), [
      'arr',
      'revenue_growth',
      'valuation',
      'burn_rate',
      'runway',
      'business_model',
      'funding_history'
    ])
  },
  {
    id: 'market_competition',
    name: 'Market & Competition Analysis',
    description: 'Strategic evaluation of market position, competitive landscape, and differentiation factors. Identifies key advantages and potential market threats.',
    logo: '🔍',
    questions: ensureNonEmptyQuestions(findQuestionIdsByText([
      'problem',
      'key customers',
      'competitors',
      'differentiation',
      'risks'
    ]), [
      'problem_statement',
      'customer_profile',
      'competitors',
      'competitive_advantage',
      'risk_factors'
    ])
  },
  {
    id: 'team_operations',
    name: 'Team & Operations Review',
    description: 'Focus on leadership capabilities, operational efficiency, and execution strategy. Evaluates the team\'s ability to deliver on business objectives.',
    logo: '👥',
    questions: ensureNonEmptyQuestions(findQuestionIdsByText([
      'management team',
      'business model',
      'ARR',
      'risks',
      'runway'
    ]), [
      'management_team',
      'business_model',
      'arr',
      'risk_factors',
      'runway'
    ])
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Build your own analysis template with the exact questions you need for your specific investment criteria and focus areas.',
    logo: '🛠️',
    questions: []
  }
]; 