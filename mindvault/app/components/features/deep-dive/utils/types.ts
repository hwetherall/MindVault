/**
 * Types for the DeepDive component
 */

/**
 * DeepDive question data structure
 */
export interface DeepDiveQuestion {
  id: string;
  question: string;
  description: string;
}

/**
 * Answer data structure
 */
export interface Answer {
  summary: string;
  details: string;
  isEdited: boolean;
} 