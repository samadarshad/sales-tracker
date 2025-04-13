"use server";
import { z } from "zod";
import isUrl from "is-url";
import puppeteer from "puppeteer";
import { removeFile, uploadFile } from "@/services/s3";
import { db } from "./../firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { revalidatePath } from "next/cache";
import { useAuth } from "@/app/providers";

const setWebsiteUrlSchema = z.object({
  websiteUrl: z.string().url(),
});

interface SetWebsiteUrlFormState {
  errors: {
    websiteUrl?: string[];
    _form?: string[];
  };
  tracker?: any; // Adjust type as needed
}

function getFaviconUrl(inputUrl: string) {
  const parsedUrl = new URL(inputUrl);
  const protocol = parsedUrl.protocol;
  const hostname = parsedUrl.hostname;
  return `${protocol}//${hostname}/favicon.ico`;
}

async function takeScreenshot(url: string, screenshotPath: string) {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );
  await page.goto(url, { waitUntil: "networkidle2" });

  await page.evaluate(() => {
    function xcc_contains(selector: string, text: string | RegExp) {
      var elements = document.querySelectorAll(selector);
      return Array.prototype.filter.call(elements, function (element) {
        return RegExp(text, "i").test(element.textContent.trim());
      });
    }
    var _xcc = xcc_contains(
      "[id*=cookie] a, [class*=cookie] a, [class*=consent] a, [class*=Consent] a,[id*=cookie] button, [class*=cookie] button, [class*=consent] button, [class*=Consent] button",
      "(?:accept|agree|okay|ok)$"
    );
    if (_xcc != null && _xcc.length != 0) {
      _xcc[0].click();
    }
  });

  await page.screenshot({ path: screenshotPath });
  await browser.close();
}

export async function setWebsiteUrl(
  userId: string, // Add userId as the first parameter
  formState: SetWebsiteUrlFormState,
  formData: FormData
): Promise<SetWebsiteUrlFormState> {
  // Ensure userId is provided
  if (!userId) {
    return {
      errors: { _form: ["User not authenticated."] },
    };
  }

  const websiteUrl = setWebsiteUrlSchema
    .safeParse({ websiteUrl: formData.get("website-url") })
    .data?.websiteUrl.toString();

  if (!websiteUrl || !isUrl(websiteUrl)) {
    return {
      errors: { websiteUrl: ["Not a valid URL"] },
    };
  }

  const screenshotPath = `${uuidv4()}.png`;
  await takeScreenshot(websiteUrl, screenshotPath);
  const previewUrl = await uploadFile(screenshotPath, screenshotPath);
  const faviconUrl = getFaviconUrl(websiteUrl);

  const trackersCollection = collection(db, "trackers");
  const trackerRef = await addDoc(trackersCollection, {
    websiteUrl,
    previewUrl,
    authorId: userId, // Use the userId parameter here
    faviconUrl,
    aiPrompt: "",
    temporary: true,
  });

  fs.unlinkSync(screenshotPath);

  return {
    errors: {},
    tracker: { id: trackerRef.id, websiteUrl, previewUrl, faviconUrl, temporary: true },
  };
}

export async function saveTracker(tracker: any): Promise<any> {
  const trackerDoc = doc(db, "trackers", tracker.id);
  await updateDoc(trackerDoc, { temporary: false });
  revalidatePath("/");
  return { ...tracker, temporary: false };
}

export async function removeTracker(tracker: any): Promise<any> {
  await removeFile(tracker.previewUrl);
  const trackerDoc = doc(db, "trackers", tracker.id);
  await deleteDoc(trackerDoc);
  return tracker;
}
