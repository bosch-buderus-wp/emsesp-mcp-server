import { describe, test, beforeEach, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { startServer } from "../src/index.ts";
import promptsData from "../config/prompts.json";
import { PromptDetails } from "../src/prompts/prompt-registrar.js";

const prompts = promptsData as Record<string, PromptDetails>;

describe("MCP Server E2E (in‐memory)", () => {
  process.env.PROMPTS = "show-dhw-settings,show-heat-curve";
  let mcpServer: Awaited<ReturnType<typeof startServer>>;
  let client: Client;
  let clientTransport: ReturnType<typeof InMemoryTransport.createLinkedPair>[0];
  let serverTransport: ReturnType<typeof InMemoryTransport.createLinkedPair>[1];

  beforeEach(async () => {
    mcpServer = await startServer();
    client = new Client({ name: "test client", version: "1.0" });
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([mcpServer.server.connect(serverTransport), client.connect(clientTransport)]);
  });

  test("prompts/list returns prompts with correct properties", async () => {
    const res = await client.listPrompts();
    const listedPrompts = res.prompts;
    const expectedPromptNames = process.env.PROMPTS?.split(",") || [];

    expect(listedPrompts.length).toBe(expectedPromptNames.length);

    for (const promptName of expectedPromptNames) {
      const listedPrompt = listedPrompts.find((p) => p.name === promptName);
      const expectedPrompt = prompts[promptName];
      expect(listedPrompt).toBeDefined();
      expect(listedPrompt?.title).toBe(expectedPrompt.title);
      expect(listedPrompt?.description).toBe(expectedPrompt.description);
    }
  });

  test("prompts/get returns a specific prompt", async () => {
    const promptName = "show-dhw-settings";
    const res = await client.getPrompt({ name: promptName });
    const expectedPrompt = prompts[promptName];
    expect(res.messages).not.toBeNull();
    expect(res.messages).toEqual(expectedPrompt.messages);
  });

  test("prompts/get returns null for non-existent prompt", async () => {
    const promptName = "non-existent-prompt";
    await expect(client.getPrompt({ name: promptName })).rejects.toThrow(
      "MCP error -32602: Prompt non-existent-prompt not found",
    );
  });
});
