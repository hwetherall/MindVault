'use client';

import { useState, useEffect, useRef } from 'react';
import { X, FileText, FileSpreadsheet } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { notesService } from '../services/notesService';
import { filesService } from '../services/filesService';
import { InvestmentMemoMain } from './features/investment-memo';

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
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref for file input
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAllContent();
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
      
      alert(`File upload failed: ${errorMsg}`);
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

  // Check if there are any documents or notes
  const hasDocuments = files.some(file => file.type !== 'note');
  const hasNotes = files.some(file => file.type === 'note');

  // Create friendly messages for empty repository sections
  const EMPTY_DOCUMENTS_MESSAGE = "Upload a PDF or Excel file to get started.";
  const EMPTY_NOTES_MESSAGE = "Your notes will appear here. Start creating!";

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 p-4 container mx-auto">
        {/* Investment Memo Main Component */}
        <InvestmentMemoMain 
          files={files}
          onComplete={(passed) => {
            console.log('Investment memo analysis completed:', passed);
          }}
          onAnswerUpdate={(id, summary, details) => {
            console.log(`Answer updated for ${id}:`, { summary, details });
          }}
        />
      </div>

      {/* Note Dialog */}
      {noteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Create Note</h2>
              <button onClick={() => setNoteDialog(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label htmlFor="note-title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  id="note-title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter note title"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="note-content" className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  id="note-content"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full p-2 border rounded h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter note content"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setNoteDialog(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  className="px-4 py-2 bg-[#F15A29] text-white rounded hover:bg-[#D94315]"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}