import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Edit2, Save, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Answer, InvestmentMemoQuestion } from './utils/pdfExport';
import { chatService } from '../../../services/chatService';

interface ReportEditorProps {
  title: string;
  description: string;
  questions: InvestmentMemoQuestion[];
  answers: Record<string, Answer>;
  onAnswersChange: (answers: Record<string, Answer>) => void;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Component for editing the generated answers
 */
const ReportEditor: React.FC<ReportEditorProps> = ({
  title,
  description,
  questions,
  answers,
  onAnswersChange,
  onPrevious,
  onNext
}) => {
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(questions.map(q => [q.id, true]))
  );
  
  // State for expanded details
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>(
    Object.fromEntries(questions.map(q => [q.id, false]))
  );
  
  // State for editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<Record<string, boolean>>({});

  // Toggle section expansion
  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Toggle details expansion
  const toggleDetails = (id: string) => {
    setExpandedDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Start editing an answer
  const handleEdit = (id: string) => {
    if (answers[id]) {
      setEditingId(id);
      setEditedContent(answers[id].content);
    }
  };

  // Save edited answer
  const handleSave = (id: string) => {
    if (!editingId) return;
    
    onAnswersChange({
      ...answers,
      [id]: {
        content: editedContent,
        isEdited: true
      }
    });
    
    setEditingId(null);
    setEditedContent('');
  };

  // Regenerate an answer
  const handleRegenerate = async (id: string) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;
    
    setIsRegenerating(prev => ({ ...prev, [id]: true }));
    
    try {
      const prompt = `Based on the provided documents, ${question.question} ${question.description ? `(${question.description})` : ''}

Organize your answer into:
1. TL;DR - A concise summary of the key points
2. DETAILS - More comprehensive explanation with supporting information

Be specific and extract concrete numbers and facts where available.`;
      
      const result = await chatService.sendMessage(prompt, []);
      
      onAnswersChange({
        ...answers,
        [id]: {
          content: result.text,
          isEdited: false
        }
      });
    } catch (error) {
      console.error(`Error regenerating answer for ${id}:`, error);
    } finally {
      setIsRegenerating(prev => ({ ...prev, [id]: false }));
    }
  };

  // Navigate to a specific question
  const goToQuestion = (id: string) => {
    const element = document.getElementById(`question-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function to split answer content into TLDR and details sections
  const splitAnswerContent = (content: string) => {
    const parts = content.split('DETAILS:');
    
    if (parts.length === 1) {
      // Clean up the content if no DETAILS section
      return { tldr: parts[0].replace('TL;DR:', '').trim(), details: '' };
    }
    
    return { 
      tldr: parts[0].replace('TL;DR:', '').trim(), 
      details: parts[1].trim() 
    };
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Report Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        {description && <p className="text-gray-600">{description}</p>}
      </div>
      
      {/* Table of Contents */}
      <div className="p-4 border-b bg-gray-50">
        <div className="font-medium mb-2">Table of Contents</div>
        <div className="space-y-1">
          {questions.map(question => (
            <div 
              key={question.id}
              className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
              onClick={() => goToQuestion(question.id)}
            >
              {question.question}
            </div>
          ))}
        </div>
      </div>
      
      {/* Questions and Answers */}
      <div className="divide-y">
        {questions.map(question => {
          const answer = answers[question.id];
          const isExpanded = expandedSections[question.id] || false;
          const isDetailsExpanded = expandedDetails[question.id] || false;
          const isEditing = editingId === question.id;
          const isCurrentlyRegenerating = isRegenerating[question.id] || false;
          
          if (!answer) {
            return null;
          }
          
          const { tldr, details } = splitAnswerContent(answer.content);
          
          return (
            <div 
              key={question.id}
              id={`question-${question.id}`}
              className="p-6"
            >
              {/* Question Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{question.question}</h2>
                  <p className="text-sm text-gray-500 mt-1">{question.description}</p>
                </div>
                <button
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                  onClick={() => toggleSection(question.id)}
                >
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              
              {isExpanded && (
                <div className="mt-4">
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <textarea
                        className="w-full h-64 p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          className="flex items-center px-3 py-1 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          onClick={() => handleSave(question.id)}
                        >
                          <Save size={16} className="mr-1" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div>
                      {/* TLDR Section */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-500 mb-1">Summary</div>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{tldr}</ReactMarkdown>
                        </div>
                      </div>
                      
                      {/* Details Section (if available) */}
                      {details && (
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-500 mb-1">Details</div>
                            <button
                              className="text-sm text-blue-600 hover:text-blue-800"
                              onClick={() => toggleDetails(question.id)}
                            >
                              {isDetailsExpanded ? 'See Less' : 'See More'}
                            </button>
                          </div>
                          {isDetailsExpanded && (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>{details}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex justify-end mt-4 space-x-2">
                        <button
                          className="flex items-center px-3 py-1 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                          onClick={() => handleRegenerate(question.id)}
                          disabled={isCurrentlyRegenerating}
                        >
                          {isCurrentlyRegenerating ? (
                            <>
                              <RefreshCw size={16} className="mr-1 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw size={16} className="mr-1" />
                              Regenerate
                            </>
                          )}
                        </button>
                        <button
                          className="flex items-center px-3 py-1 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                          onClick={() => handleEdit(question.id)}
                        >
                          <Edit2 size={16} className="mr-1" />
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between p-6 border-t">
        <button
          className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          onClick={onPrevious}
        >
          <ChevronLeft size={16} className="mr-1" />
          Back
        </button>
        <button
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={onNext}
        >
          Next
          <ChevronRight size={16} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

export default ReportEditor; 