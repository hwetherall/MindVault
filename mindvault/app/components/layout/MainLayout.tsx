/**
 * Main application layout component
 */
'use client';

import React, { useState, useEffect } from 'react';
import { filesService } from '../../services/filesService';
import InvestmentMemoMain from '../features/investment-memo/InvestmentMemoMain';
import ErrorBoundary from '../ErrorBoundary';
import { FileText, FileSpreadsheet, X, ChevronLeft, ChevronRight, Plus, Database, Trash, CheckCircle, AlertCircle } from 'lucide-react';

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
                      className="flex flex-col items-center focus:outline-none"
                      title="Upload Document"
                    >
                      <div className="w-12 h-12 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors">
                        <Plus size={24} className="text-blue-500" />
                      </div>
                      <span className="text-xs mt-1">Upload</span>
                    </button>

                    {/* Hidden Combined File Input */}
                    <input
                      id="combinedUpload"
                      type="file"
                      accept=".pdf,.xlsx,.xls"
                      multiple
                      className="hidden"
                      onChange={handleFileInput}
                    />

                    {/* Clear Repository Button */}
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

                      {/* Clear Repository Button */}
                      <button
                        onClick={handleClearRepository}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash size={16} />
                        Clear Repository
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Investment Memo Content */}
            <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'md:col-span-11' : 'md:col-span-8'}`}>
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

        {/* Add Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Add Confirmation Dialog */}
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