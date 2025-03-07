

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
 * Export options for PDF generation
 */
export interface ExportOptions {
  includeTableOfContents: boolean;
  includeAppendices: boolean;
  language: 'en' | 'ja';
}

/**
 * Export the investment memo to PDF
 * @param questions The list of investment memo questions
 * @param answers The answers to the questions
 * @param companyName Optional company name for the PDF title
 * @param options Export options for customizing the PDF output
 */
export const exportToPDF = async (
  questions: InvestmentMemoQuestion[],
  answers: Record<string, Answer>,
  companyName?: string,
  options: ExportOptions = {
    includeTableOfContents: true,
    includeAppendices: true,
    language: 'en'
  },
  logo?: string 
): Promise<void> => {
  try {
    await preloadAssets();

    // Get the template HTML
    const templateResponse = await fetch('/templates/investment-memo.html');
    if (!templateResponse.ok) {
      throw new Error(`Failed to load template: ${templateResponse.statusText}`);
    }
    const template = await templateResponse.text();

    // Call the API endpoint to generate PDF
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questions,
        answers,
        companyName,
        options,
        logo,
        template
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate PDF');
    }

    // Get the PDF blob
    const pdfBlob = await response.blob();

    // Create a download link
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = companyName 
      ? `investment-memo-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`
      : 'investment-memo.pdf';
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

async function preloadAssets() {
  // Preload custom fonts
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

  // Load all fonts
  await Promise.all(fonts.map(async (font) => {
    try {
      const fontFace = new FontFace(font.family, `url(${font.url})`, {
        weight: font.weight,
        style: font.style
      });
      await fontFace.load();
      document.fonts.add(fontFace);
    } catch (error) {
      console.warn(`Failed to load font ${font.family}:`, error);
      // Fallback to system fonts if custom fonts fail to load
      console.log('Falling back to system fonts');
    }
  }));

  // Preload images
  const images = [
    '/templates/unnamed.jpg',
    '/templates/kp-logo-placeholder.png'
  ];

  await Promise.all(images.map(src => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = (error) => {
        console.warn(`Failed to load image ${src}:`, error);
        resolve(); // Resolve anyway to not block the process
      };
      img.src = src;
    });
  }));
}