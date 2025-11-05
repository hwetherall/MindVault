/**
 * Number formatting utilities
 * Standardizes financial number formatting across outputs
 */

export interface FormatNumberOptions {
  currency?: string;
  decimals?: number;
  useSuffix?: boolean; // Use million/billion suffixes
}

/**
 * Format a number with currency and appropriate suffix
 */
export function formatFinancialNumber(
  value: number,
  options: FormatNumberOptions = {}
): string {
  const {
    currency = '',
    decimals = 2,
    useSuffix = true
  } = options;

  if (!useSuffix) {
    return `${currency}${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }

  const absValue = Math.abs(value);
  let formatted: string;
  let suffix = '';

  if (absValue >= 1_000_000_000) {
    formatted = (value / 1_000_000_000).toFixed(decimals);
    suffix = 'b';
  } else if (absValue >= 1_000_000) {
    formatted = (value / 1_000_000).toFixed(decimals);
    suffix = 'm';
  } else if (absValue >= 1_000) {
    formatted = (value / 1_000).toFixed(decimals);
    suffix = 'k';
  } else {
    formatted = value.toFixed(decimals);
  }

  // Remove trailing zeros
  formatted = parseFloat(formatted).toString();

  return `${currency}${formatted}${suffix}`;
}

/**
 * Extract and format numbers in text
 */
export function formatNumbersInText(text: string, currency?: string): string {
  if (!text) return text;

  // Pattern to match numbers that might need formatting
  // Matches: 40,485,584.91, 40485584.91, 40.49m, etc.
  const numberPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+\.\d+)/g;

  return text.replace(numberPattern, (match) => {
    // Skip if already has suffix (m, b, k)
    if (/[kmb]$/i.test(match)) {
      return match;
    }

    // Remove commas and parse
    const numStr = match.replace(/,/g, '');
    const num = parseFloat(numStr);

    if (isNaN(num)) {
      return match;
    }

    // Format with suffix if large enough
    if (Math.abs(num) >= 1000) {
      return formatFinancialNumber(num, { currency: currency || '', useSuffix: true });
    }

    return match;
  });
}

/**
 * Extract currency from text
 */
export function extractCurrency(text: string): string | null {
  const currencyPatterns = [
    /\b(USD|AUD|EUR|GBP|CAD|JPY|CNY|INR)\b/i,
    /\$\s*(USD|AUD|EUR|GBP|CAD)/i,
    /([A-Z]{3})\s*\d+/i
  ];

  for (const pattern of currencyPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]?.toUpperCase() || match[0].replace(/[^A-Z]/g, '').toUpperCase();
    }
  }

  return null;
}

/**
 * Format financial numbers in answer text
 * Post-processes AI output to ensure consistent formatting
 */
export function formatAnswerNumbers(answer: string): string {
  if (!answer) return answer;

  let formatted = answer;

  // Extract currency from the text if present
  const currency = extractCurrency(answer);

  // Format numbers in the Analysis section
  const analysisMatch = formatted.match(/#\s*Analysis\s*([\s\S]*?)(?=#\s*Conclusion|$)/i);
  if (analysisMatch) {
    const analysisSection = analysisMatch[1];
    const formattedAnalysis = formatNumbersInText(analysisSection, currency || undefined);
    formatted = formatted.replace(analysisMatch[0], `# Analysis\n${formattedAnalysis}`);
  }

  // Format numbers in the Conclusion section
  const conclusionMatch = formatted.match(/#\s*Conclusion\s*([\s\S]*?)$/i);
  if (conclusionMatch) {
    const conclusionSection = conclusionMatch[1];
    const formattedConclusion = formatNumbersInText(conclusionSection, currency || undefined);
    formatted = formatted.replace(conclusionMatch[0], `# Conclusion\n${formattedConclusion}`);
  }

  return formatted;
}

/**
 * Validate number formatting in text
 */
export function validateNumberFormatting(text: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check for numbers without currency
  const largeNumbersWithoutCurrency = /\b\d{4,}(?:,\d{3})*(?:\.\d+)?\b/g;
  const matches = text.match(largeNumbersWithoutCurrency);
  if (matches && matches.length > 0) {
    issues.push(`Found ${matches.length} large number(s) without currency code`);
    suggestions.push('Add currency codes to financial figures (e.g., "40.49m AUD" instead of "40,485,584.91")');
  }

  // Check for inconsistent formatting
  const hasSuffix = /[\d.]+[kmb]/i.test(text);
  const hasLongNumbers = /\d{7,}/.test(text);
  if (hasSuffix && hasLongNumbers) {
    issues.push('Mixed number formatting detected (some with suffixes, some without)');
    suggestions.push('Use consistent formatting: prefer million/billion suffixes for large numbers');
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

