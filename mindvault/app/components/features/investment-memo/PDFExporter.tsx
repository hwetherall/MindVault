import React from 'react';
import { ChevronLeft, Download, FileText, Share2, Mail } from 'lucide-react';
import { Answer, InvestmentMemoQuestion } from './utils/pdfExport';
import { exportToPDF } from './utils/pdfExport';

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
  // Function to export the report as PDF
  const handleExport = () => {
    exportToPDF(questions, answers, title);
    onComplete();
  };

  // Count edited answers
  const editedAnswersCount = Object.values(answers).filter(answer => answer.isEdited).length;
  
  // Calculate total word count
  const totalWordCount = Object.values(answers).reduce((total, answer) => {
    const wordCount = answer.content.split(/\s+/).filter(Boolean).length;
    return total + wordCount;
  }, 0);
  
  // Split questions by category
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
      </div>
      
      {/* Export Options */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-3">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
            onClick={handleExport}
          >
            <div className="flex justify-center mb-3">
              <Download size={32} className="text-blue-600" />
            </div>
            <h4 className="font-medium text-center">Download PDF</h4>
            <p className="text-sm text-gray-500 text-center mt-1">
              Save the memo as a PDF file on your device
            </p>
          </div>
          
          <div className="border rounded-lg p-4 bg-gray-50 cursor-not-allowed opacity-60">
            <div className="flex justify-center mb-3">
              <Share2 size={32} className="text-gray-400" />
            </div>
            <h4 className="font-medium text-center">Share Link</h4>
            <p className="text-sm text-gray-500 text-center mt-1">
              Generate a shareable link (Coming Soon)
            </p>
          </div>
          
          <div className="border rounded-lg p-4 bg-gray-50 cursor-not-allowed opacity-60">
            <div className="flex justify-center mb-3">
              <Mail size={32} className="text-gray-400" />
            </div>
            <h4 className="font-medium text-center">Email Report</h4>
            <p className="text-sm text-gray-500 text-center mt-1">
              Send the report via email (Coming Soon)
            </p>
          </div>
        </div>
      </div>
      
      {/* Table of Contents Preview */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-3">Contents Preview</h3>
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="space-y-4">
            {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
              <div key={category}>
                <div className="font-medium text-gray-700 mb-2">{category}</div>
                <ul className="space-y-1 pl-4">
                  {categoryQuestions.map(question => (
                    <li key={question.id} className="flex items-start">
                      <FileText size={14} className="mr-2 mt-1 text-gray-400" />
                      <span className="text-sm">{question.question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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