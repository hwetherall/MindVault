import React, { useState, useEffect } from 'react';
import { ChevronLeft, FileText, Settings, Zap, Bot } from 'lucide-react';
import { chatService } from '../../../services/chatService';

interface ReportSetupStepProps {
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
const ReportSetupStep: React.FC<ReportSetupStepProps> = ({
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
  
  // Sync with parent props when they change
  useEffect(() => {
    setFormValues(prevValues => ({
      ...prevValues,
      title: title || prevValues.title || '',
      description: description || prevValues.description || ''
    }));
  }, [title, description]);
  
  // Loading state for AI generation
  const [isGenerating, setIsGenerating] = useState(false);

  // Handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedValues = {
      ...formValues,
      [name]: value
    };
    
    // Update local state
    setFormValues(updatedValues);
    
    // Also update parent component state for title and description
    if (name === 'title' || name === 'description') {
      onConfigChange(updatedValues);
    }
  };

  // Handler for form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigChange(formValues);
    onNext();
  };
  
  // Generate both title and description using AI
  const generateTitleAndDescription = async () => {
    if (files.length === 0) return;
    
    setIsGenerating(true);
    try {
      // First, generate the title
      const titlePrompt = "Based on the uploaded documents, extract the company name and create a title for an investment memo. Format it as 'Investment Memo for [COMPANY_NAME], a [FUNDING_ROUND] [INDUSTRY] company'. Example: 'Investment Memo for GO1, a Series D Ed-Tech company'";
      
      let titleText = '';
      try {
        const titleResponse = await chatService.sendMessage(titlePrompt, files);
        titleText = titleResponse?.text || '';
      } catch (error) {
        console.error('Error generating title:', error);
      }
      
      // Then, generate the description
      const descPrompt = "Based on the uploaded documents, create a brief description for an investment memo that summarizes the analysis purpose. Extract details like investment amount and company name. Example: 'This report analyzes pitch deck and financial documents to evaluate a $30M investment into Go1.'";
      
      let descText = '';
      try {
        const descResponse = await chatService.sendMessage(descPrompt, files);
        descText = descResponse?.text || '';
      } catch (error) {
        console.error('Error generating description:', error);
      }
      
      // Use guaranteed string values
      const updatedValues = {
        ...formValues,
        title: titleText || formValues.title || '',
        description: descText || formValues.description || ''
      };
      
      // Update local state first
      setFormValues(updatedValues);
      
      // Then update parent component state
      onConfigChange({
        title: updatedValues.title,
        description: updatedValues.description,
        generationDepth: updatedValues.generationDepth
      });
    } catch (error) {
      console.error('Error in generation process:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Report Setup</h2>
      <p className="text-gray-600 mb-6">
        Set up your investment memo details and generation preferences.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Title and Description */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Report Title
                </label>
                <button
                  type="button"
                  onClick={generateTitleAndDescription}
                  disabled={isGenerating || files.length === 0}
                  className="flex items-center text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Bot size={16} className="mr-2" />
                      Automate Name + Desc
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                id="title"
                name="title"
                value={formValues.title ?? ''}
                onChange={handleInputChange}
                placeholder="Q1 2023 Investment Analysis"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              {files.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">Upload documents to enable AI generation</p>
              )}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formValues.description ?? ''}
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
                onClick={() => {
                  const updatedValues = { ...formValues, generationDepth: 'quick' };
                  setFormValues(updatedValues);
                  onConfigChange(updatedValues);
                }}
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
                onClick={() => {
                  const updatedValues = { ...formValues, generationDepth: 'standard' };
                  setFormValues(updatedValues);
                  onConfigChange(updatedValues);
                }}
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
                onClick={() => {
                  const updatedValues = { ...formValues, generationDepth: 'deep' };
                  setFormValues(updatedValues);
                  onConfigChange(updatedValues);
                }}
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

export default ReportSetupStep; 