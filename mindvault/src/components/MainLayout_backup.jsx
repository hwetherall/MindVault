import React, { useState, useEffect, useRef } from 'react';
import { Search } from '@mui/icons-material';
import { Trash2, X, FileText, FileSpreadsheet, AlertCircle, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { notesService } from '../services/notesService';
import { filesService } from '../services/filesService';
import { chatService } from '../services/chatService';
import { InvestmentMemo } from '../../app/components/InvestmentMemo';

// Utility function to format numbers to 2 decimal places maximum
const formatNumbersInText = (text) => {
  if (!text) return '';

  // Regular expression to find numbers with decimal points
  let formattedText = text;

  // Format currency values with $ symbols (like $123.4567 to $123.46)
  formattedText = formattedText.replace(/\$\s*(\d+\.\d+)/g, (match, number) => {
    return `$${parseFloat(number).toFixed(2)}`;
  });
  
  // Format currency values with currency codes (like USD$123.4567 to USD$123.46)
  formattedText = formattedText.replace(/(AU|USD|EUR|GBP|CAD|AUD)\$\s*(\d+\.\d+)/g, (match, currency, number) => {
    return `${currency}$${parseFloat(number).toFixed(2)}`;
  });
  
  // Format percentages (like 12.3456% to 12.35%)
  formattedText = formattedText.replace(/(\d+\.\d+)%/g, (match, number) => {
    return `${parseFloat(number).toFixed(2)}%`;
  });
  
  // Format standalone numbers with 3 or more decimal places (like 123.4567 to 123.46)
  formattedText = formattedText.replace(/(\d+\.\d{3,})(?!\w)/g, (match) => {
    return parseFloat(match).toFixed(2);
  });

  return formattedText;
};

export default function MainLayout() {
  const [files, setFiles] = useState([]);
  const [noteDialog, setNoteDialog] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatOutput, setChatOutput] = useState('To use MindVault, upload PDFs or add your own notes!');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState('chat');
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [uploadType, setUploadType] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Ref for file input
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAllContent();
  }, []);

  const loadAllContent = async () => {
    try {
      const [notes, documents] = await Promise.all([
        notesService.getNotes(),
        filesService.getFiles()
      ]);

      const formattedNotes = notes.map(note => ({
        id: note.id,
        name: `${note.title}.txt`,
        type: 'note',
        content: note.content
      }));

      const allContent = [...formattedNotes, ...documents];
      setFiles(allContent);

      // After loading files, check if there are any Excel files and get suggested questions
      if (allContent.some(file => file.excelData)) {
        const questions = await chatService.getSuggestedExcelQuestions(allContent);
        setSuggestedQuestions(questions);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      alert(`Error loading content: ${error.message}`);
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

  const handleClearRepository = async () => {
    if (window.confirm('Are you sure you want to clear all files and notes? This cannot be undone.')) {
      try {
        // First delete all files
        const fileItems = files.filter(file => file.type !== 'note');
        for (const file of fileItems) {
          await filesService.deleteFile(file.id);
        }

        // Then delete all notes
        const noteItems = files.filter(file => file.type === 'note');
        for (const note of noteItems) {
          await notesService.deleteNote(note.id);
        }

        // Clear the files state
        setFiles([]);
      } catch (error) {
        console.error('Error clearing repository:', error);
        alert('Failed to clear repository. Please try again.');
      }
    }
  };

  const handleUploadType = (type) => {
    setUploadType(type);
    if (type === 'financials') {
      fileInputRef.current.accept = ".xlsx,.xls";
    } else {
      fileInputRef.current.accept = ".pdf";
    }
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const file = fileList[0];
    const fileType = file.type;
    
    // Validate file types
    if (uploadType === 'financials' && 
        !(fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          fileType === 'application/vnd.ms-excel')) {
      setErrorMessage('Please upload only Excel files (.xlsx or .xls) for financials');
      event.target.value = ''; // Reset input
      return;
    }
    
    if (uploadType === 'pitchdeck' && fileType !== 'application/pdf') {
      setErrorMessage('Please upload only PDF files for pitch decks');
      event.target.value = ''; // Reset input
      return;
    }
    
    setIsLoading(true);
    if (uploadType === 'financials') {
      setChatOutput('Processing Excel file. This may take a moment for large files...');
    }
    
    try {
      await filesService.uploadFile(file, file.name);
      event.target.value = ''; // Reset input
      setErrorMessage(null);
      
      // Refresh the file list
      await loadAllContent();
      
      // Provide feedback about successful upload
      if (uploadType === 'financials') {
        setChatOutput(`Excel file "${file.name}" processed successfully. You can now ask questions about the data!`);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Error uploading file:', error);
      if (uploadType === 'financials') {
        setChatOutput(`Failed to process Excel file: ${error.message || 'Unknown error'}`);
      }
      setErrorMessage(`Failed to upload file: ${error.message || 'Unknown error'}`);
    }
  };

  const handleChat = async (predefinedQuestion = null) => {
    const questionToAsk = predefinedQuestion || chatInput;
    if (!questionToAsk.trim()) return;

    setIsLoading(true);
    setChatOutput('Thinking...');
    
    try {
      const response = await chatService.sendMessage(
        questionToAsk, 
        files,
        (loading) => setIsLoading(loading)
      );
      setChatOutput(response);
      
      // Only clear input if we used the input field's value
      if (!predefinedQuestion) {
        setChatInput('');
      }
    } catch (error) {
      setIsLoading(false);
      setChatOutput(`Error: ${error.message}`);
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
  const pitchDeckFiles = files.filter(file => 
    file.type !== 'note' && file.name.toLowerCase().endsWith('.pdf')
  );
  
  const financialFiles = files.filter(file => 
    file.type !== 'note' && (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))
  );

  // Add a function to handle suggested question clicks
  const handleSuggestedQuestionClick = async (question) => {
    setChatInput(question);
    await handleChat(question);
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

  return (
    <div className="min-h-screen bg-[#1F2937] p-4">
      <div className="container mx-auto max-w-full p-8">
        <div className="flex items-center mb-8">
          <div className="grid grid-cols-4 gap-1 mr-2">
            <div className="w-2 h-2 bg-white"></div>
            <div className="w-2 h-2 bg-white"></div>
            <div className="w-2 h-2 bg-white"></div>
            <div className="w-2 h-2 bg-white"></div>
          </div>
          <h1 className="text-4xl font-bold text-white">
            Project Higgins: An Innovera Initiative
          </h1>
        </div>
        
        <div className="grid grid-cols-2 gap-8 h-[calc(100vh-12rem)]">
          {/* Left Panel */}
          <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-[#1A1F2E] border-b-2 border-[#E20074] pb-2 text-center">
              Notes Repository
            </h2>
            
            <div className="flex flex-col gap-2 mb-4">
              {/* Hidden file input */}
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.xlsx,.xls"
                ref={fileInputRef}
              />
              
              <button
                onClick={() => setNoteDialog(true)}
                className="bg-[#E20074] text-white py-2 rounded hover:bg-[#B4005C] transition-colors"
              >
                Insert Note
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleUploadType('pitchdeck')}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#E20074] text-white py-2 rounded hover:bg-[#B4005C] transition-colors"
                >
                  <FileText size={18} />
                  Upload Pitch Deck (PDF only)
                </button>
                <button
                  onClick={() => handleUploadType('financials')}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#E20074] text-white py-2 rounded hover:bg-[#B4005C] transition-colors"
                >
                  <Upload size={18} />
                  Upload Financials (Excel only)
                </button>
              </div>
              
              {errorMessage && (
                <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span className="text-sm">{errorMessage}</span>
                  <button 
                    onClick={() => setErrorMessage(null)}
                    className="ml-auto text-red-700 hover:text-red-900"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            
            <h3 className="font-medium text-gray-700 mb-2">Uploaded Documents</h3>
            <div className="mb-4 space-y-2">
              {pitchDeckFiles.length > 0 ? (
                pitchDeckFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-[#E20074]" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.id, file.type)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-400 italic">No pitch deck uploaded</div>
              )}
              
              {financialFiles.length > 0 ? (
                financialFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet size={18} className="text-green-600" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.id, file.type)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-400 italic">No financials uploaded</div>
              )}
            </div>
            
            <h3 className="font-medium text-gray-700 mb-2">Notes</h3>
            <div className="flex-1 overflow-auto">
              <ul className="space-y-2">
                {files.filter(file => file.type === 'note').map((file) => (
                  <li key={file.id} className="flex items-center justify-between text-[#1A1F2E] p-2 hover:bg-gray-50 rounded">
                    <span>• {file.name}</span>
                    <button
                      onClick={() => handleDeleteFile(file.id, file.type)}
                      className="text-[#1A1F2E] hover:text-[#E20074] p-1 transition-colors"
                      title="Delete file"
                    >
                      <X size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleClearRepository}
                className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 p-2 rounded hover:bg-gray-300 transition-colors w-full"
                title="Clear Repository"
              >
                <Trash2 size={16} />
                Clear Repository
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col">
            <div className="flex justify-end mb-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setView('chat')}
                  className={`px-6 py-2.5 rounded-md transition-colors ${
                    view === 'chat'
                      ? 'bg-[#E20074] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Chat Mode
                </button>
                <button
                  onClick={() => setView('investment')}
                  className={`px-6 py-2.5 rounded-md transition-colors ${
                    view === 'investment'
                      ? 'bg-[#E20074] text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Investment Memo
                </button>
              </div>
            </div>

            {view === 'chat' ? (
              <>
                <h2 className="text-xl font-bold mb-4 text-[#1A1F2E] border-b-2 border-[#E20074] pb-2 text-center">
                  Chat Output
                </h2>
                <div className="flex-1 overflow-auto mb-4 prose max-w-none">
                  {chatOutput.trim() === 'Thinking...' ? (
                    <p className="text-[#1A1F2E] italic">{chatOutput}</p>
                  ) : (
                    <ReactMarkdown 
                      components={{
                        p: ({node, ...props}) => <p className="text-[#1A1F2E]" {...props} />
                      }}
                    >
                      {formatNumbersInText(chatOutput)}
                    </ReactMarkdown>
                  )}
                </div>
                <div className="flex gap-2 bg-[#E20074] rounded p-2 mt-auto">
                  {renderSuggestedQuestions()}
                  <input
                    type="text"
                    className="flex-1 px-4 py-2 rounded text-[#1A1F2E]"
                    placeholder="Ask me Anything!"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleChat();
                      }
                    }}
                  />
                  <button 
                    className="bg-transparent"
                    onClick={handleChat}
                    disabled={isLoading}
                  >
                    <Search className={`text-white ${isLoading ? 'opacity-50' : ''}`} />
                  </button>
                </div>
              </>
            ) : (
              <InvestmentMemo files={files} />
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />
            <textarea
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md mb-6 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-150 ease-in-out font-medium"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center text-gray-500 mt-2">
          Processing your request...
        </div>
      )}

      {/* Bottom right notification about database location */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-500">
        Data stored in IndexedDB
      </div>

    </div>
  );
}