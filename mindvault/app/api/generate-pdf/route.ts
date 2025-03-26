import { NextResponse } from 'next/server';
import { marked } from 'marked';
import { formatNumbersInText } from '../../utils/textFormatting';
import fs from 'fs/promises';
import path from 'path';
import { generatePDF } from '../../lib/puppeteer';

interface Question {
  id: string;
  question: string;
  description?: string;
  category?: string;
}

interface Answer {
  summary: string;
  details: string;
  isEdited: boolean;
}

interface ExportOptions {
  includeTableOfContents: boolean;
  includeAppendices: boolean;
  language: 'en' | 'ja';
  isDetailedView?: boolean;
}

// Configure marked to use synchronous mode
marked.setOptions({ async: false });

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { 
      questions,
      answers,
      title,
      description,
      options,
      logo,
      template
    }: {
      questions: Question[];
      answers: Record<string, Answer>;
      title: string;
      description: string;
      options: ExportOptions;
      logo?: string;
      template: string;
    } = await request.json();

    // Read font files
    const fontFiles = {
      normal: await fs.readFile(path.join(process.cwd(), 'public', 'fonts', 'gotham', 'Gotham-Book.otf')),
      bold: await fs.readFile(path.join(process.cwd(), 'public', 'fonts', 'gotham', 'Gotham-Medium.otf'))
    };

    // Read default logo and validate base64
    const defaultLogoPath = path.join(process.cwd(), 'public', 'templates', 'unnamed.jpg');
    const defaultLogo = await fs.readFile(defaultLogoPath);
    const defaultLogoBase64 = `data:image/jpeg;base64,${defaultLogo.toString('base64')}`;

    // Validate custom logo if provided
    let validatedLogo = logo;
    if (logo) {
      // Check if it's a valid data URL with base64 encoding
      const isValidDataUrl = /^data:image\/(jpeg|jpg|png|gif|webp);base64,([A-Za-z0-9+/=]*)$/.test(logo);
      if (!isValidDataUrl) {
        console.warn('Custom logo is not a valid base64 data URL, falling back to default logo');
        validatedLogo = undefined;
      }
    }

    // Convert font files to base64
    const fontBase64 = {
      normal: fontFiles.normal.toString('base64'),
      bold: fontFiles.bold.toString('base64')
    };

    // Pre-process markdown content
    const processedAnswers = Object.fromEntries(
      await Promise.all(
        Object.entries(answers).map(async ([id, answer]) => [
          id,
          {
            ...answer,
            summaryHtml: await marked.parse(formatNumbersInText(answer.summary)),
            detailsHtml: await marked.parse(formatNumbersInText(answer.details))
          }
        ])
      )
    );

    // Get the current URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Add font loading directly to the page
    const fontScript = `
      // Load fonts sequentially to ensure proper loading
      async function loadFonts() {
        try {
          // Load normal font
          const normalFont = new FontFace('Gotham', \`url(data:font/opentype;base64,${fontBase64.normal})\`, { weight: 'normal' });
          const loadedNormalFont = await normalFont.load();
          document.fonts.add(loadedNormalFont);
          console.log('Normal font loaded successfully');

          // Load bold font
          const boldFont = new FontFace('Gotham', \`url(data:font/opentype;base64,${fontBase64.bold})\`, { weight: 'bold' });
          const loadedBoldFont = await boldFont.load();
          document.fonts.add(loadedBoldFont);
          console.log('Bold font loaded successfully');

          // Wait for fonts to be ready
          await document.fonts.ready;
          console.log('All fonts ready');

          // Verify fonts are loaded
          const normalLoaded = document.fonts.check('normal 12px Gotham');
          const boldLoaded = document.fonts.check('bold 12px Gotham');
          console.log('Font load status:', { normalLoaded, boldLoaded });

          if (!normalLoaded || !boldLoaded) {
            throw new Error(\`Fonts failed to load: Normal: \${normalLoaded}, Bold: \${boldLoaded}\`);
          }

          return true;
        } catch (error) {
          console.error('Font loading error:', error);
          throw error;
        }
      }

      // Execute font loading
      loadFonts();
    `;

    // Set proper encoding for Japanese characters only when Japanese is selected
    const charsetScript = options.language === 'ja' ? `
      const meta = document.createElement('meta');
      meta.setAttribute('charset', 'UTF-8');
      document.head.appendChild(meta);
      console.log('Added UTF-8 charset meta tag for Japanese content');
    ` : '';

    // Inject content into the existing structure
    const contentScript = `
      // Helper to safely get element
      const getElement = (selector) => {
        const element = document.querySelector(selector);
        if (!element) {
          console.error(\`Element not found: \${selector}\`);
        }
        return element;
      };
      
      // Wait for fonts to be ready before setting content
      document.fonts.ready.then(() => {
        //Setup title
        const titleElement = getElement('#title');
        if (titleElement) {
          titleElement.textContent = '${title}';
        }

        //Setup description
        const descriptionElement = getElement('#description');
        if (descriptionElement) {
          if ('${description}' !== '') {
            descriptionElement.textContent = '${description}';
          } else {
            descriptionElement.style.display = 'none';
          }
        }

        // Handle table of contents
        if (${options.includeTableOfContents}) {
          const tocContainer = getElement('#tableOfContents');
          if (tocContainer) {
            tocContainer.style.display = 'block';
            
            // Group questions by category
            const questionsByCategory = ${JSON.stringify(questions)}.reduce((acc, question) => {
              const category = question.category || 'General';
              if (!acc[category]) acc[category] = [];
              acc[category].push(question);
              return acc;
            }, {});

            Object.entries(questionsByCategory).forEach(([category, categoryQuestions]) => {
              const categoryDiv = document.createElement('div');
              categoryDiv.className = 'TableOfContents-category';

              const categoryTitle = document.createElement('div');
              categoryTitle.className = 'category';
              categoryTitle.textContent = category;
              categoryDiv.appendChild(categoryTitle);

              const questionsDiv = document.createElement('div');
              questionsDiv.className = 'category-questions';
              categoryQuestions.forEach(question => {
                const questionItem = document.createElement('div');
                questionItem.className = 'question-item';
                questionItem.textContent = question.question;
                questionsDiv.appendChild(questionItem);
              });

              categoryDiv.appendChild(questionsDiv);
              tocContainer.appendChild(categoryDiv);
            });
          }
        }

        // Handle main content
        const contentContainer = getElement('#content');
        if (contentContainer) {
          ${JSON.stringify(questions)}.forEach(({ id, question, description }) => {
            const answer = ${JSON.stringify(processedAnswers)}[id];
            if (answer?.summary) {
              const section = document.createElement('div');
              section.className = 'question-section';

              const questionDiv = document.createElement('div');
              questionDiv.className = 'question';
              questionDiv.textContent = question;
              section.appendChild(questionDiv);

              if (description) {
                const descriptionDiv = document.createElement('div');
                descriptionDiv.className = 'description';
                descriptionDiv.textContent = description;
                section.appendChild(descriptionDiv);
              }

              const summaryHeader = document.createElement('h3');
              summaryHeader.textContent = 'Summary';
              section.appendChild(summaryHeader);

              const summaryDiv = document.createElement('div');
              summaryDiv.className = 'answer';
              summaryDiv.innerHTML = answer.summaryHtml;
              section.appendChild(summaryDiv);

              if (answer.details && ${options.isDetailedView}) { 
                const detailsHeader = document.createElement('h3');
                detailsHeader.textContent = 'Details';
                section.appendChild(detailsHeader);

                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'answer';
                detailsDiv.innerHTML = answer.detailsHtml;
                section.appendChild(detailsDiv);
              }

              contentContainer.appendChild(section);
            }
          });
        }

        // Show appendices if enabled
        if (${options.includeAppendices}) {
          const appendicesContainer = getElement('#appendices');
          if (appendicesContainer) {
            appendicesContainer.style.display = 'block';
          }
        }

        // Handle logo
        const logoElement = document.querySelector('#logo');
        if (logoElement) {
          logoElement.src = '${validatedLogo || defaultLogoBase64}';
        }

        // Add generation date
        const dateElement = document.querySelector('#generation-date');
        if (dateElement) {
          dateElement.textContent = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      });
    `;

    // Combine all scripts
    const fullScript = `
      ${fontScript}
      ${charsetScript}
      ${contentScript}
    `;

    // Generate the final HTML with scripts
    const finalHtml = template.replace('</head>', `
      <script>
        ${fullScript}
      </script>
    </head>`);

    // Generate PDF using our serverless Puppeteer utility
    let pdfBuffer;
    try {
      pdfBuffer = await generatePDF(finalHtml);
    } catch (error) {
      console.error('Error in generatePDF:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }

    if (!pdfBuffer) {
      throw new Error('PDF generation returned no buffer');
    }

    // Convert buffer to Uint8Array for proper encoding handling
    const uint8Array = new Uint8Array(pdfBuffer);
    
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${`${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}.pdf`}"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    // Return a more detailed error response
    return NextResponse.json({ 
      error: error.message || 'Failed to generate PDF',
      details: {
        errorType: error.name,
        errorCause: error.cause,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 
