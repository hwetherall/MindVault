import React, { useState } from 'react';
import { ChevronLeft, Download, FileText, Share2, Mail, Globe, Check } from 'lucide-react';
import { Answer, InvestmentMemoQuestion, ExportOptions as PDFExportOptions } from './utils/pdfExport';
import { exportToPDF } from './utils/pdfExport';
import ReactMarkdown from 'react-markdown';

interface PDFExporterProps {
  title: string;
  description: string;
  questions: InvestmentMemoQuestion[];
  answers: Record<string, Answer>;
  onPrevious: () => void;
  onComplete: () => void;
}

/**
 * Component for exporting the investment memo as a PDF
 */
const PDFExporter: React.FC<PDFExporterProps> = ({
  title,
  description,
  questions,
  answers,
  onPrevious,
  onComplete
}) => {
  // Default export options
  const [exportOptions, setExportOptions] = useState<PDFExportOptions>({
    includeTableOfContents: true,
    includeAppendices: true,
    language: 'en',
    isDetailedView: true
  });

  // State for collapsible sections
  const [isExportOptionsExpanded, setIsExportOptionsExpanded] = useState(true);

  // State for expanded details sections
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>(
    Object.fromEntries(questions.map(q => [q.id, false]))
  );

  // State for export status
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Function to toggle details section
  const toggleDetails = (id: string) => {
    setExpandedDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Function to export the report as PDF
  const handleExport = () => {
    try {
      exportToPDF(questions, answers, title, exportOptions);
      
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
      onComplete();
    } catch (err) {
      console.error('PDF export error:', err);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  // Count edited answers
  const editedAnswersCount = Object.values(answers).filter(answer => answer.isEdited).length;
  
  // Calculate total word count
  const totalWordCount = Object.values(answers).reduce((total, answer) => {
    const summaryWordCount = answer.summary.split(/\s+/).filter(Boolean).length;
    const detailsWordCount = answer.details.split(/\s+/).filter(Boolean).length;
    return total + summaryWordCount + detailsWordCount;
  }, 0);
  
  // Group questions by category
  const questionsByCategory = questions.reduce((acc, question) => {
    const category = question.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(question);
    return acc;
  }, {} as Record<string, InvestmentMemoQuestion[]>);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Export Investment Memo</h2>
      <p className="text-gray-600 mb-6">
        Your investment memo is ready to be exported. Review the summary and choose your export options.
      </p>
      
      {/* Report Summary */}
      <div className="bg-gray-50 border rounded-lg p-5 mb-6">
        <h3 className="text-lg font-medium mb-3">{title}</h3>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Questions</div>
            <div className="text-2xl font-bold">{questions.length}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Word Count</div>
            <div className="text-2xl font-bold">{totalWordCount.toLocaleString()}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Edited Answers</div>
            <div className="text-2xl font-bold">{editedAnswersCount}</div>
          </div>
        </div>
        
        {/* Categories Summary */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Categories</div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(questionsByCategory).map(category => (
              <div 
                key={category}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {category} ({questionsByCategory[category].length})
              </div>
            ))}
          </div>
        </div>

        {/* Export Methods */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium mb-4">Export Options</h4>
          <div className="grid grid-cols-3 gap-6">
            {/* Download as PDF */}
            <div className="text-center">
              <button
                onClick={handleExport}
                className="w-full flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
              >
                <div className="bg-blue-100 p-3 rounded-full mb-2">
                  <Download size={20} className="text-blue-600" />
                </div>
                <h3 className="font-medium text-sm mb-1">Download PDF</h3>
                <p className="text-xs text-gray-500">Save to your device</p>
              </button>
            </div>

            {/* Send as Link */}
            <div className="text-center opacity-50">
              <button
                disabled
                className="w-full flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 cursor-not-allowed"
              >
                <div className="bg-gray-100 p-3 rounded-full mb-2">
                  <Share2 size={20} className="text-gray-600" />
                </div>
                <h3 className="font-medium text-sm mb-1">Share Link</h3>
                <p className="text-xs text-gray-500">Coming soon</p>
              </button>
            </div>

            {/* Send via Email */}
            <div className="text-center opacity-50">
              <button
                disabled
                className="w-full flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 cursor-not-allowed"
              >
                <div className="bg-gray-100 p-3 rounded-full mb-2">
                  <Mail size={20} className="text-gray-600" />
                </div>
                <h3 className="font-medium text-sm mb-1">Send Email</h3>
                <p className="text-xs text-gray-500">Coming soon</p>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Export Options */}
      <div className="mb-6">
        <button 
          onClick={() => setIsExportOptionsExpanded(!isExportOptionsExpanded)}
          className="w-full flex items-center justify-between text-lg font-medium mb-3 hover:text-gray-700"
        >
          <span>Export Options</span>
          <ChevronLeft className={`transform transition-transform ${isExportOptionsExpanded ? 'rotate-90' : '-rotate-90'}`} size={20} />
        </button>
        
        {isExportOptionsExpanded && (
          <div className="space-y-4">
            {/* Table of Contents Option */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Table of Contents</div>
                <div className="text-sm text-gray-500">Include a structured table of contents</div>
              </div>
              <button
                className={`px-3 py-1 rounded ${
                  exportOptions.includeTableOfContents
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
                onClick={() => setExportOptions(prev => ({
                  ...prev,
                  includeTableOfContents: !prev.includeTableOfContents
                }))}
              >
                {exportOptions.includeTableOfContents ? (
                  <Check size={16} />
                ) : (
                  'Include'
                )}
              </button>
            </div>
            
            {/* Appendices Option */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Appendices</div>
                <div className="text-sm text-gray-500">Include supporting documents and references</div>
              </div>
              <button
                className={`px-3 py-1 rounded ${
                  exportOptions.includeAppendices
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
                onClick={() => setExportOptions(prev => ({
                  ...prev,
                  includeAppendices: !prev.includeAppendices
                }))}
              >
                {exportOptions.includeAppendices ? (
                  <Check size={16} />
                ) : (
                  'Include'
                )}
              </button>
            </div>

            {/* Language Option */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Language</div>
                <div className="text-sm text-gray-500">Choose the export language</div>
              </div>
              <div className="flex space-x-2">
                <button
                  className={`px-3 py-1 rounded ${
                    exportOptions.language === 'en'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  onClick={() => setExportOptions(prev => ({ ...prev, language: 'en' }))}
                >
                  English
                </button>
                <button
                  className={`px-3 py-1 rounded ${
                    exportOptions.language === 'ja'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  onClick={() => setExportOptions(prev => ({ ...prev, language: 'ja' }))}
                >
                  日本語
                </button>
              </div>
            </div>

            {/* Concise vs Detailed View Option */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Content Detail Level</div>
                <div className="text-sm text-gray-500">{exportOptions.isDetailedView ? 'Detailed view with full answers' : 'Concise view with summaries only'}</div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className={`px-3 py-1 rounded-l-md ${
                    !exportOptions.isDetailedView
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  onClick={() => setExportOptions(prev => ({
                    ...prev,
                    isDetailedView: false
                  }))}
                >
                  Concise
                </button>
                <button
                  className={`px-3 py-1 rounded-r-md ${
                    exportOptions.isDetailedView
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  onClick={() => setExportOptions(prev => ({
                    ...prev,
                    isDetailedView: true
                  }))}
                >
                  Detailed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Contents Preview */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-3">Contents Preview</h3>
        <div className="border rounded-lg">
          {/* Preview Header */}
          <div className="p-4 border-b bg-gray-50">
            <div className="text-xl font-bold">{title}</div>
            {description && <div className="text-gray-600 mt-2">{description}</div>}
          </div>
          
          {/* Scrollable Preview Content */}
          <div className="max-h-96 overflow-y-auto">
            {/* Table of Contents (if enabled) */}
            {exportOptions.includeTableOfContents && (
              <div className="p-4 border-b">
                <div className="font-bold mb-2">Table of Contents</div>
                {Object.entries(questionsByCategory).map(([category, categoryQuestions], index) => (
                  <div key={category} className="mb-3">
                    <div className="font-medium text-gray-700">{category}</div>
                    <ul className="pl-4 space-y-1">
                      {categoryQuestions.map(question => (
                        <li key={question.id} className="text-sm text-gray-600">
                          {question.question}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            
            {/* Questions Preview */}
            <div className="divide-y">
              {questions.map(question => {
                const answer = answers[question.id];
                if (!answer) return null;
                
                return (
                  <div key={question.id} className="p-4">
                    <div className="font-bold mb-2">{question.question}</div>
                    {question.description && (
                      <div className="text-sm text-gray-600 mb-3">{question.description}</div>
                    )}
                    <div className="prose prose-sm max-w-none">
                      <div className="mb-3">
                        <div className="font-medium text-blue-700 mb-1">Summary</div>
                        <div className="prose prose-sm">
                          <ReactMarkdown>
                            {answer.summary}
                          </ReactMarkdown>
                        </div>
                      </div>
                      
                      {/* Only show details if expanded */}
                      {expandedDetails[question.id] && answer.details && (
                        <div className="mt-4 pt-3 border-t">
                          <div className="font-medium text-gray-700 mb-1">Details</div>
                          <div className="prose prose-sm">
                            <ReactMarkdown>
                              {answer.details}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Page Break Indicator */}
                    <div className="border-t border-dashed border-gray-300 my-4">
                      <div className="text-xs text-gray-400 text-center -mt-2.5 bg-white inline-block px-2">
                        Page Break
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Appendices Preview (if enabled) */}
            {exportOptions.includeAppendices && (
              <div className="p-4 border-t">
                <div className="font-bold mb-2">Appendices</div>
                <div className="text-sm text-gray-600">
                  Supporting documents and references will be included here.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <button
          className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          onClick={onPrevious}
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to Editing
        </button>
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={handleExport}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default PDFExporter; 