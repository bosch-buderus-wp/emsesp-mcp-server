<h1 align="center">EMS-ESP MCP Server</h1>

<p align="center">MCP server for Bosch/Buderus heat pumps</p>

---

![](https://i.ibb.co/G4qzST84/claude-desktop-dhw-cop.gif)

## 📔 Table of Contents

- [About](#-about)
- [Integration in LLM Client](#️-integration-in-llm-client)
- [Configuration](#️-configuration)
- [Available Tools](#️-available-tools)
- [Outlook](#outlook)

## 🚀 About

With this **Model Context Protocol (MCP)** server, you can integrate your **Bosch CS5800/6800i or Buderus WLW176/186i heat pump** into a [Large Language Model (LLM) client](https://modelcontextprotocol.io/clients) such as [Claude Desktop](https://claude.ai/download).

This enables prompts like:

English:

- Is hot water preparation running right now?
- What is the current outdoor temperature?
- How warm is the domestic hot water right now?
- How much electricity is my heat pump currently using?
- What is the current COP (Coefficient of Performance) for hot water preparation?

German:

- Läuft gerade die Warmwasseraufbereitung?
- Wie ist die aktuelle Außentemperatur?
- Wie warm ist das Brauchwasser gerade?
- Wie viel Strom benötigt meine Wärmepumpe im Moment?
- Wie hoch ist meine Arbeitszahl der Warmwasseraufbereitung?

## ✍️ Integration in LLM Client

```
"emsesp": {
  "type": "stdio",
  "command": "npx",
  "args": [
    "-y",
    "tsx",
    "emsesp-mcp-server"
  ]
}
```

## ⚙️ Configuration

- `LOG_LEVEL` (info): The log level of the logs which get written to _~/.emsesp-mcp/server-%DATE%.log_
- `EMS_ESP_URL` (http://ems-esp): Base URL of the EMS-ESP gateway
- `ENTITIES_CONFIG_PATH` (./entities.json): Path to the entity configuration file
- `TAGS_AS_TOOLS` (statistics,temperatures,states,settings,pumps,eheater): comma-separated list of tags. Each tag gets exposed as a separate tool. Each tool provides all entities which are tagged with the respective tag in the config file stored at `ENTITIES_CONFIG_PATH`.

## 🛠️ Available Tools

The MCP server in the current initial version provides read-only [Tools](https://modelcontextprotocol.io/docs/concepts/tools) which can be chosen by the LLM according to its needs.
To reduce token size in the response and reduce irrelevant noise in the response, the huge list of entities provided by EMS-ESP has been reduced to a meaningful minimum and structured into groups with entities for similar categories like _statistics_ or _temperatures_.
To support the LLM in selecting the right tool and interpreting the response correctly - hopefully with as little hallucinations as possible, tools and the returned entities are well described.

Each entity of EMS-ESP has a list of `tags` in [entity.json](./src/resources/entity.json):

```
"dhw.nrg": {
      "title": "Total heat energy generated for hot water",
      "tags": ["statistics", "energy", "dhw", "prod-nrg"]
    },
```

All entities associated to a tag are exposed with the respective MCP tool.

If you want to add more entities, copy [entity.json](./src/resources/entity.json) and add your additional entities.
Then you can use the modified file in the MCP server via the environment variable `ENTITIES_CONFIG_PATH`=\<path-to-modified-file\>.

## 👓 Outlook

- More entities
- Tools to set room temperature, start desinfection, enable PV surplus, ...
- Prompts to draw heat curve, etc.

## 📄 License

[MIT](LICENSE)
