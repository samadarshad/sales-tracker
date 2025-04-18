/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https"; // Example ES6 import
 * import {onDocumentWritten} from "firebase-functions/v2/firestore"; // Example ES6 import
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Use v2 modular imports
import {onRequest} from "firebase-functions/v2/https"; // Use only v2 onRequest
import * as logger from "firebase-functions/logger";
// Remove the general v1/v2 import if only using specific triggers
// import * as functions from "firebase-functions";
import admin from "firebase-admin"; // Use default import for admin

// Import Puppeteer dependencies
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

admin.initializeApp();
const db = admin.firestore();

// --- Scraper Function (adapted from scraper.js) ---
// Takes a URL and returns a promise resolving to the promotion chance percentage
async function scrapeWebsiteForPromotion(url) {
  let browser = null;
  logger.info(`Starting scrape for: ${url}`);
  try {
    // Launch browser - Added args for Cloud Functions environment
    browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });

    logger.info(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 }); // 60s timeout
    logger.info(`Navigation complete for ${url}. Waiting for body...`);
    await page.waitForSelector('body', { timeout: 30000 }); // Wait up to 30s for body
    logger.info(`Body element found for ${url}. Waiting additional time...`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    logger.info(`Additional wait finished for ${url}. Getting content...`);

    const html = await page.content();
    // Optional: Log HTML preview for debugging
    // const htmlLines = html.split('\n');
    // const htmlPreview = htmlLines.slice(0, 5).join('\n');
    // logger.debug('--- HTML Preview ---', { url: url, preview: htmlPreview });

    const promoKeywords = ['sale', 'offer', 'discount', 'promotion', 'save', 'deal', 'promo', 'clearance'];
    const lowerCaseHtml = html.toLowerCase();
    const foundKeywords = new Set();

    promoKeywords.forEach(keyword => {
      if (lowerCaseHtml.includes(keyword)) {
        foundKeywords.add(keyword);
      }
    });

    const percentageChance = (foundKeywords.size / promoKeywords.length) * 100;

    if (foundKeywords.size > 0) {
      logger.info(`Found keywords for ${url}: ${[...foundKeywords].join(', ')}`, { url: url });
    } else {
      logger.info(`No keywords found for ${url}.`, { url: url });
    }

    logger.info(`Calculated chance for ${url}: ${percentageChance.toFixed(2)}%`, { url: url });
    return percentageChance;

  } catch (error) {
    logger.error(`Error scraping ${url}:`, error.message, { url: url, error: error });
    return 0; // Return 0% on error
  } finally {
    if (browser) {
      logger.info(`Closing browser for ${url}...`);
      await browser.close();
      logger.info(`Browser closed for ${url}.`);
    }
  }
}
// --- End Scraper Function ---


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// Define helloWorld using v2 onRequest
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// Define dailyTrackerProcessor using v2 onRequest and pass runtime options as the first argument
export const dailyTrackerProcessor = onRequest(
    {
        timeoutSeconds: 300, // Example: 5 minutes
        memory: '1GB'       // Example: 1GB (adjust as needed, options: 128MiB, 256MiB, 512MiB, 1GiB, 2GiB, 4GiB, 8GiB)
        // region: 'us-central1' // Optional: specify region if needed
    },
    async (request, response) => {
        logger.info("Starting daily tracker processing job on request."); // Use logger

        const trackersRef = db.collection("trackers");
        const resultsRef = db.collection("sales");
        const snapshot = await trackersRef.get();

        if (snapshot.empty) {
          logger.info("No trackers found to process."); // Use logger
          response.status(200).send("No trackers found to process.");
          return;
        }

        const processingPromises = [];

        snapshot.forEach((doc) => {
          const trackerId = doc.id;
          const trackerData = doc.data();
          logger.info(`Processing tracker: ${trackerId}`, { trackerId: trackerId }); // Use logger

          // Ensure the tracker has a URL
          if (!trackerData.websiteUrl) {
              logger.warn(`Tracker ${trackerId} is missing websiteUrl field. Skipping.`, { trackerId: trackerId });
              return; // Skip this tracker if no URL
          }

          const processPromise = (async () => {
            let calculatedPercentage = 0; // Default value
            try {
              // --- Call the actual scraper ---
              calculatedPercentage = await scrapeWebsiteForPromotion(trackerData.websiteUrl);
              logger.info(`Scraper returned ${calculatedPercentage.toFixed(2)}% for ${trackerId}`, { trackerId: trackerId });
              // --- End scraper call ---

              // Create a new document in the "sales" collection
              await resultsRef.add({
                trackerRef: doc.ref,
                result: calculatedPercentage, // Use the result from the scraper
                date: admin.firestore.Timestamp.now()
              });

              logger.info(`Successfully processed and saved result for tracker: ${trackerId}`, { trackerId: trackerId }); // Use logger

            } catch (error) {
              // Error during scraping is handled within scrapeWebsiteForPromotion
              // This catch block handles errors during Firestore write or other unexpected issues
              logger.error(`Error saving result for tracker ${trackerId}:`, error, { trackerId: trackerId }); // Use logger
              // Log error to the "sales" collection (optional)
              try {
                  await resultsRef.add({
                      trackerRef: doc.ref,
                      result: null, // Indicate failure
                      error: `Saving Error: ${error.message || 'Unknown error'}`, // Add context
                      date: admin.firestore.Timestamp.now()
                  });
              } catch (logError) {
                  logger.error(`Failed to log saving error to sales collection for tracker ${trackerId}:`, logError, { trackerId: trackerId }); // Use logger
              }
            }
          })();
          processingPromises.push(processPromise);
        });

        // Wait for all processing tasks (including saving results) to complete
        try {
            await Promise.all(processingPromises);
            logger.info("Finished daily tracker processing job."); // Use logger
            response.status(200).send("Tracker processing finished successfully.");
        } catch (error) {
            logger.error("Error waiting for all tracker processing promises:", error); // Use logger
            response.status(500).send("Tracker processing failed overall.");
        }
});

// --- Helper functions (like fetchWebsiteData) would go here ---
// async function fetchWebsiteData(url: string): Promise<any> {
//   // Implementation to fetch data from the website
// }
