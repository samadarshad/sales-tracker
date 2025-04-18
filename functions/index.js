/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https"; // Example ES6 import
 * import {onDocumentWritten} from "firebase-functions/v2/firestore"; // Example ES6 import
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Use import instead of require
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";
import admin from "firebase-admin"; // Use default import for admin

admin.initializeApp();
const db = admin.firestore();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// Use export const instead of exports.
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// Use export const instead of exports.
export const dailyTrackerProcessor = functions.https.onRequest(async (request, response) => {
    console.log("Starting daily tracker processing job on request.");

    const trackersRef = db.collection("trackers");
    const resultsRef = db.collection("sales"); // Rename collection to "sales"
    // Optionally filter trackers if needed, e.g., only active ones
    // const q = trackersRef.where("active", "==", true);
    const snapshot = await trackersRef.get();

    if (snapshot.empty) {
      console.log("No trackers found to process.");
      response.status(200).send("No trackers found to process."); // Send response
      return; // Return early
    }

    const processingPromises = [];

    snapshot.forEach((doc) => {
      const trackerId = doc.id;
      const trackerData = doc.data();
      console.log(`Processing tracker: ${trackerId}`);

      // --- Add your processing logic here ---
      const processPromise = (async () => {
        try {
          // --- Replace with your actual processing task ---
          // This should eventually call your scraper and get the percentage
          // For now, let's assume a placeholder percentage is calculated
          const placeholderPercentageResult = Math.random() * 100; // Example result
          console.log(`Calculated result for ${trackerId}: ${placeholderPercentageResult.toFixed(2)}%`);
          // --- End of placeholder processing task ---

          // Create a new document in the renamed collection ("sales")
          await resultsRef.add({
            trackerRef: doc.ref, // Store a reference to the original tracker document
            result: placeholderPercentageResult, // Store the calculated percentage
            date: admin.firestore.Timestamp.now() // Store the processing timestamp
          });

          console.log(`Successfully processed and saved result for tracker: ${trackerId}`);

        } catch (error) {
          console.error(`Error processing tracker ${trackerId}:`, error);
          // Decide how to handle errors (e.g., log, maybe add an error field to the result doc)
          // Example: Log error to results collection (optional)
          try {
              // Log error to the renamed collection ("sales")
              await resultsRef.add({
                  trackerRef: doc.ref,
                  result: null, // Indicate failure
                  error: error.message || 'Unknown processing error',
                  date: admin.firestore.Timestamp.now()
              });
          } catch (logError) {
              console.error(`Failed to log error to results collection for tracker ${trackerId}:`, logError);
          }
        }
      })();
      processingPromises.push(processPromise);
      // --- End of processing logic ---
    });

    // Wait for all processing tasks (including saving results) to complete
    try {
        await Promise.all(processingPromises);
        console.log("Finished daily tracker processing job.");
        response.status(200).send("Tracker processing finished successfully."); // Send success response
    } catch (error) {
        console.error("Error during tracker processing:", error);
        response.status(500).send("Tracker processing failed."); // Send error response
    }
});

// --- Helper functions (like fetchWebsiteData) would go here ---
// async function fetchWebsiteData(url: string): Promise<any> {
//   // Implementation to fetch data from the website
// }
