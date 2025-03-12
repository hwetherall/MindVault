import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { chatService } from '../services/chatService';
import { ChevronDown, ChevronUp, Edit2, Save, RefreshCw, FileDown, Eye, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { exportToPDF as generatePDFExport, Answer as PDFAnswer } from './features/investment-memo/utils/pdfExport';
import { formatNumbersInText } from '../utils/textFormatting';
// Import the consolidated questions
import { INVESTMENT_MEMO_QUESTIONS, getQuestionById } from './features/investment-memo/data/questions';
import { generatePromptForQuestion } from './features/investment-memo/utils/promptGenerator';
import { InvestmentMemoQuestion } from './features/investment-memo/types';

// Utility function to split answer content
const splitAnswerContent = (content: string | any) => {
  if (!content) {
    return { tldr: '', details: '' };
  }
  
  // Ensure content is a string
  if (typeof content !== 'string') {
    content = String(content);
  }
  
  // Handle both TL;DR and Summary formats
  let processedContent = content;
  if (processedContent.includes('TL;DR:')) {
    processedContent = processedContent.replace('TL;DR:', 'Summary:');
  }
  
  const parts = processedContent.split(/DETAILS:/i);
  
  if (parts.length === 1) {
    // Clean up asterisks in content if no DETAILS section
    let cleanContent = parts[0].trim();
    cleanContent = cleanContent.replace(/Summary:/i, '').trim();
    
    // Remove numbered list format (e.g., "1. Summary")
    cleanContent = cleanContent.replace(/^\d+\.\s*Summary\s*/i, '');
    
    // Remove markdown bold/italic formatting
    cleanContent = cleanContent.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    cleanContent = cleanContent.replace(/\*(.*?)\*/g, '$1');     // Italic
    cleanContent = cleanContent.replace(/\*+/g, '');             // Any remaining asterisks
    
    return { 
      tldr: cleanContent, 
      details: '' 
    };
  }
  
  // Process Summary section (previously TL;DR)
  let tldr = parts[0].trim();
  tldr = tldr.replace(/Summary:/i, '').trim();
  
  // Remove numbered list format (e.g., "1. Summary")
  tldr = tldr.replace(/^\d+\.\s*Summary\s*/i, '');
  
  // Process DETAILS section
  let details = parts[1].trim();
  
  // Remove numbered list format (e.g., "2. Details")
  details = details.replace(/^\d+\.\s*Details\s*/i, '');
  
  // Remove markdown bold/italic formatting from both parts
  tldr = tldr.replace(/\*\*(.*?)\*\*/g, '$1');    // Bold
  tldr = tldr.replace(/\*(.*?)\*/g, '$1');        // Italic
  tldr = tldr.replace(/\*+/g, '');                // Any remaining asterisks
  
  details = details.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
  details = details.replace(/\*(.*?)\*/g, '$1');     // Italic
  details = details.replace(/\*+/g, '');             // Any remaining asterisks
  
  return { 
    tldr: tldr, 
    details: details 
  };
};

interface InvestmentMemoProps {
    files: any[];
    onComplete?: (passed: boolean) => void;
    onAnswerUpdate?: (id: string, summary: string, details: string) => void;
}

// Create a ref to expose methods to the parent component
const InvestmentMemo = forwardRef<{
    analyzeDocuments: () => Promise<void>;
    exportToPDF: () => void;
    getAnswers: () => Record<string, PDFAnswer>;
}, InvestmentMemoProps>(({ files, onComplete, onAnswerUpdate }, ref) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [answers, setAnswers] = useState<Record<string, PDFAnswer>>({});
    const [error, setError] = useState<string | null>(null);
    const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>(() => {
        const initialState = Object.fromEntries(INVESTMENT_MEMO_QUESTIONS.map(q => [q.id, false]));
        console.log('Initial expandedAnswers state:', initialState);
        return initialState;
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedAnswer, setEditedAnswer] = useState<string>('');
    
    // New state variables for prompt management
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);
    const [editedPrompt, setEditedPrompt] = useState<string>('');
    const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({});

    // Reset expandedAnswers whenever answers change
    useEffect(() => {
        // When new answers arrive, ensure details remain collapsed
        setExpandedAnswers(Object.fromEntries(INVESTMENT_MEMO_QUESTIONS.map(q => [q.id, false])));
    }, [answers]);

    // Reset expandedAnswers whenever answers change
    useEffect(() => {
        // When new answers arrive, ensure details remain collapsed
        setExpandedAnswers(Object.fromEntries(INVESTMENT_MEMO_QUESTIONS.map(q => [q.id, false])));
    }, [answers]);

    // Reset expandedAnswers whenever answers change
    useEffect(() => {
        // When new answers arrive, ensure details remain collapsed
        setExpandedAnswers(Object.fromEntries(INVESTMENT_MEMO_QUESTIONS.map(q => [q.id, false])));
    }, [answers]);

    const logo = '/templates/unnamed.jpg'
    // Export to PDF function
    const handleExportPDF = async () => {
        console.log('exportToPDF called from button click');
        try {
            // Transform answers to match the expected format for PDF export
            const transformedAnswers: Record<string, PDFAnswer> = Object.fromEntries(
                Object.entries(answers).map(([id, answer]) => {
                    return [id, {
                        summary: answer.summary,
                        details: answer.details,
                        isEdited: answer.isEdited || false // Ensure isEdited is always a boolean
                    }];
                })
            );

            await generatePDFExport(
                INVESTMENT_MEMO_QUESTIONS,
                transformedAnswers,
                "Investment Memo", // title is required
                "Investment Memo", // description is required
                {
                    includeTableOfContents: true,
                    includeAppendices: true,
                    language: 'en'
                },
                logo
            );
        } catch (error) {
            console.error('Error generating PDF:', error);
            setError('Failed to generate PDF. Please try again.');
        }
    }; //

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
        analyzeDocuments,
        exportToPDF: handleExportPDF,
        getAnswers: () => answers
    }));

    const toggleAnswer = (id: string) => {
        console.log(`Toggle answer for ${id}: current state = ${expandedAnswers[id] || false}`);
        setExpandedAnswers(prev => {
            const newState = {
                ...prev,
                [id]: !prev[id]
            };
            console.log(`New state for ${id} = ${newState[id]}`);
            return newState;
        });
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setEditedAnswer(answers[id]?.summary || '');
    };

    const handleSave = (id: string) => {
        if (editedAnswer.trim()) {
            const updatedAnswer = {
                summary: editedAnswer,
                details: answers[id]?.details || '',
                isEdited: true
            };
            
            setAnswers(prev => ({
                ...prev,
                [id]: updatedAnswer
            }));
            
            // Reset details expansion state when saving
            setExpandedAnswers(prev => ({
                ...prev,
                [id]: false
            }));
            
            // Notify parent component of the update
            if (onAnswerUpdate) {
                console.log('Response type:', typeof editedAnswer, 'Response value:', editedAnswer);
                onAnswerUpdate(id, typeof editedAnswer === 'string' ? editedAnswer : String(editedAnswer), answers[id]?.details || '');
            }
        }
        setEditingId(null);
        setEditedAnswer('');
    };

    /**
     * Get the prompt for a specific question
     * Uses the new prompt generator or custom prompt if available
     */
    const getPromptForQuestion = (id: string, customPrompt?: string): string => {
        // If a custom prompt is provided, use that
        if (customPrompt && customPrompt.trim()) {
            return customPrompt;
        }
        
        // Use the new prompt generator
        return generatePromptForQuestion(id);
    };

    const handleViewPrompt = (id: string) => {
        const questionObj = getQuestionById(id);
        if (!questionObj) return;
        
        // If we have a custom prompt, use that, otherwise use the instructions from the question
        const promptText = customPrompts[id] || questionObj.instructions || '';
        
        setCurrentPromptId(id);
        setEditedPrompt(promptText);
        setShowPromptModal(true);
    };

    const handleSavePrompt = () => {
        if (currentPromptId && editedPrompt.trim()) {
            setCustomPrompts(prev => ({
                ...prev,
                [currentPromptId]: editedPrompt
            }));
            setShowPromptModal(false);
        }
    };

    const analyzeDocuments = async () => {
        if (!files || files.length === 0) {
            setError('Please add some documents to analyze first!');
            return;
        }

        // Separate documents by type
        const pdfFiles = files.filter(file => 
            file.type !== 'note' && file.name.toLowerCase().endsWith('.pdf')
        );
        
        const excelFiles = files.filter(file => 
            file.type !== 'note' && (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))
        );

        if (pdfFiles.length === 0 && excelFiles.length === 0) {
            setError('Please upload both a pitch deck (PDF) and financial data (Excel) for a complete analysis.');
            return;
        }

        if (pdfFiles.length === 0) {
            setError('Please upload a pitch deck (PDF) for qualitative analysis.');
            return;
        }

        if (excelFiles.length === 0) {
            setError('Please upload financial data (Excel) for quantitative analysis.');
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const newAnswers: Record<string, PDFAnswer> = {};

            for (const { id, question } of INVESTMENT_MEMO_QUESTIONS) {
                console.log(`Analyzing question: ${id}`);
                
                // Create a prompt using our prompt generator
                const prompt = getPromptForQuestion(id, customPrompts[id]);

                try {
                    const response = await chatService.sendMessage(prompt, files);
                    
                    if (!response) {
                        throw new Error('No response received from chat service');
                    }

                    // Ensure response is a string
                    let stringResponse = '';
                    
                    // Handle different response types
                    if (typeof response === 'string') {
                        stringResponse = response;
                    } else {
                        // Try to convert to string safely
                        try {
                            if (response && typeof response === 'object') {
                                // Check if it has a text property
                                const responseObj = response as any;
                                if (responseObj.text) {
                                    stringResponse = responseObj.text;
                                } else {
                                    stringResponse = JSON.stringify(response);
                                }
                            } else {
                                stringResponse = String(response);
                            }
                        } catch (e) {
                            console.error('Error converting response to string:', e);
                            stringResponse = 'Error processing response';
                        }
                    }

                    // Process the response to extract summary and details
                    const { tldr, details } = splitAnswerContent(stringResponse);

                    newAnswers[id] = {
                        summary: tldr,
                        details: details,
                        isEdited: false
                    };
                    
                    // Update answers after each question is processed
                    setAnswers(prev => ({
                        ...prev,
                        [id]: newAnswers[id]
                    }));
                    
                    // Notify parent component of the update
                    if (onAnswerUpdate) {
                        console.log('Response processed - Summary:', tldr.substring(0, 50) + '...', 'Details:', details.substring(0, 50) + '...');
                        onAnswerUpdate(id, tldr, details);
                    }
                    
                } catch (questionError) {
                    console.error(`Error on question ${id}:`, questionError);
                    const errorMsg = `Error analyzing this question: ${questionError.message || 'Please try again.'}`;
                    
                    newAnswers[id] = { 
                        summary: errorMsg,
                        details: '',
                        isEdited: false 
                    };
                    
                    // Update answers even when there's an error
                    setAnswers(prev => ({
                        ...prev,
                        [id]: newAnswers[id]
                    }));
                    
                    // Notify parent component of the error
                    if (onAnswerUpdate) {
                        onAnswerUpdate(id, errorMsg, '');
                    }
                }
            }

            // Check if all questions have been answered
            const allAnswered = INVESTMENT_MEMO_QUESTIONS.every(
                ({ id }) => newAnswers[id] && 
                            typeof newAnswers[id].summary === 'string' && 
                            newAnswers[id].summary.trim().length > 0
            );
            
            if (allAnswered && onComplete) {
                onComplete(true);
            }

        } catch (error) {
            console.error('Error analyzing documents:', error);
            setError(`Error analyzing documents: ${error.message || 'Please try again.'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const regenerateAnswer = async (id: string) => {
        if (!files || files.length === 0) {
            setError('Please add some documents to analyze first!');
            return;
        }

        // Check if both document types are available
        const pdfFiles = files.filter(file => 
            file.type !== 'note' && file.name.toLowerCase().endsWith('.pdf')
        );
        
        const excelFiles = files.filter(file => 
            file.type !== 'note' && (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))
        );

        if (pdfFiles.length === 0 || excelFiles.length === 0) {
            setError('Both pitch deck (PDF) and financial data (Excel) are required for a complete analysis.');
            return;
        }

        const questionObj = getQuestionById(id);
        if (!questionObj) return;

        try {
            // Mark as regenerating
            setAnswers(prev => ({
                ...prev,
                [id]: {
                    summary: 'Regenerating...',
                    details: '',
                    isEdited: false
                }
            }));

            // Use custom prompt if available, otherwise use the prompt generator
            const prompt = getPromptForQuestion(id, customPrompts[id]);
            
            const response = await chatService.sendMessage(prompt, files);
            
            if (!response) {
                throw new Error('No response received from chat service');
            }

            // Ensure response is a string
            let stringResponse = '';
            
            // Handle different response types
            if (typeof response === 'string') {
                stringResponse = response;
            } else {
                // Try to convert to string safely
                try {
                    if (response && typeof response === 'object') {
                        // Check if it has a text property
                        const responseObj = response as any;
                        if (responseObj.text) {
                            stringResponse = responseObj.text;
                        } else {
                            stringResponse = JSON.stringify(response);
                        }
                    } else {
                        stringResponse = String(response);
                    }
                } catch (e) {
                    console.error('Error converting response to string:', e);
                    stringResponse = 'Error processing response';
                }
            }
            
            // Process the response
            const { tldr, details } = splitAnswerContent(stringResponse);
            
            // Update answers state
            setAnswers(prev => ({
                ...prev,
                [id]: {
                    summary: tldr,
                    details: details,
                    isEdited: false
                }
            }));
            
            // Reset details expansion state when regenerating
            setExpandedAnswers(prev => ({
                ...prev,
                [id]: false
            }));
            
            // Notify parent component of update
            if (onAnswerUpdate) {
                onAnswerUpdate(id, tldr, details);
            }
        } catch (error) {
            console.error(`Error regenerating answer for ${id}:`, error);
            setError(`Failed to regenerate answer: ${error.message || 'Unknown error'}`);
            
            // Reset the answer state on error
            setAnswers(prev => ({
                ...prev,
                [id]: prev[id] || { summary: '', details: '', isEdited: false }
            }));
        }
    };

    return (
        <div className="p-4 space-y-6">
            {error && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                    {error}
                </div>
            )}
            
            {isAnalyzing ? (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-700">Analyzing documents...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.keys(answers).length === 0 ? (
                        <div className="text-center">
                            <button 
                                onClick={analyzeDocuments}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                                disabled={isAnalyzing || !files || files.length === 0}
                            >
                                Analyze Documents
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-end space-x-4 mb-4">
                                <button
                                    onClick={analyzeDocuments}
                                    className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                                    disabled={isAnalyzing}
                                >
                                    <RefreshCw size={16} className="mr-2" />
                                    Refresh Analysis
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="flex items-center px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-900 focus:outline-none"
                                >
                                    <FileDown size={16} className="mr-2" />
                                    Export to PDF
                                </button>
                            </div>
                            
                            <div className="space-y-8">
                                {INVESTMENT_MEMO_QUESTIONS.map(({ id, question, description }) => {
                                    const answer = answers[id];
                                    
                                    if (!answer) return null;
                                    
                                    const { tldr, details } = splitAnswerContent(answer.summary);
                                    const formattedAnswer = formatNumbersInText(tldr);
                                    const formattedDetails = formatNumbersInText(details);
                                    // Make sure details are explicitly collapsed by default
                                    const isExpanded = expandedAnswers[id] === true;
                                    
                                    console.log(`Question ${id}: isExpanded = ${isExpanded}`);
                                    
                                    return (
                                        <div key={id} className="p-4 bg-white rounded-lg shadow">
                                            <div className="mb-2 flex justify-between items-start">
                                                <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewPrompt(id)}
                                                        className="text-blue-500 hover:text-blue-700 focus:outline-none"
                                                        title="View AI Prompt"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(id)}
                                                        className="text-gray-500 hover:text-blue-500 focus:outline-none"
                                                        title="Edit answer"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => regenerateAnswer(id)}
                                                        className="text-gray-500 hover:text-blue-500 focus:outline-none"
                                                        title="Regenerate answer"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm text-gray-500 mb-3">{description}</p>
                                            
                                            {editingId === id ? (
                                                <div className="space-y-3">
                                                    <textarea
                                                        value={editedAnswer}
                                                        onChange={(e) => setEditedAnswer(e.target.value)}
                                                        rows={8}
                                                        className="w-full p-2 border border-gray-300 rounded"
                                                    ></textarea>
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="px-3 py-1 mr-2 text-sm text-gray-700 bg-gray-200 rounded"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleSave(id)}
                                                            className="flex items-center px-3 py-1 text-sm text-white bg-blue-600 rounded"
                                                        >
                                                            <Save size={14} className="mr-1" />
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    {/* Summary Section - Always visible */}
                                                    <div className="prose max-w-none mt-2">
                                                        <div className="text-sm font-medium text-gray-500 mb-1">Summary</div>
                                                        {typeof formattedAnswer === 'string' ? (
                                                            <ReactMarkdown>{formattedAnswer}</ReactMarkdown>
                                                        ) : (
                                                            <ReactMarkdown>{String(formattedAnswer)}</ReactMarkdown>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Details Section - Only show button if details exist */}
                                                    {formattedDetails && (
                                                        <div className="mt-4">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();  // Prevent default behavior
                                                                    e.stopPropagation(); // Prevent triggering question collapse
                                                                    console.log(`Details button clicked for ${id}`);
                                                                    toggleAnswer(id);
                                                                }}
                                                                className="text-sm text-blue-600 hover:text-blue-800 bg-blue-50 py-1 px-3 rounded-md border border-blue-100 focus:outline-none"
                                                            >
                                                                {isExpanded ? 'Hide Details' : 'Show Details'}
                                                            </button>
                                                            
                                                            {/* Only render details content when expanded */}
                                                            {isExpanded && (
                                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                                    <div className="text-sm font-medium text-gray-500 mb-2">Details</div>
                                                                    <div className="prose max-w-none text-sm">
                                                                        {typeof formattedDetails === 'string' ? (
                                                                            <ReactMarkdown>{formattedDetails}</ReactMarkdown>
                                                                        ) : (
                                                                            <ReactMarkdown>{String(formattedDetails)}</ReactMarkdown>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {answer.isEdited && (
                                                <div className="mt-2 text-xs text-gray-500 italic">
                                                    Edited manually
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Prompt Modal */}
            {showPromptModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-3/4 max-w-3xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">AI Prompt</h3>
                                {currentPromptId && (
                                    <p className="text-sm text-gray-600">
                                        {INVESTMENT_MEMO_QUESTIONS.find(q => q.id === currentPromptId)?.question || ''}
                                    </p>
                                )}
                            </div>
                            <button 
                                onClick={() => setShowPromptModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="mb-4 flex-grow overflow-auto">
                            {editingId === currentPromptId ? (
                                <textarea
                                    value={editedPrompt}
                                    onChange={(e) => setEditedPrompt(e.target.value)}
                                    className="w-full h-full min-h-[300px] p-3 border border-gray-300 rounded font-mono text-sm"
                                ></textarea>
                            ) : (
                                <div className="border border-gray-300 rounded p-3 h-full min-h-[300px] overflow-auto whitespace-pre-wrap font-mono text-sm">
                                    {editedPrompt}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-between space-x-3">
                            <button
                                onClick={() => setEditingId(currentPromptId === editingId ? null : currentPromptId)}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                {currentPromptId === editingId ? "Preview" : "Edit"}
                            </button>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowPromptModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSavePrompt}
                                    className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default InvestmentMemo;