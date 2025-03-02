import jsPDF from 'jspdf';
import { formatNumbersInText, splitAnswerContent } from '../../../../utils/formatters';

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
  content: string;
  isEdited: boolean;
}

/**
 * Export the investment memo to PDF
 * @param questions The list of investment memo questions
 * @param answers The answers to the questions
 * @param companyName Optional company name for the PDF title
 */
export const exportToPDF = (
  questions: InvestmentMemoQuestion[],
  answers: Record<string, Answer>,
  companyName?: string
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
  
  questions.forEach(({ id, question }) => {
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
    
    // Add the answer
    doc.setFont(undefined, 'normal');
    
    // Split answer content
    const { tldr, details } = splitAnswerContent(answer.content);
    const formattedTldr = formatNumbersInText(tldr);
    
    // Handle line breaks for long text
    const splitTldr = doc.splitTextToSize(formattedTldr, pageWidth);
    doc.text(splitTldr, leftMargin, yPosition);
    
    yPosition += 5 * (splitTldr.length);
    
    // Add details if available
    if (details) {
      yPosition += 5;
      
      // Check if we need a page break
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      const formattedDetails = formatNumbersInText(details);
      const splitDetails = doc.splitTextToSize(formattedDetails, pageWidth);
      doc.text(splitDetails, leftMargin, yPosition);
      
      yPosition += 5 * (splitDetails.length);
    }
    
    // Add space between sections
    yPosition += 10;
  });
  
  // Add date
  const date = new Date().toLocaleDateString();
  doc.setFontSize(8);
  doc.text(`Generated on: ${date}`, leftMargin, 290);
  
  // Save the PDF
  doc.save('investment-memo.pdf');
}; 