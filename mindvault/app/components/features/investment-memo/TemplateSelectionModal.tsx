import React from 'react';
import { X, Zap } from 'lucide-react';
import { TEMPLATES } from './data/templates';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  onSelectCustom: () => void;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onSelectCustom
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-[#1A1F2E]">Select a Template</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-6">
          <p className="text-gray-700 mb-6">
            Choose a template to pre-select questions for your investment memo, or create a custom selection.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TEMPLATES.map((template) => (
              <div 
                key={template.id}
                className={`border rounded-lg overflow-hidden cursor-pointer hover:border-[#F15A29] hover:shadow-md transition-all ${
                  template.id === 'custom' ? 'bg-gray-50' : 'bg-white'
                }`}
                onClick={() => template.id === 'custom' ? onSelectCustom() : onSelectTemplate(template.id)}
              >
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <div className="text-3xl mr-3">{template.logo}</div>
                    <div className="flex flex-col">
                      <h3 className="font-medium text-lg text-[#1A1F2E]">{template.name}</h3>
                      {template.id === 'quick_analysis' && (
                        <div className="flex items-center text-xs text-amber-600 mt-1">
                          <Zap size={12} className="mr-1" />
                          <span>Uses fast mode</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {template.description}
                  </p>
                  <div className="mt-4 text-xs text-gray-500 flex items-center">
                    {template.id !== 'custom' ? (
                      <span className="bg-[#F15A29] bg-opacity-10 text-[#F15A29] px-2 py-1 rounded-full">
                        {template.questions.length} question{template.questions.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="bg-gray-200 px-2 py-1 rounded-full">
                        Select your own questions
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionModal; 