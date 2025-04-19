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

// Import Crawlee and related dependencies
import { PlaywrightCrawler, Configuration, log as crawleeLogger } from 'crawlee'; // Import Configuration
// Import the specific storage client
// import { MemoryStorageClient } from '@crawlee/memory-storage'; // Use this for Crawlee v3.8+ - REMOVED
// If using older Crawlee (e.g., v3.0-v3.7), you might need:
import { MemoryStorage } from '@crawlee/memory-storage'; // Use this import
import chromium from 'chrome-aws-lambda'; // Keep for executable path potentially

// Remove Puppeteer specific imports and setup
// import puppeteer from 'puppeteer-extra'; // REMOVED
// import StealthPlugin from 'puppeteer-extra-plugin-stealth'; // REMOVED
// puppeteer.use(StealthPlugin()); // REMOVED

admin.initializeApp();
const db = admin.firestore();

// --- Scraper Function (Refactored for Crawlee) ---
async function scrapeWebsiteForPromotion(url) {
  let percentageChance = 0; // Store result here
  logger.info(`Starting Crawlee scrape for: ${url}`); // Use Firebase logger for function-level logs

  try {
    // Determine if running in the emulator
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

    let executablePath = undefined;
    let launchArgs = undefined;
    let headlessMode = true; // Default to true

    if (!isEmulator) {
        // Deployed environment: Use chrome-aws-lambda
        logger.info("Running in deployed environment, using chrome-aws-lambda.");
        executablePath = await chromium.executablePath;
        launchArgs = chromium.args;
        headlessMode = chromium.headless; // Use headless setting from chrome-aws-lambda

        if (!executablePath) {
            logger.error("Chromium executable path not found via chrome-aws-lambda in deployed environment!");
            throw new Error("Chromium executable path not found for deployed function.");
        }
        logger.info(`Using chromium.executablePath: ${executablePath}`);

    } else {
        // Local emulator environment: Use Playwright's default browser installed via 'npx playwright install'
        logger.info("Running in emulator, using default Playwright browser installation.");
        // executablePath and launchArgs remain undefined
    }

    // Configure Crawlee to use in-memory storage instead of file system
    // This Configuration instance will be used implicitly by the crawler created below
    const config = new Configuration({
        // Explicitly set the storage client to use memory
        // storageClient: new MemoryStorageClient(), // For Crawlee v3.8+ - REMOVED
        // If using older Crawlee, use: new MemoryStorage(),
        storageClient: new MemoryStorage(), // Use this instantiation
        persistStorage: false, // Keep this as well for clarity/belt-and-suspenders
    });


    const crawler = new PlaywrightCrawler({
        // Pass the configuration with in-memory storage settings - REMOVED THIS LINE
        // configuration: config,
        launchContext: {
            // Pass options to Playwright launch via launchOptions
            launchOptions: {
                executablePath: executablePath, // Will be undefined in emulator, using Playwright's default
                args: launchArgs,             // Will be undefined in emulator
                headless: headlessMode,       // Set based on environment
                // Consider adding ignoreHTTPSErrors if needed:
                // ignoreHTTPSErrors: true,
            }
        },
        // Disable session pool persistence to avoid lock file issues in emulator/serverless
        useSessionPool: false,
        persistCookiesPerSession: false,
        minConcurrency: 1, // Process one URL at a time
        maxConcurrency: 1,
        maxRequestsPerCrawl: 1, // Only process the single URL provided
        requestHandlerTimeoutSecs: 120, // Increase timeout for request handling phase

        async requestHandler({ page, request, log }) {
            log.info(`Processing ${request.url}...`); // Use Crawlee's log inside handler

            // Navigation is handled by Crawlee before requestHandler runs for the initial URL
            // Wait for body and additional time
            await page.waitForSelector('body', { timeout: 30000 });
            log.info(`Body element found for ${request.url}. Waiting additional time...`);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            log.info(`Additional wait finished for ${request.url}. Getting content...`);

            const html = await page.content();

            const promoKeywords = ['sale', 'offer', 'discount', 'promotion', 'save', 'deal', 'promo', 'clearance'];
            const lowerCaseHtml = html.toLowerCase();
            const foundKeywords = new Set();

            promoKeywords.forEach(keyword => {
                if (lowerCaseHtml.includes(keyword)) {
                    foundKeywords.add(keyword);
                }
            });

            // Update the outer scope variable
            percentageChance = (foundKeywords.size / promoKeywords.length) * 100;

            if (foundKeywords.size > 0) {
                log.info(`Found keywords: ${[...foundKeywords].join(', ')}`);
            } else {
                log.info(`No keywords found.`);
                 // Optional: Log HTML preview for debugging
                const htmlLines = html.split('\n');
                const htmlPreview = htmlLines.slice(0, 5).join('\n');
                log.debug('--- HTML Preview ---', { preview: htmlPreview });
            }

            log.info(`Calculated chance: ${percentageChance.toFixed(2)}%`);
        },

        // Handle navigation errors, etc.
        failedRequestHandler({ request, log, error }) { // Added error parameter
            log.error(`Request ${request.url} failed. Error: ${error?.message || 'Unknown error'}`);
            // percentageChance remains 0 (default)
        },
    });

    await crawler.run([url]);
    logger.info(`Crawlee finished for: ${url}. Final chance: ${percentageChance.toFixed(2)}%`); // Use Firebase logger

  } catch (error) {
    // Catch errors during crawler setup or run
    const errorMessage = error.cause?.message || error.message; // Get nested error message if available
    logger.error(`Error running Crawlee for ${url}:`, errorMessage, { url: url, error: error }); // Use Firebase logger
    percentageChance = 0; // Ensure 0% on crawler setup/run error
  }

  // Return the value captured by the requestHandler (or 0 on error)
  return percentageChance;
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
        timeoutSeconds: 540, // Increased timeout (max for v2 is 540s/9min for HTTP)
        memory: '2GiB',      // Increased memory (2GiB recommended for Puppeteer/Playwright)
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
              // --- Call the actual scraper (now using Crawlee) ---
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
              // Catch errors specifically from the scrapeWebsiteForPromotion call or Firestore write
              logger.error(`Error processing or saving result for tracker ${trackerId}:`, error, { trackerId: trackerId }); // Use logger
              // Log error to the "sales" collection (optional)
              try {
                  await resultsRef.add({
                      trackerRef: doc.ref,
                      result: null, // Indicate failure
                      error: `Processing/Saving Error: ${error.message || 'Unknown error'}`, // Add context
                      date: admin.firestore.Timestamp.now()
                  });
              } catch (logError) {
                  logger.error(`Failed to log processing error to sales collection for tracker ${trackerId}:`, logError, { trackerId: trackerId }); // Use logger
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
