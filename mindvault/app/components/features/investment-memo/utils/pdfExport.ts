import { ChartData } from '../../../ChartComponent';

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
  isLoading?: boolean;
  chartData?: ChartData;
  modelUsed?: string;
  timeTaken?: number;
  messageLength?: number;
  answerLength?: number;
  questionInstructions?: string;
  finalInstructionsPrompt?: string;
  documentContext?: string;
  finalPrompt?: string;
  rawOutput?: string;
}

/**
 * Export options for PDF generation
 */
export interface ExportOptions {
  includeTableOfContents: boolean;
  includeAppendices: boolean;
  language: 'en' | 'ja';
  isDetailedView?: boolean;
}

/**
 * Validates the input parameters for PDF export
 */
function validateInput(
  questions: InvestmentMemoQuestion[],
  answers: Record<string, Answer>,
  title: string,
  description: string,
  options?: ExportOptions
): void {
  console.log('Validating input:', { title, description }); // Debug log

  if (!title?.trim()) {
    throw new Error(`Title is required (received: ${JSON.stringify(title)})`);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Questions must be a non-empty array');
  }

  if (!answers || Object.keys(answers).length === 0) {
    throw new Error('Answers must be a non-empty object');
  }
}

/**
 * Export the investment memo to PDF
 * @param questions The list of investment memo questions
 * @param answers The answers to the questions
 * @param title Title of the document
 * @param description Description of the document	
 * @param options Export options for customizing the PDF output
 */
export const exportToPDF = async (
  questions: InvestmentMemoQuestion[],
  answers: Record<string, Answer>,
  title: string,
  description: string,
  options: ExportOptions = {
    includeTableOfContents: true,
    includeAppendices: true,
    language: 'en',
    isDetailedView: true
  },
  logo?: string 
): Promise<void> => {
  
  let downloadUrl: string | null = null;

  try {
    // Validate input parameters
    validateInput(questions, answers, title, description, options);

    await preloadAssets();

    // Check if we're on a Vercel deployment
    const isVercelDeployment = typeof window !== 'undefined' && 
      window.location.hostname.includes('vercel.app');
    
    // For Vercel deployments, skip server-side generation and use client-side directly
    if (isVercelDeployment) {
      console.log('Detected Vercel deployment, using client-side PDF generation directly');
      await generatePDFClientSide(questions, answers, title, description, options);
      return;
    }

    // Get the template HTML with timeout
    const templateResponse = await Promise.race([
      fetch('/templates/investment-memo.html'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Template fetch timeout')), 10000)
      )
    ]) as Response;

    if (!templateResponse.ok) {
      throw new Error(`Failed to load template: ${templateResponse.statusText}`);
    }
    const template = await templateResponse.text();

    // Call the API endpoint to generate PDF with timeout
    try {
      const response = await Promise.race([
        fetch('/api/generate-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questions,
            answers,
            title,
            description,
            options,
            logo,
            template
          })
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF generation timeout')), 60000)
        )
      ]) as Response;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
        console.error('PDF generation server error:', errorData);
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();

      // Create a download link
      downloadUrl = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
    } catch (error) {
      console.error('Server-side PDF generation failed, falling back to client-side generation:', error);
      await generatePDFClientSide(questions, answers, title, description, options);
    }

  } catch (error) {
    console.error('Error generating PDF:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    
    // Try client-side generation as a last resort
    try {
      await generatePDFClientSide(questions, answers, title, description, options);
    } catch (clientError) {
      console.error('Client-side fallback also failed:', clientError);
      throw error instanceof Error ? error : new Error('Failed to generate PDF');
    }
  } finally {
    // Cleanup
    if (downloadUrl) {
      window.URL.revokeObjectURL(downloadUrl);
    }
    const link = document.querySelector('a[download]');
    if (link && link.parentNode) {
      link.parentNode.removeChild(link);
    }
  }
};

/**
 * Client-side fallback for PDF generation using html2pdf.js
 */
