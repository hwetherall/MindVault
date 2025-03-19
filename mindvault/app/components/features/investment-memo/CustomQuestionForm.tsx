import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CustomQuestionFormProps {
  categories: string[];
  onSubmit: (question: {
    id: string;
    question: string;
    category: string;
    description: string;
    subcategory: string;
    complexity: 'low' | 'medium' | 'high';
    recommended: string[];
    instructions: string;
  }) => void;
  onCancel: () => void;
}

const CustomQuestionForm: React.FC<CustomQuestionFormProps> = ({
  categories,
  onSubmit,
  onCancel
}) => {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState(categories[0] || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !category) return;

    // Generate a custom ID
    const customId = `custom_${Date.now()}`;

    onSubmit({
      id: customId,
      question: question.trim(),
      category,
      description: '',
      subcategory: '',
      complexity: 'medium',
      recommended: [],
      instructions: ''
    });

    // Reset form
    setQuestion('');
    setCategory(categories[0] || '');
  };

  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Add Custom Question</h3>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F15A29] focus:border-[#F15A29]"
              placeholder="Enter your question..."
              required
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F15A29] focus:border-[#F15A29]"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A29]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#F15A29] border border-transparent rounded-md hover:bg-[#D94315] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F15A29]"
            >
              Add Question
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CustomQuestionForm; 