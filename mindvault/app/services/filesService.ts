/**
 * Service for handling file operations
 */

interface Document {
  id: string;
  name: string;
  type: 'document';
  content: string;
  size: string;
  uploadDate: Date;
}

interface Spreadsheet {
  id: string;
  name: string;
  type: 'spreadsheet';
  data: any[][];
  size: string;
  uploadDate: Date;
}

export type FileType = Document | Spreadsheet;

// Mock storage for documents and spreadsheets
let documents: Document[] = [];
let spreadsheets: Spreadsheet[] = [];

/**
 * Formats file size in a human-readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

/**
 * Simulates file upload by creating a document object
 */
const uploadDocument = async (file: File): Promise<Document> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string || '';
      
      const document: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: 'document',
        content,
        size: formatFileSize(file.size),
        uploadDate: new Date()
      };
      
      documents.push(document);
      resolve(document);
    };
    
    reader.readAsText(file);
  });
};

/**
 * Simulates file upload by creating a spreadsheet object
 */
const uploadSpreadsheet = async (file: File): Promise<Spreadsheet> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      // In a real app, you would parse CSV/Excel data here
      // For this mock, we'll create a simple 2D array
      const mockData = [
        ['Header 1', 'Header 2', 'Header 3'],
        ['Data 1', 'Data 2', 'Data 3'],
        ['Data 4', 'Data 5', 'Data 6']
      ];
      
      const spreadsheet: Spreadsheet = {
        id: Date.now().toString(),
        name: file.name,
        type: 'spreadsheet',
        data: mockData,
        size: formatFileSize(file.size),
        uploadDate: new Date()
      };
      
      spreadsheets.push(spreadsheet);
      resolve(spreadsheet);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Retrieves all documents
 */
const getDocuments = async (): Promise<Document[]> => {
  return [...documents];
};

/**
 * Retrieves all spreadsheets
 */
const getSpreadsheets = async (): Promise<Spreadsheet[]> => {
  return [...spreadsheets];
};

/**
 * Retrieves all files (both documents and spreadsheets)
 */
const getFiles = async (): Promise<FileType[]> => {
  // First try to get files from Supabase if available
  try {
    const { data, error } = await fetch('/api/documents').then(res => res.json());
    
    if (error) throw error;
    
    if (data && Array.isArray(data)) {
      return data.map(file => {
        if (file.file_type.includes('spreadsheet')) {
          // Return as Spreadsheet type
          return {
            id: file.id,
            name: file.title || file.name,
            type: 'spreadsheet' as const,
            data: file.structured_data ? JSON.parse(file.structured_data) : [[]],
            size: formatFileSize(file.file_size || 0),
            uploadDate: new Date(file.created_at)
          };
        } else {
          // Return as Document type
          return {
            id: file.id,
            name: file.title || file.name,
            type: 'document' as const,
            content: file.content || '',
            size: formatFileSize(file.file_size || 0),
            uploadDate: new Date(file.created_at)
          };
        }
      });
    }
  } catch (e) {
    console.warn('Could not fetch files from API, falling back to local storage', e);
  }
  
  // If API fetch fails or returns no data, fall back to local storage
  return [...documents, ...spreadsheets];
};

/**
 * Deletes a file by ID
 */
const deleteFile = async (id: string): Promise<void> => {
  if (documents.some(doc => doc.id === id)) {
    documents = documents.filter(doc => doc.id !== id);
  } else if (spreadsheets.some(sheet => sheet.id === id)) {
    spreadsheets = spreadsheets.filter(sheet => sheet.id !== id);
  }
};

/**
 * Clears all files
 */
const clearFiles = async (): Promise<void> => {
  documents = [];
  spreadsheets = [];
};

export const filesService = {
  uploadDocument,
  uploadSpreadsheet,
  getDocuments,
  getSpreadsheets,
  deleteFile,
  clearFiles,
  getFiles
}; 