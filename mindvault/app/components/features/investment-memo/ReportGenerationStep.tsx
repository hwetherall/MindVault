import React, { useState, useEffect } from 'react';
import { ChevronLeft, FileText, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { chatService } from '../../../services/chatService';
import { Answer, InvestmentMemoQuestion } from './utils/pdfExport';
import { INVESTMENT_MEMO_QUESTIONS } from './constants';

interface ReportGenerationStepProps {
  selectedQuestions: string[];
  files: any[];
  title: string;
  description: string;
  onProgress: (progress: number) => void;
  onGenerationComplete: (answers: Record<string, Answer>) => void;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Component for generating the report and showing progress
 */
const ReportGenerationStep: React.FC<ReportGenerationStepProps> = ({
  selectedQuestions,
  files,
  title,
  description,
  onProgress,
  onGenerationComplete,
  onPrevious,
  onNext
}) => {
  // State for generation
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // Get prompt for a specific question
  const getPromptForQuestion = (id: string): string => {
    const question = INVESTMENT_MEMO_QUESTIONS.find(q => q.id === id);
    if (!question) return '';
    
    return `Based on the provided documents, ${question.question} ${question.description ? `(${question.description})` : ''}

Organize your answer into:
1. TL;DR - A concise summary of the key points
2. DETAILS - More comprehensive explanation with supporting information

Be specific and extract concrete numbers and facts where available.`;
  };

  // Generate a single answer
  const generateAnswer = async (questionId: string): Promise<Answer | null> => {
    try {
      setCurrentQuestion(questionId);
      const prompt = getPromptForQuestion(questionId);
      const result = await chatService.sendMessage(prompt, files);
      
      return {
        content: result.text,
        isEdited: false
      };
    } catch (err) {
      console.error(`Error generating answer for question ${questionId}:`, err);
      setError(`Failed to generate answer for question ${questionId}`);
      return null;
    }
  };

  // Generate all answers
  const generateAllAnswers = async () => {
    setIsGenerating(true);
    setError(null);
    
    const totalQuestions = selectedQuestions.length;
    const result: Record<string, Answer> = {};
    
    for (let i = 0; i < totalQuestions; i++) {
      const questionId = selectedQuestions[i];
      const answer = await generateAnswer(questionId);
      
      if (answer) {
        result[questionId] = answer;
      }
      
      // Update progress
      const newProgress = Math.round(((i + 1) / totalQuestions) * 100);
      setProgress(newProgress);
      onProgress(newProgress);
    }
    
    setAnswers(result);
    onGenerationComplete(result);
    setIsGenerating(false);
  };

  // Start generation when component mounts
  useEffect(() => {
    generateAllAnswers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get question text by ID
  const getQuestionText = (id: string): string => {
    const question = INVESTMENT_MEMO_QUESTIONS.find(q => q.id === id);
    return question ? question.question : id;
  };

  // Retry generation for a specific question
  const handleRetry = async (questionId: string) => {
    const answer = await generateAnswer(questionId);
    
    if (answer) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
      
      // Update the complete answers
      onGenerationComplete({
        ...answers,
        [questionId]: answer
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Generating Investment Memo</h2>
      <p className="text-gray-600 mb-6">
        We are analyzing your documents and generating answers to the selected questions.
      </p>

      {/* Overall Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">Overall Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions Progress List */}
      <div className="space-y-4 mb-8">
        {selectedQuestions.map(questionId => {
          const isCompleted = !!answers[questionId];
          const isCurrent = currentQuestion === questionId && isGenerating;
          
          return (
            <div 
              key={questionId}
              className={`border rounded-md p-3 ${
                isCompleted 
                  ? 'border-green-200 bg-green-50' 
                  : isCurrent 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200'
              }`}
            >
              <div className="flex items-start">
                <div className="mt-0.5 mr-3">
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : isCurrent ? (
                    <RefreshCw size={18} className="text-blue-500 animate-spin" />
                  ) : (
                    <FileText size={18} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{getQuestionText(questionId)}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {isCompleted 
                      ? 'Generated successfully' 
                      : isCurrent 
                        ? 'Generating...' 
                        : 'Waiting...'}
                  </div>
                </div>
                {isCompleted && (
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => handleRetry(questionId)}
                  >
                    Regenerate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg flex items-start">
          <AlertTriangle size={16} className="mr-2 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <button
          className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          onClick={onPrevious}
          disabled={isGenerating}
        >
          <ChevronLeft size={16} className="mr-1" />
          Back
        </button>
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={onNext}
          disabled={isGenerating || Object.keys(answers).length === 0}
        >
          Continue to Editing
        </button>
      </div>
    </div>
  );
};

export default ReportGenerationStep; 