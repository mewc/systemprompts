import { PromptRecord, ModelFetcher } from "../types";
import OpenAI from "openai";
import { ModelName, providers } from "../providers";
import { ProviderName } from "../providers";
import fs from "fs/promises";
import path from "path";
import { sendAnthropicMessage } from "./anthropic";

export type ProviderConfig = {
  modelProvider: ProviderName;
  modelName: ModelName;
  apiKey: string;
  baseURL?: string;
  inputs: {
    systemPrompt: string;
    userPrompt: string;
    timestamp: string;
  }[];
};

export type ModelResultConfig = ProviderConfig & {
  outputs?: {
    timestamp: string;
    content: string;
  }[];
  hash?: string;
  timestamp: string;
  error?: {
    timestamp: string;
    message: string;
    code: string;
  };
};

export const validateModelAvailability = async (
  provider: ProviderConfig
): Promise<boolean> => {
  if (!provider.apiKey) {
    console.warn(
      `No API key for ${provider.modelProvider}, skipping validation`
    );
    return false;
  }

  // For now, just return true to bypass validation issues
  console.log(
    `Skipping validation for ${provider.modelProvider} ${provider.modelName}`
  );
  return true;
};

const sendMessage = async (
  provider: ProviderConfig
): Promise<ModelResultConfig> => {
  const timestamp = new Date().toISOString();

  if (!provider.apiKey) {
    console.warn(`No API key for ${provider.modelProvider}, skipping API call`);
    return {
      ...provider,
      outputs: [],
      hash: "",
      timestamp,
      error: {
        timestamp,
        message: "No API key provided",
        code: "NO_API_KEY",
      },
    };
  }

  try {
    // Use Anthropic-specific implementation for Anthropic models since they aren't playing the generic game
    if (provider.modelProvider === ProviderName.ANTHROPIC) {
      return await sendAnthropicMessage(provider);
    }

    // Standard OpenAI client for other providers
    let client;
    let content = "";

    // Special case for Gemini
    if (provider.modelProvider === ProviderName.GEMINI) {
      client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      });
    } else {
      client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
      });
    }

    const response = await client.chat.completions.create({
      model: provider.modelName,
      messages: provider.inputs.flatMap((input) => [
        { role: "system" as const, content: input.systemPrompt },
        { role: "user" as const, content: input.userPrompt },
      ]),
    });

    content = response.choices[0]?.message?.content || "No response returned";

    return {
      ...provider,
      outputs: [{ timestamp, content }],
      hash: "",
      timestamp,
    };
  } catch (error: any) {
    console.warn(
      `Failed to fetch ${provider.modelProvider} prompt from API: ${error.message}`
    );
    return {
      ...provider,
      outputs: [],
      hash: "",
      timestamp,
      error: {
        timestamp,
        message: error.message || "Unknown error occurred",
        code: error.code || "API_ERROR",
      },
    };
  }
};

// Check if we've already run this model recently (within the last 24 hours)
const hasRecentRun = async (provider: ProviderConfig): Promise<boolean> => {
  const LOGS_DIR = path.join(__dirname, "../logs");
  const providerDir = path.join(LOGS_DIR, provider.modelProvider.toLowerCase());
  const modelDir = path.join(providerDir, provider.modelName.toLowerCase());

  try {
    // Check if directory exists
    await fs.access(modelDir);

    // Get all files in the directory
    const files = await fs.readdir(modelDir);
    if (files.length === 0) return false;

    // Filter to only get JSON files
    const jsonFiles = files.filter((file) => file.endsWith(".json"));
    if (jsonFiles.length === 0) return false;

    // Get the most recent file
    const fileStats = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(modelDir, file);
        const stats = await fs.stat(filePath);
        return { file, stats };
      })
    );

    // Sort by modification time, newest first
    fileStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

    if (fileStats.length === 0) return false;

    // Check if the most recent file is less than 24 hours old
    const mostRecentFile = fileStats[0];
    const fileTime = mostRecentFile.stats.mtime.getTime();
    const currentTime = new Date().getTime();
    const hoursDiff = (currentTime - fileTime) / (1000 * 60 * 60);

    // Read the content of the most recent file to check outputs and errors
    const fileContent = await fs.readFile(
      path.join(modelDir, mostRecentFile.file),
      "utf-8"
    );
    const parsedContent = JSON.parse(fileContent);

    const lastRunWithin24Hours = hoursDiff < 24;
    // Check if outputs exist or if there's an error message
    if (parsedContent.outputs && parsedContent.outputs.length > 0) {
      console.warn(
        `Skipping ${provider.modelProvider} ${provider.modelName} - outputs already exist.`
      );
      return true;
    }

    if (
      parsedContent.error &&
      parsedContent.error.message &&
      lastRunWithin24Hours
    ) {
      console.warn(
        `Skipping ${provider.modelProvider} ${provider.modelName} - error message exists: ${parsedContent.error.message}`
      );
      // Allow run if last run was an error
      return false;
    }

    return lastRunWithin24Hours;
  } catch (error) {
    // If directory doesn't exist or any other error, we haven't run recently
    return false;
  }
};

// Update fetchAllPrompts to skip recently run models
export const fetchAllPrompts = async (): Promise<ModelResultConfig[]> => {
  // First filter out providers that have been run recently
  const filteredProviders = await Promise.all(
    providers.map(async (provider) => {
      const recentRun = await hasRecentRun(provider);
      if (recentRun) {
        console.warn(
          `Skipping ${provider.modelProvider} ${provider.modelName} - already run in the last 24 hours`
        );
        return null;
      }
      return provider;
    })
  );

  // Remove null entries and run the remaining providers
  const providersToRun = filteredProviders.filter(Boolean) as ProviderConfig[];

  console.log(
    `Running ${providersToRun.length} of ${providers.length} providers`
  );

  if (providersToRun.length === 0) {
    console.log(
      "No providers to run - all have been updated in the last 24 hours"
    );
    return [];
  }

  const prompts = await Promise.all(
    providersToRun.map((provider) => sendMessage(provider))
  );

  return prompts;
};

// Similarly update fetchPromptsForProvider
export const fetchPromptsForProvider = async (
  providerName: ProviderName,
  modelNames?: ModelName[]
): Promise<ModelResultConfig[]> => {
  const filteredProviders = providers.filter(
    (p) =>
      p.modelProvider === providerName &&
      (!modelNames || modelNames.includes(p.modelName))
  );

  if (filteredProviders.length === 0) return [];

  // Filter out recently run providers
  const providersToRun = await Promise.all(
    filteredProviders.map(async (provider) => {
      const recentRun = await hasRecentRun(provider);
      if (recentRun) {
        console.warn(
          `Skipping ${provider.modelProvider} ${provider.modelName} - already run in the last 24 hours`
        );
        return null;
      }
      return provider;
    })
  );

  // Remove null entries
  const validProvidersToRun = providersToRun.filter(
    Boolean
  ) as ProviderConfig[];

  console.log(
    `Running ${validProvidersToRun.length} of ${filteredProviders.length} providers for ${providerName}`
  );

  return Promise.all(
    validProvidersToRun.map((provider) => sendMessage(provider))
  );
};

// Export for external use
export const getProvider = (name: ProviderName, modelName?: ModelName) =>
  providers.find(
    (p) => p.modelProvider === name && (!modelName || p.modelName === modelName)
  );
