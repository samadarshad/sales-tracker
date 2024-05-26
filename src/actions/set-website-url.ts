"use server";
import { z } from "zod";
import isUrl from "is-url";
import puppeteer from "puppeteer";
import { uploadFile } from "@/services/s3";
const IMAGES_BASE_URL = process.env.IMAGES_BASE_URL;

if (!IMAGES_BASE_URL) {
  throw new Error("Missing images base URL");
}

const setWebsiteUrlSchema = z.object({
  websiteUrl: z.string().url(),
});

interface SetWebsiteUrlFormState {
  errors: {
    websiteUrl?: string[];
  };
  previewUrl?: string;
}

async function takeScreenshot(url: string, screenshotPath: string) {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );
  await page.goto(url, {
    waitUntil: "networkidle2",
  });
  await page.screenshot({
    path: screenshotPath,
  });
  await browser.close();
}

export async function setWebsiteUrl(
  formState: SetWebsiteUrlFormState,
  formData: FormData
): Promise<SetWebsiteUrlFormState> {
  const websiteUrl = formData.get("website-url")?.toString();

  if (websiteUrl == null || !isUrl(websiteUrl)) {
    return {
      errors: { websiteUrl: ["Not a valid URL"] },
    };
  }

  const screenshotPath = "test.png";

  await takeScreenshot(websiteUrl, screenshotPath);
  const previewUrl = await uploadFile(screenshotPath, screenshotPath);

  if (formData.get("website-url")) {
    await new Promise((callback) => setTimeout(callback, 250));
    return {
      errors: {},
      // previewUrl: `${IMAGES_BASE_URL}/hn.png`,
      // previewUrl: "/webpage-preview.png",
      previewUrl,
    };
  }

  return {
    errors: {},
  };
}
