import React from 'react';
import { Save, X } from 'lucide-react';

interface EditAnswerProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Component for editing an answer
 */
const EditAnswer: React.FC<EditAnswerProps> = ({
  value,
  onChange,
  onSave,
  onCancel
}) => {
  return (
    <div className="space-y-4">
      <textarea
        className="w-full h-64 p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your answer here..."
      />
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="flex items-center text-sm px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </button>
        <button
          onClick={onSave}
          className="flex items-center text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          <Save className="h-3 w-3 mr-1" />
          Save
        </button>
      </div>
    </div>
  );
};

export default EditAnswer; 