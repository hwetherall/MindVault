import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { marked } from 'marked';
import { formatNumbersInText } from '../../utils/formatters';
import fs from 'fs/promises';
import path from 'path';

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

export const maxDuration = 300; // Set maximum duration to 5 minutes
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

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();

    // Enable request interception for logging
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      console.log('Resource request:', {
        url,
        type: request.resourceType(),
        headers: request.headers()
      });
      request.continue();
    });

    // Get the current URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    // Add font loading directly to the page
    await page.evaluate(async (fonts) => {
      const fontFaces = [
        {
          family: 'Gotham',
          weight: 'normal',
          source: `data:font/opentype;base64,${fonts.normal}`
        },
        {
          family: 'Gotham',
          weight: 'bold',
          source: `data:font/opentype;base64,${fonts.bold}`
        }
      ];

      const loadedFonts = await Promise.all(fontFaces.map(async (font) => {
        try {
          const fontFace = new FontFace(font.family, `url(${font.source})`, { weight: font.weight });
          const loadedFont = await fontFace.load();
          document.fonts.add(loadedFont);
          console.log(`Font loaded successfully: ${font.family} ${font.weight}`);
          return loadedFont;
        } catch (error) {
          console.error(`Failed to load font: ${font.family} ${font.weight}`, error);
          throw error;
        }
      }));

      // Wait for all fonts to be ready
      await document.fonts.ready;

      // Verify fonts are loaded
      const normalLoaded = document.fonts.check('normal 12px Gotham');
      const boldLoaded = document.fonts.check('bold 12px Gotham');

      console.log('Font load status:', { normalLoaded, boldLoaded });

      if (!normalLoaded || !boldLoaded) {
        throw new Error(`Fonts failed to load: Normal: ${normalLoaded}, Bold: ${boldLoaded}`);
      }

      return true;
    }, fontBase64);

    // Set the template content with a longer timeout
    await page.setContent(template, {
      waitUntil: ['domcontentloaded', 'networkidle0', 'load'],
      timeout: 60000
    });

    // Set proper encoding for Japanese characters only when Japanese is selected
    if (options.language === 'ja') {
      await page.evaluate(() => {
        const meta = document.createElement('meta');
        meta.setAttribute('charset', 'UTF-8');
        document.head.appendChild(meta);
        console.log('Added UTF-8 charset meta tag for Japanese content');
      });
    }

    // Inject content into the existing structure
    await page.evaluate(({ questions, answers, options, title, description }: {
      questions: Question[];
      answers: Record<string, { summary: string; summaryHtml: string; details: string; detailsHtml: string }>;
      options: ExportOptions;
      title: string;
      description: string;
    }) => {
      // Helper to safely get element
      const getElement = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) {
          console.error(`Element not found: ${selector}`);
        }
        return element;
      };
      
      //Setup title
      const titleElement = getElement('#title');
      if (titleElement) {
        titleElement.textContent = title;
      }

      //Setup description
      const descriptionElement = getElement('#description');
      if (descriptionElement) {
        descriptionElement.textContent = description;
      }

      // Handle table of contents
      if (options.includeTableOfContents) {
        const tocContainer = getElement('#tableOfContents');
        if (tocContainer) {
          (tocContainer as HTMLElement).style.display = 'block';
          
          // Group questions by category
          const questionsByCategory = questions.reduce<Record<string, Question[]>>((acc, question) => {
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
        questions.forEach(({ id, question, description }) => {
          const answer = answers[id];
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

            if (answer.details && options.isDetailedView) { 
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
      if (options.includeAppendices) {
        const appendicesContainer = getElement('#appendices');
        if (appendicesContainer) {
          (appendicesContainer as HTMLElement).style.display = 'block';
        }
      }
      
    }, { questions, answers: processedAnswers, options, title, description });

    // Handle logo
    await page.evaluate(async (logoData: { defaultLogo: string; customLogo?: string }) => {
      return new Promise((resolve, reject) => {
        const logoElement = document.querySelector('#logo') as HTMLImageElement;
        if (!logoElement) {
          console.warn('Logo element not found in template');
          resolve(undefined);
          return;
        }

        // Setup handlers before setting src
        logoElement.onerror = (e) => {
          console.error('Logo failed to load:', e);
          // Fall back to default logo if custom logo fails
          if (logoData.customLogo && logoElement.src !== logoData.defaultLogo) {
            console.log('Falling back to default logo');
            logoElement.src = logoData.defaultLogo;
          } else {
            reject(new Error('Both custom and default logos failed to load'));
          }
        };

        logoElement.onload = () => {
          console.log('Logo loaded successfully');
          resolve(undefined);
        };

        // Set initial src
        try {
          logoElement.src = logoData.customLogo || logoData.defaultLogo;
          
          // If image is already complete, resolve immediately
          if (logoElement.complete) {
            console.log('Logo was already loaded');
            resolve(undefined);
          }
        } catch (error) {
          reject(new Error(`Failed to set logo src: ${error.message}`));
        }
      });
    }, { 
      defaultLogo: defaultLogoBase64,
      customLogo: validatedLogo
    });

    // Add a small delay to ensure the logo is rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add generation date
    await page.evaluate(() => {
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

    // Additional wait to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate PDF with proper font settings
    const pdfBuffer = await page.pdf({
      format: 'a4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 10px; text-align: center; color: #666;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
      preferCSSPageSize: true,
      omitBackground: false,
      timeout: 60000
    });

    await browser.close();

    // Convert buffer to Uint8Array for proper encoding handling
    const uint8Array = new Uint8Array(pdfBuffer);
    
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${`${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}.pdf` 
        }"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    return NextResponse.json({ 
      error: error.message,
      details: {
        errorType: error.name,
        errorCause: error.cause
      }
    }, { status: 500 });
  }
} 