async function generatePDFClientSide(
  questions: InvestmentMemoQuestion[],
  answers: Record<string, Answer>,
  title: string,
  description: string,
  options: ExportOptions
): Promise<void> {
  try {
    console.log('Using client-side PDF generation fallback');
    
    // Create a container to hold our content
    const container = document.createElement('div');
    container.style.width = '210mm'; // A4 width
    container.style.padding = '20mm';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.background = 'white';
    container.style.color = 'black';

    // Add title and custom styling for better PDF output
    const titleEl = document.createElement('h1');
    titleEl.textContent = title;
    titleEl.style.fontSize = '24px';
    titleEl.style.marginBottom = '10px';
    titleEl.style.fontWeight = 'bold';
    titleEl.style.textAlign = 'center';
    container.appendChild(titleEl);
    
    // Add description if it exists
    if (description) {
      const descEl = document.createElement('p');
      descEl.textContent = description;
      descEl.style.marginBottom = '20px';
      descEl.style.textAlign = 'center';
      descEl.style.fontSize = '14px';
      container.appendChild(descEl);
    }
    
    // Add generation date
    const dateEl = document.createElement('p');
    dateEl.textContent = `Generated on ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    dateEl.style.fontSize = '12px';
    dateEl.style.textAlign = 'center';
    dateEl.style.marginBottom = '30px';
    container.appendChild(dateEl);
    
    // Add table of contents if enabled
    if (options.includeTableOfContents) {
      const tocTitle = document.createElement('h2');
      tocTitle.textContent = 'Table of Contents';
      tocTitle.style.fontSize = '18px';
      tocTitle.style.marginTop = '20px';
      tocTitle.style.marginBottom = '10px';
      tocTitle.style.pageBreakAfter = 'avoid';
      container.appendChild(tocTitle);
      
      const tocList = document.createElement('ul');
      tocList.style.listStyleType = 'decimal';
      tocList.style.paddingLeft = '20px';
      
      // Group questions by category
      const questionsByCategory: Record<string, InvestmentMemoQuestion[]> = {};
      questions.forEach(q => {
        const category = q.category || 'General';
        if (!questionsByCategory[category]) {
          questionsByCategory[category] = [];
        }
        questionsByCategory[category].push(q);
      });
      
      // Add categories and questions to TOC
      Object.entries(questionsByCategory).forEach(([category, categoryQuestions]) => {
        // Add category header
        const categoryItem = document.createElement('li');
        categoryItem.style.fontWeight = 'bold';
        categoryItem.style.marginTop = '10px';
        categoryItem.textContent = category;
        tocList.appendChild(categoryItem);
        
        // Add sub-list for questions
        const subList = document.createElement('ul');
        subList.style.listStyleType = 'disc';
        subList.style.paddingLeft = '20px';
        
        categoryQuestions.forEach(q => {
          const item = document.createElement('li');
          item.textContent = q.question;
          item.style.marginBottom = '5px';
          item.style.fontWeight = 'normal';
          subList.appendChild(item);
        });
        
        categoryItem.appendChild(subList);
      });
      
      container.appendChild(tocList);
      
      // Add a page break after TOC
      const pageBreak = document.createElement('div');
      pageBreak.style.pageBreakAfter = 'always';
      pageBreak.style.height = '1px';
      container.appendChild(pageBreak);
    }
    
    // Try to convert markdown to HTML first if available
    let markdownParser: any = null;
    try {
      const marked = await import('marked');
      markdownParser = marked.marked;
      markdownParser.setOptions({ breaks: true });
    } catch (error) {
      console.warn('Could not load markdown parser:', error);
    }
    
    // Add each question and answer
    questions.forEach((q, index) => {
      const answer = answers[q.id];
      if (!answer) return;
      
      const section = document.createElement('div');
      section.style.marginTop = '30px';
      section.style.pageBreakInside = 'avoid';
      
      const questionEl = document.createElement('h2');
      questionEl.textContent = `${index + 1}. ${q.question}`;
      questionEl.style.fontSize = '18px';
      questionEl.style.marginBottom = '10px';
      questionEl.style.color = '#333';
      questionEl.style.borderBottom = '1px solid #ddd';
      questionEl.style.paddingBottom = '5px';
      section.appendChild(questionEl);
      
      if (q.description) {
        const descEl = document.createElement('p');
        descEl.textContent = q.description;
        descEl.style.marginBottom = '15px';
        descEl.style.fontStyle = 'italic';
        descEl.style.color = '#666';
        section.appendChild(descEl);
      }
      
      const summaryTitle = document.createElement('h3');
      summaryTitle.textContent = 'Summary';
      summaryTitle.style.fontSize = '16px';
      summaryTitle.style.marginTop = '15px';
      summaryTitle.style.marginBottom = '10px';
      summaryTitle.style.color = '#444';
      section.appendChild(summaryTitle);
      
      const summaryEl = document.createElement('div');
      if (markdownParser && typeof answer.summary === 'string') {
        summaryEl.innerHTML = markdownParser.parse(answer.summary);
      } else {
        summaryEl.innerHTML = answer.summary;
      }
      summaryEl.style.lineHeight = '1.5';
      summaryEl.style.marginBottom = '20px';
      section.appendChild(summaryEl);
      
      if (answer.details && options.isDetailedView) {
        const detailsTitle = document.createElement('h3');
        detailsTitle.textContent = 'Details';
        detailsTitle.style.fontSize = '16px';
        detailsTitle.style.marginTop = '15px';
        detailsTitle.style.marginBottom = '10px';
        detailsTitle.style.color = '#444';
        section.appendChild(detailsTitle);
        
        const detailsEl = document.createElement('div');
        if (markdownParser && typeof answer.details === 'string') {
          detailsEl.innerHTML = markdownParser.parse(answer.details);
        } else {
          detailsEl.innerHTML = answer.details;
        }
        detailsEl.style.lineHeight = '1.5';
        section.appendChild(detailsEl);
      }
      
      container.appendChild(section);
      
      // Add page break after each section except the last one
      if (index < questions.length - 1) {
        const pageBreak = document.createElement('div');
        pageBreak.style.pageBreakAfter = 'always';
        pageBreak.style.height = '1px';
        container.appendChild(pageBreak);
      }
    });
    
    // Add styling for better PDF output
    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
      }
      body {
        font-family: Arial, sans-serif;
        line-height: 1.5;
        color: #333;
      }
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1em;
        margin-bottom: 0.5em;
      }
      p {
        margin-bottom: 1em;
      }
      ul, ol {
        margin-bottom: 1em;
        padding-left: 2em;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 1em;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      code {
        font-family: monospace;
        background-color: #f5f5f5;
        padding: 2px 4px;
        border-radius: 3px;
      }
      pre {
        background-color: #f5f5f5;
        padding: 1em;
        border-radius: 3px;
        overflow-x: auto;
        white-space: pre-wrap;
      }
      blockquote {
        border-left: 3px solid #ddd;
        padding-left: 1em;
        margin-left: 0;
        color: #666;
      }
    `;
    container.appendChild(style);
    
    // Add to DOM temporarily
    document.body.appendChild(container);
    
    // Import html2pdf on the client side
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Generate PDF with improved options
    const opt = {
      margin: [15, 15, 15, 15],
      filename: `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true 
      }
    };
    
    await html2pdf().set(opt).from(container).save();
    
    // Remove the container
    document.body.removeChild(container);
    
    console.log('Client-side PDF generation successful');
  } catch (error) {
    console.error('Client-side PDF generation failed:', error);
    throw error;
  }
}

// Improve preloadAssets function with better error handling and timeouts
async function preloadAssets() {
  // Preload custom fonts with timeout
  const fonts = [
    {
      family: 'Gotham',
      url: '/fonts/gotham/Gotham-Book.otf',
      weight: 'normal',
      style: 'normal'
    },
    {
      family: 'Gotham',
      url: '/fonts/gotham/Gotham-Medium.otf',
      weight: 'bold',
      style: 'normal'
    }
  ];

  // Load all fonts with timeout
  await Promise.all(fonts.map(async (font) => {
    try {
      const fontFace = new FontFace(font.family, `url(${font.url})`, {
        weight: font.weight,
        style: font.style
      });

      // Add timeout to font loading
      const loadedFont = await Promise.race([
        fontFace.load(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Font load timeout: ${font.family}`)), 5000)
        )
      ]) as FontFace;

      document.fonts.add(loadedFont);
    } catch (error) {
      console.warn(`Failed to load font ${font.family}:`, error);
      // Continue with system fonts if custom fonts fail
    }
  }));

  // Preload images with timeout
  const images = [
    '/templates/unnamed.jpg',
    '/templates/kp-logo-placeholder.png'
  ];

  await Promise.all(images.map(src => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        img.src = ''; // Cancel image loading
        resolve(); // Resolve anyway to not block the process
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      img.onerror = (error) => {
        clearTimeout(timeout);
        console.warn(`Failed to load image ${src}:`, error);
        resolve(); // Resolve anyway to not block the process
      };
      img.src = src;
    });
  }));
}