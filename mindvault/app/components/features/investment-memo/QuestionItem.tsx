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
  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      {/* Question header */}
      <div 
        className="p-3 bg-gray-50 cursor-pointer flex justify-between items-center"
        onClick={() => onToggle(id)}
      >
        <div className="flex-1">
          <h3 className="text-md font-medium">{question}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {answer && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {answer.isEdited ? 'Edited' : 'AI Generated'}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>
      
      {/* Answer section */}
      {isExpanded && (
        <div className="p-4 bg-white border-t">
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