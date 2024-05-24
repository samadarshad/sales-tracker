"use server";
import { z } from "zod";
import isUrl from "is-url";
import puppeteer from "puppeteer";

const setWebsiteUrlSchema = z.object({
  websiteUrl: z.string().url(),
});

interface SetWebsiteUrlFormState {
  errors: {
    websiteUrl?: string[];
  };
  previewUrl?: string;
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

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(websiteUrl, {
    waitUntil: "networkidle2",
  });

  await page.screenshot({
    path: "/Users/samadarshad/dev/sales-tracker/hn.png",
  });

  await browser.close();

  if (formData.get("website-url")) {
    await new Promise((callback) => setTimeout(callback, 250));
    return {
      errors: {},
      previewUrl: "http://localhost:8080/hn.png",
      // previewUrl: "/webpage-preview.png",
    };
  }

  return {
    errors: {},
  };
}
