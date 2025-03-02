import React, { useState } from 'react';
import { InvestmentMemoQuestion } from './utils/pdfExport';

interface QuestionSelectionStepProps {
  questions: InvestmentMemoQuestion[];
  selectedQuestions: string[];
  onSelectionChange: (selectedQuestions: string[]) => void;
  onNext: () => void;
}

/**
 * Component for selecting which investment questions to include in the report
 */
const QuestionSelectionStep: React.FC<QuestionSelectionStepProps> = ({
  questions,
  selectedQuestions,
  onSelectionChange,
  onNext
}) => {
  // Group questions by category
  const questionsByCategory = questions.reduce((acc, question) => {
    const category = question.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(question);
    return acc;
  }, {} as Record<string, InvestmentMemoQuestion[]>);

  // Get all unique categories
  const categories = Object.keys(questionsByCategory);

  // State for active filter
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Toggle question selection
  const toggleQuestionSelection = (questionId: string) => {
    if (selectedQuestions.includes(questionId)) {
      onSelectionChange(selectedQuestions.filter(id => id !== questionId));
    } else {
      onSelectionChange([...selectedQuestions, questionId]);
    }
  };

  // Select all questions in a category
  const selectAllInCategory = (category: string) => {
    const questionsInCategory = category === 'All'
      ? questions
      : questionsByCategory[category] || [];
    
    const questionIds = questionsInCategory.map(q => q.id);
    const newSelected = [...selectedQuestions];
    
    questionIds.forEach(id => {
      if (!newSelected.includes(id)) {
        newSelected.push(id);
      }
    });
    
    onSelectionChange(newSelected);
  };

  // Deselect all questions in a category
  const deselectAllInCategory = (category: string) => {
    const questionsInCategory = category === 'All'
      ? questions
      : questionsByCategory[category] || [];
    
    const questionIds = questionsInCategory.map(q => q.id);
    const newSelected = selectedQuestions.filter(id => !questionIds.includes(id));
    
    onSelectionChange(newSelected);
  };

  // Filter questions to display
  const filteredQuestions = activeFilter === 'All'
    ? questions
    : questionsByCategory[activeFilter] || [];

  // Check if all questions in a category are selected
  const areAllSelectedInCategory = (category: string) => {
    const questionsInCategory = category === 'All'
      ? questions
      : questionsByCategory[category] || [];
    
    return questionsInCategory.every(q => selectedQuestions.includes(q.id));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Select Investment Questions</h2>
      <p className="text-gray-600 mb-6">
        Choose the questions you want to include in your investment memo. 
        We recommend selecting questions relevant to your analysis.
      </p>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`px-3 py-1 rounded-full text-sm font-medium 
            ${activeFilter === 'All' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveFilter('All')}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            className={`px-3 py-1 rounded-full text-sm font-medium 
              ${activeFilter === category 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setActiveFilter(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Select/Deselect All */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          {selectedQuestions.length} of {questions.length} questions selected
        </div>
        <div className="flex gap-2">
          <button
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={() => selectAllInCategory(activeFilter)}
            disabled={areAllSelectedInCategory(activeFilter)}
          >
            Select All
          </button>
          <span className="text-gray-400">|</span>
          <button
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={() => deselectAllInCategory(activeFilter)}
            disabled={!selectedQuestions.length}
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3 mb-8 max-h-96 overflow-y-auto pr-2">
        {filteredQuestions.map(question => (
          <div 
            key={question.id}
            className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => toggleQuestionSelection(question.id)}
          >
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300 text-blue-600 mt-1 focus:ring-blue-500"
              checked={selectedQuestions.includes(question.id)}
              onChange={() => {}} // Handled by parent div click
              onClick={e => e.stopPropagation()} // Prevent double toggling
            />
            <div className="ml-3 flex-1">
              <div className="font-medium">{question.question}</div>
              <div className="text-sm text-gray-500 mt-1">{question.description}</div>
              {question.complexity && (
                <div className="mt-2 flex items-center">
                  <span 
                    className={`text-xs px-2 py-1 rounded ${
                      question.complexity === 'low' 
                        ? 'bg-green-100 text-green-800' 
                        : question.complexity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {question.complexity.charAt(0).toUpperCase() + question.complexity.slice(1)} complexity
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end mt-6">
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={onNext}
          disabled={selectedQuestions.length === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default QuestionSelectionStep; 