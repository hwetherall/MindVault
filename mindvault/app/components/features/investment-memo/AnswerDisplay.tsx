import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, RefreshCw, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatNumbersInText } from '../../../utils/textFormatting';
import ChartComponent, { ChartData } from '../../ChartComponent';

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
  questionInstructions?: string;
  finalInstructionsPrompt?: string;
  documentContext?: string;
  finalPrompt?: string;
  rawOutput?: string;
}

interface AnswerDisplayProps {
  answer: Answer | undefined;
  onEdit: () => void;
  onRegenerate: () => void;
  showPlayground?: boolean;
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
const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ answer, onEdit, onRegenerate, showPlayground = false }) => {
  // Add state to track if details are expanded
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(showPlayground);
  // Track each playground section independently
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    questionInstructions: false,
    finalInstructionsPrompt: false,
    documentContext: false,
    finalPrompt: false,
    aiOutput: false
  });

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

  // Toggle individual playground section
  const togglePlaygroundSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
    return (
      <div className="space-y-6">
        <div className="flex justify-end space-x-2">
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
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Prompt Playground</h4>
          <div className="space-y-4">
            {/* Model and Metrics */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Model:</span>
                    <span className="ml-2 text-blue-600">{answer.modelUsed || 'Not specified'}</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Time:</span>
                    <span className="ml-2 text-green-600">{answer.timeTaken ? `${(answer.timeTaken / 1000).toFixed(2)}s` : 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Input:</span>
                    <span className="ml-2 text-purple-600">{answer.messageLength ? `${answer.messageLength} tokens` : 'N/A'}</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Output:</span>
                    <span className="ml-2 text-amber-600">{answer.answerLength ? `${answer.answerLength} tokens` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Instructions */}
            <div className="rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="flex justify-between items-center cursor-pointer px-6 py-4" 
                onClick={() => togglePlaygroundSection('questionInstructions')}
              >
                <h4 className="text-sm font-semibold text-gray-700">Question Instructions</h4>
                <button className="text-gray-600 hover:text-gray-800 text-sm flex items-center">
                  {expandedSections.questionInstructions ? (
                    <>
                      <span>Hide</span>
                      <ChevronUp className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <span>Show</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
              {expandedSections.questionInstructions && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">{answer.questionInstructions || 'No instructions available'}</pre>
                </div>
              )}
            </div>

            {/* Final Instructions Prompt */}
            <div className="rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="flex justify-between items-center cursor-pointer px-6 py-4" 
                onClick={() => togglePlaygroundSection('finalInstructionsPrompt')}
              >
                <h4 className="text-sm font-semibold text-gray-700">Final Instructions Prompt</h4>
                <button className="text-gray-600 hover:text-gray-800 text-sm flex items-center">
                  {expandedSections.finalInstructionsPrompt ? (
                    <>
                      <span>Hide</span>
                      <ChevronUp className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <span>Show</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
              {expandedSections.finalInstructionsPrompt && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">{answer.finalInstructionsPrompt || 'No prompt available'}</pre>
                </div>
              )}
            </div>

            {/* Document Context */}
            <div className="rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="flex justify-between items-center cursor-pointer px-6 py-4" 
                onClick={() => togglePlaygroundSection('documentContext')}
              >
                <h4 className="text-sm font-semibold text-gray-700">Document Context</h4>
                <button className="text-gray-600 hover:text-gray-800 text-sm flex items-center">
                  {expandedSections.documentContext ? (
                    <>
                      <span>Hide</span>
                      <ChevronUp className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <span>Show</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
              {expandedSections.documentContext && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">{answer.documentContext || 'No context available'}</pre>
                </div>
              )}
            </div>

            {/* Final Prompt */}
            <div className="rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="flex justify-between items-center cursor-pointer px-6 py-4" 
                onClick={() => togglePlaygroundSection('finalPrompt')}
              >
                <h4 className="text-sm font-semibold text-gray-700">Final Prompt</h4>
                <button className="text-gray-600 hover:text-gray-800 text-sm flex items-center">
                  {expandedSections.finalPrompt ? (
                    <>
                      <span>Hide</span>
                      <ChevronUp className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <span>Show</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
              {expandedSections.finalPrompt && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">{answer.finalPrompt || 'No prompt available'}</pre>
                </div>
              )}
            </div>

            {/* AI Output */}
            <div className="rounded-lg border border-gray-200 shadow-sm">
              <div 
                className="flex justify-between items-center cursor-pointer px-6 py-4" 
                onClick={() => togglePlaygroundSection('aiOutput')}
              >
                <h4 className="text-sm font-semibold text-gray-700">AI Output</h4>
                <button className="text-gray-600 hover:text-gray-800 text-sm flex items-center">
                  {expandedSections.aiOutput ? (
                    <>
                      <span>Hide</span>
                      <ChevronUp className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <span>Show</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
              {expandedSections.aiOutput && (
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">{answer.rawOutput || 'No output available'}</pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
      </div>
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
    </div>
  );
};

export default AnswerDisplay;