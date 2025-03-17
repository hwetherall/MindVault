/**
 * Investment memo question data structure
 */
export interface InvestmentMemoQuestion {
  id: string;
  question: string;
  description: string;
  category?: string;
  complexity?: 'low' | 'medium' | 'high';
  recommended?: string[];
  instructions?: string;
}

/**
 * Answer data structure
 */
export interface Answer {
  summary: string;
  details: string;
  isEdited: boolean;
  isLoading?: boolean;
}

/**
 * Export options for PDF generation
 */
export interface ExportOptions {
  includeTableOfContents: boolean;
  includeAppendices: boolean;
  language: string;
  isDetailedView?: boolean;
} 