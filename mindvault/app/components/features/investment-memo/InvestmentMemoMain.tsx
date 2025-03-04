import React, { useState, useEffect } from 'react';
import { FileDown, Eye } from 'lucide-react';
import QuestionItem from './QuestionItem';
import { useInvestmentMemo, InvestmentMemoQuestion } from './hooks/useInvestmentMemo';
// Mock implementation to fix the import error
const exportToPDF = (questions: InvestmentMemoQuestion[], answers: any) => {
  console.log('Mock exportToPDF called', { questions, answers });
  // In a real implementation, this would generate and download a PDF
  alert('PDF export functionality is not available in this version.');
};
import { INVESTMENT_MEMO_QUESTIONS } from './constants';

interface InvestmentMemoProps {
  files: any[];
  onComplete?: (passed: boolean) => void;
  onAnswerUpdate?: (id: string, content: string) => void;
}

/**
 * Main component for the Investment Memo feature
 */
const InvestmentMemoMain: React.FC<InvestmentMemoProps> = ({
  files,
  onComplete,
  onAnswerUpdate
}) => {
  // Add local state for prompt
  const [localPrompt, setLocalPrompt] = useState('');
  
  const {
    isAnalyzing,
    answers,
    error,
    expandedAnswers,
    editingId,
    editedAnswer,
    promptModalVisible,
    currentPrompt,
    currentPromptId,
    setEditedAnswer,
    toggleAnswer,
    handleEdit,
    handleSave,
    analyzeDocuments,
    regenerateAnswer,
    getPromptForQuestion,
    handleViewPrompt,
    handleSavePrompt,
    closePromptModal
  } = useInvestmentMemo({
    files,
    questions: INVESTMENT_MEMO_QUESTIONS,
    onComplete,
    onAnswerUpdate
  });
  
  // Sync local prompt with current prompt
  useEffect(() => {
    setLocalPrompt(currentPrompt);
  }, [currentPrompt]);
  
  // Custom save prompt handler
  const customSavePrompt = () => {
    // Use the local prompt value when saving
    const tempCurrentPrompt = localPrompt;
    handleSavePrompt();
  };

  const handleExportPDF = () => {
    exportToPDF(INVESTMENT_MEMO_QUESTIONS, answers);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Error display */}
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}
      
      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Investment Memo</h2>
        <div className="flex space-x-4">
          <button
            onClick={analyzeDocuments}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Generate Investment Memo'}
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            disabled={Object.keys(answers).length === 0}
          >
            <FileDown size={16} className="mr-2" />
            Export PDF
          </button>
        </div>
      </div>
      
      {/* Questions */}
      <div className="space-y-4">
        {INVESTMENT_MEMO_QUESTIONS.map(({ id, question, description }) => (
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

      {/* Prompt Modal */}
      {promptModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Edit Prompt</h3>
              <button onClick={closePromptModal} className="text-gray-500 hover:text-gray-700">
                <Eye className="h-5 w-5" />
              </button>
            </div>
            <textarea
              className="w-full h-64 p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={closePromptModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={customSavePrompt}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentMemoMain; 