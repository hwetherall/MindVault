import React, { useState } from 'react';
import { QuestionSelectionModal, INVESTMENT_MEMO_QUESTIONS } from '../';

/**
 * Example component demonstrating how to use the QuestionSelectionModal
 */
const QuestionSelectionModalExample: React.FC = () => {
  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for selected questions
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // Handle question selection
  const handleQuestionSelection = (selectedIds: string[]) => {
    setSelectedQuestions(selectedIds);
    console.log('Selected question IDs:', selectedIds);
    
    // Get the full question objects for the selected IDs
    const selectedQuestionObjects = INVESTMENT_MEMO_QUESTIONS.filter(q => 
      selectedIds.includes(q.id)
    );
    console.log('Selected questions:', selectedQuestionObjects);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Question Selection Example</h1>
      
      <div className="mb-6">
        <p className="mb-2">
          This example demonstrates how to use the QuestionSelectionModal component.
        </p>
        <p className="text-gray-600">
          Selected Questions: {selectedQuestions.length} / {INVESTMENT_MEMO_QUESTIONS.length}
        </p>
      </div>
      
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-[#E6007E] text-white rounded hover:bg-[#C4006C]"
      >
        Open Question Selection Modal
      </button>
      
      {/* Display selected questions */}
      {selectedQuestions.length > 0 && (
        <div className="mt-6 p-4 border rounded-lg">
          <h2 className="font-bold mb-2">Selected Questions:</h2>
          <ul className="list-disc pl-5 space-y-1">
            {INVESTMENT_MEMO_QUESTIONS
              .filter(q => selectedQuestions.includes(q.id))
              .map(q => (
                <li key={q.id}>{q.question}</li>
              ))}
          </ul>
        </div>
      )}
      
      {/* Question Selection Modal */}
      <QuestionSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleQuestionSelection}
        initialSelections={selectedQuestions}
      />
    </div>
  );
};

export default QuestionSelectionModalExample; 