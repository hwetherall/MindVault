/**
 * Storage keys for MindVault localStorage
 * This file centralizes all storage key definitions to maintain consistency
 * and avoid typos when accessing localStorage
 */

// Document content
export const STORAGE_KEYS = {
  // Title and description
  TITLE: 'title',
  DESCRIPTION: 'description',
  
  // Investment Memo Questions and Answers
  SELECTED_QUESTION_IDS: 'selectedQuestionIds',
  CUSTOM_QUESTIONS: 'customQuestions',
  ANSWERS: 'answers',
  
  // User preferences
  FAST_MODE: 'fastMode',
  EXPORT_OPTIONS: 'exportOptions',
  LAST_VIEWED_SECTION: 'lastViewedSection',
  
  // Application state
  VERSION: 'version',  // For potential future migration handling
}; 