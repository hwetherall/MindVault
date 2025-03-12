import React, { useState, useEffect } from 'react';
import { INVESTMENT_MEMO_QUESTIONS } from './constants';
import { X } from 'lucide-react';

// Define the category types - match the actual categories in the data
type QuestionCategory = 'Financial' | 'Business' | 'Market' | 'Team' | 'Risk' | 'All' | 'Recommended';

interface QuestionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedQuestions: string[], immediatelyAnalyze: boolean) => void;
  initialSelections?: string[];
}

const QuestionSelectionModal: React.FC<QuestionSelectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialSelections = []
}) => {
  // State for selected question IDs
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>(initialSelections);
  // State for active category filter
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>('All');
  // State for triggering immediate analysis
  const [immediatelyAnalyze, setImmediatelyAnalyze] = useState<boolean>(true);
  
  // Get unique categories from the questions
  const categories = ['All', 'Recommended', ...new Set(INVESTMENT_MEMO_QUESTIONS.map(q => q.category))].filter(Boolean) as QuestionCategory[];
  
  // Reset selections when modal opens/closes or initialSelections change
  useEffect(() => {
    if (isOpen) {
      setSelectedQuestions(initialSelections);
      setImmediatelyAnalyze(true);
    }
  }, [isOpen, initialSelections]);

  // Filter questions based on active category
  const filteredQuestions = INVESTMENT_MEMO_QUESTIONS.filter(q => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Recommended' && q.recommended && q.recommended.length > 0) return true;
    return q.category === activeCategory;
  });

  // Determine if all filtered questions are selected
  const allFilteredSelected = filteredQuestions.length > 0 && 
    filteredQuestions.every(q => selectedQuestions.includes(q.id));

  // Toggle individual question selection
  const toggleQuestion = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id) 
        : [...prev, id]
    );
  };

  // Select or deselect all filtered questions
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered questions
      setSelectedQuestions(prev => 
        prev.filter(id => !filteredQuestions.some(q => q.id === id))
      );
    } else {
      // Select all filtered questions
      const filteredIds = filteredQuestions.map(q => q.id);
      setSelectedQuestions(prev => {
        const newSelection = [...prev];
        filteredIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    onSubmit(selectedQuestions, immediatelyAnalyze);
    onClose();
  };

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-[#1A1F2E]">Select Investment Questions</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Category Tabs */}
          <div className="border-b flex items-center px-6 overflow-x-auto">
            <div className="flex space-x-2 py-4">
              {categories.map(category => (
                <button
                  key={category}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    activeCategory === category
                      ? 'bg-[#F15A29] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category === 'Recommended' ? 'Innovera Recommends' : category}
                </button>
              ))}
            </div>

            {/* Selection Controls */}
            <div className="ml-auto flex items-center text-sm space-x-4">
              <div className="text-gray-600">
                {selectedQuestions.length} of {INVESTMENT_MEMO_QUESTIONS.length} questions selected
              </div>
              <button
                className="text-[#F15A29] hover:underline"
                onClick={toggleSelectAll}
              >
                {allFilteredSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Question List */}
          <div className="overflow-y-auto p-6 flex-1">
            <p className="text-gray-700 mb-6">
              Choose the questions you want to include in your investment memo. We recommend selecting questions relevant to your analysis.
            </p>
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No questions available in this category.
                </div>
              ) : (
                filteredQuestions.map(question => (
                  <div key={question.id} className="border rounded-lg overflow-hidden">
                    <div className="p-4 flex items-start">
                      <input
                        type="checkbox"
                        id={`question-${question.id}`}
                        checked={selectedQuestions.includes(question.id)}
                        onChange={() => toggleQuestion(question.id)}
                        className="mt-1 h-5 w-5 text-[#F15A29] rounded border-gray-300 focus:ring-[#F15A29]"
                      />
                      <div className="ml-3">
                        <label
                          htmlFor={`question-${question.id}`}
                          className="font-medium text-[#1A1F2E] cursor-pointer"
                        >
                          {question.question}
                        </label>
                        {question.description && (
                          <p className="text-gray-500 text-sm mt-1">
                            {question.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t p-6 flex justify-between items-center">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="immediately-analyze"
              checked={immediatelyAnalyze}
              onChange={() => setImmediatelyAnalyze(!immediatelyAnalyze)}
              className="h-5 w-5 text-[#F15A29] rounded border-gray-300 focus:ring-[#F15A29]"
            />
            <label htmlFor="immediately-analyze" className="ml-2 text-gray-700">
              Generate AI answers immediately
            </label>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-[#F15A29] text-white rounded hover:bg-[#D94315]"
              disabled={selectedQuestions.length === 0}
            >
              Add Selected Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionSelectionModal; 