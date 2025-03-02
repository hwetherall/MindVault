import React, { useState } from 'react';
import { ChevronLeft, FileText, Settings, Zap } from 'lucide-react';

interface GenerationConfigStepProps {
  title: string;
  description: string;
  files: any[];
  onConfigChange: (config: { title: string; description: string; generationDepth?: string }) => void;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Component for configuring report settings before generation
 */
const GenerationConfigStep: React.FC<GenerationConfigStepProps> = ({
  title,
  description,
  files,
  onConfigChange,
  onPrevious,
  onNext
}) => {
  // Local state for form values
  const [formValues, setFormValues] = useState({
    title: title || '',
    description: description || '',
    generationDepth: 'standard'
  });

  // Handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigChange(formValues);
    onNext();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Configure Report Generation</h2>
      <p className="text-gray-600 mb-6">
        Set up your investment memo details and generation preferences.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Title and Description */}
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Report Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formValues.title}
                onChange={handleInputChange}
                placeholder="Q1 2023 Investment Analysis"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formValues.description}
                onChange={handleInputChange}
                placeholder="Brief description of the investment analysis scope and goals..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Source Files */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Source Documents</h3>
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              {files.length > 0 ? (
                <ul className="space-y-1">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <FileText size={16} className="mr-2 text-gray-500" />
                      <span>{file.name}</span>
                      <span className="ml-auto text-xs text-gray-500">
                        {file.type || 'Unknown type'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 py-2">No documents uploaded</p>
              )}
            </div>
          </div>

          {/* Generation Depth */}
          <div>
            <label htmlFor="generationDepth" className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Depth
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div
                className={`cursor-pointer border rounded-md p-3 text-center transition-colors ${
                  formValues.generationDepth === 'quick'
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setFormValues(prev => ({ ...prev, generationDepth: 'quick' }))}
              >
                <Zap size={20} className="mx-auto mb-1" />
                <div className="font-medium">Quick</div>
                <div className="text-xs text-gray-500">5-10 minutes</div>
              </div>
              
              <div
                className={`cursor-pointer border rounded-md p-3 text-center transition-colors ${
                  formValues.generationDepth === 'standard'
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setFormValues(prev => ({ ...prev, generationDepth: 'standard' }))}
              >
                <Settings size={20} className="mx-auto mb-1" />
                <div className="font-medium">Standard</div>
                <div className="text-xs text-gray-500">10-20 minutes</div>
              </div>
              
              <div
                className={`cursor-pointer border rounded-md p-3 text-center transition-colors ${
                  formValues.generationDepth === 'deep'
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setFormValues(prev => ({ ...prev, generationDepth: 'deep' }))}
              >
                <FileText size={20} className="mx-auto mb-1" />
                <div className="font-medium">Deep</div>
                <div className="text-xs text-gray-500">20-30 minutes</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {formValues.generationDepth === 'quick' && 'Quick analysis provides concise answers with basic insights.'}
              {formValues.generationDepth === 'standard' && 'Standard analysis balances depth and time, suitable for most reports.'}
              {formValues.generationDepth === 'deep' && 'Deep analysis provides comprehensive insights with detailed explanations.'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            onClick={onPrevious}
          >
            <ChevronLeft size={16} className="mr-1" />
            Back
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={!formValues.title}
          >
            Generate Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default GenerationConfigStep; 