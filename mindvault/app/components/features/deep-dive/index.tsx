import DeepDiveMain from './DeepDiveMain';
import QuestionItem from './QuestionItem';
import { useDeepDive } from './hooks/useDeepDive';
import { DEEP_DIVE_QUESTIONS } from './constants';
import type { Answer, DeepDiveQuestion } from './utils/types';

export {
  DeepDiveMain,
  QuestionItem,
  useDeepDive,
  DEEP_DIVE_QUESTIONS,
};

// Export types
export type { Answer, DeepDiveQuestion };

// Default export for easy importing
export default DeepDiveMain; 