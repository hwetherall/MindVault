/**
 * Helper functions to extract Excel content for chart generation
 */

/**
 * Extracts content from Excel files for chart generation
 * @param {Array} files - Array of file objects
 * @returns {string} Concatenated Excel file content
 */
export const extractExcelContent = (files) => {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return '';
    }
    
    // Filter for Excel files
    const excelFiles = files.filter(file => 
      file.type === 'spreadsheet' || 
      file.name?.toLowerCase().endsWith('.xlsx') || 
      file.name?.toLowerCase().endsWith('.xls')
    );
    
    if (excelFiles.length === 0) {
      return '';
    }
    
    // Extract content from Excel files and concatenate
    const excelContent = excelFiles
      .map(file => {
        if (file.content) {
          return `--- File: ${file.name} ---\n${file.content}\n`;
        }
        return '';
      })
      .join('\n');
    
    return excelContent;
  };
  
  /**
   * Safely extracts text content from potentially undefined values
   * @param {any} obj - Object to extract text from
   * @param {string} defaultValue - Default value to return if extraction fails
   * @returns {string} Extracted text or default value
   */
  export const safeExtractText = (obj, defaultValue = '') => {
    try {
      if (!obj) return defaultValue;
      
      if (typeof obj === 'string') {
        return obj;
      }
      
      if (typeof obj === 'object') {
        // Handle response object with text property
        if (obj.text) {
          return obj.text;
        }
        
        // Try to convert object to string
        return JSON.stringify(obj);
      }
      
      return String(obj);
    } catch (error) {
      console.error('Error extracting text:', error);
      return defaultValue;
    }
  };