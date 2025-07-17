import { loadEntitiesConfig, loadTagsConfig } from "./entity-config.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import EmsEspClient, { EmsEspEntity } from "../ems-esp/ems-esp-client.js";
import logger from "../logger.js";

class EntityToolRegistrar {
  private entitiesConfig: ReturnType<typeof loadEntitiesConfig>;
  private tagsConfig: ReturnType<typeof loadTagsConfig>;

  constructor(
    private server: McpServer,
    private emsEspClient: EmsEspClient,
  ) {
    this.entitiesConfig = loadEntitiesConfig();
    this.tagsConfig = loadTagsConfig();
  }

  register(tag: string): void {
    const tagName = `get-${tag}`;
    const tagDescription = this.tagsConfig?.[tag]?.description || `Get all entities with tag '${tag}'`;
    // Precompute filteredEntities, entityNameSet, and entityConfigMap once per registration (not per request)
    const filteredEntities = Object.fromEntries(
      Object.entries(this.entitiesConfig).filter(([, entity]) => entity.tags?.includes(tag) || "all" === tag),
    );

    if (Object.keys(filteredEntities).length === 0) {
      logger.warn(`No entities found for tag '${tag}'. Tool '${tagName}' will return empty results.`);
    } else {
      logger.info(`Found ${Object.keys(filteredEntities).length} entities for tag '${tag}'`);
    }

    this.server.registerTool(
      tagName,
      {
        title: tagName,
        description: tagDescription,
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async () => {
        try {
          const allEntities = await this.emsEspClient.getAllEntities();
          const result: Record<string, EmsEspEntity & { description?: string }> = {};
          Object.entries(filteredEntities).forEach(([key, meta]) => {
            const entityObj = allEntities[meta.device]?.[key];
            if (entityObj) {
              result[key] = { ...entityObj, description: meta?.description };
            }
          });

          logger.debug(`Tool '${tagName}' returned ${Object.keys(result).length} entities`);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result),
              },
            ],
          };
        } catch (error) {
          logger.error(`Error executing tool '${tagName}':`, error);
          throw error;
        }
      },
    );
  }
}

export { EntityToolRegistrar };
