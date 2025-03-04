/**
 * Utility functions for formatting text in the application
 */

/**
 * Format numbers in text to 2 decimal places maximum
 * @param text Text containing numbers to format
 * @returns Formatted text
 */
export const formatNumbersInText = (text: string | any): string => {
  if (!text) return '';
  
  // Ensure text is a string
  if (typeof text !== 'string') {
    text = String(text);
  }

  // Regular expression to find numbers with decimal points
  // This regex looks for numbers that have a decimal point followed by at least one digit
  let formattedText = text;

  // Format currency values with $ symbols (like $123.4567 to $123.46)
  formattedText = formattedText.replace(/\$\s*(\d+\.\d+)/g, (match, number) => {
    return `$${parseFloat(number).toFixed(2)}`;
  });
  
  // Format currency values with currency codes (like USD$123.4567 to USD$123.46)
  formattedText = formattedText.replace(/(AU|USD|EUR|GBP|CAD|AUD)\$\s*(\d+\.\d+)/g, (match, currency, number) => {
    return `${currency}$${parseFloat(number).toFixed(2)}`;
  });
  
  // Format percentages (like 12.3456% to 12.35%)
  formattedText = formattedText.replace(/(\d+\.\d+)%/g, (match, number) => {
    return `${parseFloat(number).toFixed(2)}%`;
  });
  
  // Format standalone numbers with 3 or more decimal places (like 123.4567 to 123.46)
  formattedText = formattedText.replace(/(\d+\.\d{3,})(?!\w)/g, (match) => {
    return parseFloat(match).toFixed(2);
  });

  return formattedText;
};

/**
 * Split answer content into Summary and details sections and clean up asterisks
 * @param content Answer content to split
 * @returns Object containing tldr and details sections
 */
export const splitAnswerContent = (content: string | any) => {
  if (!content) {
    return { tldr: '', details: '' };
  }
  
  // Ensure content is a string
  if (typeof content !== 'string') {
    content = String(content);
  }
  
  // Handle both TL;DR and Summary formats
  let processedContent = content;
  if (processedContent.includes('TL;DR:')) {
    processedContent = processedContent.replace('TL;DR:', 'Summary:');
  }
  
  const parts = processedContent.split(/DETAILS:/i);
  
  if (parts.length === 1) {
    // Clean up asterisks in content if no DETAILS section
    let cleanContent = parts[0].trim();
    cleanContent = cleanContent.replace(/Summary:/i, '').trim();
    
    // Remove numbered list format (e.g., "1. Summary")
    cleanContent = cleanContent.replace(/^\d+\.\s*Summary\s*/i, '');
    
    // Remove markdown bold/italic formatting
    cleanContent = cleanContent.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    cleanContent = cleanContent.replace(/\*(.*?)\*/g, '$1');     // Italic
    cleanContent = cleanContent.replace(/\*+/g, '');             // Any remaining asterisks
    
    return { 
      tldr: cleanContent, 
      details: '' 
    };
  }
  
  // Process Summary section (previously TL;DR)
  let tldr = parts[0].trim();
  tldr = tldr.replace(/Summary:/i, '').trim();
  
  // Remove numbered list format (e.g., "1. Summary")
  tldr = tldr.replace(/^\d+\.\s*Summary\s*/i, '');
  
  // Process DETAILS section
  let details = parts[1].trim();
  
  // Remove numbered list format (e.g., "2. Details")
  details = details.replace(/^\d+\.\s*Details\s*/i, '');
  
  // Remove markdown bold/italic formatting from both parts
  tldr = tldr.replace(/\*\*(.*?)\*\*/g, '$1');    // Bold
  tldr = tldr.replace(/\*(.*?)\*/g, '$1');        // Italic
  tldr = tldr.replace(/\*+/g, '');                // Any remaining asterisks
  
  details = details.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
  details = details.replace(/\*(.*?)\*/g, '$1');     // Italic
  details = details.replace(/\*+/g, '');             // Any remaining asterisks
  
  return { 
    tldr: tldr, 
    details: details 
  };
};