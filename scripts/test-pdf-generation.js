// scripts/test-pdf-generation.js
const path = require('path');
const fs = require('fs');

// Use dynamic import for ESM modules
let chromium;
let playwright;

try {
  // Try to use @sparticuz/chromium in production
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    chromium = require('@sparticuz/chromium');
  }
  // Always try to use playwright-core
  playwright = require('playwright-core');
} catch (error) {
  console.warn(
    'Error loading production dependencies, falling back to development:',
    error.message
  );
  // Fall back to regular playwright in development
  playwright = require('playwright');
}

// Configuration
const TEST_OUTPUT_DIR = path.join(__dirname, '../test-output');
const PDF_OUTPUT_PATH = path.join(TEST_OUTPUT_DIR, 'test-report.pdf');

// Create test output directory if it doesn't exist
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  console.log(`Created test output directory: ${TEST_OUTPUT_DIR}`);
}

async function testPdfGeneration() {
  console.log('🚀 Starting PDF generation test...');

  // Log environment information
  console.log('Environment:');
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(
    `- PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: ${process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD || 'not set'}`
  );
  console.log(`- PLAYWRIGHT_BROWSERS_PATH: ${process.env.PLAYWRIGHT_BROWSERS_PATH || 'not set'}`);

  let browser;
  try {
    // Launch browser with appropriate arguments for production vs development
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--single-process',
      ],
    };

    // In production, use @sparticuz/chromium
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
      console.log('🔧 Using production configuration with @sparticuz/chromium');

      if (chromium) {
        // Set the path to the Chromium binary
        const executablePath = await chromium.executablePath();
        console.log(`📁 Chromium executable path: ${executablePath}`);

        // Set environment variables for Chromium
        process.env.CHROME_EXECUTABLE_PATH = executablePath;
        launchOptions.executablePath = executablePath;

        // Add additional arguments for production
        launchOptions.args = [
          ...launchOptions.args,
          ...chromium.args,
          '--disable-extensions',
          '--disable-software-rasterizer',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--no-zygote',
          '--single-process',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
        ];

        console.log('🚀 Launch options:', JSON.stringify(launchOptions, null, 2));
      } else {
        console.warn('⚠️ @sparticuz/chromium not available, falling back to default browser');
      }
    } else {
      console.log('🔧 Using development configuration');
      // In development, use the locally installed Chrome/Chromium
      playwright = require('playwright');
    }

    console.log('🚀 Launching browser...');
    console.log('🚀 Launching browser with options:', JSON.stringify(launchOptions, null, 2));
    browser = await playwright.chromium.launch(launchOptions);
    console.log('✅ Browser launched successfully');

    console.log('🌐 Creating new page...');
    const page = await browser.newPage();

    // Set a reasonable viewport size
    await page.setViewportSize({ width: 1280, height: 800 });

    // Generate a simple HTML page for testing
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test PDF Generation</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c3e50; }
            .content { margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Test PDF Generation</h1>
          <div class="content">
            <p>This is a test PDF generated on ${new Date().toLocaleString()}</p>
            <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
            <p>User Agent: <span id="user-agent"></span></p>
          </div>
          <script>
            document.getElementById('user-agent').textContent = navigator.userAgent;
          </script>
        </body>
      </html>
    `;

    // Set the HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });

    // Wait for any dynamic content to load
    await page.waitForTimeout(1000);

    console.log('📄 Generating PDF...');
    const pdf = await page.pdf({
      path: PDF_OUTPUT_PATH,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    console.log(`✅ PDF generated successfully at: ${PDF_OUTPUT_PATH}`);
    console.log(`📄 PDF size: ${(pdf.length / 1024).toFixed(2)} KB`);

    return { success: true, path: PDF_OUTPUT_PATH, size: pdf.length };
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return { success: false, error: error.message };
  } finally {
    if (browser) {
      await browser.close();
      console.log('👋 Browser closed');
    }
  }
}

// Run the test
if (require.main === module) {
  testPdfGeneration()
    .then(({ success, path, size, error }) => {
      if (success) {
        console.log(`\n🎉 Test completed successfully!`);
        console.log(`📄 PDF saved to: ${path}`);
        console.log(`📏 Size: ${(size / 1024).toFixed(2)} KB`);
      } else {
        console.error(`\n❌ Test failed: ${error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { testPdfGeneration };
