import React, { useState, useEffect } from 'react';
import { FileDown, PlusCircle, Pencil, Check, RefreshCw } from 'lucide-react';
import QuestionItem from './QuestionItem';
import QuestionSelectionModal from './QuestionSelectionModal';
import TemplateSelectionModal from './TemplateSelectionModal';
import { useInvestmentMemo, InvestmentMemoQuestion } from './hooks/useInvestmentMemo';
import { exportToPDF, Answer } from './utils/pdfExport';
import { ExportPDFDialog } from './ExportPDFDialog';

// Import from the new data file instead of constants
import { INVESTMENT_MEMO_QUESTIONS } from './data/questions';
import { TEMPLATES } from './data/templates';

// Local FastModeToggle component to avoid import issues
interface FastModeToggleProps {
  fastMode: boolean;
  setFastMode: (mode: boolean) => void;
}

const FastModeToggle: React.FC<FastModeToggleProps> = ({ fastMode, setFastMode }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
        <button
          onClick={() => setFastMode(!fastMode)}
          className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-all ${
            fastMode 
              ? 'bg-amber-100 text-amber-700 shadow-sm border border-amber-200' 
              : 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
          }`}
          aria-pressed={fastMode}
          title={fastMode ? "Fast mode: Quick answers but less thorough" : "Normal mode: More detailed and thorough analysis"}
        >
          <span>{fastMode ? 'Fast Mode' : 'Normal Mode'}</span>
        </button>
        
        <span className="text-xs text-gray-600">
          {fastMode 
            ? 'Quick analysis'
            : 'Detailed analysis'
          }
        </span>
      </div>
    </div>
  );
};

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
    category: string;
  }>;
  answers: {
    [key: string]: {
      summary: string;
      details: string;
    };
  };
}

// Extend Answer type to include model information
interface AnswerWithModel extends Answer {
  modelUsed?: string;
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
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<TranslatedContent | null>(null);
  const [originalContent, setOriginalContent] = useState<{
    title: string;
    description: string;
    questions: InvestmentMemoQuestion[];
  } | null>(null);

  // Add fast mode state with default value (false)
  const [fastMode, setFastMode] = useState(false);
  
  // Use useEffect to safely access localStorage after component mounts
  useEffect(() => {
    // Check if localStorage is available (client-side only)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fastMode');
      if (saved === 'true') {
        setFastMode(true);
      }
    }
  }, []);
  
  // Update localStorage when the mode changes
  const handleSetFastMode = (value: boolean) => {
    setFastMode(value);
    // Check if localStorage is available
    if (typeof window !== 'undefined') {
      localStorage.setItem('fastMode', value.toString());
    }
  };
  
  // Model information
  const modelInfo = {
    normal: {
      id: "deepseek-r1-distill-llama-70b",
      description: "More detailed analysis",
      displayName: "The Innovera Tortoise is methodically examining every detail in your documents."
    },
    fast: {
      id: "llama-3.2-3b-preview",
      description: "Faster responses",
      displayName: "The Innovera Hare is racing through your documents to find quick answers."
    }
  };
  
  // Get current model based on mode
  const getCurrentModel = () => fastMode ? modelInfo.fast.id : modelInfo.normal.id;

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeTableOfContents: true,
    includeAppendices: true,
    language: 'en',
    isDetailedView: true
  });
  // State for selected question IDs
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('investmentMemoSelectedQuestions');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  // State to track IDs that should be analyzed immediately after selection
  const [pendingAnalysisIds, setPendingAnalysisIds] = useState<string[]>([]);
  const [title, setTitle] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('investmentMemoTitle') || 'Investment Memo';
    }
    return 'Investment Memo';
  });
  const [description, setDescription] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('investmentMemoDescription') || '';
    }
    return '';
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [tempDescription, setTempDescription] = useState(description);
  
  // Add state for custom questions
  const [customQuestions, setCustomQuestions] = useState<InvestmentMemoQuestion[]>([]);
  
  // Modify the filteredQuestions to include custom questions
  const filteredQuestions = selectedQuestionIds.length > 0
    ? [...INVESTMENT_MEMO_QUESTIONS, ...customQuestions].filter(q => selectedQuestionIds.includes(q.id))
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
    analyzeSelectedQuestions: originalAnalyzeSelectedQuestions,
    regenerateAnswer: originalRegenerateAnswer
  } = useInvestmentMemo({
    files,
    questions: filteredQuestions, 
    onComplete,
    onAnswerUpdate: handleAnswerUpdate,
    fastMode
  });

  // Get loading status from answers
  const getLoadingQuestions = () => {
    return Object.entries(answers).filter(([_, answer]) => 
      (answer as any).isLoading === true
    ).length;
  };
  
  const loading = getLoadingQuestions();
  
  // Get total number of questions
  const total = filteredQuestions.length;
  
  // Get category list
  const categories = Array.from(new Set(filteredQuestions.map(q => q.category || 'General')));
  
  // Wrap the analyzeSelectedQuestions to include fastMode
  const analyzeSelectedQuestions = async (questionIds: string[]) => {
    // Call the original method with fastMode parameter
    await originalAnalyzeSelectedQuestions(questionIds);
    
    // Store the model used for each answer - this is just for UI display
    const currentModel = getCurrentModel();
    questionIds.forEach(id => {
      if (answers[id]) {
        // We need to use any type here because modelUsed isn't in the Answer type
        (answers[id] as any).modelUsed = currentModel;
      }
    });
  };
  
  // Update the regenerateAnswer function
  const regenerateAnswer = async (id: string, customPrompt?: string) => {
    // Call the original method with both the id and custom prompt
    await originalRegenerateAnswer(id, customPrompt);
  };
  
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

  // Function to handle PDF export from dialog
  const handleExportPDFPopup = async () => {
    const contentToExport = exportOptions.language === 'ja' && translatedContent
      ? {
          questions: translatedContent.questions,
          answers: Object.entries(translatedContent.answers).reduce((acc, [id, answer]) => {
            acc[id] = {
              ...answer,
              isEdited: answers[id]?.isEdited || false
            };
            return acc;
          }, {} as Record<string, Answer>),
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

  // Store original content when questions are selected
  useEffect(() => {
    if (filteredQuestions.length > 0 && !originalContent) {
      setOriginalContent({
        title,
        description,
        questions: filteredQuestions
      });
    }
  }, [filteredQuestions, title, description, originalContent]);

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
        answers: Object.entries(translatedContent.answers).reduce((acc, [id, answer]) => {
          acc[id] = {
            ...answer,
            isEdited: answers[id]?.isEdited || false
          };
          return acc;
        }, {} as Record<string, Answer>)
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

  const handleTitleEdit = () => {
    setTempTitle(title);
    setIsEditingTitle(true);
  };
  
  const handleTitleSave = () => {
    setTitle(tempTitle);
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

  // Add handler for custom questions
  const handleCustomQuestionAdd = (question: InvestmentMemoQuestion) => {
    setCustomQuestions(prev => [...prev, question]);
  };

  // Function to handle deleting an individual question
  const handleDeleteQuestion = (id: string) => {
    try {
      // Remove the question ID from the selected questions
      setSelectedQuestionIds(prev => prev.filter(qId => qId !== id));
      
      // If it's a custom question, remove it from the custom questions list as well
      const isCustomQuestion = customQuestions.some(q => q.id === id);
      if (isCustomQuestion) {
        setCustomQuestions(prev => prev.filter(q => q.id !== id));
      }
      
      console.log(`Removed question with ID: ${id}`);
    } catch (error) {
      console.error('Error removing question:', error);
    }
  };

  // Handle template selection
  const handleTemplateSelection = (templateId: string) => {
    // Find the template
    const selectedTemplate = TEMPLATES.find(t => t.id === templateId);
    if (selectedTemplate) {
      console.log(`Selected template: ${selectedTemplate.name}`);
      console.log(`Template has ${selectedTemplate.questions.length} questions`);
      
      // Set fastMode to true when Quick Analysis template is selected
      if (templateId === 'quick_analysis') {
        handleSetFastMode(true);
        console.log('Fast mode enabled for Quick Analysis template');
      } else {
        // For other templates, set to normal mode
        handleSetFastMode(false);
        console.log('Normal mode set for non-Quick Analysis template');
      }
      
      // Log a few question IDs for debugging
      if (selectedTemplate.questions.length > 0) {
        console.log('Sample question IDs:', selectedTemplate.questions.slice(0, 3));
        
        // Verify if these IDs exist in INVESTMENT_MEMO_QUESTIONS
        const foundQuestions = INVESTMENT_MEMO_QUESTIONS.filter(q => 
          selectedTemplate.questions.includes(q.id)
        );
        console.log(`Found ${foundQuestions.length} matching questions in INVESTMENT_MEMO_QUESTIONS`);
      } else {
        console.warn(`Template ${selectedTemplate.name} has no questions!`);
      }
      
      // Get the questions from the template
      handleQuestionSelection(selectedTemplate.questions, true);
    } else {
      console.error(`Template with ID ${templateId} not found`);
    }
    setIsTemplateModalOpen(false);
  };

  // Handle custom template selection
  const handleCustomSelection = () => {
    setIsTemplateModalOpen(false);
    setIsSelectionModalOpen(true);
  };

  // Save title to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('investmentMemoTitle', title);
    }
  }, [title]);

  // Save description to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('investmentMemoDescription', description);
    }
  }, [description]);

  // Save selected questions to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('investmentMemoSelectedQuestions', JSON.stringify(selectedQuestionIds));
    }
  }, [selectedQuestionIds]);

  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('investmentMemoAnswers');
      localStorage.removeItem('investmentMemoExpanded');
      localStorage.removeItem('investmentMemoTitle');
      localStorage.removeItem('investmentMemoDescription');
      localStorage.removeItem('investmentMemoSelectedQuestions');
    }
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
            {/* Fast Mode Toggle */}
            <FastModeToggle fastMode={fastMode} setFastMode={handleSetFastMode} />
            
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
        <div className="flex gap-2">
          <button 
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-2 bg-[#F15A29] text-white px-4 py-2 rounded-lg hover:bg-[#D94315]"
          >
            <PlusCircle size={18} />
            <span>{selectedQuestionIds.length === 0 ? 'Select Questions' : 'Add or Remove Questions'}</span>
          </button>
          
          {selectedQuestionIds.length > 0 && (
            <button 
              onClick={() => {
                clearLocalStorage();
                // Reset other state as needed
                setTitle('Investment Memo');
                setDescription('');
                setSelectedQuestionIds([]);
                // ... other state resets
              }}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw size={18} />
              <span>Reset</span>
            </button>
          )}
        </div>
        
        {loading > 0 && (
          <div className="flex items-center gap-2 text-blue-600 mb-4 mt-4">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-1"></div>
            <span>Analyzing {loading} question{loading > 1 ? 's' : ''}...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4 mt-4">
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
            onClick={() => setIsTemplateModalOpen(true)}
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
                    {currentContent.questions
                      .filter(question => question.category === category)
                      .map(question => {
                      const questionAnswer = currentContent.answers[question.id];
                      const modelUsed = (questionAnswer as any)?.modelUsed || 
                        (fastMode ? modelInfo.fast.id : modelInfo.normal.id);
                      const isFastMode = modelUsed === modelInfo.fast.id;
                      
                      return (
                        <QuestionItem
                          key={question.id}
                          question={question}
                          answer={questionAnswer}
                          isExpanded={expandedAnswers[question.id] || false}
                          onToggle={() => toggleAnswer(question.id)}
                          onEdit={handleEdit}
                          onSave={(id, content) => handleSave(id, content)}
                          onRegenerate={(customPrompt?: string) => regenerateAnswer(question.id, customPrompt)}
                          editedAnswer={editingId === question.id ? editedAnswer : ''}
                          setEditedAnswer={setEditedAnswer}
                          onDelete={handleDeleteQuestion}
                        >
                          {/* Model indicator */}
                          {questionAnswer && (
                            <div className={`text-xs mb-2 ${
                              isFastMode ? 'text-amber-600' : 'text-blue-600'
                            }`}>
                              {isFastMode 
                                ? modelInfo.fast.displayName
                                : modelInfo.normal.displayName
                              }
                            </div>
                          )}
                        </QuestionItem>
                      );
                    })}
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
        customQuestions={customQuestions}
        onCustomQuestionAdd={handleCustomQuestionAdd}
      />

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleTemplateSelection}
        onSelectCustom={handleCustomSelection}
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