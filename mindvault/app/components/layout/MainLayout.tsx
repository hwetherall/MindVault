/**
 * Main application layout component
 */
'use client';

import React, { useState, useEffect } from 'react';
import { notesService } from '../../services/notesService';
import { filesService } from '../../services/filesService';
import { Header, FileUploader, FileList, ChatInterface } from './index';
import InvestmentMemoMain from '../features/investment-memo';
import DeepDiveMain from '../features/deep-dive';
import ErrorBoundary from '../ErrorBoundary';

// Suggested questions for the chat interface
const SUGGESTED_QUESTIONS = [
  { id: '1', text: 'What is the ARR of the company?' },
  { id: '2', text: 'What is the burn rate?' },
  { id: '3', text: 'How does the company generate revenue?' },
  { id: '4', text: 'Who are the key competitors?' },
  { id: '5', text: 'What are the biggest risks?' }
];

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
  const [showInvestmentMemo, setShowInvestmentMemo] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);

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
   * Starts the investment memo generation process
   */
  const handleGenerateInvestmentMemo = () => {
    setShowInvestmentMemo(true);
    setShowDeepDive(false);
  };

  /**
   * Handles the completion of an analysis
   */
  const handleAnalysisComplete = (passed: boolean) => {
    // Reset view after analysis is complete
    setShowInvestmentMemo(false);
    setShowDeepDive(false);
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
          onGenerateInvestmentMemo={handleGenerateInvestmentMemo}
          onClearRepository={handleClearRepository}
        />

        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column - File Management */}
            <div className="md:col-span-4">
              <div className="mb-6">
                <FileUploader onFilesUploaded={handleFilesUploaded} />
              </div>
              <div>
                <FileList files={files} onDeleteFile={handleDeleteFile} />
              </div>
            </div>

            {/* Right Column - Chat or Analysis Content */}
            <div className="md:col-span-8">
              {showInvestmentMemo ? (
                <div className="innovera-card shadow-elevated">
                  <InvestmentMemoMain 
                    files={files} 
                    onComplete={handleAnalysisComplete} 
                  />
                </div>
              ) : showDeepDive ? (
                <div className="innovera-card shadow-elevated">
                  <DeepDiveMain 
                    files={files} 
                    onComplete={handleAnalysisComplete} 
                  />
                </div>
              ) : (
                <div className="innovera-card h-[600px] flex flex-col shadow-elevated">
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-border-medium">Conduct Due Diligence</h2>
                  <ChatInterface
                    files={files}
                    suggestedQuestions={SUGGESTED_QUESTIONS}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default MainLayout; 