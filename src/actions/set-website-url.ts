"use server";
import { z } from "zod";
import isUrl from "is-url";
import puppeteer from "puppeteer";
import { removeFile, uploadFile } from "@/services/s3";
import { db } from "@/db";
import { auth } from "@/auth";
import { Tracker } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { revalidatePath } from "next/cache";
import url from "url";

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
    _form?: string[];
  };
  tracker?: Tracker;
}

function getFaviconUrl(inputUrl: string) {
  // Parse the input URL
  const parsedUrl = new URL(inputUrl);

  // Extract the protocol and hostname
  const protocol = parsedUrl.protocol;
  const hostname = parsedUrl.hostname;

  // Combine protocol and hostname to get the home page URL
  const homePageUrl = protocol + "//" + hostname;

  return homePageUrl + "/favicon.ico";
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

  // very basic cookie consent handling
  await page.evaluate(() => {
    function xcc_contains(selector: string, text: string | RegExp) {
      var elements = document.querySelectorAll(selector);
      return Array.prototype.filter.call(elements, function (element) {
        return RegExp(text, "i").test(element.textContent.trim());
      });
    }
    var _xcc;
    _xcc = xcc_contains(
      "[id*=cookie] a, [class*=cookie] a, [class*=consent] a, [class*=Consent] a,[id*=cookie] button, [class*=cookie] button, [class*=consent] button, [class*=Consent] button",
      "(?:accept|agree|okay|ok)$"
    );
    if (_xcc != null && _xcc.length != 0) {
      _xcc[0].click();
    }
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
  const session = await auth();
  if (!session || !session.user) {
    return {
      errors: {
        _form: ["You must sign in to do this."],
      },
    };
  }

  const websiteUrl = setWebsiteUrlSchema
    .safeParse({
      websiteUrl: formData.get("website-url"),
    })
    .data?.websiteUrl.toString();

  if (!websiteUrl) {
    return {
      errors: {},
    };
  }

  if (websiteUrl == null || !isUrl(websiteUrl)) {
    return {
      errors: { websiteUrl: ["Not a valid URL"] },
    };
  }

  const screenshotPath = `${uuidv4()}.png`;

  await takeScreenshot(websiteUrl, screenshotPath);
  const previewUrl = await uploadFile(screenshotPath, screenshotPath);

  // get home page's favicon.ico page
  const faviconUrl = getFaviconUrl(websiteUrl);

  const tracker = await db.tracker.create({
    data: {
      websiteUrl,
      previewUrl,
      authorId: session.user.id,
      faviconUrl,
      aiPrompt: "",
      temporary: true,
    },
  });

  fs.unlinkSync(screenshotPath);

  return {
    errors: {},
    tracker: tracker,
  };
}

export async function saveTracker(tracker: Tracker): Promise<Tracker> {
  const result = await db.tracker.update({
    where: { id: tracker.id },
    data: {
      temporary: false,
    },
  });
  revalidatePath("/");
  return result;
}

export async function removeTracker(tracker: Tracker): Promise<Tracker> {
  await removeFile(tracker.previewUrl);
  return db.tracker.delete({
    where: { id: tracker.id },
  });
}
