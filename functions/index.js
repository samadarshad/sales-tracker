/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https"; // Example ES6 import
 * import {onDocumentWritten} from "firebase-functions/v2/firestore"; // Example ES6 import
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Use v2 modular imports
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
// import * as functions from "firebase-functions";
import admin from "firebase-admin";

// Import Crawlee and related dependencies
import { PlaywrightCrawler, Configuration, log as crawleeLogger } from 'crawlee';
// If using older Crawlee (e.g., v3.0-v3.7), you might need:
import { MemoryStorage } from '@crawlee/memory-storage';
import chromium from 'chrome-aws-lambda';

admin.initializeApp();
const db = admin.firestore();

// --- Scraper Function (Refactored for Crawlee) ---
async function scrapeWebsiteForPromotion(url) {
  let percentageChance = 0;
  let htmlPreviewForLog = '';

  try {
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

    let executablePath = undefined;
    let launchArgs = undefined;
    let headlessMode = true;

    if (!isEmulator) {
        executablePath = await chromium.executablePath;
        launchArgs = chromium.args;
        headlessMode = chromium.headless;

        if (!executablePath) {
            throw new Error("Chromium executable path not found for deployed function.");
        }
    }

    // Configure Crawlee to use in-memory storage instead of file system
    const config = new Configuration({
        persistStorage: false, // Avoid writing state to disk in serverless environment
    });


    const crawler = new PlaywrightCrawler({
        // configuration: config, // Pass config directly if needed by your Crawlee version
        launchContext: {
            launchOptions: {
                executablePath: executablePath,
                args: launchArgs,
                headless: headlessMode,
                // ignoreHTTPSErrors: true,
            }
        },
        useSessionPool: false, // Avoid lock file issues in serverless
        persistCookiesPerSession: false,
        minConcurrency: 1,
        maxConcurrency: 1,
        maxRequestsPerCrawl: 1,
        requestHandlerTimeoutSecs: 120,

        async requestHandler({ page, request, log }) {
            await page.waitForSelector('body', { timeout: 30000 });
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for dynamic content

            const html = await page.content();

            const promoKeywords = ['sale', 'offer', 'discount', 'promotion', 'save', 'deal', 'promo', 'clearance'];
            const lowerCaseHtml = html.toLowerCase();
            const foundKeywords = new Set();

            promoKeywords.forEach(keyword => {
                if (lowerCaseHtml.includes(keyword)) {
                    foundKeywords.add(keyword);
                }
            });

            percentageChance = (foundKeywords.size / promoKeywords.length) * 100;

            if (percentageChance === 0) {
                const htmlLines = html.split('\n');
                htmlPreviewForLog = htmlLines.slice(0, 10).join('\n');
            }
        },

        failedRequestHandler({ request, log, error }) {
            percentageChance = 0;
        },
    },
    config // Pass config as second argument if needed by your Crawlee version
  );

    await crawler.run([url]);

    // Final Log: Include HTML preview conditionally
    if (percentageChance === 0 && htmlPreviewForLog) {
        logger.info(`Final chance for ${url}: ${percentageChance.toFixed(2)}%. HTML Preview:\n${htmlPreviewForLog}`);
    } else if (percentageChance === 0) {
        logger.info(`Final chance for ${url}: ${percentageChance.toFixed(2)}% (Error or no keywords found)`);
    } else {
        logger.info(`Final chance for ${url}: ${percentageChance.toFixed(2)}%`);
    }


  } catch (error) {
    percentageChance = 0;
    logger.info(`Final chance for ${url}: ${percentageChance.toFixed(2)}% (Error during setup/run)`);
  }

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
        timeoutSeconds: 540, // Max for v2 HTTP functions
        memory: '4GiB',      // Increased memory for Playwright/Crawlee
        // region: 'us-central1'
    },
    async (request, response) => {
        logger.info("Starting daily tracker processing job on request.");

        const trackersRef = db.collection("trackers");
        const resultsRef = db.collection("sales");
        const snapshot = await trackersRef.get();

        if (snapshot.empty) {
          logger.info("No trackers found to process.");
          response.status(200).send("No trackers found to process.");
          return;
        }

        const processingPromises = [];

        snapshot.forEach((doc) => {
          const trackerId = doc.id;
          const trackerData = doc.data();
          logger.info(`Processing tracker: ${trackerId}`, { trackerId: trackerId });

          if (!trackerData.websiteUrl) {
              logger.warn(`Tracker ${trackerId} is missing websiteUrl field. Skipping.`, { trackerId: trackerId });
              return;
          }


          const processPromise = (async () => {
            let calculatedPercentage = 0;
            try {
              calculatedPercentage = await scrapeWebsiteForPromotion(trackerData.websiteUrl);
              // logger.info(`Scraper returned ${calculatedPercentage.toFixed(2)}% for ${trackerId}`, { trackerId: trackerId }); // Logged inside scraper function

              await resultsRef.add({
                trackerRef: doc.ref,
                result: calculatedPercentage,
                date: admin.firestore.Timestamp.now()
              });

            } catch (error) {
              logger.error(`Error processing or saving result for tracker ${trackerId}:`, error, { trackerId: trackerId });
              try {
                  await resultsRef.add({
                      trackerRef: doc.ref,
                      result: null,
                      error: `Processing/Saving Error: ${error.message || 'Unknown error'}`,
                      date: admin.firestore.Timestamp.now()
                  });
              } catch (logError) {
                  logger.error(`Failed to log processing error to sales collection for tracker ${trackerId}:`, logError, { trackerId: trackerId });
              }
            }
          })();
          processingPromises.push(processPromise);
        });

        try {
            await Promise.all(processingPromises);
            logger.info("Finished daily tracker processing job.");
            response.status(200).send("Tracker processing finished successfully.");
        } catch (error) {
            logger.error("Error waiting for all tracker processing promises:", error);
            response.status(500).send("Tracker processing failed overall.");
        }
});

// --- Helper functions (like fetchWebsiteData) would go here ---
// async function fetchWebsiteData(url: string): Promise<any> {
//   // Implementation to fetch data from the website
// }
