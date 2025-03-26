import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';
import puppeteer from 'puppeteer';

export async function getBrowser() {
  const isServerless = process.env.NODE_ENV === 'production';
  
  if (isServerless) {
    const executablePath = await chromium.executablePath();
    return puppeteerCore.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
        '--enable-font-antialiasing',
        '--force-color-profile=srgb',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--enable-gpu',
        '--ignore-certificate-errors'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });
  } else {
    // Local development
    return puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
        '--enable-font-antialiasing',
        '--force-color-profile=srgb',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--enable-gpu',
        '--ignore-certificate-errors'
      ]
    });
  }
}

export async function generatePDF(html: string) {
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    
    // Configure logging
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    page.on('pageerror', err => console.error('Page error:', err.message));
    
    // Configure viewport for A4 size
    await page.setViewport({
      width: 794, // A4 width at 96 DPI
      height: 1123, // A4 height at 96 DPI
      deviceScaleFactor: 2,
    });

    // Enable JavaScript
    await page.setJavaScriptEnabled(true);
    
    // Add helper script to handle image loading
    const htmlWithHelpers = html.replace('</body>', `
      <script>
        // Basic error handler
        window.addEventListener('error', function(event) {
          console.error('Script error:', event.error || event.message);
        });
        
        // Add classes to all SVG images for better rendering
        document.addEventListener('DOMContentLoaded', () => {
          const images = document.querySelectorAll('img[src^="data:image/svg"]');
          images.forEach(img => {
            img.classList.add('svg-image');
            img.style.maxWidth = '100%';
          });
        });
      </script>
      </body>
    `);
    
    console.log('Setting page content...');
    
    // Load the content with a longer timeout
    await page.setContent(htmlWithHelpers, {
      waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
      timeout: 60000
    });
    
    console.log('Content loaded successfully');
    
    // Add a delay to ensure all content is rendered properly
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Generating PDF...');
    
    // Generate the PDF
    const pdf = await page.pdf({
      format: 'A4',
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
      timeout: 90000
    });
    
    console.log(`PDF generated successfully: ${pdf.byteLength} bytes`);
    
    return pdf;
    
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
} 