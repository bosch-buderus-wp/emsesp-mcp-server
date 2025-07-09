import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import EmsEspClient from "../src/ems-esp/ems-esp-client";
import boilerEntitiesMock from "./boiler_entities.json";
import thermostatEntitiesMock from "./thermostat_entities.json";

// Type assertion for globalThis with fetch
const globalAny = globalThis as typeof globalThis & { fetch: typeof fetch };

describe("EmsEspClient", () => {
  let client: EmsEspClient;
  beforeEach(() => {
    client = new EmsEspClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch and return boiler and thermostat entities in namespaces", async () => {
    globalAny.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => boilerEntitiesMock,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => thermostatEntitiesMock,
      });

    const result = await client.getAllEntities();
    expect(result).toHaveProperty("boiler");
    expect(result).toHaveProperty("thermostat");
    expect(result.boiler).toMatchObject(boilerEntitiesMock);
    expect(result.thermostat).toMatchObject(thermostatEntitiesMock);
    expect(result.boiler["reset"]).toMatchObject(boilerEntitiesMock["reset"]);
    expect(result.thermostat["outdoortemp"]).toMatchObject(thermostatEntitiesMock["outdoortemp"]);
  });

  it("should throw if fetch fails", async () => {
    globalAny.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Internal Server Error" });
    await expect(client.getAllEntities()).rejects.toThrow("Failed to fetch");
  });

  it("should throw if response is not an object", async () => {
    globalAny.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [1, 2, 3] });
    await expect(client.getAllEntities()).rejects.toThrow("Unexpected response structure");
  });
});
