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
  setEditedAnswer
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
    if (!answer || isAnswerLoading || !answer.summary) return '';
    
    const summary = answer.summary;
    if (summary.length <= 80) return summary;
    return summary.substring(0, 80) + '...';
  };

  return (
    <div className={cardClasses}>
      {/* Question header */}
      <div 
        className={`p-4 bg-gradient-to-r ${
          isExpanded 
            ? 'from-blue-50 to-white' 
            : 'from-gray-50 to-white'
        } cursor-pointer flex justify-between items-center`}
        onClick={() => onToggle(id)}
      >
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-800">{question}</h3>
          {description && !isExpanded && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
          
          {/* Preview of answer when collapsed */}
          {!isExpanded && isAnswerGenerated && (
            <p className="text-sm text-gray-600 mt-2 italic">
              {getSummaryPreview()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {isAnswerGenerated && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              answer.isEdited 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {answer.isEdited ? 'Edited' : 'AI Generated'}
            </span>
          )}
          {isAnswerLoading && (
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full flex items-center">
              <div className="animate-spin h-3 w-3 border-2 border-yellow-500 border-t-transparent rounded-full mr-1"></div>
              Processing
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      {/* Description when expanded */}
      {isExpanded && description && (
        <div className="px-4 pt-1 pb-3 bg-gray-50 border-t border-b">
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      )}
      
      {/* Answer section */}
      {isExpanded && (
        <div className="p-5 bg-white">
          {isEditing ? (
            <EditAnswer 
              value={editedAnswer}
              onChange={setEditedAnswer}
              onSave={() => onSave(id, editedAnswer)}
              onCancel={() => onEdit('')}
            />
          ) : (
            <AnswerDisplay 
              answer={answer}
              onEdit={() => onEdit(id)}
              onRegenerate={() => onRegenerate(id)}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionItem;