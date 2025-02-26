import Anthropic from "@anthropic-ai/sdk";
import { ProviderConfig, ModelResultConfig } from "./fetchers";

// https://console.anthropic.com/dashboard

export const sendAnthropicMessage = async (
  provider: ProviderConfig
): Promise<ModelResultConfig> => {
  const timestamp = new Date().toISOString();

  if (!provider.apiKey) {
    console.warn(`No API key for Anthropic, skipping API call`);
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
    const anthropic = new Anthropic({
      apiKey: provider.apiKey,
    });

    // Create messages array with system prompt and user prompt
    const messages = [];

    // Add system message if it exists
    if (provider.inputs[0].systemPrompt) {
      messages.push({
        role: "assistant" as const,
        content: provider.inputs[0].systemPrompt,
      });
    }

    // Add user message
    messages.push({
      role: "user" as const,
      content: provider.inputs[0].userPrompt,
    });

    console.log(
      `Sending request to Anthropic API for model ${provider.modelName}`
    );

    const response = await anthropic.messages.create({
      model: provider.modelName,
      max_tokens: 1024,
      system: provider.inputs[0].systemPrompt,
      messages: messages,
    });

    const content = response.content
      .map((block) => {
        if (block.type === "text") {
          return block.text;
        }
        return "";
      })
      .join("\n");

    return {
      ...provider,
      outputs: [
        {
          timestamp,
          content,
        },
      ],
      hash: "",
      timestamp,
    };
  } catch (error: any) {
    console.warn(`Failed to fetch Anthropic prompt from API: ${error.message}`);
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
