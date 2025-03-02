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
      <div className="text-center p-6 bg-gray-800 rounded border border-dashed border-gray-600">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-300">No files uploaded yet</p>
        <p className="text-sm text-gray-400 mt-1">Upload documents or spreadsheets to analyze</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded shadow-md border border-gray-700 overflow-hidden">
      <h2 className="p-4 bg-gray-700 font-medium border-b border-gray-600 text-gray-100">Uploaded Files</h2>
      <ul className="divide-y divide-gray-700">
        {files.map((file) => (
          <li key={file.id} className="p-4 hover:bg-gray-700 flex items-center justify-between text-gray-100">
            <div className="flex items-center">
              {file.type === 'document' ? (
                <FileText className="h-5 w-5 text-blue-400 mr-3" />
              ) : (
                <FileSpreadsheet className="h-5 w-5 text-green-400 mr-3" />
              )}
              <div>
                <p className="font-medium truncate max-w-md">{file.name}</p>
                {file.size && (
                  <p className="text-xs text-gray-400">
                    {file.size} • {file.uploadDate && new Date(file.uploadDate).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => onDeleteFile(file.id, file.type)}
              className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-600"
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