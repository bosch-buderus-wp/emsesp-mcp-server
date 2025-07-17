<h1 align="center">EMS-ESP MCP Server</h1>

<p align="center">MCP server for Bosch/Buderus heat pumps</p>

---

<div align="center">
  <img src="https://i.ibb.co/G4qzST84/claude-desktop-dhw-cop.gif" alt="Get dhw temperature and COP of preparation" />
  <p>Get dhw temperature and COP of preparation</p>
</div>

---

<div align="center">
  <img src="https://i.ibb.co/QRfSSMw/Claude-show-heat-curve.gif" alt="Get graph of configured heat curve" />
  <p>Get graph of configured heat curve</p>
</div>

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

## ✍️ Integration in LLM Client

### Install in Claude Desktop App with DXT file

1. Download latest [emsesp-mcp-server.dxt](https://github.com/bosch-buderus-wp/emsesp-mcp-server/releases/latest/download/emsesp-mcp-server.dxt) file
2. Open `Settings` in Claude Desktop
3. Go to `Extensions` and drag the DXT file into the window
4. Press `Install`
5. Change the URL of your EMS-ESP gateway if necessary
6. Close the window and start chatting with your heat pump 💬

### Manual installation

Go to the settings file of your LLM Client, for instance .vscode/mcp.json for Github Copilot, and add the following configuration:

```
"emsesp": {
  "type": "stdio",
  "command": "npx",
  "args": [
    "-y",
    "github:bosch-buderus-wp/emsesp-mcp-server"
  ],
  "env": {
    "EMS_ESP_URL": "http://ems-esp"
  }
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
