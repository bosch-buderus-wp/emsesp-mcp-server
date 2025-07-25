#!/usr/bin/env node
/**
 * EMS-ESP MCP Server
 *
 * A Model Context Protocol (MCP) server that exposes data from a Bosch/Buderus heat pump
 * through standardized interfaces, allowing LLM tools like Claude to interact with it.
 */

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import EmsEspClient from "./ems-esp/ems-esp-client.js";
import { EntityToolRegistrar } from "./tools/entity-tool-registrar.js";
import { PromptRegistrar } from "./prompts/prompt-registrar.js";
import logger from "./logger.js";

// Start the server
startServer().catch((err) => {
  logger.error(`Failed to start server: ${err}`);
  process.exit(1);
});

export async function startServer() {
  logger.info("Starting EMS-ESP MCP Server...");

  const emsEspClient = new EmsEspClient();

  const server = new McpServer({
    name: "Bosch-Buderus Wärmepumpe",
    version: "1.0.0",
  });

  registerTools(server, emsEspClient);
  registerPrompts(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("EMS-ESP MCP Server running with stdio transport...");
  return server;
}

async function registerTools(server: McpServer, emsEspClient: EmsEspClient) {
  const envTags = process.env.TAGS_AS_TOOLS || "statistics,temperatures,states,settings,pumps,eheater";
  const validToolTags: string[] = envTags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  logger.info(`Using tool tags from TAGS_AS_TOOLS: ${validToolTags.join(", ")}`);
  const entityToolRegistrar = new EntityToolRegistrar(server, emsEspClient);
  for (const tag of validToolTags) {
    if (typeof tag !== "string" || !tag.match(/^[a-z0-9_-]+$/)) {
      logger.warn(
        `Skipping invalid tool tag '${tag}': must contain only lowercase letters, numbers, underscores, and hyphens`,
      );
      continue;
    }
    try {
      entityToolRegistrar.register(tag);
      logger.info(`Successfully registered tool for tag ${tag}`);
    } catch (error) {
      logger.error(`Failed to register tool for tag '${tag}':`, error);
    }
  }
}

async function registerPrompts(server: McpServer) {
  const envPrompts = process.env.PROMPTS || "show-dhw-settings,show-heat-curve";
  const validPromptNames: string[] = envPrompts
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  logger.info(`Using prompts from PROMPTS: ${validPromptNames.join(", ")}`);

  const promptRegistrar = new PromptRegistrar(server);
  for (const name of validPromptNames) {
    if (typeof name !== "string" || !name.match(/^[a-z0-9_-]+$/)) {
      logger.warn(
        `Skipping invalid prompt name '${name}': must contain only lowercase letters, numbers, underscores, and hyphens`,
      );
      continue;
    }
    try {
      promptRegistrar.register(name);
    } catch (error) {
      logger.error(`Failed to register prompt for name '${name}':`, error);
    }
  }
}

// Graceful shutdown handling
process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});
