import { useState } from 'react';
import { answerService } from '../../../../services/answerService.js';
import { generatePromptForQuestion, generateSimplePrompt } from "../utils/promptGenerator";
import { ChartData } from '../../../ChartComponent';

// Updated Answer type with separate summary and details fields, loading state, and chart data
export interface Answer {
  summary: string;
  details: string;
  isEdited: boolean;
  isLoading?: boolean;
  chartData?: ChartData;
}

export interface InvestmentMemoQuestion {
  id: string;
  question: string;
  description: string;
  category?: string;
  complexity?: 'low' | 'medium' | 'high';
  recommended?: string[];
}

interface UseInvestmentMemoProps {
  files: any[];
  questions: InvestmentMemoQuestion[];
  onComplete?: (passed: boolean) => void;
  onAnswerUpdate?: (id: string, summary: string, details: string) => void;
}

interface UseInvestmentMemoReturn {
  isAnalyzing: boolean;
  answers: Record<string, Answer>;
  error: string | null;
  expandedAnswers: Record<string, boolean>;
  editingId: string | null;
  editedAnswer: string;
  promptModalVisible: boolean;
  currentPrompt: string;
  currentPromptId: string;
  setEditedAnswer: (answer: string) => void;
  setCurrentPrompt: (prompt: string) => void;
  toggleAnswer: (id: string) => void;
  handleEdit: (id: string) => void;
  handleSave: (id: string) => void;
  analyzeDocuments: () => Promise<void>;
  analyzeSelectedQuestions: (questionIds: string[]) => Promise<void>;
  regenerateAnswer: (id: string) => Promise<void>;
  getPromptForQuestion: (id: string) => string;
  handleViewPrompt: (id: string) => void;
  handleSavePrompt: () => void;
  closePromptModal: () => void;
}

// Add type definition for the API response
interface AnswerServiceResponse {
  text: string;
  suggestedQuestions?: string[];
  chartData?: ChartData;
  error?: string;
}

/**
 * Custom hook for managing investment memo state and operations
 */
