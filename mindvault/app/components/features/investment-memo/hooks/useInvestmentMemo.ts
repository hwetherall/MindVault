import { useState, useEffect, useCallback } from 'react';
import { answerService } from '../../../../services/answerService.js';
import { buildPromptForQuestion } from "../utils/promptBuilder";
import { generateCustomInstructions } from "../utils/customInstructionsGenerator";
import { ChartData } from '../../../ChartComponent';

// Updated Answer type with separate summary and details fields, loading state, and chart data
export interface Answer {
  summary: string;
  details: string;
  isEdited: boolean;
  isLoading?: boolean;
  chartData?: ChartData;
  modelUsed?: string;
  timeTaken?: number;
  messageLength?: number;
  answerLength?: number;
  finalInstructions?: string;
  documentContext?: string;
  finalPrompt?: string;
  rawOutput?: string;
}

export interface InvestmentMemoQuestion {
  id: string;
  question: string;
  description: string;
  category?: string;
  subcategory?: string;
  complexity?: 'low' | 'medium' | 'high';
  recommended?: string[];
  instructions?: string;  // Added for custom questions that might need their own instructions
}

interface UseInvestmentMemoProps {
  files: any[];
  questions: InvestmentMemoQuestion[];
  onComplete?: (passed: boolean) => void;
  onAnswerUpdate?: (id: string, summary: string, details: string) => void;
  fastMode?: boolean;
}

interface UseInvestmentMemoReturn {
  isAnalyzing: boolean;
  answers: Record<string, Answer>;
  error: string | null;
  expandedAnswers: Record<string, boolean>;
  editingId: string | null;
  editedSummary: string;
  editedDetails: string;
  setEditedSummary: (summary: string) => void;
  setEditedDetails: (details: string) => void;
  toggleAnswer: (id: string) => void;
  handleEdit: (id: string) => void;
  handleSave: (id: string, summary: string, details: string, instructions?: string) => void;
  analyzeDocuments: () => Promise<void>;
  analyzeSelectedQuestions: (questionIds: string[], setPrompt?: string) => Promise<void>;
  regenerateAnswer: (id: string, customPrompt?: string) => Promise<void>;
  resetExpandedAnswers: () => void;
}

// Add type definition for the API response
interface AnswerServiceResponse {
  text: string;
  suggestedQuestions?: string[];
  chartData?: ChartData;
  error?: string;
  modelUsed: string;
  timeTaken: number;
  messageLength: number;
  answerLength: number;
  documentContext: string;
  finalPrompt: string;
  rawOutput: string;
}

/**
 * Custom hook for managing investment memo state and operations
 */
