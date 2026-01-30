import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpInitializeParams,
  McpInitializeResult,
  McpToolCallParams,
  McpToolCallResult,
  Env,
} from "./types";
import { TOOLS } from "./tools";
import { handleSearch } from "../handlers/search";
import { handleGet } from "../handlers/get";
import { handleSequence } from "../handlers/sequence";
import { handleCheck } from "../handlers/check";
import { errorResponse, successResponse } from "../utils/response";

const SERVER_INFO = {
  name: "nyko",
  version: "1.0.0",
};

const PROTOCOL_VERSION = "2024-11-05";

export async function handleMcpRequest(
  request: JsonRpcRequest,
  env: Env
): Promise<JsonRpcResponse> {
  const { id, method, params } = request;

  try {
    switch (method) {
      case "initialize":
        return handleInitialize(id, params as unknown as McpInitializeParams);

      case "initialized":
        // Client acknowledgment, no response needed but we send one anyway
        return successResponse(id, {});

      case "tools/list":
        return handleToolsList(id);

      case "tools/call":
        return await handleToolCall(id, params as unknown as McpToolCallParams, env);

      default:
        return errorResponse(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(id, -32603, message);
  }
}

function handleInitialize(
  id: number | string,
  _params: McpInitializeParams
): JsonRpcResponse {
  const result: McpInitializeResult = {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {
      tools: {},
    },
    serverInfo: SERVER_INFO,
  };

  return successResponse(id, result);
}

function handleToolsList(id: number | string): JsonRpcResponse {
  return successResponse(id, { tools: TOOLS });
}

async function handleToolCall(
  id: number | string,
  params: McpToolCallParams,
  env: Env
): Promise<JsonRpcResponse> {
  const { name, arguments: args } = params;

  try {
    let result: unknown;

    switch (name) {
      case "nyko_search":
        result = await handleSearch(
          args.query as string,
          args.category as string | undefined,
          env
        );
        break;

      case "nyko_get":
        result = await handleGet(
          args.pattern_id as string,
          args.has_src_dir as boolean | undefined,
          env
        );
        break;

      case "nyko_sequence":
        result = await handleSequence(
          args.goal as string,
          args.already_implemented as string[] | undefined,
          env
        );
        break;

      case "nyko_check":
        result = await handleCheck(
          args.pattern_id as string,
          args.dependencies as Record<string, string>,
          env
        );
        break;

      default:
        return errorResponse(id, -32602, `Unknown tool: ${name}`);
    }

    const toolResult: McpToolCallResult = {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };

    return successResponse(id, toolResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool execution failed";

    const toolResult: McpToolCallResult = {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: message }),
        },
      ],
      isError: true,
    };

    return successResponse(id, toolResult);
  }
}
