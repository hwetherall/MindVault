/**
 * Utility functions for text formatting, especially for financial data
 */

/**
 * Formats numbers and financial data in text with markdown formatting
 * Enhances readability of financial information by adding proper formatting
 * @param text The input text to format
 * @returns Formatted text with markdown enhancements
 */
export const formatNumbersInText = (text: string): string => {
  if (!text) return '';

  let formattedText = text;

  // Format currency mentions (AUD, USD, etc with numbers)
  formattedText = formattedText.replace(
    /(\b(?:AUD|USD|EUR|GBP)\s*)(\d+(?:\.\d+)?)\s*(million|billion|thousand|M|B|K)?\b/gi,
    (match, currency, number, scale) => {
      // Convert string number to float
      const numValue = parseFloat(number);
      
      // Format with commas
      const formattedNum = numValue.toLocaleString('en-US', {
        minimumFractionDigits: numValue % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
      });
      
      // Bold the important financial figures
      return `**${currency} ${formattedNum}${scale ? ' ' + scale : ''}**`;
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
    /^((?:- |• )?)((?:Revenue|EBITDA|Net Income|Profit Margin|ROI|IRR|NPV|Capex|Opex|FCF|EPS)(?:\s*:)?\s*)(\d+(?:\.\d+)?)/gim,
    (match, bullet, metric, value) => {
      const numValue = parseFloat(value);
      const formattedNum = numValue.toLocaleString('en-US', {
        minimumFractionDigits: numValue % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
      });
      return `${bullet}**${metric}${formattedNum}**`;
    }
  );

  // Format large numbers with commas (numbers with 5+ digits)
  formattedText = formattedText.replace(
    /\b(\d{5,}(?:\.\d+)?)\b(?!\s*%)/g,
    (match, number) => {
      const numValue = parseFloat(number);
      return numValue.toLocaleString('en-US', {
        minimumFractionDigits: numValue % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2
      });
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