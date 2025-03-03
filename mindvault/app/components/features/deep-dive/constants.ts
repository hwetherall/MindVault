import { DeepDiveQuestion } from './utils/types';

/**
 * List of deep dive questions with descriptions
 */
export const DEEP_DIVE_QUESTIONS: DeepDiveQuestion[] = [
  {
    id: 'scalability',
    question: 'How scalable is the current product, team, and operations to meet the next phase of growth?',
    description: 'Evaluate the company\'s ability to scale its operations, technology, and team.'
  },
  {
    id: 'financials',
    question: 'What are the current and projected cash flow needs, and how long will this funding round sustain the business?',
    description: 'Analyze detailed financial projections and cash flow requirements.'
  },
  {
    id: 'acquisition',
    question: 'What customer acquisition strategies have been most effective so far, and what is the payback period on these efforts?',
    description: 'Examine customer acquisition costs, strategies, and ROI metrics.'
  },
  {
    id: 'team',
    question: 'How strong is the team, and what key hires or organizational changes are necessary to achieve the next growth targets?',
    description: 'Assess team capabilities, experience, and hiring needs.'
  },
  {
    id: 'challenges',
    question: 'What regulatory, technical, or operational hurdles could limit success at scale, and how is the company preparing to address them?',
    description: 'Identify and evaluate potential obstacles to growth.'
  }
]; 