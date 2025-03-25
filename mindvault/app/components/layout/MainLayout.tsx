/**
 * Main application layout component
 */
'use client';

import React, { useState, useEffect } from 'react';
import { filesService } from '../../services/filesService';
import InvestmentMemoMain from '../features/investment-memo/InvestmentMemoMain';
import ErrorBoundary from '../ErrorBoundary';
import { FileText, FileSpreadsheet, X, ChevronLeft, ChevronRight, Plus, Database, Trash, CheckCircle, AlertCircle, LineChart } from 'lucide-react';
import PedramExportCard from '../features/pedram-export/PedramExportCard';
import Link from 'next/link';

// Add type definition for filesService
interface FilesService {
  uploadDocument: (file: File) => Promise<any>;
  uploadSpreadsheet: (file: File) => Promise<any>;
  getFiles: () => Promise<any[]>;
  deleteFile: (fileId: string) => Promise<void>;
  extractTextFromPDF: (file: File) => Promise<string>;
  extractTextFromExcel: (file: File) => Promise<string>;
  verifyFileContent: (fileId: string) => Promise<any>;
  clearFiles: () => Promise<void>;
}

// Add Toast component
const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border ${borderColor} ${bgColor} shadow-lg`}>
      <Icon className={`w-5 h-5 ${textColor}`} />
      <span className={textColor}>{message}</span>
    </div>
  );
};

// Add Confirmation Dialog component
const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

interface MainLayoutProps {}

const MainLayout: React.FC<MainLayoutProps> = () => {
  // State
  const [files, setFiles] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Load initial data
  useEffect(() => {
    const loadAllContent = async () => {
      try {
        // Load files
        const loadedFiles = await filesService.getFiles();
        setFiles(loadedFiles);
      } catch (error) {
        console.error('Error loading content:', error);
        showToast('Failed to load content', 'error');
      }
    };

    loadAllContent();
  }, []);

  // Show toast helper
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /**
   * Clears all repository content
   */
  const handleClearRepository = async () => {
    setConfirmationDialog({
      isOpen: true,
      title: 'Clear Repository',
      message: 'Are you sure you want to clear all files from the repository? This action cannot be undone.',
      onConfirm: async () => {
    try {
          console.log('Starting clear repository process...');
          
      // Clear all files
          console.log('Calling filesService.clearFiles()...');
      await filesService.clearFiles();
          console.log('filesService.clearFiles() completed successfully');
          
          // Verify files are cleared by fetching again
          const remainingFiles = await filesService.getFiles();
          console.log(`Remaining files after clear: ${remainingFiles.length}`);
          
          // Only set files to empty if we verify the clear was successful
          if (remainingFiles.length === 0) {
            setFiles([]);
            console.log('Clear repository process completed successfully');
            showToast('Repository cleared successfully', 'success');
          } else {
            throw new Error('Failed to clear all files from the repository');
          }
    } catch (error) {
          console.error('Error in handleClearRepository:', error);
          showToast('Failed to clear repository. Please try again.', 'error');
        } finally {
          setConfirmationDialog(null);
        }
      }
    });
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
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className={`bg-white border-r transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
            <div className="p-4 flex items-center justify-between">
              {!isCollapsed && <h2 className="text-xl font-semibold text-gray-800">MindVault</h2>}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>

            <nav className="mt-4">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100"
              >
                <Database className="w-5 h-5" />
                {!isCollapsed && <span>Home</span>}
              </Link>
              <Link
                href="/simulation"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100"
              >
                <LineChart className="w-5 h-5" />
                {!isCollapsed && <span>Simulation</span>}
              </Link>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <InvestmentMemoMain 
                files={files}
                onComplete={handleAnalysisComplete}
                onAnswerUpdate={handleAnswerUpdate}
              />
            </div>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {confirmationDialog && (
          <ConfirmationDialog
            isOpen={confirmationDialog.isOpen}
            onClose={() => setConfirmationDialog(null)}
            onConfirm={confirmationDialog.onConfirm}
            title={confirmationDialog.title}
            message={confirmationDialog.message}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default MainLayout; 