/**
 * Service for handling file operations with Supabase
 */
import { supabase } from '../lib/supabase';

// Flag to disable PDF text extraction if it causes issues
const SKIP_PDF_TEXT_EXTRACTION = false;

/**
 * Formats file size in a human-readable format
 */
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

/**
 * Extract text from PDF file
 */
const extractTextFromPDF = async (file) => {
  try {
    // Only import PDF.js in browser environment
    if (typeof window === 'undefined') {
      console.log('PDF extraction skipped in server environment');
      return 'PDF content extraction not available in server environment';
    }

    // Import the PDF.js library dynamically
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set the worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
    
    const arrayBuffer = await file.arrayBuffer();
    
    console.log(`Starting PDF extraction for: ${file.name}, size: ${file.size} bytes`);
    
    try {
      // Load the PDF document
      const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
      console.log(`PDF loaded successfully with ${pdf.numPages} pages`);
      
      let fullText = '';

      // Process each page
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map(item => item.str)
            .join(' ');
          
          console.log(`Extracted ${pageText.length} characters from page ${i}`);
          fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        } catch (pageError) {
          console.error(`Error extracting page ${i}:`, pageError);
          fullText += `--- Page ${i} ---\n[Error extracting content]\n\n`;
        }
      }

      console.log(`Total extracted text length: ${fullText.length} characters`);
      
      // If text extraction appears to have failed
      if (fullText.trim().length < 100) {
        console.warn("Very little text extracted from PDF. The file may be scanned or image-based.");
        fullText += "\n[Note: This PDF appears to contain mostly images or scanned content that couldn't be extracted as text.]";
      }
      
      return fullText;
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return `Error extracting text from PDF: ${pdfError.message}`;
    }
  } catch (error) {
    console.error('PDF extraction error:', error);
    return `Error processing PDF: ${error.message}`;
  }
};

/**
 * Extract data from Excel file
 */
const extractTextFromExcel = async (file) => {
  try {
    console.log(`Starting Excel extraction for: ${file.name}, size: ${file.size} bytes`);
    
    // Import XLSX library dynamically
    const { read } = await import('xlsx');
    
    // Get array buffer from the file
    const arrayBuffer = await file.arrayBuffer();
    
    // Read the workbook
    const workbook = read(arrayBuffer, { type: 'array' });
    
    let fullText = '';
    
    // Process each sheet in the workbook
    workbook.SheetNames.forEach(sheetName => {
      // Add sheet name as header
      fullText += `--- Sheet: ${sheetName} ---\n\n`;
      
      const sheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON with headers
      const jsonData = read(sheet, { header: 1, defval: null });
      
      // Calculate column widths for better formatting
      const columnWidths = [];
      jsonData.forEach(row => {
        row.forEach((cell, j) => {
          const cellValue = String(cell || '');
          if (!columnWidths[j] || cellValue.length > columnWidths[j]) {
            columnWidths[j] = Math.min(cellValue.length, 30); // Limit width to 30 chars
          }
        });
      });
      
      // Convert JSON data to formatted text
      jsonData.forEach((row, rowIndex) => {
        if (row.length > 0 && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
          // Format each row with consistent spacing
          const formattedRow = row.map((cell, colIndex) => {
            const cellValue = String(cell || '');
            return cellValue.padEnd(columnWidths[colIndex] + 3);
          }).join('');
          
          fullText += formattedRow + '\n';
          
          // Add a separator after header row
          if (rowIndex === 0) {
            fullText += '-'.repeat(formattedRow.length) + '\n';
          }
        }
      });
      
      fullText += '\n\n';
    });
    
    console.log(`Excel extraction complete, processed ${workbook.SheetNames.length} sheets, extracted ${fullText.length} characters`);
    return fullText;
  } catch (error) {
    console.error('Excel extraction error:', error);
    return `Error extracting data from Excel file: ${error.message}`;
  }
};

/**
 * Uploads a document to Supabase storage and database
 */
