'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from '@mui/icons-material';
import { X, FileText, FileSpreadsheet } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { notesService } from '../services/notesService';
import { filesService } from '../services/filesService';
import { chatService } from '../services/chatService';
import InvestmentMemo from './InvestmentMemo';

// List of questions for the investment memo (updated with detailed prompts)
const INVESTMENT_MEMO_QUESTIONS = [
  {
    id: 'arr',
    question: 'What is the current Annual Recurring Revenue (ARR) of the company?',
    description: 'Find the most recent ARR figure with currency.'
  },
  {
    id: 'burn-rate',
    question: 'What is the current burn rate?',
    description: 'Calculate the rate at which the company is spending cash.'
  },
  {
    id: 'runway',
    question: 'How many months of runway does the company have at the current expense level?',
    description: 'Calculate how long the company can operate with current funds.'
  },
  {
    id: 'problem',
    question: 'What problem is this company trying to solve?',
    description: 'Identify the core customer problem the company addresses.'
  },
  {
    id: 'team',
    question: 'Who are the key members of the management team and what are their backgrounds?',
    description: 'Identify key executives and their relevant experience.'
  },
];

export default function MainLayout() {
  const [files, setFiles] = useState([]);
  const [noteDialog, setNoteDialog] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatOutput, setChatOutput] = useState('To use MindVault, upload PDFs or add your own notes!');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState('memo');
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [memoAnswers, setMemoAnswers] = useState({});
  
  // Ref for file input
  const fileInputRef = useRef(null);
  // Ref for InvestmentMemo component
  const investmentMemoRef = useRef(null);

  useEffect(() => {
    loadAllContent();
    
    // Set up event listener for answer updates
    const handleAnswerUpdate = (event) => {
      const { id, content } = event.detail;
      setMemoAnswers(prev => ({
        ...prev,
        [id]: { content }
      }));
    };

    // Add event listener
    const memoContainer = document.getElementById('memo-container');
    if (memoContainer) {
      memoContainer.addEventListener('answer-updated', handleAnswerUpdate);
    }

    // Clean up
    return () => {
      if (memoContainer) {
        memoContainer.removeEventListener('answer-updated', handleAnswerUpdate);
      }
    };
  }, []);

  const loadAllContent = async () => {
    try {
      const [, documents] = await Promise.all([
        notesService.getNotes(),
        filesService.getFiles()
      ]);

      const formattedFiles = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type || 'document',
        content: doc.content || '',
        created_at: doc.created_at
      }));

      setFiles(formattedFiles);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  };

  const handleCreateNote = async () => {
    try {
      if (!noteTitle.trim() || !noteContent.trim()) {
        alert('Please fill in both title and content');
        return;
      }

      await notesService.createNote(noteTitle, noteContent);
      setNoteDialog(false);
      setNoteTitle('');
      setNoteContent('');
      await loadAllContent();
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note. Please try again.');
    }
  };

  

  const handleUploadType = () => {
    fileInputRef.current.accept = ".pdf";
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsLoading(true);
    try {
      console.log(`Uploading file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      // Upload the file and get the processed document back
      const uploadedDocument = await filesService.uploadFile(file, file.name);
      console.log('File uploaded successfully:', uploadedDocument.id);
      
      // Verify content was extracted properly
      if (uploadedDocument && uploadedDocument.id) {
        try {
          const contentStatus = await filesService.verifyFileContent(uploadedDocument.id);
          console.log('File content verification:', contentStatus);
          
          if (!contentStatus.hasContent) {
            console.warn('Warning: No content was extracted from the file');
            alert('File was uploaded, but no text content could be extracted. AI analysis may be limited.');
          }
        } catch (verifyError) {
          console.error('Error verifying file content:', verifyError);
        }
      }
      
      // Reload all files to update the state
      await loadAllContent();
      setIsLoading(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      // Provide more specific error messages based on the error
      let errorMsg = 'Failed to upload file';
      
      if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      
      if (error.statusCode) {
        errorMsg += ` (Status: ${error.statusCode})`;
      }
      
      // Check for Supabase storage quota issues
      if (error.error_description && error.error_description.includes('quota')) {
        errorMsg = 'Storage quota exceeded. Please delete some files first.';
      }
      
      setChatOutput(errorMsg);
      alert(`File upload failed: ${errorMsg}`);
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsLoading(true);

    try {
      // Check if there are any files uploaded
      if (!files || files.length === 0) {
        setChatOutput('Please upload at least one document (pitch deck PDF and financial data Excel file) to analyze.');
        setIsLoading(false);
        return;
      }
      
      // Pass files array to chatService for context
      const response = await chatService.sendMessage(userMessage, files);
      
      // Process the response to extract text if it's in JSON format
      let processedResponse = response;
      if (typeof response === 'string') {
        try {
          if (response.startsWith('{') && response.includes('"text":')) {
            const parsed = JSON.parse(response);
            processedResponse = parsed.text || response;
          }
        } catch (e) {
          console.error('Error parsing chat response:', e);
          // Keep original response if parsing fails
        }
      } else if (response && response.text) {
        processedResponse = response.text;
      }
      
      // Ensure processedResponse is a string
      if (typeof processedResponse !== 'string') {
        processedResponse = String(processedResponse);
      }
      
      setChatOutput(processedResponse);
      setSuggestedQuestions(response.suggestedQuestions || []);
    } catch (error) {
      console.error('Error getting chat response:', error);
      setChatOutput('Sorry, there was an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (fileId, fileType) => {
    try {
      if (window.confirm('Are you sure you want to delete this item?')) {
        if (fileType === 'note') {
          await notesService.deleteNote(fileId);
        } else {
          await filesService.deleteFile(fileId);
        }
        await loadAllContent();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  // Get pitch deck and financial files
  
  
 

  // Create helper variables to check if documents exist
  const hasDocuments = files.filter(file => file.type !== 'note').length > 0;
  const hasNotes = files.filter(file => file.type === 'note').length > 0;

  // Create friendly messages for empty repository sections
  const EMPTY_DOCUMENTS_MESSAGE = "Upload a PDF or Excel file to get started.";
  const EMPTY_NOTES_MESSAGE = "Your notes will appear here. Start creating!";

  // Create placeholder helpful text for each question before analysis
 
  // Add a function to handle suggested question clicks
  const handleSuggestedQuestionClick = async (question) => {
    setChatInput(question);
    await handleChatSubmit({ preventDefault: () => {} });
  };

  // Add this new rendering section for suggested Excel questions
  const renderSuggestedQuestions = () => {
    if (suggestedQuestions.length === 0) return null;
    
    return (
      <div className="mt-4 mb-2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Suggested questions about your Excel data:</h3>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedQuestionClick(question)}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded-full"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Function to handle Generate Investment Memo button click
  const handleGenerateInvestmentMemo = () => {
    // Reset the answers first
    setMemoAnswers({});
    
    // Check if there are any files available
    if (files.length === 0) {
      alert('Please upload at least one document to analyze.');
      return;
    }
    
    // Check if both PDF and Excel files are available
    const pdfFiles = files.filter(file => 
      file.type !== 'note' && file.name.toLowerCase().endsWith('.pdf')
    );
    
    const excelFiles = files.filter(file => 
      file.type !== 'note' && (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))
    );
    
    if (pdfFiles.length === 0) {
      alert('Please upload at least one pitch deck (PDF) file.');
      return;
    }
    
    if (excelFiles.length === 0) {
      alert('Please upload at least one financial data (Excel) file.');
      return;
    }
    
    // Initialize empty answers for each question to show loading state
    const initialAnswers = {};
    INVESTMENT_MEMO_QUESTIONS.forEach(question => {
      initialAnswers[question.id] = { content: 'Generating...' };
    });
    setMemoAnswers(initialAnswers);
    
    // Call the analyze method on the ref
    if (investmentMemoRef.current && investmentMemoRef.current.analyzeDocuments) {
      try {
        investmentMemoRef.current.analyzeDocuments();
      } catch (error) {
        console.error('Error generating investment memo:', error);
        
        // Update answers to show error
        const errorAnswers = {};
        INVESTMENT_MEMO_QUESTIONS.forEach(question => {
          errorAnswers[question.id] = { content: 'Error generating answer. Please try again.' };
        });
        setMemoAnswers(errorAnswers);
        
        alert('Error generating investment memo. Please try again.');
      }
    } else {
      console.error('InvestmentMemo reference or analyzeDocuments method not available');
      alert('Unable to generate investment memo. Please refresh the page and try again.');
    }
  };

  // Function to handle Export PDF button click
  const handleExportPDF = async () => {
    if (investmentMemoRef.current && investmentMemoRef.current.exportToPDF) {
      try {
        await investmentMemoRef.current.exportToPDF();
      } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export PDF. Please try again.');
      }
    }
  };

  // Handler for regenerating an answer
  const handleRegenerateAnswer = (key) => {
    console.log(`Handling answer for: ${key}`);
    
    // This is called by the InvestmentMemo component with each question ID
    // The component is responsible for getting the answer from the API
    // and then calling this function to update the parent state
    
    // For demo purposes, we're generating test data if real data is not provided
    // In a real implementation, this function would be called with the actual content
    setMemoAnswers(prevAnswers => {
      // If this key doesn't exist yet or is still in "Generating..." state, keep it as is
      if (!prevAnswers[key] || prevAnswers[key].content === 'Generating...') {
        return prevAnswers;
      }
      
      // Otherwise, this is a request to regenerate the answer
      // For demo purposes, we'll just append "(Regenerated)" to the content
      return {
        ...prevAnswers,
        [key]: { 
          content: prevAnswers[key].content + " (Regenerated)" 
        }
      };
    });
  };

  // Handler for manually editing an answer
  const handleManualEdit = (key) => {
    console.log(`Editing answer for: ${key}`);
    
    // In a real implementation, you would show a dialog to edit the content
    // For now, we'll just add a placeholder functionality
    const currentContent = memoAnswers[key]?.content || '';
    
    // This is very simplified - in a real app, you'd use a modal dialog with a text area
    const newContent = prompt('Edit the content:', currentContent);
    
    if (newContent !== null && newContent !== currentContent) {
      setMemoAnswers(prevAnswers => ({
        ...prevAnswers,
        [key]: { content: newContent }
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1A1F2E]">
      {/* Header */}
      <header className="bg-[#1A1F2E] text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">•••• Project Higgins: A Innovera Initiative</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 container mx-auto">
        {/* Left Panel - Notes Repository */}
        <div className="w-full md:w-1/2 bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-center border-b pb-2">Notes Repository</h2>
          
          {/* Insert Note Button */}
          <button 
            onClick={() => setNoteDialog(true)}
            className="w-full bg-[#E6007E] hover:bg-[#C4006C] text-white p-3 rounded mb-4 font-medium"
          >
            Insert Note
          </button>
          
          {/* Upload Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button 
              onClick={() => handleUploadType()}
              className="bg-[#E6007E] hover:bg-[#C4006C] text-white p-2 rounded flex items-center justify-center gap-2"
            >
              <FileText size={18} />
              Upload Pitch Deck (PDF only)
            </button>
            <button 
              onClick={() => handleUploadType()}
              className="bg-[#E6007E] hover:bg-[#C4006C] text-white p-2 rounded flex items-center justify-center gap-2"
            >
              <FileSpreadsheet size={18} />
              Upload Financials (Excel only)
            </button>
          </div>
          
          {/* Uploaded Documents */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Uploaded Documents</h3>
            <ul className="space-y-1">
              {hasDocuments ? (
                files.filter(file => file.type !== 'note').map(file => (
                  <li key={file.id} className="p-2 hover:bg-gray-100 rounded flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls') ? 
                        <FileSpreadsheet size={16} className="text-green-500" /> : 
                        <FileText size={16} className="text-red-500" />
                      }
                      <span className="truncate">{file.name}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteFile(file.id, file.type)} 
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))
              ) : (
                <li className="p-4 text-center italic text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  {EMPTY_DOCUMENTS_MESSAGE}
                </li>
              )}
            </ul>
          </div>
          
          {/* Notes */}
          <div>
            <h3 className="font-semibold mb-2">Notes</h3>
            <ul className="space-y-1">
              {hasNotes ? (
                files.filter(file => file.type === 'note').map(note => (
                  <li key={note.id} className="p-2 hover:bg-gray-100 rounded flex justify-between items-center">
                    <span className="truncate">{note.name || 'Untitled Note'}</span>
                    <button 
                      onClick={() => handleDeleteFile(note.id, 'note')} 
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))
              ) : (
                <li className="p-4 text-center italic text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  {EMPTY_NOTES_MESSAGE}
                </li>
              )}
            </ul>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.xlsx,.xls" 
            onChange={handleFileChange} 
          />
        </div>

        {/* Right Panel - Content View */}
        <div className="w-full md:w-1/2 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
          {/* View Toggle */}
          <div className="flex bg-gray-100 border-b">
            <button 
              onClick={() => setView('memo')} 
              className={`px-6 py-3 flex-1 font-medium ${view === 'memo' ? 'bg-white text-black' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              Investment Memo
            </button>
            <button 
              onClick={() => setView('chat')} 
              className={`px-6 py-3 flex-1 font-medium ${view === 'chat' ? 'bg-white text-black' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              Chat Mode
            </button>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 p-6 overflow-auto">
            {view === 'memo' ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Investment Memo</h2>
                  <button 
                    onClick={handleExportPDF}
                    className="text-gray-700 border border-gray-300 px-3 py-1 rounded hover:bg-gray-100"
                  >
                    Export PDF
                  </button>
                </div>
                
                <p className="text-gray-700 mb-6">
                  This analysis will evaluate key financial metrics, business model, and team composition to determine investment potential.
                </p>
                
                <button 
                  onClick={handleGenerateInvestmentMemo}
                  className="w-full bg-[#1A1F2E] text-white py-3 rounded mb-6"
                >
                  Generate Investment Memo
                </button>
                
                {/* Display memo answers */}
                <div className="space-y-4 mb-6">
                  {INVESTMENT_MEMO_QUESTIONS.map(question => (
                    <div key={question.id} className="border rounded-lg overflow-hidden">
                      <div className="p-3 bg-gray-50">
                        <h3 className="font-medium text-[#1A1F2E]">{question.question}</h3>
                        <p className="text-sm text-gray-500">{question.description}</p>
                      </div>
                      <div className="p-4 bg-white">
                        {memoAnswers[question.id] ? (
                          <div>
                            {typeof memoAnswers[question.id].content === 'string' && memoAnswers[question.id].content !== 'Generating...' ? (
                              <ReactMarkdown>{memoAnswers[question.id].content}</ReactMarkdown>
                            ) : memoAnswers[question.id].content === 'Generating...' ? (
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                                <span>Generating...</span>
                              </div>
                            ) : (
                              <div className="text-red-500">Error displaying content. Please regenerate.</div>
                            )}
                            <div className="flex justify-end gap-2 mt-2">
                              <button 
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                onClick={() => handleRegenerateAnswer(question.id)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Regenerate
                              </button>
                              <button 
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                onClick={() => handleManualEdit(question.id)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 italic">
                            Click &quot;Generate Investment Memo&quot; to analyze this question
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div id="memo-container">
                  <InvestmentMemo 
                    ref={investmentMemoRef} 
                    files={files}
                    onComplete={(passed) => {
                      console.log('Investment memo analysis completed:', passed);
                    }}
                    onAnswerUpdate={(id, content) => {
                      console.log(`Answer updated for ${id}:`, content);
                      // Handle both string and object content formats
                      let processedContent = '';
                      
                      // Handle different content types
                      if (typeof content === 'string') {
                        processedContent = content;
                        
                        // Check if it's a JSON string and parse it
                        if (content.startsWith('{') && content.includes('"text":')) {
                          try {
                            const parsed = JSON.parse(content);
                            if (parsed.text) {
                              processedContent = parsed.text;
                            }
                          } catch (e) {
                            console.error('Error parsing content:', e);
                            // Keep original content if parsing fails
                          }
                        }
                      } else if (content && typeof content === 'object') {
                        // Handle object response
                        if (content.text) {
                          processedContent = content.text;
                        } else {
                          try {
                            processedContent = JSON.stringify(content);
                          } catch {
                            processedContent = 'Error processing content';
                          }
                        }
                      } else {
                        // Fallback for any other type
                        processedContent = String(content);
                      }
                      
                      setMemoAnswers(prev => ({
                        ...prev,
                        [id]: { content: processedContent }
                      }));
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-auto">
                  <div className="prose max-w-none">
                    {typeof chatOutput === 'string' && (
                      <ReactMarkdown>{chatOutput}</ReactMarkdown>
                    )}
                    {typeof chatOutput !== 'string' && (
                      <ReactMarkdown>{String(chatOutput)}</ReactMarkdown>
                    )}
                  </div>
                  {renderSuggestedQuestions()}
                </div>
                
                <form onSubmit={handleChatSubmit} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 p-2 border rounded"
                    placeholder="Ask about your documents..."
                    disabled={isLoading}
                  />
                  <button 
                    type="submit" 
                    className="bg-[#E6007E] hover:bg-[#C4006C] text-white p-2 rounded"
                    disabled={isLoading}
                  >
                    <Search />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note Dialog */}
      {noteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create New Note</h2>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-[#E6007E] focus:border-transparent"
              placeholder="Title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />
            <textarea
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md mb-6 h-32 focus:outline-none focus:ring-2 focus:ring-[#E6007E] focus:border-transparent resize-none"
              placeholder="Content"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setNoteDialog(false)}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-150 ease-in-out"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                className="px-6 py-2.5 bg-[#E6007E] text-white rounded-md hover:bg-[#C4006C] transition-colors duration-150 ease-in-out font-medium"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="text-center text-gray-700">
              Processing your request...
            </div>
          </div>
        </div>
      )}

      {view === 'memo' ? (
        <button
          onClick={() => setView('chat')}
          className="fixed bottom-4 right-4 bg-[#1A1F2E] text-white py-2 px-4 rounded-full hover:bg-[#2A2F3E] transition-colors flex items-center gap-2 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0v-4a1 1 0 112 0v4z" clipRule="evenodd" />
          </svg>
          Switch to Chat
        </button>
      ) : (
        <button
          onClick={() => setView('memo')}
          className="fixed bottom-4 right-4 bg-[#1A1F2E] text-white py-2 px-4 rounded-full hover:bg-[#2A2F3E] transition-colors flex items-center gap-2 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0v-4a1 1 0 112 0v4z" clipRule="evenodd" />
          </svg>
          Switch to Memo
        </button>
      )}
    </div>
  );
}