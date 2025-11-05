/**
 * Answer Feedback Component
 * Allows users to provide feedback on answer quality
 */

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag } from 'lucide-react';

export interface AnswerFeedbackData {
  questionId: string;
  answerId?: string;
  feedback: 'positive' | 'negative' | 'flag';
  comment?: string;
}

interface AnswerFeedbackProps {
  questionId: string;
  answerId?: string;
  onFeedback?: (feedback: AnswerFeedbackData) => void;
  initialFeedback?: AnswerFeedbackData | null;
}

export const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({
  questionId,
  answerId,
  onFeedback,
  initialFeedback = null
}) => {
  const [feedback, setFeedback] = useState<AnswerFeedbackData | null>(initialFeedback);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const handleFeedback = (type: 'positive' | 'negative' | 'flag') => {
    const feedbackData: AnswerFeedbackData = {
      questionId,
      answerId,
      feedback: type,
      comment: comment || undefined
    };

    setFeedback(feedbackData);
    
    if (onFeedback) {
      onFeedback(feedbackData);
    }

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      const key = `feedback_${questionId}${answerId ? `_${answerId}` : ''}`;
      localStorage.setItem(key, JSON.stringify(feedbackData));
    }

    // Show comment input for negative feedback or flags
    if (type === 'negative' || type === 'flag') {
      setShowComment(true);
    } else {
      setShowComment(false);
    }
  };

  const handleSubmitComment = () => {
    if (feedback) {
      const updatedFeedback: AnswerFeedbackData = {
        ...feedback,
        comment
      };
      setFeedback(updatedFeedback);
      
      if (onFeedback) {
        onFeedback(updatedFeedback);
      }

      // Update localStorage
      if (typeof window !== 'undefined') {
        const key = `feedback_${questionId}${answerId ? `_${answerId}` : ''}`;
        localStorage.setItem(key, JSON.stringify(updatedFeedback));
      }
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
      <span className="text-xs text-gray-500 mr-2">Was this helpful?</span>
      
      <button
        onClick={() => handleFeedback('positive')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          feedback?.feedback === 'positive'
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
        }`}
        title="This answer was helpful"
      >
        <ThumbsUp className="h-3 w-3" />
        <span>Helpful</span>
      </button>

      <button
        onClick={() => handleFeedback('negative')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          feedback?.feedback === 'negative'
            ? 'bg-red-100 text-red-700 border border-red-300'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
        }`}
        title="This answer was not helpful"
      >
        <ThumbsDown className="h-3 w-3" />
        <span>Not helpful</span>
      </button>

      <button
        onClick={() => handleFeedback('flag')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          feedback?.feedback === 'flag'
            ? 'bg-orange-100 text-orange-700 border border-orange-300'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
        }`}
        title="Flag incorrect or incomplete answer"
      >
        <Flag className="h-3 w-3" />
        <span>Flag</span>
      </button>

      {(showComment || feedback?.comment) && (
        <div className="flex-1 ml-4">
          <textarea
            value={comment || feedback?.comment || ''}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Please provide more details..."
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <div className="flex justify-end mt-1">
            <button
              onClick={handleSubmitComment}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

