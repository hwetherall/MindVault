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
 * Split answer content into TLDR and details sections and clean up asterisks
 * @param content Answer content to split
 * @returns Object containing tldr and details sections
 */
export const splitAnswerContent = (content: string | any) => {
  // Ensure content is a string
  if (!content || typeof content !== 'string') {
    return { tldr: '', details: '' };
  }
  
  const parts = content.split('DETAILS:');
  
  if (parts.length === 1) {
    // Clean up asterisks in content if no DETAILS section
    let cleanContent = parts[0].trim();
    cleanContent = cleanContent.replace('TL;DR:', '').trim();
    
    // Remove markdown bold/italic formatting
    cleanContent = cleanContent.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    cleanContent = cleanContent.replace(/\*(.*?)\*/g, '$1');     // Italic
    cleanContent = cleanContent.replace(/\*+/g, '');             // Any remaining asterisks
    
    return { 
      tldr: cleanContent, 
      details: '' 
    };
  }
  
  // Process TL;DR section
  let tldr = parts[0].trim();
  tldr = tldr.replace('TL;DR:', '').trim();
  
  // Process DETAILS section
  let details = parts[1].trim();
  
  // Remove markdown bold/italic formatting from both sections
  tldr = tldr.replace(/\*\*(.*?)\*\*/g, '$1');
  tldr = tldr.replace(/\*(.*?)\*/g, '$1');
  tldr = tldr.replace(/\*+/g, '');
  
  details = details.replace(/\*\*(.*?)\*\*/g, '$1');
  details = details.replace(/\*(.*?)\*/g, '$1');
  details = details.replace(/\*+/g, '');
  
  return { 
    tldr: tldr, 
    details: details 
  };
}; 