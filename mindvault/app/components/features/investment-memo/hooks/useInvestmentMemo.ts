import { useState } from 'react';

// Mock types to fix import errors
export interface Answer {
  content: string;
  isEdited: boolean;
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
  onAnswerUpdate?: (id: string, content: string) => void;
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
  regenerateAnswer: (id: string) => Promise<void>;
  getPromptForQuestion: (id: string) => string;
  handleViewPrompt: (id: string) => void;
  handleSavePrompt: () => void;
  closePromptModal: () => void;
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
    setEditedAnswer(answers[id]?.content || '');
  };

  /**
   * Saves the edited answer
   */
  const handleSave = (id: string) => {
    if (editedAnswer.trim()) {
      const updatedAnswer = {
        content: editedAnswer,
        isEdited: true
      };
      
      setAnswers(prev => ({
        ...prev,
        [id]: updatedAnswer
      }));
      
      if (onAnswerUpdate) {
        onAnswerUpdate(id, editedAnswer);
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
    
    // Default prompts based on question ID
    const question = questions.find(q => q.id === id);
    if (!question) return '';
    
    return `Analyze the provided documents and answer the following question:
${question.question}

${question.description ? `Additional context: ${question.description}` : ''}

Format your response as follows:
TL;DR: A brief summary of the answer in 1-2 sentences.
DETAILS: More comprehensive explanation with supporting evidence from the documents.
`;
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
   * Analyzes documents to generate answers for all questions
   */
  const analyzeDocuments = async () => {
    // Implementation would connect to the actual chat service
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Mock implementation for now - in a real app, would call chatService
      const mockAnswers: Record<string, Answer> = {};
      
      for (const question of questions) {
        // Would use file content and prompt to generate real answers
        mockAnswers[question.id] = {
          content: `TL;DR: This is a placeholder answer for ${question.question}\n\nDETAILS: More detailed information would be generated by the actual AI service based on the document content.`,
          isEdited: false
        };
      }
      
      setAnswers(mockAnswers);
      
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
      // Mock implementation - would call chat service in a real app
      const regeneratedAnswer = {
        content: `TL;DR: This is a regenerated answer for ${question.question}\n\nDETAILS: More detailed information would be regenerated by the actual AI service.`,
        isEdited: false
      };
      
      setAnswers(prev => ({
        ...prev,
        [id]: regeneratedAnswer
      }));
      
      if (onAnswerUpdate) {
        onAnswerUpdate(id, regeneratedAnswer.content);
      }
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
    regenerateAnswer,
    getPromptForQuestion,
    handleViewPrompt,
    handleSavePrompt,
    closePromptModal
  };
} 