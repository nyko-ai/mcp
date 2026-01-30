import type { McpTool } from "./types";

export const TOOLS: McpTool[] = [
  {
    name: "nyko_search",
    description:
      "Search for implementation patterns by keyword. Use when user wants to implement a feature like 'google auth', 'stripe payments', etc.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "What to search for (e.g., 'google oauth', 'stripe checkout')",
        },
        category: {
          type: "string",
          enum: [
            "auth",
            "payments",
            "database",
            "deploy",
            "email",
            "api",
            "storage",
            "monitoring",
            "ai",
          ],
          description: "Optional category filter",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "nyko_get",
    description:
      "Get complete implementation details for a pattern including all code, files, env vars, and setup steps.",
    inputSchema: {
      type: "object",
      properties: {
        pattern_id: {
          type: "string",
          description:
            "Pattern ID from search results (e.g., 'supabase-google-oauth')",
        },
        has_src_dir: {
          type: "boolean",
          description: "Whether the project uses a src/ directory",
          default: false,
        },
      },
      required: ["pattern_id"],
    },
  },
  {
    name: "nyko_sequence",
    description:
      "Get ordered sequence of patterns to implement a complete feature. Use when user wants something that needs multiple patterns.",
    inputSchema: {
      type: "object",
      properties: {
        goal: {
          type: "string",
          description:
            "What the user wants to achieve (e.g., 'complete auth system with google and protected routes')",
        },
        already_implemented: {
          type: "array",
          items: { type: "string" },
          description: "Pattern IDs already in the project",
          default: [],
        },
      },
      required: ["goal"],
    },
  },
  {
    name: "nyko_check",
    description:
      "Check if a pattern is compatible with current project dependencies.",
    inputSchema: {
      type: "object",
      properties: {
        pattern_id: {
          type: "string",
          description: "Pattern ID to check",
        },
        dependencies: {
          type: "object",
          description: "Current package.json dependencies object",
        },
      },
      required: ["pattern_id", "dependencies"],
    },
  },
];
