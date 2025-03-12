import React, { useState, useEffect } from 'react';
import { FileDown, PlusCircle } from 'lucide-react';
import QuestionItem from './QuestionItem';
import QuestionSelectionModal from './QuestionSelectionModal';
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
  onAnswerUpdate?: (id: string, summary: string, details: string) => void;
}

/**
 * Main component for the Investment Memo feature
 */
const InvestmentMemoMain: React.FC<InvestmentMemoProps> = ({
  files,
  onComplete,
  onAnswerUpdate
}) => {
  // State for question selection modal
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  // State for selected question IDs
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  // State to track IDs that should be analyzed immediately after selection
  const [pendingAnalysisIds, setPendingAnalysisIds] = useState<string[]>([]);
  
  // Filtered questions based on selection
  const filteredQuestions = selectedQuestionIds.length > 0
    ? INVESTMENT_MEMO_QUESTIONS.filter(q => selectedQuestionIds.includes(q.id))
    : [];
  
  // Custom wrapper for onAnswerUpdate to handle both summary and details
  const handleAnswerUpdate = (id: string, summary: string, details: string) => {
    if (onAnswerUpdate) {
      onAnswerUpdate(id, summary, details);
    }
  };
  
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
    analyzeSelectedQuestions,
    regenerateAnswer
  } = useInvestmentMemo({
    files,
    questions: filteredQuestions, 
    onComplete,
    onAnswerUpdate: handleAnswerUpdate
  });
  
  // Effect to handle analyzing questions after state updates have completed
  useEffect(() => {
    if (pendingAnalysisIds.length > 0) {
      // Ensure the filtered questions includes the questions we want to analyze
      const readyToAnalyze = pendingAnalysisIds.every(id => 
        filteredQuestions.some(q => q.id === id)
      );
      
      if (readyToAnalyze) {
        // Now it's safe to analyze
        analyzeSelectedQuestions(pendingAnalysisIds);
        // Clear the pending analysis queue
        setPendingAnalysisIds([]);
      }
    }
  }, [pendingAnalysisIds, filteredQuestions, analyzeSelectedQuestions]);
  
  // Handle question selection submission
  const handleQuestionSelection = (selectedIds: string[], immediatelyAnalyze: boolean) => {
    // Find newly added questions (questions that weren't selected before)
    const previouslySelectedIds = selectedQuestionIds;
    const newlyAddedIds = selectedIds.filter(id => !previouslySelectedIds.includes(id));
    
    // Update the selection
    setSelectedQuestionIds(selectedIds);
    
    // If immediate analysis is requested and there are new questions, queue them for analysis
    if (immediatelyAnalyze && newlyAddedIds.length > 0) {
      setPendingAnalysisIds(newlyAddedIds);
    }
  };

  const handleExportPDF = () => {
    exportToPDF(filteredQuestions, answers);
  };

  // Get the counts of answered, loading and total questions
  const getQuestionStatusCounts = () => {
    let answered = 0;
    let loading = 0;
    const total = filteredQuestions.length;
    
    filteredQuestions.forEach(q => {
      if (answers[q.id]) {
        if (answers[q.id].isLoading) {
          loading++;
        } else {
          answered++;
        }
      }
    });
    
    return { answered, loading, total };
  };

  const { answered, loading, total } = getQuestionStatusCounts();

  // Get questions grouped by category
  const getQuestionsGroupedByCategory = () => {
    const grouped: { [key: string]: InvestmentMemoQuestion[] } = {};
    
    filteredQuestions.forEach(question => {
      const category = question.category || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(question);
    });
    
    return grouped;
  };

  const groupedQuestions = getQuestionsGroupedByCategory();
  const categories = Object.keys(groupedQuestions);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#1A1F2E]">Investment Memo</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            disabled={isAnalyzing || loading > 0 || total === 0}
          >
            <FileDown size={18} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Status Information */}
      <div className="mb-6">
        <button 
          onClick={() => setIsSelectionModalOpen(true)}
          className="flex items-center gap-2 bg-[#F15A29] text-white px-4 py-2 rounded-lg hover:bg-[#D94315] mb-4"
        >
          <PlusCircle size={18} />
          <span>{selectedQuestionIds.length === 0 ? 'Select Questions' : 'Add or Remove Questions'}</span>
        </button>
        
        {loading > 0 && (
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-1"></div>
            <span>Analyzing {loading} question{loading > 1 ? 's' : ''}...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
      </div>

      {selectedQuestionIds.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <h3 className="text-xl font-medium text-gray-600 mb-2">No Questions Selected</h3>
          <p className="text-gray-500 mb-4">
            Start by selecting investment questions to analyze your documents
          </p>
          <button 
            onClick={() => setIsSelectionModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#F15A29] text-white px-4 py-2 rounded-lg hover:bg-[#D94315]"
          >
            <PlusCircle size={18} />
            <span>Select Questions</span>
          </button>
        </div>
      ) : (
        <div>
          {categories.length > 0 && (
            <div className="space-y-8">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="text-lg font-semibold border-b pb-2 mb-4">{category}</h3>
                  <div className="space-y-6">
                    {groupedQuestions[category].map(question => (
                      <QuestionItem
                        key={question.id}
                        id={question.id}
                        question={question.question}
                        description={question.description}
                        answer={answers[question.id]}
                        isExpanded={expandedAnswers[question.id] || false}
                        isEditing={editingId === question.id}
                        editedAnswer={editingId === question.id ? editedAnswer : ''}
                        setEditedAnswer={setEditedAnswer}
                        onToggle={toggleAnswer}
                        onEdit={handleEdit}
                        onSave={(id, content) => handleSave(id)}
                        onRegenerate={regenerateAnswer}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Question Selection Modal */}
      <QuestionSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onSubmit={handleQuestionSelection}
        initialSelections={selectedQuestionIds}
      />
    </div>
  );
};

export default InvestmentMemoMain; 