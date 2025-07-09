/**
 * EMS-ESP Client
 *
 * A client for interacting with the EMS-ESP API to fetch data from Bosch/Buderus heat pumps.
 */

import logger from "../logger.js";
import { z } from "zod";

// Zod schema for EMS-ESP entity
export const EmsEspEntitySchema = z.object({
  name: z.string().describe("The entity name prefixed by the circuit to prevent name collisions"),
  fullname: z.string().describe("The localized human-readable name"),
  circuit: z.string().optional().describe("The circuit this entity belongs to (e.g. 'hc1', 'dhw')"),
  type: z.string().describe("Data type: 'number', 'enum', 'boolean', etc."),
  value: z.union([z.string(), z.number()]).optional().describe("The current value (string or number)"),
  bool: z.boolean().optional().describe("Boolean value for entities of type 'boolean'"),
  index: z.number().optional().describe("Index value for entities of type 'enum'"),
  min: z.number().optional().describe("Minimum value for entities of type 'number'"),
  max: z.number().optional().describe("Maximum value for entities of type 'number'"),
  uom: z.string().optional().describe("Unit of measurement (°C, kWh, etc.)"),
  enum: z.array(z.string()).optional().describe("Possible enum values if type is 'enum'"),
  readable: z.boolean().describe("Whether this entity can be read"),
  writeable: z.boolean().describe("Whether this entity can be modified"),
  visible: z.boolean().describe("Whether this entity is visible in the UI"),
});

export type EmsEspEntity = z.infer<typeof EmsEspEntitySchema>;

class EmsEspClient {
  private baseUrl: URL;

  constructor() {
    this.baseUrl = this.getValidatedBaseUrl();
    logger.info(`EMS-ESP API base URL set to: ${this.baseUrl.toString().replace(/\/$/, "")}`);
  }

  /**
   * Validates and returns the EMS-ESP base URL as a URL object.
   * Throws an error if the URL is invalid.
   */
  private getValidatedBaseUrl(): URL {
    const emsEspUrl = process.env.EMS_ESP_URL || "http://ems-esp";
    try {
      return new URL(emsEspUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`EMS_ESP_URL environment variable is not a valid URL: ${emsEspUrl}. Error: ${errorMessage}`);
      throw new Error(`EMS_ESP_URL environment variable is not a valid URL: ${emsEspUrl}`);
    }
  }

  /**
   * Fetches all entities from the EMS-ESP API (boiler and thermostat).
   * Returns an object with separate namespaces for boiler and thermostat.
   * @returns Object with boiler and thermostat entities keyed by entity name
   */
  async getAllEntities(): Promise<{
    boiler: Record<string, EmsEspEntity>;
    thermostat: Record<string, EmsEspEntity>;
  }> {
    const boilerUrl = new URL("/api/boiler/entities", this.baseUrl);
    const thermostatUrl = new URL("/api/thermostat/entities", this.baseUrl);
    const [boilerEntities, thermostatEntities] = await Promise.all([
      this.fetchEntities(boilerUrl),
      this.fetchEntities(thermostatUrl),
    ]);
    return {
      boiler: boilerEntities,
      thermostat: thermostatEntities,
    };
  }

  /**
   * Fetches entities from a given EMS-ESP API endpoint.
   * @param url The endpoint URL
   * @returns Object of entities keyed by entity name
   */
  private async fetchEntities(url: URL): Promise<Record<string, EmsEspEntity>> {
    let response: Response;
    try {
      response = await fetch(url);
    } catch (err) {
      logger.error(`Network error while fetching ${url}:`, err);
      throw new Error(`Network error while fetching ${url}: ${(err as Error).message}`);
    }
    if (response.ok) {
      let data: unknown;
      try {
        data = await response.json();
      } catch (err) {
        logger.error(`Invalid JSON from ${url}:`, err);
        throw new Error(`Invalid JSON from ${url}: ${(err as Error).message}`);
      }
      logger.debug(`Fetched entities from ${url}:`, data);
      return this.parseEntitiesResponse(data);
    }
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  /**
   * Parses and validates the entities response from the EMS-ESP API.
   * @param data The raw response data
   * @returns Object of entities keyed by entity name
   */
  private parseEntitiesResponse(data: unknown): Record<string, EmsEspEntity> {
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const result: Record<string, EmsEspEntity> = {};
      for (const [key, value] of Object.entries(data)) {
        try {
          result[key] = EmsEspEntitySchema.parse(value);
        } catch (e) {
          logger.error(`Validation failed for entity '${key}'`, e);
          // Continue with the next entity instead of throwing
        }
      }
      return result;
    }
    logger.error(`Unexpected response structure from EMS-ESP API:`, data);
    throw new Error(`Unexpected response structure from EMS-ESP API`);
  }
}

export default EmsEspClient;
