/**
 * Main application layout component
 */
'use client';

import React, { useState, useEffect } from 'react';
import { notesService } from '../../services/notesService';
import { filesService } from '../../services/filesService';
import { Header, FileUploader, FileList } from './index';
import { InvestmentMemoMain } from '../features/investment-memo';
import ErrorBoundary from '../ErrorBoundary';

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
  const handleFilesUploaded = (uploadedFiles: any[]) => {
    // Update files state with newly uploaded files
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  /**
   * Handles file deletion
   */
  const handleDeleteFile = async (fileId: string, fileType: string) => {
    try {
      // Delete file using the unified deleteFile method
      await filesService.deleteFile(fileId);
      
      // Update files state
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error deleting file:', error);
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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white text-text-primary">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClearRepository={handleClearRepository}
        />

        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column - File Management */}
            <div className="md:col-span-4">
              <div className="mb-6">
                <FileUploader onFilesUploaded={handleFilesUploaded} />
              </div>
              
              <div className="mb-6">
                <FileList files={files} onDeleteFile={handleDeleteFile} />
              </div>
              
              {/* Investment Memo Box */}
              <div className="mb-6 border-2 border-border-medium p-5 rounded-lg shadow-md bg-white">
                <h2 className="font-medium text-lg mb-4 border-b-2 border-border-medium pb-2">Repository Actions</h2>
                <div className="flex flex-col gap-4">  
                  <button
                    className="innovera-button-secondary w-full"
                    onClick={handleClearRepository}
                  >
                    Clear Repository
                  </button>
                </div>
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