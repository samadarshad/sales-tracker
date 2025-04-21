/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https"; // Example ES6 import
 * import {onDocumentWritten} from "firebase-functions/v2/firestore"; // Example ES6 import
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Use v2 modular imports
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
// import * as functions from "firebase-functions";
import admin from "firebase-admin";

// Import Crawlee and related dependencies
import { PlaywrightCrawler, Configuration, log as crawleeLogger } from 'crawlee';
import chromium from 'chrome-aws-lambda';

admin.initializeApp();
const db = admin.firestore();


// Define dailyTrackerProcessor using v2 onSchedule
export const dailyTrackerProcessor = onSchedule(
    {
        schedule: "55 8 * * *", // Run daily at 8:55 AM
        timeZone: "UTC", // Or your desired timezone e.g., "Europe/London", "America/New_York"
        timeoutSeconds: 540, // Max for v2 HTTP functions (keep for now, adjust if needed)
        memory: '4GiB',      // Increased memory for Playwright/Crawlee
        // region: 'us-central1'
    },
    async (event) => { // Changed signature: removed request, response
        logger.info("Starting daily tracker processing job on schedule."); // Updated log message

        const trackersRef = db.collection("trackers");
        const resultsRef = db.collection("sales");
        const snapshot = await trackersRef.get();

        if (snapshot.empty) {
          logger.info("No trackers found to process.");
          return; // Exit function
        }

        // --- Prepare URLs and Tracker Info ---
        const trackerInfos = [];
        snapshot.forEach((doc) => {
          const trackerData = doc.data();
          if (trackerData.websiteUrl) {
            trackerInfos.push({
              url: trackerData.websiteUrl,
              docRef: doc.ref,
              trackerId: doc.id,
            });
          } else {
            logger.warn(`Tracker ${doc.id} is missing websiteUrl field. Skipping.`, { trackerId: doc.id });
          }
        });

        if (trackerInfos.length === 0) {
            logger.info("No valid trackers with URLs found to process.");
            return; // Exit function
        }

        const urlsToCrawl = trackerInfos.map(info => info.url);
        const resultsMap = new Map(); // To store results keyed by URL

        // --- Configure and Run Crawler ---
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

            const config = new Configuration({
                persistStorage: false,
            });

            const crawler = new PlaywrightCrawler({
                launchContext: {
                    launchOptions: {
                        executablePath: executablePath,
                        args: launchArgs,
                        headless: headlessMode,
                    }
                },
                useSessionPool: false,
                persistCookiesPerSession: false,
                minConcurrency: 1,
                maxConcurrency: 1, // Adjust if needed and resources allow
                // maxRequestsPerCrawl: urlsToCrawl.length, // Not needed when passing array to run()
                requestHandlerTimeoutSecs: 120,

                async requestHandler({ page, request, log }) {
                    let percentageChance = 0;
                    let htmlPreviewForLog = '';
                    try {
                        await page.waitForSelector('body', { timeout: 30000 });
                        await new Promise(resolve => setTimeout(resolve, 10000));

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

                        // Store successful result
                        resultsMap.set(request.url, { percentage: percentageChance, error: null, htmlPreview: htmlPreviewForLog });

                        // Final Log per URL
                        if (percentageChance === 0 && htmlPreviewForLog) {
                            logger.info(`Final chance for ${request.url}: ${percentageChance.toFixed(2)}%. HTML Preview:\n${htmlPreviewForLog}`);
                        } else {
                            logger.info(`Final chance for ${request.url}: ${percentageChance.toFixed(2)}%`);
                        }

                    } catch (pageError) {
                        // Handle errors during page processing
                        logger.error(`Error processing page ${request.url}:`, pageError);
                        resultsMap.set(request.url, { percentage: 0, error: `Page Error: ${pageError.message || 'Unknown page error'}`, htmlPreview: '' });
                        logger.info(`Final chance for ${request.url}: 0.00% (Page Error)`);
                    }
                },

                failedRequestHandler({ request, log, error }) {
                    // Store failure result
                    logger.error(`Request failed for ${request.url}:`, error);
                    resultsMap.set(request.url, { percentage: 0, error: `Request Error: ${error?.message || 'Unknown request error'}`, htmlPreview: '' });
                    logger.info(`Final chance for ${request.url}: 0.00% (Request Error)`);
                },
            }, config); // Pass config as second argument

            logger.info(`Starting crawl for ${urlsToCrawl.length} URLs.`);
            await crawler.run(urlsToCrawl);
            logger.info("Crawling finished.");

        } catch (crawlSetupError) {
            logger.error("Error setting up or running the crawler:", crawlSetupError);
            // If crawler setup fails, mark all as errors
            trackerInfos.forEach(info => {
                if (!resultsMap.has(info.url)) {
                    resultsMap.set(info.url, { percentage: 0, error: `Crawler Setup Error: ${crawlSetupError.message || 'Unknown setup error'}`, htmlPreview: '' });
                }
            });
        }

        // --- Save Results to Firestore ---
        const firestoreWritePromises = [];
        logger.info("Saving results to Firestore...");

        trackerInfos.forEach((info) => {
            const resultData = resultsMap.get(info.url);
            let dataToSave;

            if (resultData) {
                dataToSave = {
                    trackerRef: info.docRef,
                    result: resultData.percentage,
                    error: resultData.error || null, // Store error message if present
                    date: admin.firestore.Timestamp.now()
                };
            } else {
                // Should not happen if setup error handling is correct, but as a fallback
                logger.warn(`No result found in map for ${info.url}. Marking as error.`);
                dataToSave = {
                    trackerRef: info.docRef,
                    result: null,
                    error: 'Processing Error: Result missing after crawl.',
                    date: admin.firestore.Timestamp.now()
                };
            }

            firestoreWritePromises.push(
                resultsRef.add(dataToSave).catch(dbError => {
                    logger.error(`Failed to save result for tracker ${info.trackerId} (${info.url}) to Firestore:`, dbError);
                    // Optionally, try logging the error to a separate error log in Firestore
                })
            );
        });

        try {
            await Promise.all(firestoreWritePromises);
            logger.info("Finished saving results to Firestore.");
        } catch (error) {
            // Errors during individual writes are caught above, this catches potential Promise.all issues
            logger.error("Error waiting for all Firestore write promises:", error);
        }
});

// --- Helper functions (like fetchWebsiteData) would go here ---
// async function fetchWebsiteData(url: string): Promise<any> {
//   // Implementation to fetch data from the website
// }
