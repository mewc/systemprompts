




// Validate required environment variables
const requiredEnvVars = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "GROK_API_KEY",
] as const;

// Check which variables are missing
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.warn(`⚠️ Missing environment variables: ${missingVars.join(", ")}`);
  console.warn("Using fallback public prompts where API calls fail");
}

// you scalliwags listen up, heres the secret config. be nice to each other.
// env 
export const CONFIG = {
  GROK_API_KEY: process.env.GROK_API_KEY || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
} as const;