const uploadDocument = async (file) => {
  try {
    console.log(`Processing document: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    // Extract text content from PDF
    let textContent = '';
    if (file.type === 'application/pdf' && !SKIP_PDF_TEXT_EXTRACTION) {
      console.log('Processing as PDF...');
      try {
        textContent = await extractTextFromPDF(file);
        console.log(`PDF processing complete, extracted ${textContent.length} characters`);
        
        if (textContent.length < 100) {
          console.warn('Minimal text extracted from PDF, it may contain mostly images or be encrypted');
        }
        
        // Limit the text content size to prevent database issues
        // PostgreSQL has a limit on text column size
        if (textContent.length > 1000000) {  // 1MB limit
          console.log(`Text content too large (${textContent.length} chars), truncating...`);
          textContent = textContent.substring(0, 1000000) + '... [content truncated]';
        }
      } catch (pdfError) {
        console.error('PDF extraction error:', pdfError);
        textContent = `Error extracting PDF content: ${pdfError.message}`;
      }
    } else if (file.type === 'application/pdf') {
      console.log('PDF text extraction skipped due to SKIP_PDF_TEXT_EXTRACTION flag');
      textContent = 'PDF content extraction skipped';
    } else {
      console.log(`Unsupported document type: ${file.type}, no text extraction performed`);
    }
    
    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    console.log(`Uploading file to Supabase storage bucket 'documents' with name: ${fileName}`);
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', JSON.stringify(uploadError));
      throw new Error(`Storage upload error: ${JSON.stringify(uploadError)}`);
    }

    console.log('File successfully uploaded to storage, getting public URL');
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    console.log(`Public URL generated: ${publicUrl}`);
    
    // Create database record
    console.log('Creating database record for the uploaded file');
    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          title: file.name,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          content: textContent,
          public_url: publicUrl
        }
      ])
      .select();

    if (error) {
      console.error('Database insert error:', JSON.stringify(error));
      throw new Error(`Database insert error: ${JSON.stringify(error)}`);
    }
    
    console.log('Document successfully uploaded and recorded in database');
    return {
      id: data[0].id,
      name: data[0].title,
      type: 'document',
      content: textContent,
      size: formatFileSize(data[0].file_size),
      uploadDate: new Date(data[0].created_at),
      url: data[0].public_url
    };
  } catch (error) {
    console.error('Upload document error:', error);
    throw error;
  }
};

/**
 * Uploads a spreadsheet to Supabase storage and database
 */
const uploadSpreadsheet = async (file) => {
  try {
    console.log(`Processing spreadsheet: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    // Extract content from Excel
    let textContent = '';
    let structuredData = null;
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type.includes('excel')) {
      console.log('Processing as Excel...');
      try {
        textContent = await extractTextFromExcel(file);
        console.log(`Excel processing complete, extracted ${textContent.length} characters`);
        
        // Generate structured data from the text content
        try {
          // Parse the text content into a simple structured format
          // This is a simplified version - in a real app, you would do more sophisticated parsing
          const lines = textContent.split('\n').filter(line => line.trim());
          const parsedData = [];
          
          let currentSheet = null;
          let currentSheetData = [];
          
          for (const line of lines) {
            if (line.startsWith('--- Sheet:')) {
              // New sheet found, save the previous sheet if it exists
              if (currentSheet && currentSheetData.length > 0) {
                parsedData.push({
                  name: currentSheet,
                  data: currentSheetData
                });
              }
              
              // Start a new sheet
              currentSheet = line.replace('--- Sheet:', '').replace('---', '').trim();
              currentSheetData = [];
            } else if (currentSheet && line.trim()) {
              // Add data row to current sheet
              const rowData = line.split(/\s{3,}/).map(cell => cell.trim());
              if (rowData.length > 0) {
                currentSheetData.push(rowData);
              }
            }
          }
          
          // Add the last sheet if it exists
          if (currentSheet && currentSheetData.length > 0) {
            parsedData.push({
              name: currentSheet,
              data: currentSheetData
            });
          }
          
          structuredData = JSON.stringify(parsedData);
        } catch (parseError) {
          console.error('Error parsing Excel data into structured format:', parseError);
          structuredData = JSON.stringify([{ name: 'Sheet1', data: [['Error parsing data']] }]);
        }
        
        // Limit the text content size
        if (textContent.length > 1000000) {
          console.log(`Text content too large (${textContent.length} chars), truncating...`);
          textContent = textContent.substring(0, 1000000) + '... [content truncated]';
        }
      } catch (excelError) {
        console.error('Excel extraction error:', excelError);
        textContent = `Error extracting Excel content: ${excelError.message}`;
        structuredData = JSON.stringify([{ name: 'Error', data: [['Failed to extract data']] }]);
      }
    } else {
      console.log(`Unsupported spreadsheet type: ${file.type}, no text extraction performed`);
      structuredData = JSON.stringify([{ name: 'Unknown', data: [['No Data'], ['Unsupported file format']] }]);
    }
    
    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    console.log(`Uploading file to Supabase storage bucket 'spreadsheets' with name: ${fileName}`);
    const { error: uploadError } = await supabase.storage
      .from('spreadsheets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', JSON.stringify(uploadError));
      throw new Error(`Storage upload error: ${JSON.stringify(uploadError)}`);
    }

    console.log('File successfully uploaded to storage, getting public URL');
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('spreadsheets')
      .getPublicUrl(fileName);

    console.log(`Public URL generated: ${publicUrl}`);
    
    // Create database record
    console.log('Creating database record for the uploaded file');
    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          title: file.name,
          file_path: fileName,
          file_type: `spreadsheet/${file.type}`,
          file_size: file.size,
          content: textContent,
          structured_data: structuredData,
          public_url: publicUrl
        }
      ])
      .select();

    if (error) {
      console.error('Database insert error:', JSON.stringify(error));
      throw new Error(`Database insert error: ${JSON.stringify(error)}`);
    }
    
    console.log('Spreadsheet successfully uploaded and recorded in database');
    // Return formatted spreadsheet with content
    return {
      id: data[0].id,
      name: data[0].title,
      type: 'spreadsheet',
      content: textContent,
      data: JSON.parse(data[0].structured_data || '[[]]'),
      size: formatFileSize(data[0].file_size),
      uploadDate: new Date(data[0].created_at),
      url: data[0].public_url
    };
  } catch (error) {
    console.error('Upload spreadsheet error:', error);
    throw error;
  }
};

