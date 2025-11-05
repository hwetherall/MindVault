import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatNumbersInText } from '../../../utils/textFormatting';
import ChartComponent, { ChartData } from '../../ChartComponent';
import PromptPlayground from './PromptPlayground';
import { AnswerFeedback } from './AnswerFeedback';

// Define the Answer interface locally 
interface Answer {
  summary: string;
  details: string;
  isEdited?: boolean;
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

interface AnswerDisplayProps {
  answer: Answer | undefined;
  onEdit: () => void;
  onRegenerate: () => void;
  showPlayground?: boolean;
  onInstructionsChange?: (value: string) => void;
  questionId?: string;
  currentInstructions?: string;
}

/**
 * Removes asterisks from text content
 */
const removeAsterisks = (text: string): string => {
  if (!text) return '';
  return text.replace(/^\*\*\s*/gm, '').replace(/\s*\*\*$/gm, '');
};

/**
 * Component for displaying an answer with formatting
 */
const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ 
  answer, 
  onEdit, 
  onRegenerate, 
  showPlayground = false,
  onInstructionsChange,
  currentInstructions,
  questionId
}) => {
  // Add state to track if details are expanded
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(showPlayground);

  // Auto-expand details when playground is opened
  React.useEffect(() => {
    if (showPlayground) {
      setIsDetailsExpanded(true);
    }
  }, [showPlayground]);

  // Toggle details expansion
  const toggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  // Add debug logging for chart data
  React.useEffect(() => {
    if (answer?.chartData) {
      console.log("AnswerDisplay received chart data:", JSON.stringify(answer.chartData, null, 2));
    }
  }, [answer?.chartData]);

  if (!answer) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">No answer generated yet.</p>
      </div>
    );
  }

  // Show loading state
  if (answer.isLoading) {
    const modelInfo = (answer as any).modelInfo || { displayName: 'Analyzing documents...', id: 'unknown' };
    const progress = (answer as any).progress || 0;
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span>{modelInfo.displayName || 'Analyzing...'}</span>
            {modelInfo.id && modelInfo.id !== 'unknown' && (
              <span className="text-xs text-gray-500">({modelInfo.id})</span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              disabled
              className="flex items-center text-sm px-3 py-1 rounded bg-gray-100 opacity-50 cursor-not-allowed"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </button>
            <button
              disabled
              className="flex items-center text-sm px-3 py-1 rounded bg-gray-100 opacity-50 cursor-not-allowed"
            >
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Regenerating
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        {progress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Loading Summary Skeleton */}
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
          <h4 className="text-sm font-semibold text-blue-700 mb-3">
            Summary
            <span className="inline-flex ml-2">
              <span className="animate-bounce mr-1">•</span>
              <span className="animate-bounce delay-150 mr-1">•</span>
              <span className="animate-bounce delay-300">•</span>
            </span>
          </h4>
          <div className="text-sm text-gray-800">
            <div className="h-4 bg-blue-100 rounded animate-pulse mb-2 w-3/4"></div>
            <div className="h-4 bg-blue-100 rounded animate-pulse w-1/2"></div>
          </div>
        </div>

        {/* Loading Details Skeleton */}
        <div className="p-4 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Details
            <span className="inline-flex ml-2">
              <span className="animate-bounce mr-1">•</span>
              <span className="animate-bounce delay-150 mr-1">•</span>
              <span className="animate-bounce delay-300">•</span>
            </span>
          </h4>
          <div className="text-sm text-gray-800">
            <div className="h-4 bg-gray-100 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-5/6"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-4/5"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  // Clean the summary and details by removing asterisks first
  const cleanSummary = removeAsterisks(answer.summary);
  const cleanDetails = removeAsterisks(answer.details);
  
  // Then format the numbers
  const formattedSummary = formatNumbersInText(cleanSummary);
  const formattedDetails = formatNumbersInText(cleanDetails);

  // Debug log for chart data rendering
  if (answer.chartData) {
    console.log("Rendering chart component with data:", 
      JSON.stringify({
        type: answer.chartData.type,
        title: answer.chartData.title,
        dataPoints: answer.chartData.data.datasets[0].data.length,
        labels: answer.chartData.data.labels
      }, null, 2)
    );
  }

  // Render Prompt Playground if enabled
  if (showPlayground) {
    return (
      <PromptPlayground
        answer={answer}
        onRegenerate={onRegenerate}
        onInstructionsChange={onInstructionsChange}
        currentInstructions={currentInstructions}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
        <h4 className="text-sm font-semibold text-blue-700 mb-2">Summary</h4>
        <div className="text-base text-gray-800">
          <ReactMarkdown>{formattedSummary}</ReactMarkdown>
        </div>
      </div>
      
      {/* Chart visualization if available */}
      {answer.chartData && (
        <ChartComponent chartData={answer.chartData} height={350} />
      )}

      {/* Details Section (if available) */}
      {formattedDetails && (
        <div className="rounded-lg border border-gray-200 shadow-sm">
          <div 
            className="flex justify-between items-center cursor-pointer p-4" 
            onClick={toggleDetails}
          >
            <h4 className="text-sm font-semibold text-gray-700">Details</h4>
            <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
              {isDetailsExpanded ? (
                <>
                  <span>Hide details</span>
                  <ChevronUp className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  <span>Show details</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          </div>
          
          {/* Only render the content when expanded */}
          {isDetailsExpanded && (
            <div className="p-4 border-t border-gray-200 text-base text-gray-800 prose prose-sm max-w-none">
              <ReactMarkdown>{formattedDetails}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
      
      {/* Action Buttons - Moved to bottom for better flow */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={onEdit}
          className="flex items-center text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
          <Edit2 className="h-3 w-3 mr-1" />
          Edit
        </button>
        <button
          onClick={onRegenerate}
          className="flex items-center text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Regenerate
        </button>
      </div>

      {/* Feedback Component */}
      {questionId && (
        <AnswerFeedback
          questionId={questionId}
          onFeedback={async (feedback) => {
            // Send feedback to API
            try {
              await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...feedback,
                  answerText: answer.details,
                  questionText: questionId
                })
              });
            } catch (error) {
              console.error('Failed to submit feedback:', error);
            }
          }}
        />
      )}
    </div>
  );
};

export default AnswerDisplay;