<div align="center">
  <img src="images/logo.png" alt="Logo" width="100" height="100">
  <h2>MCP Server for Bosch/Buderus heat pumps</h2>
  <p>LLM-powered chat for your heat pump</p>

[![Latest Release](https://img.shields.io/github/v/release/bosch-buderus-wp/emsesp-mcp-server?label=Release)](https://github.com/bosch-buderus-wp/emsesp-mcp-server/releases/latest)
[![Tests](https://img.shields.io/github/actions/workflow/status/bosch-buderus-wp/emsesp-mcp-server/build-and-test.yml?branch=main&label=Tests)](https://github.com/bosch-buderus-wp/emsesp-mcp-server/actions/workflows/build-and-test.yml)

</div>

---

<div align="center">
  <img src="https://i.ibb.co/G4qzST84/claude-desktop-dhw-cop.gif" width="672" alt="Get dhw temperature and COP of preparation" />
  <p>Get hot water temperature and COP of preparation</p>
</div>

---

<div align="center">
  <img src="https://i.ibb.co/NdYDgCPy/Claude-show-heat-curve-small.gif" alt="Get graph of configured heat curve" />
  <p>Get graph of configured heat curve</p>
</div>

## 📔 Table of Contents

- [About](#-about)
- [Integration in LLM Application](#️-integration-in-llm-application)
- [Configuration](#️-configuration)
- [Available Tools](#️-available-tools)
- [Outlook](#-outlook)

## 🚀 About

With this **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)** server, you can integrate your **Bosch CS5800/6800i or Buderus WLW176/186i heat pump** via [ems-esp](https://bosch-buderus-wp.github.io/docs/smarthome/) into a [Large Language Model (LLM) Application](https://modelcontextprotocol.io/clients) such as [Claude Desktop](https://claude.ai/download).

Then shoot your prompts like so:

- _Is hot water preparation running right now?_
- _What's the current outdoor temperature?_
- _How warm is the domestic hot water at the moment?_
- _How much electricity is my heat pump currently using?_
- _What's the COP (Coefficient of Performance) for hot water preparation?_

The LLM will select the necessary [Tools](https://modelcontextprotocol.io/docs/concepts/tools) provided by the MCP server to answer the question.

Or you can simply use the built-in [Prompts](https://modelcontextprotocol.io/docs/concepts/prompts) provided by the MCP server:

- `/show-dhw-settings` to get all settings for domestic hot water preparation in table format
- `/show-heat-curve` to show the configured heat curve as a graph
- ... more to come soon - stay tuned! 👀

## ✍️ Integration in LLM Application

This MCP server works with any LLM application which supports [Tools](https://modelcontextprotocol.io/clients).
I've verified it end-to-end on the Claude Desktop App which supports easy one-click installation.

### Install in Claude Desktop App with DXT file

1. Download latest [emsesp-mcp-server.dxt](https://github.com/bosch-buderus-wp/emsesp-mcp-server/releases/latest/download/emsesp-mcp-server.dxt) file
2. Open `Settings` in Claude Desktop
3. Go to `Extensions` and drag the DXT file into the window
4. Press `Install`
5. Change the URL of your EMS-ESP gateway if necessary
6. Close the window and start chatting with your heat pump 💬

### Manual installation

Go to the settings file of your LLM application, for instance `.vscode/mcp.json` for Github Copilot, and add the following configuration:

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

- More entities and prompts
- Tools to set room temperature, start desinfection, enable PV surplus, adapt dhw settings, ...
- Resources providing more context on the topic

## 📄 License

[MIT](LICENSE)
