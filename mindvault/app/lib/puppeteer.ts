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

    // Load required libraries for charts
    const rechartsScript = `
      <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
      <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
      <script src="https://unpkg.com/recharts@2.1.9/umd/Recharts.min.js"></script>
    `;
    
    // Add Recharts scripts to the HTML
    html = html.replace('</head>', `${rechartsScript}</head>`);

    // Set content and wait for everything to load
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'load', 'domcontentloaded'],
      timeout: 30000
    });

    // Wait for MathJax script to load (if present)
    try {
      await page.waitForSelector('#MathJax-script', { timeout: 5000 });
    } catch (error) {
      console.log('MathJax script not found:', error);
    }

    // Check for chart containers
    let chartContainersCount = 0;
    try {
      const chartContainers = await page.$$('.chart-container');
      chartContainersCount = chartContainers.length;
    } catch (error) {
      console.log('Error checking for chart containers:', error);
    }

    console.log(`Found ${chartContainersCount} chart containers`);

    if (chartContainersCount > 0) {
      // Add a flag to the page to signal when charts are done rendering
      await page.addScriptTag({
        content: `
          // Function to check if charts are rendered
          function checkChartsRendered() {
            const containers = document.querySelectorAll('.chart-container');
            let allRendered = true;
            
            containers.forEach(container => {
              if (!container.querySelector('svg')) {
                allRendered = false;
              }
            });
            
            if (allRendered) {
              document.body.setAttribute('data-charts-rendered', 'true');
              console.log('All charts rendered successfully');
            } else {
              setTimeout(checkChartsRendered, 1000);
            }
          }
          
          // Start checking after everything is loaded
          window.addEventListener('load', () => {
            // Give initial time for React to initialize
            setTimeout(checkChartsRendered, 2000);
          });
          
          // Also start checking immediately (in case load already fired)
          setTimeout(checkChartsRendered, 2000);
        `
      });
      
      // Wait for the data attribute to be set (or timeout after 10 seconds)
      try {
        await page.waitForSelector('body[data-charts-rendered="true"]', { timeout: 10000 });
        console.log('Charts rendering completed successfully');
      } catch (error) {
        console.log('Timed out waiting for charts to render. Continuing with PDF generation.');
      }
      
      // Additional wait to ensure everything is fully rendered
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      // No charts, just wait for standard content
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

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