import dotenv from "dotenv";

// Load .env file in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import {
  fetchAllPrompts,
  validateModelAvailability,
} from "./fetchers/fetchers";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { PromptRecord } from "./types";
import { CONFIG } from "./config";
import { providers } from "./providers";

const LOGS_DIR = path.join(__dirname, "../logs");

const generateHash = (content: string): string => {
  return crypto.createHash("sha256").update(content).digest("hex");
};

const savePrompt = async (prompt: PromptRecord) => {
  const timestamp = new Date().toISOString().split("T")[0];
  // Generate hash from both the prompt we sent and the response we got
  const hashContent = JSON.stringify({
    systemPrompt: prompt.inputs,
    response: prompt.outputs || "",
  });

  if (typeof hashContent !== "string") {
    console.error("Invalid data for hash generation:", hashContent);
    return; // or throw an error, depending on your error handling strategy
  }

  const hash = generateHash(hashContent);

  // Create model-specific directory structure
  const providerDir = path.join(LOGS_DIR, prompt.modelProvider.toLowerCase());
  const modelType = prompt.modelName || "unknown"; // Assuming model type is in the output
  const modelTypeDir = path.join(providerDir, modelType.toLowerCase());
  await fs.mkdir(modelTypeDir, { recursive: true });

  const fileName = `${prompt.modelProvider.toLowerCase()}_${prompt.modelName.toLowerCase()}_${timestamp}.json`;
  const filePath = path.join(modelTypeDir, fileName);

  await fs.writeFile(
    filePath,
    JSON.stringify(
      {
        ...prompt,
        apiKey: "..." + prompt.apiKey.slice(-5),
        hash,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log(`Saved prompt to ${filePath}`);
};

const main = async () => {
  try {
    // Check model availability before fetching prompts
    for (const provider of providers) {
      const isAvailable = await validateModelAvailability(provider);
      if (!isAvailable) {
        console.log(`${provider.modelProvider}: Not Available`);
      }
    }

    // Only fetch prompts if all models are available
    const prompts = await fetchAllPrompts();
    for (const prompt of prompts) {
      await savePrompt(prompt);
    }

    console.log("Successfully updated prompts");
  } catch (error) {
    console.error("Error updating prompts:", error);
    process.exit(1);
  }
};

console.log("ENV: ", CONFIG.IS_PRODUCTION ? "PROD" : "DEV");
main();