/**
 * Retrieves all files from Supabase
 */
const getFiles = async () => {
  try {
    console.log('Fetching all files from database');
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      throw error;
    }

    console.log(`Retrieved ${data.length} files from database`);
    
    return data.map(file => {
      if (file.file_type && file.file_type.includes('spreadsheet')) {
        // Log for debugging
        console.log(`Processing spreadsheet: ${file.title}, content length: ${file.content ? file.content.length : 0}`);
        
        // Return as Spreadsheet type
        return {
          id: file.id,
          name: file.title || file.name || 'Unnamed Spreadsheet',
          type: 'spreadsheet',
          content: file.content || '', // Important: include content
          data: file.structured_data ? JSON.parse(file.structured_data) : [[]],
          size: formatFileSize(file.file_size || 0),
          uploadDate: new Date(file.created_at),
          url: file.public_url
        };
      } else {
        // Log for debugging
        console.log(`Processing document: ${file.title}, content length: ${file.content ? file.content.length : 0}`);
        
        // Return as Document type
        return {
          id: file.id,
          name: file.title || file.name || 'Unnamed Document',
          type: 'document',
          content: file.content || '', // Make sure content is returned
          size: formatFileSize(file.file_size || 0),
          uploadDate: new Date(file.created_at),
          url: file.public_url
        };
      }
    });
  } catch (e) {
    console.error('Could not fetch files from Supabase:', e);
    return [];
  }
};

/**
 * Deletes a file by ID
 */
const deleteFile = async (id) => {
  try {
    // First get the file info to get the storage path
    const { data: file } = await supabase
      .from('documents')
      .select('file_path, file_type')
      .eq('id', id)
      .single();

    if (file) {
      // Determine the storage bucket based on file type
      const bucket = file.file_type.includes('spreadsheet') ? 'spreadsheets' : 'documents';
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([file.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Verify if file content was properly extracted
 */
const verifyFileContent = async (fileId) => {
  try {
    console.log(`Verifying content for file ID: ${fileId}`);
    
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, content, file_type')
      .eq('id', fileId)
      .single();
    
    if (error) {
      console.error('Error verifying file content:', error);
      return { id: fileId, hasContent: false, error: error.message };
    }
    
    if (!data) {
      console.error('File not found');
      return { id: fileId, hasContent: false, error: 'File not found' };
    }
    
    const hasContent = Boolean(data.content && data.content.length > 100);
    const status = {
      id: fileId,
      hasContent,
      contentLength: data.content ? data.content.length : 0,
      fileType: data.file_type,
      title: data.title
    };
    
    console.log(`File content verification result:`, status);
    return status;
  } catch (error) {
    console.error('Error in verifyFileContent:', error);
    return { id: fileId, hasContent: false, error: error.message };
  }
};

export const filesService = {
  uploadDocument,
  uploadSpreadsheet,
  getFiles,
  deleteFile,
  extractTextFromPDF,
  extractTextFromExcel,
  verifyFileContent
}; 