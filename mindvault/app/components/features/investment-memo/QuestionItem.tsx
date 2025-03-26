import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, RefreshCw, Code, Trash2 } from 'lucide-react';
import { Answer as BaseAnswer } from './utils/pdfExport';
import AnswerDisplay from './AnswerDisplay';
import EditAnswer from './EditAnswer';
import { InvestmentMemoQuestion } from './utils/pdfExport';
import PromptPlayground from './PromptPlayground';

// Extend the base Answer type to include additional fields
interface Answer extends BaseAnswer {
  finalInstructions?: string;
  documentContext?: string;
  finalPrompt?: string;
  rawOutput?: string;
}

interface QuestionItemProps {
  question: {
    id: string;
    question: string;
    description: string;
    category?: string;
    subcategory?: string;
    complexity?: 'low' | 'medium' | 'high';
    recommended?: string[];
  };
  children?: React.ReactNode;
  answer?: Answer;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (id: string) => void;
  onSave: (id: string, content: string) => void;
  onRegenerate: (customPrompt?: string) => void;
  onDelete: (id: string) => void;
  editedAnswer: string;
  setEditedAnswer: (answer: string) => void;
  showPlayground?: boolean;
}

/**
 * Component for displaying an individual investment memo question with its answer
 */
const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  children,
  answer,
  isExpanded,
  onToggle,
  onRegenerate,
  onEdit,
  onSave,
  onDelete,
  editedAnswer,
  setEditedAnswer,
  showPlayground = false
}) => {
  // Helper functions to check loading state safely
  const isAnswerLoading = answer && (answer as any).isLoading === true;
  const isAnswerGenerated = answer && !isAnswerLoading;
  const isEditing = editedAnswer !== '';

  // Add state for playground and edited instructions
  const [showPlaygroundState, setShowPlaygroundState] = React.useState(showPlayground);
  const [editedInstructions, setEditedInstructions] = React.useState<string | undefined>(undefined);

  // Handle regenerate with current instructions
  const handleRegenerate = () => {
    // Use edited instructions if available, otherwise use original
    const promptToUse = editedInstructions !== undefined ? editedInstructions : answer?.finalInstructions;
    onRegenerate(promptToUse);
  };

  // Handle instructions change
  const handleInstructionsChange = (value: string) => {
    setEditedInstructions(value);
  };

  // Determine card elevation based on state
  const cardClasses = `border rounded-lg overflow-hidden mb-6 transition-all duration-200 ${
    isExpanded 
      ? 'shadow-md border-blue-200' 
      : 'shadow-sm hover:shadow-md border-gray-200'
  }`;

  // Get a preview of the answer summary for collapsed state
  const getSummaryPreview = () => {
    if (!answer || !answer.summary) return 'No answer generated yet';
    const summaryText = answer.summary;
    if (summaryText.length <= 100) return summaryText;
    return summaryText.slice(0, 100) + '...';
  };

  return (
    <div className={cardClasses}>
      {/* Question Header */}
      <div 
        onClick={onToggle}
        className="p-4 bg-white flex justify-between items-center cursor-pointer"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-medium text-gray-900">{question.question}</h4>
            {/* Status indicator */}
            {isAnswerLoading ? (
              <div className="flex items-center gap-1.5 text-blue-600 text-xs ml-4 px-2.5 py-0.5 rounded-full border border-blue-200 bg-blue-50">
                <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span>Analyzing...</span>
              </div>
            ) : isAnswerGenerated ? (
              <div className="text-green-600 text-xs flex items-center gap-1.5 ml-4 px-2.5 py-0.5 rounded-full border border-green-200 bg-green-50">
                <div className="h-2.5 w-2.5 rounded-full bg-green-600"></div>
                <span>Complete</span>
              </div>
            ) : null}
          </div>
          <p className="text-sm text-gray-600 mt-1">{question.description}</p>
          {!isExpanded && isAnswerGenerated && (
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{getSummaryPreview()}</p>
          )}
        </div>
        <div className="flex items-center ml-4">
          {/* Delete button - always show */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to remove "${question.question}"?`)) {
                onDelete(question.id);
              }
            }}
            className="p-1 text-red-500 hover:text-red-700 mr-2"
            title="Remove question"
          >
            <Trash2 size={18} />
          </button>
          
          {isAnswerGenerated && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPlaygroundState(!showPlaygroundState);
                }}
                className={`p-1 mr-2 ${
                  showPlaygroundState 
                    ? 'text-purple-600 hover:text-purple-800' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Toggle Prompt Playground"
              >
                <Code size={18} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(question.id);
                }}
                className="p-1 text-blue-600 hover:text-blue-800 mr-2"
                title="Edit answer"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRegenerate();
                }}
                className="p-1 text-blue-600 hover:text-blue-800 mr-2"
                title="Regenerate answer"
                disabled={isAnswerLoading}
              >
                <RefreshCw size={18} className={isAnswerLoading ? "animate-spin" : ""} />
              </button>
            </>
          )}
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Answer Content */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          {isAnswerLoading ? (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span>Generating answer...</span>
            </div>
          ) : isEditing ? (
            <EditAnswer 
              value={editedAnswer}
              onChange={setEditedAnswer}
              onSave={() => onSave(question.id, editedAnswer)}
              onCancel={() => onEdit('')}
            />
          ) : isAnswerGenerated ? (
            <AnswerDisplay 
              answer={answer}
              onEdit={() => onEdit(question.id)}
              onRegenerate={handleRegenerate}
              showPlayground={showPlaygroundState}
              onInstructionsChange={handleInstructionsChange}
              currentInstructions={editedInstructions || answer?.finalInstructions}
            />
          ) : (
            <div>
              <button
                onClick={handleRegenerate}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Generate Answer
              </button>
            </div>
          )}
          {showPlayground && answer && (
            <PromptPlayground
              answer={answer}
              onRegenerate={handleRegenerate}
              onInstructionsChange={handleInstructionsChange}
              currentInstructions={editedInstructions || answer?.finalInstructions}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionItem;