import React, { useState, useEffect } from 'react';
import { FileDown, PlusCircle, Pencil, Check } from 'lucide-react';
import QuestionItem from './QuestionItem';
import QuestionSelectionModal from './QuestionSelectionModal';
import { useInvestmentMemo, InvestmentMemoQuestion } from './hooks/useInvestmentMemo';
import { exportToPDF } from './utils/pdfExport';
import { ExportPDFDialog } from './ExportPDFDialog';

// Import from the new data file instead of constants
import { INVESTMENT_MEMO_QUESTIONS } from './data/questions';

interface ExportOptions {
  includeTableOfContents: boolean;
  includeAppendices: boolean;
  language: 'en' | 'ja';
  isDetailedView: boolean;
}

interface InvestmentMemoProps {
  files: any[];
  onComplete?: (passed: boolean) => void;
  onAnswerUpdate?: (id: string, summary: string, details: string) => void;
}

interface TranslatedContent {
  title: string;
  description: string;
  questions: Array<{
    id: string;
    question: string;
    description: string;
  }>;
  answers: {
    [key: string]: {
      summary: string;
      details: string;
    };
  };
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
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<TranslatedContent | null>(null);
  const [originalContent, setOriginalContent] = useState<{
    title: string;
    description: string;
    questions: InvestmentMemoQuestion[];
  } | null>(null);

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeTableOfContents: true,
    includeAppendices: true,
    language: 'en',
    isDetailedView: true
  });
  // State for selected question IDs
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  // State to track IDs that should be analyzed immediately after selection
  const [pendingAnalysisIds, setPendingAnalysisIds] = useState<string[]>([]);
  const [title, setTitle] = useState('Investment Memo');
  const [description, setDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [tempDescription, setTempDescription] = useState(description);
  
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

  const handleExportPDF = async () => {
    setIsExportDialogOpen(true);
  };

  // Store original content when questions are selected
  useEffect(() => {
    if (filteredQuestions.length > 0 && !originalContent) {
      setOriginalContent({
        title,
        description,
        questions: filteredQuestions
      });
    }
  }, [filteredQuestions, title, description]);

  const handleLanguageChange = async (newLanguage: 'en' | 'ja') => {
    if (newLanguage === 'ja' && !translatedContent) {
      setIsTranslating(true);
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: {
              title,
              description,
              questions: filteredQuestions.map(q => ({
                id: q.id,
                question: q.question,
                description: q.description,
                category: q.category
              })),
              answers: Object.entries(answers).map(([id, answer]) => ({
                id,
                summary: answer.summary,
                details: answer.details,
                isEdited: answer.isEdited
              }))
            },
            targetLanguage: 'ja'
          }),
        });

        if (!response.ok) {
          throw new Error('Translation failed');
        }

        const translatedData = await response.json();
        setTranslatedContent(translatedData);
      } catch (error) {
        console.error('Translation error:', error);
        // Handle error appropriately
      } finally {
        setIsTranslating(false);
      }
    } else if (newLanguage === 'en') {
      setTranslatedContent(null);
    }
    setExportOptions(prev => ({ ...prev, language: newLanguage }));
  };

  // Get the current content based on language
  const getCurrentContent = () => {
    if (exportOptions.language === 'ja' && translatedContent) {
      return {
        title: translatedContent.title,
        description: translatedContent.description,
        questions: translatedContent.questions,
        answers: translatedContent.answers
      };
    }
    return {
      title,
      description,
      questions: filteredQuestions,
      answers
    };
  };

  const currentContent = getCurrentContent();

  const handleExportPDFPopup = async () => {
    const contentToExport = exportOptions.language === 'ja' && translatedContent
      ? {
          questions: translatedContent.questions,
          answers: translatedContent.answers,
          title: translatedContent.title,
          description: translatedContent.description
        }
      : {
          questions: filteredQuestions,
          answers,
          title,
          description
        };

    await exportToPDF(
      contentToExport.questions,
      contentToExport.answers,
      contentToExport.title,
      contentToExport.description,
      exportOptions
    );
    setIsExportDialogOpen(false);
    if (onComplete) {
      onComplete(true);
    }
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

  const handleTitleEdit = () => {
    setTempTitle(title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    // Only update if tempTitle is not empty, otherwise keep the previous title
    setTitle(tempTitle.trim() || title);
    setIsEditingTitle(false);
  };

  const handleDescriptionEdit = () => {
    setTempDescription(description);
    setIsEditingDescription(true);
  };

  const handleDescriptionSave = () => {
    setDescription(tempDescription);
    setIsEditingDescription(false);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="text-2xl font-semibold text-[#1A1F2E] bg-transparent border-b border-[#F15A29] outline-none pb-1"
                  autoFocus
                />
                <button
                  onClick={handleTitleSave}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <Check size={18} />
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-[#1A1F2E]">{currentContent.title}</h2>
                <button
                  onClick={handleTitleEdit}
                  className="p-1 text-[#F15A29] hover:text-[#D94315]"
                >
                  <Pencil size={16} />
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportPDF}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
                isAnalyzing || loading > 0 || total === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              disabled={isAnalyzing || loading > 0 || total === 0}
            >
              <FileDown size={18} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-start gap-2">
          {isEditingDescription ? (
            <>
              <input
                type="text"
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                placeholder="Add a description..."
                className="flex-1 text-base text-gray-600 bg-transparent border-b border-[#F15A29] outline-none pb-1 italic font-normal"
                autoFocus
              />
              <button
                onClick={handleDescriptionSave}
                className="p-1 text-green-600 hover:text-green-700"
              >
                <Check size={16} />
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center">
              <p className="text-base text-gray-600 italic font-normal">
                {currentContent.description || <span className="text-gray-400">Add a description...</span>}
              </p>
              <button
                onClick={handleDescriptionEdit}
                className="p-1 text-[#F15A29] hover:text-[#D94315] ml-1"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
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
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Questions Selected</h3>
          <p className="text-base text-gray-500 mb-4">
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
                  <h3 className="text-xl font-semibold border-b pb-2 mb-4">{category}</h3>
                  <div className="space-y-6">
                    {currentContent.questions.map(question => (
                      <QuestionItem
                        key={question.id}
                        id={question.id}
                        question={question.question}
                        description={question.description}
                        answer={currentContent.answers[question.id]}
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

      {/* Export PDF Dialog */}
      {isExportDialogOpen && (
        <ExportPDFDialog
          onClose={() => setIsExportDialogOpen(false)}
          onExport={handleExportPDFPopup}
          options={exportOptions}
          onOptionsChange={setExportOptions}
          onLanguageChange={handleLanguageChange}
          isTranslating={isTranslating}
        />
      )}
    </div>
  );
};

export default InvestmentMemoMain; 