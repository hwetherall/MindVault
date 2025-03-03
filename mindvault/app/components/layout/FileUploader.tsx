import React, { useState, useRef } from 'react';
import { Upload, FileText, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { filesService } from '../../services/filesService';

interface FileUploaderProps {
  onFilesUploaded: (uploadedFiles: any[]) => void;
}

/**
 * Component for uploading files to the application
 */
const FileUploader: React.FC<FileUploaderProps> = ({ onFilesUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'document' | 'spreadsheet' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Sets the upload type and triggers file input dialog
   */
  const handleUploadType = (type: 'document' | 'spreadsheet') => {
    setUploadType(type);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Handles the file selection and uploads files
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadType) return;

    setUploading(true);
    setError(null);

    try {
      // Convert FileList to array
      const fileArray = Array.from(files);
      console.log(`Starting upload of ${fileArray.length} files as ${uploadType}`);
      
      // Upload each file
      const uploadPromises = fileArray.map(file => {
        console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);
        if (uploadType === 'document') {
          return filesService.uploadDocument(file);
        } else {
          return filesService.uploadSpreadsheet(file);
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      console.log('All files uploaded successfully:', uploadedFiles);
      
      // Pass uploaded files to parent component
      onFilesUploaded(uploadedFiles);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading files:', error);
      // Extract error message - handle both Error objects and string errors
      let errorMessage = 'Failed to upload files.';
      if (error instanceof Error) {
        errorMessage = error.message || 'Unknown error occurred';
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setError(errorMessage);
    } finally {
      setUploading(false);
      setUploadType(null);
    }
  };

  return (
    <div className="border-2 border-border-medium p-5 rounded-lg shadow-md bg-white">
      <h2 className="font-medium text-lg mb-4 border-b-2 border-border-medium pb-2">Upload Files</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-300 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Upload failed</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-4">
        <button
          className="flex-1 flex items-center justify-center px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors shadow-sm border-2 border-primary"
          onClick={() => handleUploadType('document')}
          disabled={uploading}
        >
          <FileText className="mr-2 h-5 w-5" />
          Upload Document
        </button>

        <button
          className="flex-1 flex items-center justify-center px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors shadow-sm border-2 border-primary"
          onClick={() => handleUploadType('spreadsheet')}
          disabled={uploading}
        >
          <FileSpreadsheet className="mr-2 h-5 w-5" />
          Upload Spreadsheet
        </button>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          multiple
          accept={uploadType === 'document' ? '.pdf,.docx,.doc,.txt,.md,.ppt,.pptx' : '.xlsx,.xls,.csv'}
        />
      </div>

      {uploading && (
        <div className="mt-4 flex items-center justify-center text-primary border-2 border-border-medium rounded-lg p-3 bg-background-secondary shadow-sm">
          <Upload className="animate-pulse mr-2 h-5 w-5" />
          <span>Uploading files...</span>
        </div>
      )}
    </div>
  );
};

export default FileUploader; 