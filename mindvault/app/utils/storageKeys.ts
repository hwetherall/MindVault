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
  
  // Questions
  SELECTED_QUESTIONS: 'selectedQuestions',
  CUSTOM_QUESTIONS: 'customQuestions',
  
  // User preferences
  FAST_MODE: 'fastMode',
  EXPORT_SETTINGS: 'exportSettings',
  LAST_VIEWED_SECTION: 'lastViewedSection',
  
  // Application state
  VERSION: 'version',  // For potential future migration handling
}; 