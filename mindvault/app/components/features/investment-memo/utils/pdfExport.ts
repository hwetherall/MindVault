import jsPDF from 'jspdf';
import { formatNumbersInText } from '../../../../utils/formatters';

/**
 * Investment memo questions data structure
 */
export interface InvestmentMemoQuestion {
  id: string;
  question: string;
  description: string;
  category?: string;
  complexity?: 'low' | 'medium' | 'high';
  recommended?: string[];
}

/**
 * Answer data structure
 */
export interface Answer {
  summary: string;
  details: string;
  isEdited: boolean;
}

/**
 * Export options for PDF generation
 */
export interface ExportOptions {
  includeTableOfContents: boolean;
  includeAppendices: boolean;
  language: 'en' | 'ja';
  isDetailedView?: boolean; // Toggle between Concise and Detailed view
}

/**
 * Export the investment memo to PDF
 * @param questions The list of investment memo questions
 * @param answers The answers to the questions
 * @param companyName Optional company name for the PDF title
 * @param options Export options for customizing the PDF output
 */
export const exportToPDF = (
  questions: InvestmentMemoQuestion[],
  answers: Record<string, Answer>,
  companyName?: string,
  options: ExportOptions = {
    includeTableOfContents: true,
    includeAppendices: true,
    language: 'en',
    isDetailedView: true
  }
): void => {
  const doc = new jsPDF();
  
  // Set title
  const title = companyName ? `Investment Memo: ${companyName}` : 'Investment Memo';
  doc.setFontSize(18);
  doc.text(title, 20, 20);
  
  // Set font for the rest of the document
  doc.setFontSize(10);
  
  let yPosition = 30;
  const leftMargin = 20;
  const pageWidth = 180;
  
  // Group questions by category
  const questionsByCategory = questions.reduce((acc, question) => {
    const category = question.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(question);
    return acc;
  }, {} as Record<string, InvestmentMemoQuestion[]>);
  
  // Add table of contents if enabled
  if (options.includeTableOfContents) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Table of Contents', leftMargin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    Object.entries(questionsByCategory).forEach(([category, categoryQuestions]) => {
      // Add category
      doc.setFont(undefined, 'bold');
      doc.text(category, leftMargin, yPosition);
      yPosition += 5;
      
      // Add questions
      doc.setFont(undefined, 'normal');
      categoryQuestions.forEach(question => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${question.question}`, leftMargin + 5, yPosition);
        yPosition += 5;
      });
      
      yPosition += 5;
    });
    
    // Add page break after table of contents
    doc.addPage();
    yPosition = 20;
  }
  
  // Add main content
  Object.entries(questionsByCategory).forEach(([category, categoryQuestions]) => {
    // Add category header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(category, leftMargin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    
    categoryQuestions.forEach(({ id, question, description }) => {
      // Get answer content if available
      const answer = answers[id];
      if (!answer) return;
      
      // Add the question
      doc.setFont(undefined, 'bold');
      
      // Check if we need a page break
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(question, leftMargin, yPosition);
      yPosition += 7;
      
      // Add description if available
      if (description) {
        doc.setFont(undefined, 'italic');
        const splitDesc = doc.splitTextToSize(description, pageWidth);
        doc.text(splitDesc, leftMargin, yPosition);
        yPosition += 5 * splitDesc.length;
      }
      
      // Add the answer
      doc.setFont(undefined, 'normal');
      
      // Add "Summary" label when in detailed view
      if (options.isDetailedView) {
        doc.setFont(undefined, 'bold');
        doc.text("Summary:", leftMargin, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition += 5;
      }
      
      const formattedSummary = formatNumbersInText(answer.summary);
      
      // Handle line breaks for long text
      const splitSummary = doc.splitTextToSize(formattedSummary, pageWidth);
      doc.text(splitSummary, leftMargin, yPosition);
      
      yPosition += 5 * (splitSummary.length);
      
      // Add details if available and detailed view is enabled
      if (answer.details && options.isDetailedView) {
        yPosition += 5;
        
        // Check if we need a page break
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Add "Details" label
        doc.setFont(undefined, 'bold');
        doc.text("Details:", leftMargin, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition += 5;
        
        const formattedDetails = formatNumbersInText(answer.details);
        const splitDetails = doc.splitTextToSize(formattedDetails, pageWidth);
        doc.text(splitDetails, leftMargin, yPosition);
        
        yPosition += 5 * (splitDetails.length);
      }
      
      // Add space between sections
      yPosition += 10;
    });
  });
  
  // Add appendices if enabled
  if (options.includeAppendices) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Appendices', leftMargin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Add placeholder text for appendices
    doc.text('Supporting documents and references', leftMargin, yPosition);
  }
  
  // Add date and language indicator
  const date = new Date().toLocaleDateString(options.language === 'ja' ? 'ja-JP' : 'en-US');
  doc.setFontSize(8);
  doc.text(`Generated on: ${date}`, leftMargin, 290);
  doc.text(`Language: ${options.language === 'ja' ? '日本語' : 'English'}`, 160, 290);
  
  // Save the PDF with appropriate filename
  const filename = companyName 
    ? `investment-memo-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`
    : 'investment-memo.pdf';
  
  doc.save(filename);
}; 