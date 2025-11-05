/**
 * Output validator for AI responses
 * Ensures responses match expected Source/Analysis/Conclusion format
 */

export interface ParsedAnswer {
  source: string;
  analysis: string[];
  conclusion: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Regex patterns for section detection
 */
const SECTION_PATTERNS = {
  source: /^#\s*Source\s*$/im,
  analysis: /^#\s*Analysis\s*$/im,
  conclusion: /^#\s*Conclusion\s*$/im,
  // Also support variations
  sourceAlt: /^##\s*Source\s*$/im,
  analysisAlt: /^##\s*Analysis\s*$/im,
  conclusionAlt: /^##\s*Conclusion\s*$/im,
};

/**
 * Extract sections from answer text
 */
function extractSections(text: string): { source?: string; analysis?: string; conclusion?: string } {
  const sections: { source?: string; analysis?: string; conclusion?: string } = {};
  
  // Try to find sections using various patterns
  const sourceMatch = text.match(/(?:^#+\s*Source\s*$)([\s\S]*?)(?=^#+\s*(?:Analysis|Conclusion)\s*$|$)/im);
  const analysisMatch = text.match(/(?:^#+\s*Analysis\s*$)([\s\S]*?)(?=^#+\s*(?:Conclusion|Source)\s*$|$)/im);
  const conclusionMatch = text.match(/(?:^#+\s*Conclusion\s*$)([\s\S]*?)(?=^#+\s*(?:Source|Analysis)\s*$|$)/im);
  
  if (sourceMatch) sections.source = sourceMatch[1].trim();
  if (analysisMatch) sections.analysis = analysisMatch[1].trim();
  if (conclusionMatch) sections.conclusion = conclusionMatch[1].trim();
  
  return sections;
}

/**
 * Validate source section
 */
function validateSource(source: string | undefined): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!source || source.trim().length === 0) {
    errors.push('Source section is missing or empty');
    return { isValid: false, errors, warnings };
  }
  
  // Check for document references
  const hasDocumentRef = /document|file|pdf|excel|sheet|page/i.test(source);
  if (!hasDocumentRef) {
    warnings.push('Source section may not contain specific document references');
  }
  
  // Check for page/sheet references
  const hasPageRef = /page\s+\d+|sheet|cell|column|row/i.test(source);
  if (!hasPageRef) {
    warnings.push('Source section may not contain page/sheet/cell references');
  }
  
  return { isValid: true, errors, warnings };
}

/**
 * Validate analysis section
 */
function validateAnalysis(analysis: string | undefined): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!analysis || analysis.trim().length === 0) {
    errors.push('Analysis section is missing or empty');
    return { isValid: false, errors, warnings };
  }
  
  // Check for document availability status (bad)
  const availabilityPhrases = [
    /analysis was performed/i,
    /excel analysis:?\s*(available|unavailable)/i,
    /pdf analysis:?\s*(available|unavailable)/i,
    /documents? (were|was) analyzed/i,
    /some document types? may have been/i
  ];
  
  for (const pattern of availabilityPhrases) {
    if (pattern.test(analysis)) {
      errors.push('Analysis section contains document availability status instead of insights - focus on what the data shows');
    }
  }
  
  // Split into bullet points
  const bulletPoints = analysis.split(/^[-•*]\s*/m).filter(point => point.trim().length > 0);
  
  if (bulletPoints.length < 3) {
    warnings.push(`Analysis section has fewer than 3 bullet points (found ${bulletPoints.length})`);
  }
  
  if (bulletPoints.length > 7) {
    warnings.push(`Analysis section has more than 7 bullet points (found ${bulletPoints.length}), may be too verbose`);
  }
  
  // Check for specific data points
  const hasNumbers = /\d+/.test(analysis);
  if (!hasNumbers) {
    warnings.push('Analysis section may not contain specific figures or metrics');
  }
  
  // Check for dates
  const hasDates = /\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|Q[1-4]|quarter|year/i.test(analysis);
  if (!hasDates) {
    warnings.push('Analysis section may not contain time references');
  }
  
  // Check for insight-focused language (good)
  const insightKeywords = ['grew', 'increased', 'decreased', 'accelerated', 'decelerated', 'exceeds', 'below', 'indicating', 'suggesting', 'demonstrating', 'trend', 'comparison', 'benchmark'];
  const hasInsights = insightKeywords.some(keyword => analysis.toLowerCase().includes(keyword));
  if (!hasInsights && bulletPoints.length > 0) {
    warnings.push('Analysis section may lack insight-focused language - consider adding trends, comparisons, or implications');
  }
  
  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate conclusion section
 */
function validateConclusion(conclusion: string | undefined): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!conclusion || conclusion.trim().length === 0) {
    errors.push('Conclusion section is missing or empty');
    return { isValid: false, errors, warnings };
  }
  
  // Check length (should be 1-2 sentences)
  const sentences = conclusion.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 3) {
    warnings.push(`Conclusion section has more than 2 sentences (found ${sentences.length})`);
  }
  
  // Check for specific figures
  const hasNumbers = /\d+/.test(conclusion);
  if (!hasNumbers) {
    warnings.push('Conclusion section may not contain specific figures');
  }
  
  return { isValid: true, errors, warnings };
}

/**
 * Check for citation quality
 */
function checkCitationQuality(text: string): { hasCitations: boolean; quality: 'high' | 'medium' | 'low' } {
  const sourceSection = extractSections(text).source || '';
  
  // High quality: Has document name + page/sheet + cell reference
  const highQualityPattern = /(?:document|file|pdf|excel).*?(?:page\s+\d+|sheet|cell\s+[A-Z]+\d+)/i;
  if (highQualityPattern.test(sourceSection)) {
    return { hasCitations: true, quality: 'high' };
  }
  
  // Medium quality: Has document name + page/sheet
  const mediumQualityPattern = /(?:document|file|pdf|excel).*?(?:page\s+\d+|sheet)/i;
  if (mediumQualityPattern.test(sourceSection)) {
    return { hasCitations: true, quality: 'medium' };
  }
  
  // Low quality: Has document name only
  const lowQualityPattern = /(?:document|file|pdf|excel)/i;
  if (lowQualityPattern.test(sourceSection)) {
    return { hasCitations: true, quality: 'low' };
  }
  
  return { hasCitations: false, quality: 'low' };
}

/**
 * Parse and validate an AI answer
 */
export function validateAnswer(answer: string): ParsedAnswer {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Extract sections
  const sections = extractSections(answer);
  
  // Validate each section
  const sourceValidation = validateSource(sections.source);
  const analysisValidation = validateAnalysis(sections.analysis);
  const conclusionValidation = validateConclusion(sections.conclusion);
  
  errors.push(...sourceValidation.errors, ...analysisValidation.errors, ...conclusionValidation.errors);
  warnings.push(...sourceValidation.warnings, ...analysisValidation.warnings, ...conclusionValidation.warnings);
  
  // Check citation quality
  const citationCheck = checkCitationQuality(answer);
  if (!citationCheck.hasCitations) {
    warnings.push('No citations found in source section');
  } else if (citationCheck.quality === 'low') {
    warnings.push('Citation quality is low - consider adding page/sheet references');
  }

  // Check for banned generic phrases in source section
  const bannedPhrases = [
    'combined results from available',
    'analysis was performed on available',
    'available document analyses'
  ];
  
  const lowerSource = (sections.source || '').toLowerCase();
  for (const phrase of bannedPhrases) {
    if (lowerSource.includes(phrase)) {
      errors.push(`Source section contains banned generic phrase: "${phrase}" - use specific citations instead`);
    }
  }
  
  // Parse analysis into bullet points
  const analysisBullets = sections.analysis
    ? sections.analysis.split(/^[-•*]\s*/m).filter(point => point.trim().length > 0)
    : [];
  
  const isValid = errors.length === 0;
  
  return {
    source: sections.source || '',
    analysis: analysisBullets,
    conclusion: sections.conclusion || '',
    isValid,
    errors,
    warnings
  };
}

/**
 * Format answer if structure is missing (fallback formatting)
 */
export function formatAnswerFallback(answer: string): string {
  const parsed = validateAnswer(answer);
  
  // If already valid, return as-is
  if (parsed.isValid) {
    return answer;
  }
  
  // Try to reformat
  let formatted = '';
  
  if (parsed.source) {
    formatted += `# Source\n${parsed.source}\n\n`;
  } else {
    formatted += `# Source\nBased on the provided documents.\n\n`;
  }
  
  if (parsed.analysis.length > 0) {
    formatted += `# Analysis\n${parsed.analysis.map(point => `- ${point.trim()}`).join('\n')}\n\n`;
  } else {
    // Try to extract bullet points from raw text
    const bullets = answer.split(/^[-•*]\s*/m).filter(point => point.trim().length > 20);
    if (bullets.length > 0) {
      formatted += `# Analysis\n${bullets.slice(0, 5).map(point => `- ${point.trim()}`).join('\n')}\n\n`;
    } else {
      formatted += `# Analysis\n- Analysis of the provided information.\n\n`;
    }
  }
  
  if (parsed.conclusion) {
    formatted += `# Conclusion\n${parsed.conclusion}\n`;
  } else {
    // Try to extract conclusion from end of text
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      formatted += `# Conclusion\n${sentences.slice(-2).join('. ')}.\n`;
    } else {
      formatted += `# Conclusion\nBased on the available information.\n`;
    }
  }
  
  return formatted;
}

/**
 * Get validation summary for display
 */
export function getValidationSummary(parsed: ParsedAnswer): string {
  if (parsed.isValid && parsed.warnings.length === 0) {
    return 'Answer format is valid';
  }
  
  const parts: string[] = [];
  
  if (!parsed.isValid) {
    parts.push(`Errors: ${parsed.errors.length}`);
  }
  
  if (parsed.warnings.length > 0) {
    parts.push(`Warnings: ${parsed.warnings.length}`);
  }
  
  return parts.join(', ');
}