export function useInvestmentMemo({
  files,
  questions,
  onComplete,
  onAnswerUpdate
}: UseInvestmentMemoProps): UseInvestmentMemoReturn {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [error, setError] = useState<string | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedAnswer, setEditedAnswer] = useState<string>('');
  const [promptModalVisible, setPromptModalVisible] = useState<boolean>(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [currentPromptId, setCurrentPromptId] = useState<string>('');
  const [prompts, setPrompts] = useState<Record<string, string>>({});

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
      setEditedAnswer('');
      return;
    }
    
    setEditingId(id);
    // Edit the summary part by default
    setEditedAnswer(answers[id]?.summary || '');
  };

  /**
   * Saves the edited answer
   */
  const handleSave = (id: string) => {
    if (editedAnswer.trim()) {
      const updatedAnswer = {
        summary: editedAnswer,
        details: answers[id]?.details || '',
        isEdited: true,
        isLoading: false,
        // Preserve chart data if it exists
        chartData: answers[id]?.chartData
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
    setEditedAnswer('');
  };

  /**
   * Gets the prompt for a specific question
   */
  const getPromptForQuestion = (id: string): string => {
    if (prompts[id]) {
      return prompts[id];
    }
    
    // Use the new prompt generator
    return generatePromptForQuestion(id);
  };

  /**
   * Opens the prompt modal for viewing/editing a question prompt
   */
  const handleViewPrompt = (id: string) => {
    setCurrentPromptId(id);
    setCurrentPrompt(getPromptForQuestion(id));
    setPromptModalVisible(true);
  };

  /**
   * Saves the edited prompt
   */
  const handleSavePrompt = () => {
    if (currentPromptId && currentPrompt.trim()) {
      setPrompts(prev => ({
        ...prev,
        [currentPromptId]: currentPrompt
      }));
    }
    
    setPromptModalVisible(false);
    setCurrentPromptId('');
    setCurrentPrompt('');
  };

  /**
   * Closes the prompt modal
   */
  const closePromptModal = () => {
    setPromptModalVisible(false);
    setCurrentPromptId('');
    setCurrentPrompt('');
  };

  /**
   * Analyzes a single question
   */
  const analyzeQuestion = async (questionId: string): Promise<Answer> => {
    // Mark this question as loading
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isLoading: true
      }
    }));

    // Get the question details
    const question = questions.find(q => q.id === questionId);
    if (!question) {
      console.error(`Question with id '${questionId}' not found in the available questions:`, 
        questions.map(q => ({ id: q.id, question: q.question })));
      throw new Error(`Question with id '${questionId}' not found. This might be due to a synchronization issue. Please try reselecting the question.`);
    }

    try {
      // Use the custom prompt if available, otherwise use the prompt generator
      const prompt = prompts[questionId] 
        ? prompts[questionId] 
        : generatePromptForQuestion(questionId);

      // Call the actual AI service
      const response = await answerService.sendMessage(prompt, files);
      
      console.log(`Response for question ${questionId}:`, response);
      
      // Parse the response text to extract summary and details
      let responseText = '';
      let chartData: ChartData | undefined = undefined;
      
      if (typeof response === 'string') {
        responseText = response;
      } else if (response && typeof response === 'object' && 'text' in response) {
        responseText = response.text;
        // Extract chart data if available
        if ('chartData' in response && response.chartData) {
          console.log(`Found chart data for question ${questionId}:`, response.chartData);
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
      
      return {
        summary,
        details,
        isEdited: false,
        isLoading: false,
        chartData
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
  const analyzeSelectedQuestions = async (questionIds: string[]) => {
    setError(null);
    
    try {
      // First verify all questions exist to avoid "Question not found" errors
      const validQuestionIds: string[] = [];
      const invalidQuestionIds: string[] = [];
      
      questionIds.forEach(id => {
        const questionExists = questions.some(q => q.id === id);
        if (questionExists) {
          validQuestionIds.push(id);
        } else {
          invalidQuestionIds.push(id);
        }
      });
      
      // Log warning if some IDs weren't found
      if (invalidQuestionIds.length > 0) {
        console.warn(`Questions with ids [${invalidQuestionIds.join(', ')}] not found. Make sure the questions array is up to date.`);
        setError(`Some questions could not be found. Please try reselecting them.`);
        return;
      }
      
      // If no valid questions, exit early
      if (validQuestionIds.length === 0) {
        setError('No valid questions to analyze. Please select questions and try again.');
        return;
      }
      
      // Setup initial loading state for all selected questions
      const selectedQuestions = questions.filter(q => validQuestionIds.includes(q.id));
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
      
      // Process each question
      const answerPromises = validQuestionIds.map(id => analyzeQuestion(id));
      const results = await Promise.all(answerPromises);
      
      // Update with real answers
      const finalAnswers: Record<string, Answer> = {};
      validQuestionIds.forEach((id, index) => {
        finalAnswers[id] = results[index];
        
        // Update caller if needed
        if (onAnswerUpdate) {
          onAnswerUpdate(id, results[index].summary, results[index].details);
        }
      });
      
      // Merge answers
      setAnswers(prev => ({
        ...prev,
        ...finalAnswers
      }));
      
      // Auto-expand newly added questions
      const newExpandedState: Record<string, boolean> = {};
      validQuestionIds.forEach(id => {
        newExpandedState[id] = true;
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
  const regenerateAnswer = async (id: string) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;
    
    try {
      // Mark this answer as loading
      setAnswers(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          isLoading: true
        }
      }));
      
      // Generate a new answer
      const regeneratedAnswer = await analyzeQuestion(id);
      
      // Update state with new answer
      setAnswers(prev => ({
        ...prev,
        [id]: regeneratedAnswer
      }));
      
      if (onAnswerUpdate) {
        onAnswerUpdate(id, regeneratedAnswer.summary, regeneratedAnswer.details);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while regenerating the answer');
      
      // Reset loading state on error
      setAnswers(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          isLoading: false
        }
      }));
    }
  };

  return {
    isAnalyzing,
    answers,
    error,
    expandedAnswers,
    editingId,
    editedAnswer,
    promptModalVisible,
    currentPrompt,
    currentPromptId,
    setEditedAnswer,
    setCurrentPrompt,
    toggleAnswer,
    handleEdit,
    handleSave,
    analyzeDocuments,
    analyzeSelectedQuestions,
    regenerateAnswer,
    getPromptForQuestion,
    handleViewPrompt,
    handleSavePrompt,
    closePromptModal
  };
} 