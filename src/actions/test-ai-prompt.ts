"use server";
import { z } from "zod";

const aiPromptSchema = z.object({
  aiPrompt: z.string(),
});

interface TestAiPromptFormState {
  errors: {
    aiPrompt?: string[];
  };
  response?: string;
}

export async function testAiPrompt(
  formState: TestAiPromptFormState,
  formData: FormData
): Promise<TestAiPromptFormState> {
  await new Promise((callback) => setTimeout(callback, 2500));
  return {
    errors: {},
    response: "response...",
  };
}
