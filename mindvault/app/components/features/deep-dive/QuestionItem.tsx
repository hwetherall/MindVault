import React from 'react';
import { ChevronDown, ChevronUp, Edit2, RefreshCw } from 'lucide-react';
import { Answer } from './utils/types';

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
 * Component for displaying an individual deep dive question with its answer
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
            <div className="space-y-4">
              <textarea
                className="w-full h-64 p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editedAnswer}
                onChange={(e) => setEditedAnswer(e.target.value)}
                placeholder="Enter your answer here..."
              />
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => onEdit('')}
                  className="flex items-center text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSave(id, editedAnswer)}
                  className="flex items-center text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => onEdit(id)}
                  className="flex items-center text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => onRegenerate(id)}
                  className="flex items-center text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate
                </button>
              </div>
              
              {answer ? (
                <div className="prose prose-sm max-w-none">
                  {answer.content.split('\n').map((line, i) => (
                    <p key={i} className="my-1">{line}</p>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="text-gray-500">No answer generated yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionItem; 