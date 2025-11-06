import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";

const server = new McpServer({
  name: "basics",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.registerTool(
  "ping",
  {
    title: "Ping Tool",
    description:
      "Echoes the text back so the host can verify the tool is reachable.",
    inputSchema: {
      text: z.string().optional(),
    },
  },
  // handler Function
  async ({ text }) => {
    const message = text
      ? `Pong - you said: ${text}`
      : `Pong - No text provided`;
    return {
      content: [
        {
          type: "text",
          text: message,
        },
      ],
    };
  }
);

server.registerTool(
  "do_sum",
  {
    title: "Add two numbers",
    description: "Adds a and b and returns the numeric result as text",
    inputSchema: {
      a: z.number(),
      b: z.number(),
    },
    outputSchema: { result: z.number() },
  },
  async ({ a, b }) => {
    const output = { result: a + b };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  }
);

// Start the MCP Server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio transport");
}

main().catch((error) => {
  console.error("Server Error", error);
  process.exit(1);
});
