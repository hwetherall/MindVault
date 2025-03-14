import React from 'react';
import { ChevronDown, ChevronUp, Edit2, RefreshCw } from 'lucide-react';
import { Answer } from './utils/pdfExport';
import AnswerDisplay from './AnswerDisplay';
import EditAnswer from './EditAnswer';

interface QuestionItemProps {
  id: string;
  question: string;
  description: string;
  answer: Answer | undefined;
  isExpanded: boolean;
  isEditing: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onSave: (id: string, content: string) => void;
  onRegenerate: (id: string) => void;
  editedAnswer: string;
  setEditedAnswer: (content: string) => void;
  children?: React.ReactNode;
}

/**
 * Component for displaying an individual investment memo question with its answer
 */
const QuestionItem: React.FC<QuestionItemProps> = ({
  id,
  question,
  description,
  answer,
  isExpanded,
  isEditing,
  onToggle,
  onEdit,
  onSave,
  onRegenerate,
  editedAnswer,
  setEditedAnswer,
  children
}) => {
  // Helper functions to check loading state safely
  const isAnswerLoading = answer && (answer as any).isLoading === true;
  const isAnswerGenerated = answer && !isAnswerLoading;

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
        onClick={() => onToggle(id)}
        className="p-4 bg-white flex justify-between items-center cursor-pointer"
      >
        <div>
          <h4 className="text-lg font-medium text-gray-900">{question}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="flex items-center">
          {isAnswerGenerated && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(id);
                }}
                className="p-1 text-blue-600 hover:text-blue-800 mr-2"
                title="Edit answer"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate(id);
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
          {/* Display model indicator if provided */}
          {children}
          
          {isAnswerLoading ? (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span>Generating answer...</span>
            </div>
          ) : isEditing ? (
            <EditAnswer 
              value={editedAnswer}
              onChange={setEditedAnswer}
              onSave={() => onSave(id, editedAnswer)}
              onCancel={() => onEdit('')}
            />
          ) : isAnswerGenerated ? (
            <AnswerDisplay 
              answer={answer}
              onEdit={() => onEdit(id)} 
              onRegenerate={() => onRegenerate(id)}
            />
          ) : (
            <div>
              <button
                onClick={() => onRegenerate(id)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Generate Answer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionItem;