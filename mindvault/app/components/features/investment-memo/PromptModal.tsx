import React from 'react';
import { X, Copy } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  prompt: string;
}

const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, title, prompt }) => {
  if (!isOpen) return null;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(prompt)
      .then(() => {
        console.log('Prompt copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-2/3 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-full hover:bg-gray-100"
              title="Copy prompt to clipboard"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-auto p-4 flex-grow">
          <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded border border-gray-200">
            {prompt}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default PromptModal; 