import { describe, test, beforeEach, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { startServer } from "../src/index.ts";
import fs from "fs";
import path from "path";

const boilerEntitiesData = JSON.parse(fs.readFileSync(path.join(__dirname, "./boiler_entities.json"), "utf-8"));
const thermostatEntitiesData = JSON.parse(fs.readFileSync(path.join(__dirname, "./thermostat_entities.json"), "utf-8"));
const configuredEntitiesData = JSON.parse(fs.readFileSync(path.join(__dirname, "../config/entities.json"), "utf-8"));

describe("MCP Server E2E (in‐memory)", () => {
  process.env.TAGS_AS_TOOLS = "all,statistics,temperatures,states,settings,pumps,eheater,runtimes";
  let mcpServer: Awaited<ReturnType<typeof startServer>>;
  let client: Client;
  let clientTransport: ReturnType<typeof InMemoryTransport.createLinkedPair>[0];
  let serverTransport: ReturnType<typeof InMemoryTransport.createLinkedPair>[1];

  beforeEach(async () => {
    // Mock fetch for EMS-ESP endpoints
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : "";
      if (url.includes("/api/boiler/entities")) {
        return {
          ok: true,
          json: async () => boilerEntitiesData,
        } as Response;
      }
      if (url.includes("/api/thermostat/entities")) {
        return {
          ok: true,
          json: async () => thermostatEntitiesData,
        } as Response;
      }
      // fallback: simulate 404
      return {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ error: "Not Found" }),
      } as Response;
    };

    mcpServer = await startServer();
    client = new Client({ name: "test client", version: "1.0" });
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([mcpServer.server.connect(serverTransport), client.connect(clientTransport)]);
  });

  test("tools/list returns exactly the number of tools defined in TAGS_AS_TOOLS", async () => {
    const res = await client.listTools();
    expect(Array.isArray(res.tools)).toBe(true);
    expect(res.tools.length).toBe(process.env.TAGS_AS_TOOLS?.split(",").length);
  });

  test("tool get-all returns all entities as properties", async () => {
    const res = await client.callTool({ name: "get-all" });
    expect(res).toBeDefined();
    expect(typeof res).toBe("object");
    const response = res as { content: Array<{ text: string }> };
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBeGreaterThan(0);
    const jsonText = response.content[0].text;
    const obj = JSON.parse(jsonText);
    expect(Object.keys(obj)).toStrictEqual(Object.keys(configuredEntitiesData.entities));
  });

  test("tool get-runtime returns an object with 5 entities as properties", async () => {
    const res = await client.callTool({ name: "get-runtimes" });
    expect(res).toBeDefined();
    expect(typeof res).toBe("object");
    const response = res as { content: Array<{ text: string }> };
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBeGreaterThan(0);
    const jsonText = response.content[0].text;
    const obj = JSON.parse(jsonText);
    expect(Object.keys(obj).length).toBe(5);
    expect(obj).toHaveProperty("uptimetotal");
    expect(obj).toHaveProperty("uptimecontrol");
    expect(obj).toHaveProperty("uptimecompheating");
    expect(obj).toHaveProperty("uptimecompcooling");
  });
});
