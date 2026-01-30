import type { Env, JsonRpcRequest } from "./mcp/types";
import { handleMcpRequest } from "./mcp/server";
import { errorResponse, ERROR_CODES } from "./utils/response";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({ status: "ok", version: "1.0.0" }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // MCP endpoint
    if (url.pathname === "/mcp" && request.method === "POST") {
      return handleMcp(request, env);
    }

    // SSE endpoint (for future use)
    if (url.pathname === "/sse" && request.method === "GET") {
      return handleSse();
    }

    // Root - info page
    if (url.pathname === "/") {
      return new Response(
        JSON.stringify({
          name: "Nyko MCP Server",
          version: "1.0.0",
          description: "Battle-tested patterns for AI coding assistants",
          endpoints: {
            mcp: "/mcp (POST)",
            health: "/health (GET)",
            sse: "/sse (GET)",
          },
          usage: {
            claude_code: {
              config: "~/.claude/settings.json",
              example: {
                mcpServers: {
                  nyko: {
                    url: "https://nyko-mcp.nyko-ai.workers.dev/mcp",
                  },
                },
              },
            },
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
};

async function handleMcp(request: Request, env: Env): Promise<Response> {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await request.text();

    if (!body) {
      const response = errorResponse(
        0,
        ERROR_CODES.INVALID_REQUEST,
        "Empty request body"
      );
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    let mcpRequest: JsonRpcRequest;
    try {
      mcpRequest = JSON.parse(body);
    } catch {
      const response = errorResponse(
        0,
        ERROR_CODES.PARSE_ERROR,
        "Invalid JSON"
      );
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Validate JSON-RPC structure
    if (mcpRequest.jsonrpc !== "2.0" || !mcpRequest.method) {
      const response = errorResponse(
        mcpRequest.id ?? 0,
        ERROR_CODES.INVALID_REQUEST,
        "Invalid JSON-RPC request"
      );
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Handle the MCP request
    const response = await handleMcpRequest(mcpRequest, env);

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    const response = errorResponse(0, ERROR_CODES.INTERNAL_ERROR, message);

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
}

function handleSse(): Response {
  // SSE endpoint for future real-time features
  return new Response("SSE not yet implemented", { status: 501 });
}
