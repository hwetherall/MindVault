// src/services/filesService.js - updated with Excel handling
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker for PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

export const filesService = {
  async extractTextFromPDF(file) {
    try {
      console.log(`Starting extraction for PDF: ${file.name}`);
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF
      const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
      console.log(`PDF loaded successfully with ${pdf.numPages} pages`);
      
      let fullText = '';

      // Process each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        console.log(`Extracted ${pageText.length} characters from page ${i}`);
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }

      console.log(`Total extracted text length: ${fullText.length} characters`);
      
      // If text extraction appears to have failed
      if (fullText.trim().length < 100) {
        console.warn("Very little text extracted from PDF. May need OCR processing.");
      }
      
      return fullText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Could not extract text from PDF: ${error.message}`);
    }
  },

  async extractTextFromExcel(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      let fullText = '';
      
      // Process each sheet in the workbook
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        // Use header:1 to get array format but also process with headers
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Add sheet name as a very prominent header
        fullText += `\n\n==========================================\n`;
        fullText += `EXCEL SHEET NAME: ${sheetName}\n`;
        fullText += `==========================================\n\n`;
        
        // If there are rows, assume first row contains headers
        if (jsonData.length > 0) {
          const headers = jsonData[0];
          
          // If there's data beyond the header row
          if (jsonData.length > 1) {
            // Process each data row
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (row && row.length > 0) {
                // Create a formatted row with header labels where possible
                let rowText = '';
                for (let j = 0; j < row.length; j++) {
                  // Only add header if it exists
                  const header = j < headers.length ? headers[j] : `Column ${j+1}`;
                  // Skip empty cells
                  if (row[j] !== undefined && row[j] !== null && row[j] !== '') {
                    rowText += `${header}: ${row[j]} | `;
                  }
                }
                fullText += rowText + '\n';
              }
            }
          } else {
            fullText += 'No data rows found in this sheet.\n';
          }
        } else {
          fullText += 'Empty sheet.\n';
        }
        
        fullText += '\n';
      });
      
      return fullText;
    } catch (error) {
      console.error('Excel extraction error:', error);
      throw new Error('Could not extract text from Excel file');
    }
  },

  async uploadFile(file, title) {
    try {
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      // Extract text based on file type
      let textContent = null;
      let structuredData = null;
      
      if (file.type === 'application/pdf') {
        console.log('Processing as PDF...');
        textContent = await this.extractTextFromPDF(file);
        console.log(`PDF processing complete, extracted ${textContent.length} characters`);
      } else if (file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        console.log('Processing as Excel...');
        textContent = await this.extractTextFromExcel(file);
        // Try to extract structured data but don't fail if it errors
        try {
          structuredData = await this.extractStructuredExcelData(file);
          console.log('Successfully extracted structured Excel data');
        } catch (structuredError) {
          console.warn('Failed to extract structured Excel data:', structuredError);
          structuredData = null; // Ensure it's null if there's an error
        }
        console.log(`Excel processing complete, extracted ${textContent.length} characters`);
      } else {
        console.log(`Unsupported file type: ${file.type}, no text extraction performed`);
      }
      
      // 2. Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError, data: storageData } = await supabase.storage
        .from('excel-files') // Use the bucket we created
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('excel-files')
        .getPublicUrl(fileName);

      // 3. Create database record - check if structured_data column exists
      // First check if structured_data column exists by getting table info
      let insertData = {
        title: title || file.name,
        file_path: fileName,
        file_type: file.type,
        file_size: file.size,
        content: textContent,
        public_url: publicUrl
      };
      
      // Only add structured_data if it exists and we have it
      if (structuredData) {
        try {
          // Get a sample record to see available columns
          const { data: sampleData } = await supabase
            .from('documents')
            .select('*')
            .limit(1);
            
          // Check if structured_data column exists in the table
          const hasStructuredDataColumn = sampleData && 
            sampleData.length > 0 && 
            'structured_data' in sampleData[0];
            
          if (hasStructuredDataColumn) {
            console.log('structured_data column exists, adding it to insert data');
            insertData.structured_data = structuredData;
          } else {
            console.log('structured_data column does not exist, skipping');
          }
        } catch (columnCheckError) {
          console.warn('Error checking for structured_data column, skipping:', columnCheckError);
        }
      }
      
      // Insert the record with or without structured_data
      const { data, error } = await supabase
        .from('documents')
        .insert([insertData])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Add this new method to extract structured Excel data as JSON
  async extractStructuredExcelData(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const result = {};
      
      // Process each sheet in the workbook
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        // Convert to JSON with headers
        try {
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          result[sheetName] = jsonData;
        } catch (sheetError) {
          console.warn(`Error processing sheet ${sheetName}:`, sheetError);
          result[sheetName] = []; // Empty array for failed sheets
        }
      });
      
      return JSON.stringify(result);
    } catch (error) {
      console.error('Structured Excel extraction error:', error);
      return null;
    }
  },

  // Existing methods for getFiles and deleteFile...
  async getFiles() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(file => ({
      id: file.id,
      name: file.title,
      type: file.file_type,
      content: file.content,
      url: file.public_url
    }));
  },

  async deleteFile(fileId) {
    try {
      // First get the file info to get the storage path
      const { data: file } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', fileId)
        .single();

      if (file) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('excel-files')
          .remove([file.file_path]);

        if (storageError) throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },
  
  // Add this to filesService.js
  async verifyFileContent(fileId) {
    try {
      // Get file from database
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', fileId)
        .single();
        
      if (error) throw error;
      
      // Check content
      const contentStatus = {
        id: data.id,
        name: data.title,
        hasContent: !!data.content && data.content.length > 0,
        contentLength: data.content ? data.content.length : 0,
        contentSample: data.content ? data.content.substring(0, 200) + '...' : 'No content',
        fileType: data.file_type
      };
      
      return contentStatus;
    } catch (error) {
      console.error('Content verification error:', error);
      throw error;
    }
  }
};