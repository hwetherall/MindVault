import React from 'react';

interface ResetConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: (options: ResetOptions) => void;
}

export interface ResetOptions {
  resetQuestions: boolean;
  resetTitle: boolean;
  resetDescription: boolean;
  resetCustomQuestions: boolean;
}

const ResetConfirmationDialog: React.FC<ResetConfirmationDialogProps> = ({ 
  isOpen, 
  onClose, 
  onReset 
}) => {
  // Default reset options
  const [options, setOptions] = React.useState<ResetOptions>({
    resetQuestions: true,
    resetTitle: true,
    resetDescription: true,
    resetCustomQuestions: false,
  });

  // Handle checkbox changes
  const handleOptionChange = (option: keyof ResetOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Reset the options when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setOptions({
        resetQuestions: true,
        resetTitle: true,
        resetDescription: true,
        resetCustomQuestions: false,
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Reset Investment Memo</h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Choose which elements to reset. Your document content in the repository will remain intact.
        </p>
        
        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={options.resetQuestions} 
              onChange={() => handleOptionChange('resetQuestions')}
              className="h-4 w-4 rounded border-gray-300 text-[#F15A29] focus:ring-[#F15A29]"
            />
            <span>Selected Questions</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={options.resetTitle} 
              onChange={() => handleOptionChange('resetTitle')}
              className="h-4 w-4 rounded border-gray-300 text-[#F15A29] focus:ring-[#F15A29]"
            />
            <span>Title</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={options.resetDescription} 
              onChange={() => handleOptionChange('resetDescription')}
              className="h-4 w-4 rounded border-gray-300 text-[#F15A29] focus:ring-[#F15A29]"
            />
            <span>Description</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={options.resetCustomQuestions} 
              onChange={() => handleOptionChange('resetCustomQuestions')}
              className="h-4 w-4 rounded border-gray-300 text-[#F15A29] focus:ring-[#F15A29]"
            />
            <span>Custom Questions</span>
          </label>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            onClick={() => {
              onReset(options);
              onClose();
            }}
            className="px-4 py-2 bg-[#F15A29] text-white rounded-md hover:bg-[#D94315]"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetConfirmationDialog; 