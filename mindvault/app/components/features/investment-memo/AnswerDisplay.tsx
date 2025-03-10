import React from 'react';
import { Edit2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Answer } from './utils/pdfExport';
import { formatNumbersInText, splitAnswerContent } from '../../../utils/formatters';

interface AnswerDisplayProps {
  answer: Answer | undefined;
  onEdit: () => void;
  onRegenerate: () => void;
}

/**
 * Component for displaying an answer with formatting
 */
const AnswerDisplay: React.FC<AnswerDisplayProps> = ({ answer, onEdit, onRegenerate }) => {
  if (!answer) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">No answer generated yet.</p>
      </div>
    );
  }

  const { tldr, details } = splitAnswerContent(answer.content);
  const formattedTldr = formatNumbersInText(tldr);
  const formattedDetails = formatNumbersInText(details);

  return (
    <div className="space-y-4">
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

      {/* TLDR Section */}
      <div className="bg-blue-50 p-3 rounded">
        <h4 className="text-sm font-semibold text-blue-700 mb-2">TL;DR</h4>
        <div className="text-sm text-gray-800">
          <ReactMarkdown>{formattedTldr}</ReactMarkdown>
        </div>
      </div>

      {/* Details Section (if available) */}
      {formattedDetails && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Details</h4>
          <div className="text-sm text-gray-800 prose prose-sm max-w-none">
            <ReactMarkdown>{formattedDetails}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerDisplay; 