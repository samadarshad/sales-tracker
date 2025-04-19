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
import axios from 'axios'; // Import axios

// Remove Crawlee and related dependencies if no longer needed elsewhere
// import { PlaywrightCrawler, Configuration, log as crawleeLogger, ProxyConfiguration } from 'crawlee'; // REMOVED
// import { MemoryStorage } from '@crawlee/memory-storage'; // REMOVED
// import chromium from 'chrome-aws-lambda'; // REMOVED

admin.initializeApp();
const db = admin.firestore();

// --- Scraper Function (Refactored for Oxylabs Web Scraper API) ---
async function scrapeWebsiteForPromotion(targetUrl) {
  let percentageChance = 0; // Store result here

  // Oxylabs API Credentials and Endpoint
  const OXYLABS_USERNAME = 'sabaska_9rF68';
  const OXYLABS_PASSWORD = 'Dfgdfgdfg123='; // Consider moving credentials to environment variables/secrets
  const OXYLABS_API_ENDPOINT = 'https://realtime.oxylabs.io/v1/queries'; // Standard endpoint, verify if different

  try {
    const requestPayload = {
      source: 'universal', // Use 'universal' for general web pages
      url: targetUrl,
      render: 'html', // Request JavaScript rendering if needed, otherwise remove or set to null
      // Add other parameters as needed, e.g., geo-location, user_agent_type
      // 'geo_location': 'United States',
      // 'user_agent_type': 'desktop'
    };

    const response = await axios.post(
      OXYLABS_API_ENDPOINT,
      requestPayload,
      {
        auth: {
          username: OXYLABS_USERNAME,
          password: OXYLABS_PASSWORD,
        },
        timeout: 120000, // Set timeout for the API request (e.g., 120 seconds)
      }
    );

    // Extract HTML content - structure depends on API response format
    // Assuming the HTML is in response.data.results[0].content based on typical Oxylabs structure
    if (response.data && response.data.results && response.data.results.length > 0 && response.data.results[0].content) {
      const html = response.data.results[0].content;

      const promoKeywords = ['sale', 'offer', 'discount', 'promotion', 'save', 'deal', 'promo', 'clearance'];
      const lowerCaseHtml = html.toLowerCase();
      const foundKeywords = new Set();

      promoKeywords.forEach(keyword => {
        if (lowerCaseHtml.includes(keyword)) {
          foundKeywords.add(keyword);
        }
      });

      percentageChance = (foundKeywords.size / promoKeywords.length) * 100;

      logger.info(`Final chance for ${targetUrl}: ${percentageChance.toFixed(2)}%`);

    } else {
      percentageChance = 0; // Treat as failure if content is missing
      logger.info(`Final chance for ${targetUrl}: ${percentageChance.toFixed(2)}% (API content missing)`);
    }

  } catch (error) {
    percentageChance = 0; // Ensure 0% on error
    logger.info(`Final chance for ${targetUrl}: ${percentageChance.toFixed(2)}% (Error occurred)`);
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
        timeoutSeconds: 300, // Timeout can likely be reduced as API call is faster than browser launch
        memory: '512MiB',    // Memory can likely be reduced significantly
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
              // --- Call the actual scraper (now using Oxylabs API) ---
              calculatedPercentage = await scrapeWebsiteForPromotion(trackerData.websiteUrl);

              // Create a new document in the "sales" collection
              await resultsRef.add({
                trackerRef: doc.ref,
                result: calculatedPercentage, // Use the result from the scraper
                date: admin.firestore.Timestamp.now()
              });

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
