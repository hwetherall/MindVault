/**
 * Main application layout component
 */
'use client';

import React, { useState, useEffect } from 'react';
import { notesService } from '../../services/notesService';
import { filesService } from '../../services/filesService';
import { InvestmentMemoMain } from '../features/investment-memo';
import ErrorBoundary from '../ErrorBoundary';
import { FileText, FileSpreadsheet, X, ChevronLeft, ChevronRight, Plus, Database, Trash } from 'lucide-react';


interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface MainLayoutProps {
  initialNotes?: Note[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialNotes = [] }) => {
  // State
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [files, setFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadAllContent = async () => {
      try {
        // Load notes
        const loadedNotes = await notesService.getNotes();
        setNotes(loadedNotes);

        // Load files
        const loadedFiles = await filesService.getFiles();
        setFiles(loadedFiles);
      } catch (error) {
        console.error('Error loading content:', error);
      }
    };

    loadAllContent();
  }, []);

  /**
   * Clears all repository content
   */
  const handleClearRepository = async () => {
    try {
      // Clear all files
      await filesService.clearFiles();
      
      // Reload files
      const loadedFiles = await filesService.getFiles();
      setFiles(loadedFiles);
    } catch (error) {
      console.error('Error clearing repository:', error);
    }
  };

  /**
   * Handles files being uploaded
   */
  const handleFilesUploaded = async (newFiles: File[]) => {
    try {
      const uploadPromises = newFiles.map(async (file) => {
        // Check file extension instead of MIME type
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        
        if (fileExt === 'pdf') {
          return await filesService.uploadDocument(file);
        } else if (['xlsx', 'xls'].includes(fileExt || '')) {
          return await filesService.uploadSpreadsheet(file);
        }
        return null;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const validFiles = uploadedFiles.filter(file => file && file.id);
      
      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload one or more files. Please try again.');
    }
  };

  /**
   * Handles file deletion
   */
  const handleDeleteFile = async (fileId: string, fileType: string) => {
    try {
      if (!fileId) {
        console.error('No file ID provided');
        return;
      }

      // Delete file using the unified deleteFile method
      await filesService.deleteFile(fileId);
      
      // Update files state
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error instanceof Error ? error.message : 'Unknown error');
      // Optionally show an error message to the user
      alert('Failed to delete file. Please try again.');
    }
  };

  /**
   * Handles the completion of an analysis
   */
  const handleAnalysisComplete = (passed: boolean) => {
    console.log('Analysis complete, passed:', passed);
    // Can handle any post-analysis tasks here
  };

  /**
   * Handles answer updates from investment memo
   */
  const handleAnswerUpdate = (id: string, summary: string, details: string) => {
    console.log(`Answer updated for ${id}:`, { summary, details });
    // Handle answer updates as needed
  };

  // Filter notes based on search query
  const filteredNotes = searchQuery
    ? notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes;

  /**
   * Handles file input changes
   */
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFilesUploaded(files);
    // Clear the input value so the same file can be uploaded again if needed
    e.target.value = '';
  };

  // Update the getDocumentCounts function to use the same logic
  const getDocumentCounts = (files: any[]) => {
    return {
      pdf: files.filter(f => {
        const ext = f.name?.split('.').pop()?.toLowerCase();
        return ext === 'pdf';
      }).length,
      excel: files.filter(f => {
        const ext = f.name?.split('.').pop()?.toLowerCase();
        return ['xlsx', 'xls'].includes(ext || '');
      }).length
    };
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white text-text-primary">
        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column - File Management */}
            <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'md:col-span-1' : 'md:col-span-4'}`}>
              {/* Document Repository Section */}
              <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white shadow-sm relative">
                {/* Collapse Toggle Button */}
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="absolute -right-3 top-2 bg-white p-1 rounded-full border border-gray-300 shadow-sm hover:bg-gray-50"
                >
                  {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

                {isCollapsed ? (
                  // Collapsed View with Document Counts and Upload Button
                  <div className="flex flex-col items-center gap-6 py-4 mt-4">
                    {/* Document counts */}
                    <div className="relative flex flex-col items-center">
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {getDocumentCounts(files).pdf}
                      </div>
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <FileText size={24} className="text-red-500" />
                      </div>
                      <span className="text-xs mt-1">PDF</span>
                    </div>
                    <div className="relative flex flex-col items-center">
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {getDocumentCounts(files).excel}
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <FileSpreadsheet size={24} className="text-green-500" />
                      </div>
                      <span className="text-xs mt-1">Excel</span>
                    </div>
                    
                    {/* Upload Button */}
                    <button 
                      onClick={() => document.getElementById('combinedUpload')?.click()}
                      className="w-12 h-12 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors"
                      title="Upload Document"
                    >
                      <Plus size={24} className="text-blue-500" />
                    </button>
                  </div>
                ) : (
                  // Expanded View - Update file icons to use consistent colors
                  <div className="transition-all duration-300">
                    <h3 className="font-semibold mb-3 text-gray-800">Document Repository</h3>
                    <div className="space-y-4">
                      {/* Upload Buttons */}
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => document.getElementById('pdfUpload')?.click()}
                          className="flex flex-col items-center justify-center p-3 border-2 border-red-300 border-dashed rounded-lg hover:bg-red-50 transition-colors group"
                        >
                          <FileText size={20} className="text-red-500 mb-1" />
                          <span className="text-red-600 text-sm font-medium">Upload</span>
                          <span className="text-red-600 text-sm">Documents</span>
                          <span className="text-xs text-red-400">(PDF)</span>
                        </button>
                        <button 
                          onClick={() => document.getElementById('excelUpload')?.click()}
                          className="flex flex-col items-center justify-center p-3 border-2 border-green-300 border-dashed rounded-lg hover:bg-green-50 transition-colors group"
                        >
                          <FileSpreadsheet size={20} className="text-green-500 mb-1" />
                          <span className="text-green-600 text-sm font-medium">Upload</span>
                          <span className="text-green-600 text-sm">Spreadsheets</span>
                          <span className="text-xs text-green-400">(Excel)</span>
                        </button>
                      </div>

                      {/* Hidden File Inputs */}
                      <input
                        id="pdfUpload"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileInput}
                      />
                      <input
                        id="excelUpload"
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleFileInput}
                      />

                      {/* Files List */}
                      <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h4>
                        {files.length > 0 ? (
                          <ul className="space-y-1">
                            {files.map((file) => (
                              <li key={file.id || `file-${file.name}`} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded">
                                <div className="flex items-center gap-2">
                                  {file.name?.toLowerCase().endsWith('.pdf') ? (
                                    <FileText size={16} className="text-red-500" />
                                  ) : (
                                    <FileSpreadsheet size={16} className="text-green-500" />
                                  )}
                                  <span className="truncate">{file.name}</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteFile(file.id, file.type)}
                                  className="text-gray-500 hover:text-red-500"
                                >
                                  <X size={16} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-center text-gray-500 py-2">
                            Upload a PDF or Excel file to get started
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Investment Memo Box */}
              <div className="mb-6 border-2 border-border-medium p-5 rounded-lg shadow-md bg-white">
                {isCollapsed ? (
                  // Collapsed view with icons
                  <div className="flex flex-col items-center gap-6 py-4">
                    <div className="flex flex-col items-center focus:outline-none" title="Repository Actions">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Database size={24} className="text-blue-500" />
                      </div>
                      <span className="text-xs mt-1">Files</span>
                    </div>
                    <button
                      onClick={handleClearRepository}
                      className="flex flex-col items-center focus:outline-none"
                      title="Clear Repository"
                    >
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors">
                        <Trash size={24} className="text-red-500" />
                      </div>
                      <span className="text-xs mt-1">Clear</span>
                    </button>
                  </div>
                ) : (
                  // Expanded view with text
                  <>
                    <h2 className="font-medium text-lg mb-4 border-b-2 border-border-medium pb-2">Repository Actions</h2>
                    <div className="flex flex-col gap-4">  
                      <button
                        className="innovera-button-secondary w-full"
                        onClick={handleClearRepository}
                      >
                        Clear Repository
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column - Investment Memo Content */}
            <div className="md:col-span-8">
              <div className="innovera-card shadow-elevated">
                <InvestmentMemoMain 
                  files={files} 
                  onComplete={handleAnalysisComplete} 
                  onAnswerUpdate={handleAnswerUpdate}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default MainLayout;