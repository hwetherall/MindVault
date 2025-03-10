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
  const [activeGenerations, setActiveGenerations] = useState<Record<string, {
    summary: string;
    details: string;
    isComplete: boolean;
  }>>({});

  // Get prompt for a specific question to generate detailed answer
  const getPromptForQuestion = (id: string): string => {
    const question = INVESTMENT_MEMO_QUESTIONS.find(q => q.id === id);
    if (!question) return '';
    
    return `Based on the provided documents, provide a DETAILED answer to this question: ${question.question} ${question.description ? `(${question.description})` : ''}

Your answer should be comprehensive and include supporting information, calculations, and specific data points from the documents.
Include source references where appropriate. Extract concrete numbers and facts where available.

This will be used as the DETAILS section of the answer, which will be shown when users click "Show Details".`;
  };

  // Get prompt to generate a summary based on the detailed answer
  const getSummaryPrompt = (detailedAnswer: string, id: string): string => {
    const question = INVESTMENT_MEMO_QUESTIONS.find(q => q.id === id);
    if (!question) return '';
    
    return `Based on the following detailed answer to the question "${question.question}", provide a concise 1-2 sentence summary that directly answers the question with key facts.

Detailed Answer:
${detailedAnswer}

Your summary should be brief but informative, capturing the most important points from the detailed answer.
This will always be shown to the user as the Summary section.`;
  };

  // Generate a single answer
  const generateAnswer = async (questionId: string): Promise<Answer | null> => {
    try {
      console.log(`Starting answer generation for question ${questionId}`);
      setCurrentQuestion(questionId);
      
      // Initialize the active generation with empty content
      setActiveGenerations(prev => ({
        ...prev,
        [questionId]: { 
          summary: '',
          details: 'Generating detailed answer...', 
          isComplete: false 
        }
      }));
      
      // Step 1: Generate detailed answer
      console.log(`Generating details for question ${questionId}`);
      const detailsPrompt = getPromptForQuestion(questionId);
      const detailedResult = await simulateStreamingResponse(detailsPrompt, questionId);
      console.log(`Details generated for question ${questionId}, length: ${detailedResult.length} chars`);
      
      // Update progress for the detailed part and show we're generating summary
      setActiveGenerations(prev => ({
        ...prev,
        [questionId]: { 
          summary: 'Generating summary...', 
          details: detailedResult,
          isComplete: false 
        }
      }));
      
      // Step 2: Generate summary based on the detailed answer
      console.log(`Generating summary for question ${questionId} based on details`);
      const summaryPrompt = getSummaryPrompt(detailedResult, questionId);
      const summaryResponse = await chatService.sendMessage(summaryPrompt, files);
      const summaryResult = summaryResponse.text;
      console.log(`Summary generated for question ${questionId}, length: ${summaryResult.length} chars`);
      
      const answer = {
        summary: summaryResult,
        details: detailedResult,
        isEdited: false
      };
      
      // Mark generation as complete with the final answer
      setActiveGenerations(prev => ({
        ...prev,
        [questionId]: { 
          summary: summaryResult, 
          details: detailedResult, 
          isComplete: true 
        }
      }));
      
      console.log(`Completed answer generation for question ${questionId}`);
      return answer;
    } catch (err) {
      console.error(`Error generating answer for question ${questionId}:`, err);
      setError(`Failed to generate answer for question ${questionId}`);
      
      // Mark as failed
      setActiveGenerations(prev => ({
        ...prev,
        [questionId]: { 
          summary: 'Error generating response', 
          details: 'Error generating response',
          isComplete: true 
        }
      }));
      
      return null;
    }
  };
  
  // Simulate streaming content for demonstration purposes
  const simulateStreamingResponse = async (prompt: string, questionId: string): Promise<string> => {
    // Get the full response first
    const result = await chatService.sendMessage(prompt, files);
    const fullText = result.text;
    
    // Simulate streaming by updating the content in chunks
    const chunkSize = Math.ceil(fullText.length / 10);
    for (let i = 0; i <= fullText.length; i += chunkSize) {
      const partialContent = fullText.substring(0, i);
      
      // Update the streaming content
      setActiveGenerations(prev => ({
        ...prev,
        [questionId]: { 
          ...prev[questionId],
          details: partialContent 
        }
      }));
      
      // Wait a short delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`Completed streaming response for question ${questionId}`);
    return fullText;
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
        
        // Update answers state after each question is complete
        setAnswers(prevAnswers => ({
          ...prevAnswers,
          [questionId]: answer
        }));
      }
      
      // Update progress
      const newProgress = Math.round(((i + 1) / totalQuestions) * 100);
      setProgress(newProgress);
      onProgress(newProgress);
    }
    
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
          const isActivelyGenerating = activeGenerations[questionId] && !activeGenerations[questionId].isComplete;
          const partialContent = activeGenerations[questionId]?.details || '';
          
          return (
            <div 
              key={questionId}
              className={`border rounded-md p-3 transition-all ${
                isCompleted 
                  ? 'border-green-200 bg-green-50' 
                  : isCurrent 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200'
              }`}
            >
              <div className="flex items-start">
                <div className="mt-0.5 mr-3 flex-shrink-0">
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
                  
                  {/* This shows either the generation status or the partial/complete content */}
                  {isActivelyGenerating ? (
                    <div className="mt-3 text-sm border-l-2 border-blue-300 pl-3 animate-pulse">
                      {activeGenerations[questionId].summary && (
                        <div className="mb-2">
                          <span className="font-medium">Summary: </span>
                          <span className="transition-opacity duration-300 opacity-80">
                            {activeGenerations[questionId].summary}
                          </span>
                        </div>
                      )}
                      {activeGenerations[questionId].details && (
                        <div>
                          <span className="font-medium">Details: </span>
                          <div className="transition-opacity duration-300 opacity-80">
                            {activeGenerations[questionId].details}
                            <span className="inline-block w-1 h-4 ml-1 bg-blue-500 animate-pulse"></span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : isCompleted ? (
                    <div className="mt-3 text-sm">
                      <div className="mb-2">
                        <span className="font-medium">Summary: </span>
                        {answers[questionId].summary.substring(0, 100)}
                        {answers[questionId].summary.length > 100 ? '...' : ''}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-1">
                      {isCurrent ? 'Generating...' : 'Waiting...'}
                    </div>
                  )}
                </div>
                {isCompleted && (
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800 flex-shrink-0"
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