export function useInvestmentMemo({
  files,
  questions,
  onComplete,
  onAnswerUpdate,
  fastMode = false
}: UseInvestmentMemoProps): UseInvestmentMemoReturn {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => {
    // Load initial answers from localStorage if available
    if (typeof window !== 'undefined') {
      const savedAnswers = localStorage.getItem('investmentMemoAnswers');
      return savedAnswers ? JSON.parse(savedAnswers) : {};
    }
    return {};
  });
  const [error, setError] = useState<string | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>(() => {
    // Load initial expanded state from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('investmentMemoExpanded');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedSummary, setEditedSummary] = useState<string>('');
  const [editedDetails, setEditedDetails] = useState<string>('');

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('investmentMemoAnswers', JSON.stringify(answers));
    }
  }, [answers]);

  // Save expanded state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('investmentMemoExpanded', JSON.stringify(expandedAnswers));
    }
  }, [expandedAnswers]);

  // Add reset function
  const resetExpandedAnswers = useCallback(() => {
    setExpandedAnswers({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('investmentMemoExpanded');
    }
  }, []);

  /**
   * Toggles the expansion state of an answer
   */
  const toggleAnswer = (id: string) => {
    setExpandedAnswers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  /**
   * Opens the editor for an answer
   */
  const handleEdit = (id: string) => {
    if (!id) {
      setEditingId(null);
      setEditedSummary('');
      setEditedDetails('');
      return;
    }
    
    setEditingId(id);
    setEditedSummary(answers[id]?.summary || '');
    setEditedDetails(answers[id]?.details || '');
  };

  /**
   * Saves the edited answer
   */
  const handleSave = (id: string, summary: string, details: string, instructions?: string) => {
    if (summary.trim() || details.trim()) {
      const updatedAnswer = {
        ...answers[id],
        summary: summary.trim(),
        details: details.trim(),
        isEdited: true,
        isLoading: false,
        // Preserve chart data if it exists
        chartData: answers[id]?.chartData,
        // Update instructions if provided
        finalInstructions: instructions || answers[id]?.finalInstructions
      };
      
      setAnswers(prev => ({
        ...prev,
        [id]: updatedAnswer
      }));
      
      if (onAnswerUpdate) {
        onAnswerUpdate(id, updatedAnswer.summary, updatedAnswer.details);
      }
    }
    
    setEditingId(null);
    setEditedSummary('');
    setEditedDetails('');
  };

  /**
   * Analyzes a single question
   */
  const analyzeQuestion = async (question: InvestmentMemoQuestion, customInstructions?: string): Promise<Answer> => {
    // Mark this question as loading
    setAnswers(prev => ({
      ...prev,
      [question.id]: {
        ...prev[question.id],
        isLoading: true
      }
    }));

    try {
      let prompt = '';

      if (customInstructions){
        prompt = customInstructions;

      } else {
        if (question.id.startsWith('custom_')) {
          // Generate custom instructions for the question
          question.instructions = await generateCustomInstructions(question);
          console.log(`Custom instructions generated for question ${question.id}: ${question.instructions}`);
        }

        // Use the prompt generator with the question object
        prompt = buildPromptForQuestion(question);
      }

      console.log(`Prompt passed to AI service: ${prompt}`);

      // Call the actual AI service with fastMode
      const response = await answerService.sendMessage(prompt, files, fastMode) as AnswerServiceResponse;
      
      // Parse the response text to extract summary and details
      let responseText = '';
      let chartData: ChartData | undefined = undefined;
      
      if (typeof response === 'string') {
        responseText = response;
      } else if (response && typeof response === 'object' && 'text' in response) {
        responseText = response.text;
        // Extract chart data if available
        if ('chartData' in response && response.chartData) {
          console.log(`Found chart data for question ${question.id}:`, response.chartData);
          chartData = response.chartData as ChartData;
        }
      } else {
        throw new Error('Invalid response format from AI service');
      }
      
      // Split the response into summary and details
      let summary = '';
      let details = '';
      
      if (responseText.toLowerCase().includes('summary:')) {
        // Split by "DETAILS:" or "DETAILS" or similar variations
        const parts = responseText.split(/DETAILS:?/i);
        if (parts.length > 1) {
          // Extract summary from the first part (may have "SUMMARY:" prefix)
          const summaryText = parts[0];
          summary = summaryText.replace(/^[\s\S]*?SUMMARY:?/i, '').trim();
          
          // Extract details from the second part
          details = parts[1].trim();
        } else {
          // If no clear division, make a reasonable split
          const lines = responseText.split('\n');
          const summaryEndIndex = Math.min(5, lines.length); // Take first few lines as summary
          
          summary = lines.slice(0, summaryEndIndex).join('\n').replace(/^[\s\S]*?SUMMARY:?/i, '').trim();
          details = lines.slice(summaryEndIndex).join('\n').trim();
        }
      } else {
        // If no clear structure, use first paragraph as summary and rest as details
        const paragraphs = responseText.split('\n\n');
        summary = paragraphs[0].trim();
        details = paragraphs.slice(1).join('\n\n').trim();
      }
      
      // Remove any redundant labels that might be in the content
      summary = summary.replace(/^SUMMARY:?\s*/i, '').replace(/^SUMMARY\s*$/i, '').trim();
      details = details.replace(/^DETAILS:?\s*/i, '').replace(/^DETAILS\s*$/i, '').trim();
      
      // Return the answer with all metrics from the response
      return {
        summary,
        details,
        isEdited: false,
        isLoading: false,
        chartData,
        modelUsed: response.modelUsed,
        timeTaken: response.timeTaken,
        messageLength: response.messageLength,
        answerLength: response.answerLength,
        finalInstructions: prompt,
        documentContext: response.documentContext,
        finalPrompt: response.finalPrompt,
        rawOutput: response.rawOutput
      };
    } catch (error) {
      console.error('Error analyzing question:', error);
      
      // Return an error response
      return {
        summary: 'Error analyzing documents',
        details: `We encountered an error while analyzing the documents for this question. Error details: ${error.message || 'Unknown error'}`,
        isEdited: false,
        isLoading: false
      };
    }
  };

  /**
   * Analyzes documents to generate answers for selected questions
   */
  const analyzeSelectedQuestions = async (questionIds: string[], setPrompt?: string) => {
    setError(null);
    
    try {
      // Get valid questions in one pass
      const selectedQuestions = questions.filter(q => questionIds.includes(q.id));
      const invalidQuestionIds = questionIds.filter(id => !selectedQuestions.some(q => q.id === id));
      
      // Log warning if some IDs weren't found
      if (invalidQuestionIds.length > 0) {
        console.warn(`Questions with ids [${invalidQuestionIds.join(', ')}] not found. Make sure the questions array is up to date.`);
        setError(`Some questions could not be found. Please try reselecting them.`);
        return;
      }
      
      // If no valid questions, exit early
      if (selectedQuestions.length === 0) {
        setError('No valid questions to analyze. Please select questions and try again.');
        return;
      }
      
      // Setup initial loading state for all selected questions
      const initialLoadingState: Record<string, Answer> = {};
      
      // Create initial loading state for each question
      selectedQuestions.forEach(q => {
        initialLoadingState[q.id] = {
          summary: '',
          details: '',
          isEdited: false,
          isLoading: true
        };
      });
      
      // Update state to show loading
      setAnswers(prev => ({
        ...prev,
        ...initialLoadingState
      }));
      
      // Process each question directly
      const answerPromises = selectedQuestions.map(question => analyzeQuestion(question, setPrompt));
      const results = await Promise.all(answerPromises);
      
      // Update with real answers
      const finalAnswers: Record<string, Answer> = {};
      selectedQuestions.forEach((question, index) => {
        finalAnswers[question.id] = results[index];
        
        // Update caller if needed
        if (onAnswerUpdate) {
          onAnswerUpdate(question.id, results[index].summary, results[index].details);
        }
      });
      
      // Merge answers
      setAnswers(prev => ({
        ...prev,
        ...finalAnswers
      }));
      
      // Auto-expand newly added questions
      const newExpandedState: Record<string, boolean> = {};
      selectedQuestions.forEach(question => {
        newExpandedState[question.id] = true;
      });
      
      setExpandedAnswers(prev => ({
        ...prev,
        ...newExpandedState
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing documents');
    }
  };

  /**
   * Analyzes documents to generate answers for all questions
   */
  const analyzeDocuments = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Get all question IDs and analyze them
      const questionIds = questions.map(q => q.id);
      await analyzeSelectedQuestions(questionIds);
      
      if (onComplete) {
        onComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Regenerates a specific answer
   */
  const regenerateAnswer = async (id: string, customPrompt?: string) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;
    
    try {
      // Use the custom prompt if provided, otherwise use the stored instructions
      await analyzeSelectedQuestions([id], customPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while regenerating the answer');
    }
  };

  return {
    isAnalyzing,
    answers,
    error,
    expandedAnswers,
    editingId,
    editedSummary,
    editedDetails,
    setEditedSummary,
    setEditedDetails,
    toggleAnswer,
    handleEdit,
    handleSave,
    analyzeDocuments,
    analyzeSelectedQuestions,
    regenerateAnswer,
    resetExpandedAnswers
  };
} 