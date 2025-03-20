import { InvestmentMemoQuestion } from "../types";
import { INVESTMENT_MEMO_QUESTIONS } from "./questions";

export interface Template {
  id: string;
  name: string;
  description: string;
  questions: string[];
}

// Helper function to find question IDs by their text
const findQuestionIdsByText = (texts: string[]): string[] => {
  return INVESTMENT_MEMO_QUESTIONS
    .filter(q => texts.some(text => q.question.includes(text)))
    .map(q => q.id);
};

export const TEMPLATES: Template[] = [
  {
    id: 'full_analysis',
    name: 'Full Analysis',
    description: 'Comprehensive analysis covering all questions',
    questions: INVESTMENT_MEMO_QUESTIONS.map(q => q.id)
  },
  {
    id: 'quick_analysis',
    name: 'Quick Analysis',
    description: 'Key questions that can be answered by faster models',
    questions: findQuestionIdsByText([
      'What is the company\'s business model?',
      'Who are the company\'s key customers?',
      'Who are the main competitors?',
      'What is the company\'s key differentiation?',
      'Who are the key members of the management team and what are their backgrounds?',
      'What problem is this company trying to solve?'
    ])
  },
  {
    id: 'financial_deep_dive',
    name: 'Financial Deep Dive',
    description: 'Focus on financial metrics and performance',
    questions: findQuestionIdsByText([
      'What is the current Annual Recurring Revenue (ARR) of the company?',
      'What is the Year-over-Year (YoY) growth rate?',
      'What is the target valuation for the company?',
      'What is the current monthly cash burn rate?',
      'How much runway does the company have?',
      'What is the company\'s business model?',
      'What is the company\'s funding history?'
    ])
  },
  {
    id: 'market_competition',
    name: 'Market & Competition Analysis',
    description: 'Analyze the market position and competitive landscape',
    questions: findQuestionIdsByText([
      'What problem is this company trying to solve?',
      'Who are the company\'s key customers?',
      'Who are the main competitors?',
      'What is the company\'s key differentiation?',
      'What are the key risks to consider?'
    ])
  },
  {
    id: 'team_operations',
    name: 'Team & Operations Review',
    description: 'Focus on the team and operational aspects',
    questions: findQuestionIdsByText([
      'Who are the key members of the management team and what are their backgrounds?',
      'What is the company\'s business model?',
      'What is the current Annual Recurring Revenue (ARR) of the company?',
      'What are the key risks to consider?',
      'How much runway does the company have?'
    ])
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Choose your own questions',
    questions: []
  }
]; 