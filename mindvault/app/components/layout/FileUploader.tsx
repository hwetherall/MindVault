import React, { useState, useRef } from 'react';
import { Upload, FileText, FileSpreadsheet } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Sets the upload type and triggers file input dialog
   */
  const handleUploadType = (type: 'document' | 'spreadsheet') => {
    setUploadType(type);
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

    try {
      // Convert FileList to array
      const fileArray = Array.from(files);
      
      // Upload each file
      const uploadPromises = fileArray.map(file => {
        if (uploadType === 'document') {
          return filesService.uploadDocument(file);
        } else {
          return filesService.uploadSpreadsheet(file);
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Pass uploaded files to parent component
      onFilesUploaded(uploadedFiles);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
      setUploadType(null);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex space-x-4">
        <button
          className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors border border-gray-600"
          onClick={() => handleUploadType('document')}
          disabled={uploading}
        >
          <FileText className="mr-2 h-5 w-5" />
          Upload Document
        </button>

        <button
          className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors border border-gray-600"
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
          accept={uploadType === 'document' ? '.pdf,.docx,.txt,.md' : '.xlsx,.xls,.csv'}
        />
      </div>

      {uploading && (
        <div className="mt-2 flex items-center text-blue-400">
          <Upload className="animate-pulse mr-2 h-5 w-5" />
          <span>Uploading files...</span>
        </div>
      )}
    </div>
  );
};

export default FileUploader; 