import React from 'react';
import { Trash2, FileText, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface FileProps {
  id: string;
  name: string;
  type: 'document' | 'spreadsheet';
  size?: string;
  uploadDate?: Date;
}

interface FileListProps {
  files: FileProps[];
  onDeleteFile: (id: string, type: string) => void;
}

/**
 * Component to display uploaded files in the application
 */
const FileList: React.FC<FileListProps> = ({ files, onDeleteFile }) => {
  if (!files || files.length === 0) {
    return (
      <div className="text-center p-6 bg-background-secondary rounded-lg border-2 border-dashed border-border-medium shadow-sm">
        <AlertCircle className="h-8 w-8 text-text-secondary mx-auto mb-2" />
        <p className="text-text-primary">No files uploaded yet</p>
        <p className="text-sm text-text-secondary mt-1">Upload documents or spreadsheets to analyze</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-elevated border-2 border-border-medium overflow-hidden">
      <h2 className="p-4 bg-background-secondary font-medium border-b-2 border-border-medium text-text-primary">Uploaded Files</h2>
      <ul className="divide-y-2 divide-border-medium">
        {files.map((file) => (
          <li key={file.id} className="p-4 hover:bg-background-secondary flex items-center justify-between text-text-primary">
            <div className="flex items-center">
              {file.type === 'document' ? (
                <FileText className="h-5 w-5 text-primary mr-3" />
              ) : (
                <FileSpreadsheet className="h-5 w-5 text-primary mr-3" />
              )}
              <div>
                <p className="font-medium truncate max-w-md">{file.name}</p>
                {file.size && (
                  <p className="text-xs text-text-secondary">
                    {file.size} • {file.uploadDate && new Date(file.uploadDate).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => onDeleteFile(file.id, file.type)}
              className="p-2 text-text-secondary hover:text-primary rounded-full hover:bg-background-secondary"
              aria-label="Delete file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileList; 