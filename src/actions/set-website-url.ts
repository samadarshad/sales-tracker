"use server";
import { z } from "zod";

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
  if (formData.get("website-url")) {
    await new Promise((callback) => setTimeout(callback, 250));
    return {
      errors: {},
      previewUrl: "/webpage-preview.png",
    };
  }

  return {
    errors: {},
  };
}
