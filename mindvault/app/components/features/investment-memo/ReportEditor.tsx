import React, { useState, useEffect, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Edit2, Save, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Answer, InvestmentMemoQuestion } from './utils/pdfExport';
import { chatService } from '../../../services/chatService';

interface ReportEditorProps {
  title: string;
  description: string;
  questions: InvestmentMemoQuestion[];
  answers: Record<string, Answer>;
  files: any[];
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
  files,
  onAnswersChange,
  onPrevious,
  onNext
}) => {
  // State for expanded sections - start with all collapsed (set to false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(questions.map(q => [q.id, false]))
  );
  
  // State for expanded details - start with all collapsed (set to false)
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>(() => {
    const initialState = Object.fromEntries(questions.map(q => [q.id, false]));
    console.log('Initial expandedDetails state:', initialState);
    return initialState;
  });
  
  // State for editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<Record<string, boolean>>({});

  // Toggle section expansion
  const toggleSection = (id: string) => {
    const newExpandedState = !expandedSections[id];
    
    setExpandedSections(prev => ({
      ...prev,
      [id]: newExpandedState
    }));
    
    // When expanding a section, ensure details are initially collapsed
    if (newExpandedState === true) {
      setExpandedDetails(prev => ({
        ...prev,
        [id]: false
      }));
    }
  };

  // Toggle details expansion
  const toggleDetails = (id: string) => {
    console.log(`Toggle details for ${id}: current state = ${expandedDetails[id] || false}`);
    setExpandedDetails(prev => {
      const newState = {
        ...prev,
        [id]: !prev[id]
      };
      console.log(`New expandedDetails state for ${id} = ${newState[id]}`);
      return newState;
    });
    console.log(`New state for ${id} should be ${!expandedDetails[id]}`);
  };

  // Handle editing an answer
  const handleEdit = (id: string) => {
    if (answers[id]) {
      setEditingId(id);
      // Create a combined content for editing
      const combinedContent = `Summary: 
${answers[id].summary}

DETAILS:
${answers[id].details}`;
      setEditedContent(combinedContent);
    }
  };

  // Save edited answer
  const handleSave = (id: string) => {
    if (!editingId) return;
    
    // Split the edited content into summary and details
    const parts = editedContent.split(/DETAILS:/i);
    let summary = '';
    let details = '';
    
    if (parts.length === 1) {
      // If no DETAILS section found, treat everything as summary
      summary = parts[0].replace(/Summary:/i, '').trim();
    } else {
      summary = parts[0].replace(/Summary:/i, '').trim();
      details = parts[1].trim();
    }
    
    onAnswersChange({
      ...answers,
      [id]: {
        summary,
        details,
        isEdited: true
      }
    });
    
    // Reset details expansion state when saving
    setExpandedDetails(prev => ({
      ...prev,
      [id]: false
    }));
    
    setEditingId(null);
    setEditedContent('');
  };

  // Regenerate an answer
  const handleRegenerate = async (id: string) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;
    
    setIsRegenerating(prev => ({ ...prev, [id]: true }));
    
    try {
      // First generate the detailed answer
      const detailsPrompt = `Based on the provided documents, provide a DETAILED answer to this question: ${question.question} ${question.description ? `(${question.description})` : ''}

Your answer should be comprehensive and include supporting information, calculations, and specific data points from the documents.
Include source references where appropriate. Extract concrete numbers and facts where available.`;
      
      // Add instructions for DETAILS section
      const detailsPromptWithInstructions = detailsPrompt + `

This will be used as the DETAILS section of the answer, which will be shown when users click "Show Details".`;
      
      const detailsResult = await chatService.sendMessage(detailsPromptWithInstructions, files);
      const detailedAnswer = detailsResult.text;
      
      // Then generate a summary based on the detailed answer
      const summaryPrompt = `Based on the following detailed answer to the question "${question.question}", provide a concise 1-2 sentence summary that directly answers the question with key facts.

Detailed Answer:
${detailedAnswer}

Your summary should be brief but informative, capturing the most important points from the detailed answer.`;
      
      // Add instructions for SUMMARY section
      const summaryPromptWithInstructions = summaryPrompt + `

This will always be shown to the user as the Summary section.`;
      
      const summaryResult = await chatService.sendMessage(summaryPromptWithInstructions, files);
      
      onAnswersChange({
        ...answers,
        [id]: {
          summary: summaryResult.text,
          details: detailedAnswer,
          isEdited: false
        }
      });
      
      // Reset details expansion state when regenerating
      setExpandedDetails(prev => ({
        ...prev,
        [id]: false
      }));
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
      
      // Automatically expand the section when navigating to it
      setExpandedSections(prev => ({
        ...prev,
        [id]: true
      }));
      
      // Ensure details are collapsed when navigating to a question
      setExpandedDetails(prev => ({
        ...prev,
        [id]: false
      }));
    }
  };

  // Reset expandedDetails whenever answers change
  useEffect(() => {
    // When new answers arrive, ensure details remain collapsed
    console.log('useEffect triggered: resetting expandedDetails');
    console.log('Current answers:', answers);
    // Only reset for questions whose answers have changed
    const updatedIds = Object.keys(answers).filter(id => answers[id].isEdited === false);
    console.log('Resetting expandedDetails for IDs:', updatedIds);
    
    setExpandedDetails(prev => {
      const newState = { ...prev };
      updatedIds.forEach(id => {
        newState[id] = false;
      });
      return newState;
    });
  }, [answers]);

  useLayoutEffect(() => {
    // Trace each render and log the state of expandedDetails
    console.log('Current expandedDetails state:', expandedDetails);
  }, [expandedDetails]);

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
          
          console.log(`Question ${question.id}: isExpanded = ${isExpanded}, isDetailsExpanded = ${isDetailsExpanded}`);
          
          if (!answer) {
            return null;
          }
          
          return (
            <div 
              key={question.id}
              id={`question-${question.id}`}
              className="p-6"
            >
              {/* Question Header - Always visible */}
              <div 
                className="flex justify-between items-start cursor-pointer"
                onClick={() => toggleSection(question.id)}
              >
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{question.question}</h2>
                  <p className="text-sm text-gray-500 mt-1">{question.description}</p>
                </div>
                <button
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              
              {/* Question Content - Only shown when expanded */}
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
                      {/* Summary Section - Always visible within an expanded question */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-500 mb-1">Summary</div>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{answer.summary}</ReactMarkdown>
                        </div>
                      </div>
                      
                      {/* Show Details Button - Only shown if details exist */}
                      {answer.details && (
                        <div className="mb-4">
                          <button
                            className="text-sm text-blue-600 hover:text-blue-800 bg-blue-50 py-1 px-3 rounded-md border border-blue-100"
                            onClick={(e) => {
                              e.preventDefault();  // Prevent default behavior
                              e.stopPropagation(); // Prevent triggering question collapse
                              console.log(`Details button clicked for ${question.id}`);
                              console.log(`Before toggle: isDetailsExpanded = ${isDetailsExpanded}`);
                              toggleDetails(question.id);
                            }}
                          >
                            {isDetailsExpanded ? 'Hide Details' : 'Show Details'}
                          </button>
                          
                          {/* Details Content - Only shown when explicitly expanded */}
                          {isDetailsExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-sm font-medium text-gray-500 mb-2">Details</div>
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>{answer.details}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex justify-end mt-4 space-x-2">
                        <button
                          className="flex items-center px-3 py-1 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering question collapse
                            handleRegenerate(question.id);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering question collapse
                            handleEdit(question.id);
                          }}
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