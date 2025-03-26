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
        '--disable-features=IsolateOrigins,site-per-process'
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
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
  }
}

export async function generatePDF(html: string) {
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    
    // Track failed resources
    const failedResources: string[] = [];
    
    // Listen for console messages
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Listen for failed requests
    page.on('requestfailed', request => {
      const url = request.url();
      console.log(`Failed to load resource: ${url}`);
      console.log(`Error: ${request.failure()?.errorText}`);
      failedResources.push(url);
    });

    // Set viewport for A4 size
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    // Enable JavaScript and CSS
    await page.setJavaScriptEnabled(true);

    // Set content and wait for everything to load
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
      timeout: 30000
    });

    // Wait for MathJax script to load
    await page.waitForSelector('#MathJax-script', { timeout: 5000 })
      .catch(error => console.log('MathJax script not found:', error));

    // Additional wait to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Log if any resources failed to load
    if (failedResources.length > 0) {
      console.log('Failed to load the following resources:');
      failedResources.forEach(url => console.log(` - ${url}`));
    }

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
      omitBackground: false,
      timeout: 60000
    });
    return pdf;
  } finally {
    await browser.close();
  }
} 