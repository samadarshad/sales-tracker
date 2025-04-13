// Use puppeteer-extra and the stealth plugin
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const url = 'https://www.udemy.com'; // Replace

// Modify function to return a percentage (Promise<number>)
async function scrapeDynamicData() {
  let browser = null; // Declare browser outside try block
  try {
    // 1. Launch a headless browser instance using puppeteer-extra
    console.log('Launching browser with stealth plugin...');
    browser = await puppeteer.launch({ headless: true }); // Keep headless true for production, false for debugging
    const page = await browser.newPage();

    // --- Set User Agent and Viewport ---
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });
    // --- End Set User Agent and Viewport ---

    // 2. Navigate to the page and wait for loading
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 }); // Increased timeout to 60s
    console.log('Page navigation complete (networkidle0). Waiting for body element...');

    // Wait specifically for the body tag to ensure basic DOM is ready
    await page.waitForSelector('body', { timeout: 30000 }); // Wait up to 30s for body
    console.log('Body element found. Page should be loaded.');

    // --- Alternative/Additional Waits (Uncomment if needed) ---
    // Option A: Wait for a specific element known to load late
    // try {
    //   await page.waitForSelector('#specific-late-loading-element', { timeout: 30000 });
    //   console.log('Specific element found.');
    // } catch (e) {
    //   console.warn('Specific element did not appear within timeout.');
    // }
    // Option B: Wait for a fixed amount of time (less reliable)
    console.log('Waiting for an additional 10 seconds...'); // Update log message
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    console.log('Additional wait finished.');
    // --- End Alternative Waits ---

    // --- Get HTML ---
    console.log('Getting page content...');
    const html = await page.content();
    // --- Log HTML Preview ---
    const htmlLines = html.split('\n');
    const htmlPreview = htmlLines.slice(0, 10).join('\n'); // Get first 10 lines
    console.log('--- HTML Preview ---');
    console.log(htmlPreview);
    console.log('--- End HTML Preview ---');
    // --- End Log HTML Preview ---
    // --- End Get HTML ---

    // --- Search for promotional keywords and calculate percentage ---
    const promoKeywords = ['sale', 'offer', 'discount', 'promotion', 'save', 'deal', 'promo', 'clearance'];
    const lowerCaseHtml = html.toLowerCase(); // For case-insensitive search
    const foundKeywords = new Set(); // Use a Set to store unique found keywords

    promoKeywords.forEach(keyword => {
      if (lowerCaseHtml.includes(keyword)) {
        foundKeywords.add(keyword);
      }
    });

    // Calculate percentage based on unique keywords found
    const percentageChance = (foundKeywords.size / promoKeywords.length) * 100;

    if (foundKeywords.size > 0) {
      console.log(`Found promotional keywords: ${[...foundKeywords].join(', ')}`);
      console.log(`Calculated chance of promotion: ${percentageChance.toFixed(2)}%`);
    } else {
      console.log('No promotional keywords found.');
    }
    // --- End search ---

    return percentageChance; // Return the calculated percentage

  } catch (error) {
    console.error(`Error scraping ${url} with Puppeteer:`, error.message);
    // Log more details if available
    if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Headers:', error.response.headers);
    }
    return 0; // Return 0% in case of error
  } finally {
    // 4. Close the browser
    if (browser) {
      await browser.close();
    }
  }
}

// Update function call to handle the returned percentage
(async () => {
  const promoChance = await scrapeDynamicData();
  console.log(`Overall promotion chance: ${promoChance.toFixed(2)}%`);
})();