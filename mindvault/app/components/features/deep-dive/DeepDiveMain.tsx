import React from 'react';
import QuestionItem from './QuestionItem';
import { useDeepDive } from './hooks/useDeepDive';
import { DEEP_DIVE_QUESTIONS } from './constants';
import ErrorBoundary from '../../ErrorBoundary';

interface DeepDiveProps {
  files: any[];
  onComplete?: (passed: boolean) => void;
}

/**
 * Main component for the Deep Dive feature
 */
const DeepDiveMain: React.FC<DeepDiveProps> = ({
  files,
  onComplete
}) => {
  const {
    isAnalyzing,
    answers,
    error,
    expandedAnswers,
    editingId,
    editedAnswer,
    setEditedAnswer,
    toggleAnswer,
    handleEdit,
    handleSave,
    analyzeDocuments,
    regenerateAnswer
  } = useDeepDive({
    files,
    questions: DEEP_DIVE_QUESTIONS,
    onComplete
  });

  return (
    <ErrorBoundary>
      <div className="p-4 space-y-6">
        {/* Error display */}
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}
        
        {/* Controls */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Deep Dive Analysis</h2>
          <button
            onClick={analyzeDocuments}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Generate Analysis'}
          </button>
        </div>
        
        {/* Questions */}
        <div className="space-y-4">
          {DEEP_DIVE_QUESTIONS.map(({ id, question, description }) => (
            <QuestionItem
              key={id}
              id={id}
              question={question}
              description={description}
              answer={answers[id]}
              isExpanded={expandedAnswers[id] || false}
              isEditing={editingId === id}
              onToggle={toggleAnswer}
              onEdit={handleEdit}
              onSave={handleSave}
              onRegenerate={regenerateAnswer}
              editedAnswer={editedAnswer}
              setEditedAnswer={setEditedAnswer}
            />
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DeepDiveMain; 