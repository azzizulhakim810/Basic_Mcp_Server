import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from "googleapis";
import z from "zod";
import "dotenv/config";

// Create server instance
const server = new McpServer({
  name: "basics Implementation",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Tool function
async function getMyCalendarDataByDate(date?: string) {
  const calendar = google.calendar({
    version: "v3",
    auth: `${process.env.GOOGLE_PUBLIC_API_KEY}`,
  });

  // If the date is not given
  const givenOrToday = date ?? new Date().toISOString();

  // Calculate the start & end of the given date(UTC)
  const start = new Date(givenOrToday);
  // const start = new Date(date);

  // Validate the date
  if (isNaN(start.getTime())) {
    return { error: "Invalid date provided" };
  }

  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  try {
    const res = await calendar.events.list({
      calendarId: `${process.env.CALENDAR_ID}`,

      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = res.data.items || [];
    const meetings = events.map((event: any) => {
      const start = event.start.dateTime || event.start.date;
      return `${event.summary} at ${start}`;
    });

    if (meetings.length > 0) {
      return {
        meetings,
      };
    } else {
      return {
        meetings: [],
      };
    }
  } catch (err: any) {
    return {
      error: err.message,
    };
  }
}

// Ping Text Tool
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

// Do Sum Tool
server.registerTool(
  "do_the_sum",
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

// Know primary questions
server.registerTool(
  "ask initial quesions",
  {
    title: "Primary Intake",
    description: "Ask the user some preliminary questions about himself",
    inputSchema: {
      input: z.string(),
    },
    outputSchema: { result: z.string() },
  },
  async ({ input }) => {
    const output = { result: input };
    return {
      content: [{ type: "text", text: JSON.stringify(output) }],
      structuredContent: output,
    };
  }
);

// Get Calendar Data
server.registerTool(
  "getMyCalendarDataByDate",
  {
    title: "Schedule Checker",
    description: "Check my schedule today?",
    inputSchema: {
      date: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: "Invalid date format. Please provide a valid date string.",
        }),
    },
  },
  async ({ date }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(await getMyCalendarDataByDate(date)),
        },
      ],
    };
  }
);

// Start the MCP Server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio transport");
}

// call the initialization
main().catch((error) => {
  console.error("Server Error", error);
  process.exit(1);
});
