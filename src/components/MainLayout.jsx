import React, { useState, useEffect } from 'react';
import { Search } from '@mui/icons-material';
import { Trash2, X } from 'lucide-react';
import { notesService } from '../services/notesService';
import { filesService } from '../services/filesService';
import { chatService } from '../services/chatService';

export default function MainLayout() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [noteDialog, setNoteDialog] = useState(false);
  const [fileDialog, setFileDialog] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatOutput, setChatOutput] = useState('To use MindVault, upload PDFs or add your own notes!');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleFileUpload = async () => {
    try {
      if (!selectedFile) return;
      
      const title = fileTitle.trim() || selectedFile.name;
      
      await filesService.uploadFile(selectedFile, title);
      setFileDialog(false);
      setFileTitle('');
      setSelectedFile(null);
      
      await loadAllContent();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload file: ${error.message || 'Unknown error'}`);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    setIsLoading(true);
    try {
      const response = await chatService.sendMessage(chatInput, files);
      setChatOutput(response);
      setChatInput('');
    } catch (error) {
      console.error('Chat error:', error);
      alert('Failed to get response. Please try again.');
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

  return (
    <div className="min-h-screen bg-[#E20074] p-4">
      <div className="container mx-auto max-w-full p-8">
        <div className="flex items-center mb-8">
          <div className="grid grid-cols-4 gap-1 mr-2">
            <div className="w-2 h-2 bg-white"></div>
            <div className="w-2 h-2 bg-white"></div>
            <div className="w-2 h-2 bg-white"></div>
            <div className="w-2 h-2 bg-white"></div>
          </div>
          <h1 className="text-4xl font-bold text-white">
            MindVault, a Deutsche Telekom + Innovera Initiative
          </h1>
        </div>
        
        <div className="grid grid-cols-2 gap-8 h-[calc(100vh-12rem)]">
          {/* Left Panel */}
          <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-[#1A1F2E] border-b-2 border-[#E20074] pb-2 text-center">
              Notes Repository
            </h2>
            
            <div className="flex-1 overflow-auto mb-4">
              <ul className="space-y-2">
                {files.map((file) => (
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
            
            <div className="flex gap-4 mt-auto pt-4 border-t">
              <button
                onClick={() => setNoteDialog(true)}
                className="flex-1 bg-[#E20074] text-white py-2 rounded hover:bg-[#B4005C] transition-colors"
              >
                Insert Note
              </button>
              <button
                onClick={() => setFileDialog(true)}
                className="flex-1 bg-[#E20074] text-white py-2 rounded hover:bg-[#B4005C] transition-colors"
              >
                Upload File
              </button>
              <button
                onClick={handleClearRepository}
                className="bg-[#E20074] text-white p-2 rounded hover:bg-[#B4005C] transition-colors"
                title="Clear Repository"
              >
                <Trash2 className="text-white" />
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-[#1A1F2E] border-b-2 border-[#E20074] pb-2 text-center">
              Chat Output
            </h2>
            
            <div className="flex-1 overflow-auto mb-4">
              <p className="text-[#1A1F2E] italic">{chatOutput}</p>
            </div>
            
            <div className="flex gap-2 bg-[#E20074] rounded p-2 mt-auto">
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

      {/* File Upload Dialog */}
      {fileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Upload File</h2>
            
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="File Title (optional)"
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
            />

            <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
              <Trash2 className="text-gray-400 mb-3" />
              <span className="text-gray-600">
                {selectedFile ? selectedFile.name : 'Click to Upload File'}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </label>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setFileDialog(false);
                  setFileTitle('');
                  setSelectedFile(null);
                }}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!selectedFile}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Upload
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
    </div>
  );
}