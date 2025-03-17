/**
 * Utility functions for text formatting, especially for financial data
 */

/**
 * Formats a number to a maximum of 2 significant figures with appropriate suffix
 * @param num The number to format
 * @returns Formatted number with appropriate suffix (k, m, b)
 */
const formatNumberWithSuffix = (num: number): string => {
  if (num >= 1000000000) { // Billions
    return (num / 1000000000).toFixed(2).replace(/\.?0+$/, '') + 'b';
  } else if (num >= 1000000) { // Millions
    // Explicitly format as "X.XXm" for millions instead of the full number
    // For example: 40,485,584.91 -> 40.49m
    return (num / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'm';
  } else if (num >= 1000) { // Thousands
    return (num / 1000).toFixed(2).replace(/\.?0+$/, '') + 'k';
  }
  
  // Regular numbers
  return num.toFixed(2).replace(/\.?0+$/, '');
};

/**
 * Removes asterisks from the beginning and end of text
 * @param text The text to process
 * @returns Text with asterisks removed from beginning and end
 */
const removeAsterisks = (text: string): string => {
  if (!text) return '';
  
  // Remove asterisks from beginning and end of text
  return text.replace(/^\*\*\s*/, '').replace(/\s*\*\*$/, '');
};

/**
 * Formats numbers and financial data in text with markdown formatting
 * Enhances readability of financial information by adding proper formatting
 * @param text The input text to format
 * @returns Formatted text with markdown enhancements
 */
export const formatNumbersInText = (text: string): string => {
  if (!text) return '';

  // Remove asterisks at the beginning and end of the text
  let formattedText = removeAsterisks(text);

  // Format currency mentions (AUD, USD, etc with numbers)
  formattedText = formattedText.replace(
    /(\b(?:AUD|USD|EUR|GBP)\s*)(\d+(?:,\d+)*(?:\.\d+)?)\s*(million|billion|thousand|M|B|K)?\b/gi,
    (match, currency, number, scale) => {
      // Convert string number to float, removing commas
      const numString = number.replace(/,/g, '');
      const numValue = parseFloat(numString);
      
      // Apply scale multiplier if present
      let scaledValue = numValue;
      if (scale) {
        if (/million|M/i.test(scale)) scaledValue *= 1000000;
        else if (/billion|B/i.test(scale)) scaledValue *= 1000000000;
        else if (/thousand|K/i.test(scale)) scaledValue *= 1000;
      }
      
      // Format with shortened representation
      const formattedNum = formatNumberWithSuffix(scaledValue);
      
      // Bold the important financial figures
      return `**${currency} ${formattedNum}**`;
    }
  );

  // Format large numbers with appropriate suffixes (numbers with 5+ digits)
  formattedText = formattedText.replace(
    /\b(\d{1,3}(?:,\d{3})+|\d{5,})(?:\.\d+)?\b(?!\s*%)/g,
    (match, number) => {
      const numValue = parseFloat(number.replace(/,/g, ''));
      return formatNumberWithSuffix(numValue);
    }
  );

  // Add a specific regex to catch full precision ARR numbers (like 40,485,584.91 AUD)
  // This will ensure numbers with commas are also properly formatted
  formattedText = formattedText.replace(
    /\b(\d{1,3}(?:,\d{3})+(?:\.\d+)?)\s*(AUD|USD|EUR|GBP)\b/g,
    (match, number, currency) => {
      const numValue = parseFloat(number.replace(/,/g, ''));
      return `${formatNumberWithSuffix(numValue)} ${currency}`;
    }
  );

  // Format percentages with bold
  formattedText = formattedText.replace(
    /(\d+(?:\.\d+)?\s*%)/g,
    (match) => `**${match}**`
  );

  // Format calculations and equations as code blocks
  formattedText = formattedText.replace(
    /(\d+(?:\.\d+)?\s*[\+\-\*\/]\s*\d+(?:\.\d+)?(?:\s*[\+\-\*\/]\s*\d+(?:\.\d+)?)*\s*=\s*\d+(?:\.\d+)?)/g,
    (match) => `\`${match}\``
  );

  // Format financial metrics in lists
  formattedText = formattedText.replace(
    /^((?:- |• )?)((?:Revenue|EBITDA|Net Income|Profit Margin|ROI|IRR|NPV|Capex|Opex|FCF|EPS)(?:\s*:)?\s*)(\d+(?:,\d+)*(?:\.\d+)?)/gim,
    (match, bullet, metric, value) => {
      const numValue = parseFloat(value.replace(/,/g, ''));
      const formattedNum = formatNumberWithSuffix(numValue);
      return `${bullet}**${metric}${formattedNum}**`;
    }
  );

  return formattedText;
};

/**
 * Intelligently truncates text at sentence boundaries
 * @param text The text to truncate
 * @param maxLength Maximum length of the truncated text
 * @param addEllipsis Whether to add ellipsis at the end of truncated text
 * @returns Truncated text ending at a sentence boundary
 */
export const smartTruncateText = (
  text: string,
  maxLength: number = 200,
  addEllipsis: boolean = true
): string => {
  if (!text || text.length <= maxLength) return text;

  // Find the last sentence boundary before maxLength
  const sentenceEndRegex = /[.!?]\s+/g;
  let lastSentenceEnd = 0;
  let match;

  // Find all sentence boundaries
  while ((match = sentenceEndRegex.exec(text)) !== null) {
    if (match.index > maxLength) break;
    lastSentenceEnd = match.index + match[0].length;
  }

  // If no sentence boundary found, truncate at word boundary
  if (lastSentenceEnd === 0) {
    const truncated = text.substring(0, maxLength).trim();
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex !== -1) {
      return truncated.substring(0, lastSpaceIndex) + (addEllipsis ? '...' : '');
    }
    
    return truncated + (addEllipsis ? '...' : '');
  }

  return text.substring(0, lastSentenceEnd) + (addEllipsis ? '...' : '');
}; 