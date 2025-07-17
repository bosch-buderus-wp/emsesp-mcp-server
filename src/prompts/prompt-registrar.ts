import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import logger from "../logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export interface PromptDetails {
  title: string;
  description: string;
  messages: {
    role: "user" | "assistant";
    content: {
      type: "text";
      text: string;
    };
  }[];
}

class PromptRegistrar {
  private prompts: Record<string, PromptDetails>;

  constructor(private server: McpServer) {
    this.prompts = this.loadPrompts();
  }

  private loadPrompts(): Record<string, PromptDetails> {
    const configPath = process.env.PROMPTS_CONFIG_PATH || "./config/prompts.json";
    const resolvedPath = path.isAbsolute(configPath)
      ? configPath
      : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../", configPath);
    if (!fs.existsSync(resolvedPath)) {
      logger.warn("Could not find prompts.json, no prompts will be loaded.");
      return {};
    }

    try {
      const promptsData = fs.readFileSync(resolvedPath, "utf-8");
      return JSON.parse(promptsData) as Record<string, PromptDetails>;
    } catch (error) {
      logger.error("Failed to load or parse prompts.json:", error);
      return {};
    }
  }

  register(promptName: string): void {
    const prompt = this.prompts[promptName];

    if (!prompt) {
      logger.warn(`Prompt '${promptName}' not found in prompts.json. Skipping registration.`);
      return;
    }

    this.server.registerPrompt(
      promptName,
      {
        title: prompt.title,
        description: prompt.description,
      },
      () => ({
        messages: prompt.messages,
      }),
    );
    logger.info(`Successfully registered prompt: ${promptName}`);
  }
}

export { PromptRegistrar };
