import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import logger from "../logger.js";

const EntitySchema = z.object({
  title: z.string().describe("Human/LLM-readable title of the entity"),
  name: z.string().describe("Name of the entity"),
  description: z.string().describe("Human/LLM-readable description of the entity"),
  device: z.enum(["boiler", "thermostat"]).describe("Device which owns the entity"),
  isWritable: z.boolean().optional().describe("True if the entity is writable"),
  tags: z.array(z.string()).optional().describe("Classification tags for the entity"),
});

const TagSchema = z.object({
  description: z.string().describe("Human/LLM-readable description of the tag"),
});

const EntityTagsConfigSchema = z.object({
  tags: z.record(TagSchema),
  entities: z.record(EntitySchema),
});

export type Entity = z.infer<typeof EntitySchema>;
export type EntityTagsConfig = z.infer<typeof EntityTagsConfigSchema>;

export { EntitySchema };

/**
 * Loads and validates the entity/tool configuration file.
 * @throws Error if the file cannot be read, parsed, or does not match the schema.
 */
function readAndParseConfig<T>(schema: z.ZodSchema<T>): T {
  const configPath = process.env.ENTITIES_CONFIG_PATH || "./config/entities.json";
  const resolvedPath = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../", configPath);
  let configRaw: string;
  try {
    configRaw = fs.readFileSync(resolvedPath, "utf-8");
  } catch (err) {
    throw new Error(
      `Failed to read entity config at ${resolvedPath}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  let configObj: unknown;
  try {
    configObj = JSON.parse(configRaw);
  } catch (err) {
    throw new Error(
      `Failed to parse entity config at ${resolvedPath}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const parsed = schema.safeParse(configObj);
  if (!parsed.success) {
    throw new Error(
      `Invalid entity config in ${resolvedPath} (schema):\n` + JSON.stringify(parsed.error.format(), null, 2),
    );
  }
  return parsed.data;
}

export function loadEntitiesConfig(): Record<string, z.infer<typeof EntitySchema>> {
  const config = readAndParseConfig(EntityTagsConfigSchema);
  logger.info(`Loaded ${Object.keys(config.entities).length} entity configurations`);
  return config.entities;
}

export function loadTagsConfig(): Record<string, { description: string }> {
  const config = readAndParseConfig(EntityTagsConfigSchema);
  logger.info(`Loaded ${Object.keys(config.tags).length} tag configurations`);
  return config.tags;
}
