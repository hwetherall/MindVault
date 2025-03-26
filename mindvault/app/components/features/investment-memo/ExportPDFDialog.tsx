import React, { useState } from 'react';
import { FileDown } from 'lucide-react';

interface ExportOptions {
  includeTableOfContents: boolean;
  includeAppendices: boolean;
  language: 'en' | 'ja';
  isDetailedView: boolean;
}

interface ExportPDFDialogProps {
  onClose: () => void;
  onExport: () => void;
  options: ExportOptions;
  onOptionsChange: (options: ExportOptions) => void;
  onLanguageChange: (language: 'en' | 'ja') => Promise<void>;
  isTranslating: boolean;
}

export const ExportPDFDialog: React.FC<ExportPDFDialogProps> = ({
  onClose,
  onExport,
  options,
  onOptionsChange,
  onLanguageChange,
  isTranslating
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await onExport();
    setIsExporting(false);
  };

  const handleLanguageChange = async (language: 'en' | 'ja') => {
    await onLanguageChange(language);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
            <FileDown className="h-6 w-6 mr-2 text-blue-600" />
            Export Investment Memo
          </h2>
          <p className="text-gray-600 mt-1 ml-8">
            Your investment memo is ready to be exported. Review the options below.
          </p>
        </div>
        
        <div className="p-6">
          {/* Export Options Section */}
          <div className="mb-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                Export Options
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* Content Structure */}
              <div>
                <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">Content Structure</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-800">Table of Contents</p>
                      <p className="text-sm text-gray-500">Include a structured table of contents</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={options.includeTableOfContents} 
                        onChange={(e) => onOptionsChange({
                          ...options,
                          includeTableOfContents: e.target.checked
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-800">Appendices</p>
                      <p className="text-sm text-gray-500">Include supporting documents and references</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={options.includeAppendices} 
                        onChange={(e) => onOptionsChange({
                          ...options,
                          includeAppendices: e.target.checked
                        })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Language Selection */}
              <div>
                <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">Language</h4>
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        options.language === 'en'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      onClick={() => handleLanguageChange('en')}
                      disabled={isTranslating}
                    >
                      English
                    </button>
                    <button 
                      className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        options.language === 'ja'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      onClick={() => handleLanguageChange('ja')}
                      disabled={isTranslating}
                    >
                      {isTranslating ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          翻訳中...
                        </div>
                      ) : (
                        '日本語'
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Detail Level */}
              <div>
                <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">Content Detail Level</h4>
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                  <button 
                    className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                      !options.isDetailedView
                        ? 'bg-white text-blue-600 shadow-md border border-blue-100' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => onOptionsChange({ ...options, isDetailedView: false })}
                  >
                    Concise
                  </button>
                  <button 
                    className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                      options.isDetailedView
                        ? 'bg-white text-blue-600 shadow-md border border-blue-100' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => onOptionsChange({ ...options, isDetailedView: true })}
                  >
                    Detailed
                  </button>
                </div>
              </div>
              
              {/* Charts Information */}
              <div>
                <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-4">Charts & Visualizations</h4>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700 flex items-start">
                    <svg className="h-5 w-5 mr-2 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Any financial charts and visualizations in your answers will be automatically included in the PDF export. 
                      Charts will be rendered in high quality to ensure they're clear and readable.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-100 flex justify-between bg-gradient-to-r from-white to-gray-50">
          <button 
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center ${
              isExporting 
                ? 'bg-blue-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg shadow-blue-100'
            }`}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="h-5 w-5 mr-2" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 