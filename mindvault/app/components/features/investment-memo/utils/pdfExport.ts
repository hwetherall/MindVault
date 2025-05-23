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

  // Validate chart data if present
  Object.values(answers).forEach(answer => {
    if (answer.chartData) {
      if (!answer.chartData.data || !Array.isArray(answer.chartData.data.labels)) {
        console.warn('Chart data has invalid structure:', answer.chartData);
      }
    }
  });
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
  let retryCount = 0;
  const maxRetries = 2;

  try {
    // Validate input parameters
    validateInput(questions, answers, title, description, options);

    await preloadAssets();

    // Function to attempt PDF generation with retry logic
    const attemptPdfGeneration = async (): Promise<Response> => {
      try {
        console.log(`PDF generation attempt ${retryCount + 1}/${maxRetries + 1}`);
        
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
          const error = await response.json();
          throw new Error(error.message || 'Failed to generate PDF');
        }
        
        return response;
      } catch (error) {
        console.error(`PDF generation attempt ${retryCount + 1} failed:`, error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying PDF generation, attempt ${retryCount + 1}/${maxRetries + 1}`);
          // Add small delay before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          return attemptPdfGeneration();
        }
        throw error;
      }
    };

    // Attempt PDF generation with retries
    const response = await attemptPdfGeneration();

    // Get the PDF blob
    const pdfBlob = await response.blob();
    
    // Check if the PDF has a reasonable size
    if (pdfBlob.size < 10000) {
      console.warn(`PDF size (${pdfBlob.size} bytes) is suspiciously small, may be empty`);
    } else {
      console.log(`PDF generated successfully: ${pdfBlob.size} bytes`);
    }

    // Create a download link
    downloadUrl = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();

  } catch (error) {
    console.error('Error generating PDF:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    throw error instanceof Error ? error : new Error('Failed to generate PDF');
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