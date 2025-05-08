import React from 'react';
import { Clock, CheckCircle, MessageSquare } from 'lucide-react';

interface IterationHistoryProps {
  iterations: {
    index: number;
    questions: string[];
    timestamp?: string;
    isComplete: boolean;
  }[];
  activeIteration: number;
  onSelectIteration: (index: number) => void;
}

const IterationHistory: React.FC<IterationHistoryProps> = ({
  iterations,
  activeIteration,
  onSelectIteration
}) => {
  if (iterations.length <= 1) return null;
  
  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Iteration History</h4>
      <div className="flex flex-wrap gap-2">
        <button
          key="original"
          onClick={() => onSelectIteration(0)}
          className={`flex items-center px-3 py-1.5 text-xs rounded-full transition-colors ${
            activeIteration === 0
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
          }`}
        >
          <CheckCircle size={12} className="mr-1" />
          Original Analysis
        </button>
        
        {iterations.slice(1).map((iteration) => (
          <button
            key={`iteration-${iteration.index}`}
            onClick={() => onSelectIteration(iteration.index)}
            className={`flex items-center px-3 py-1.5 text-xs rounded-full transition-colors ${
              activeIteration === iteration.index
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            {iteration.isComplete ? (
              <CheckCircle size={12} className="mr-1" />
            ) : (
              <Clock size={12} className="mr-1" />
            )}
            <span>Follow-up {iteration.index}</span>
            <span className="ml-1 text-xs bg-gray-200 text-gray-700 rounded-full px-1.5">
              {iteration.questions.length}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default IterationHistory; 