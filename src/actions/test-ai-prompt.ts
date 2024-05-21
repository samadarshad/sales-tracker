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
  return {
    errors: {},
    response: "response...",
  };
}
