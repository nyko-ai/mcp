// MCP Protocol Types (JSON-RPC 2.0)

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// MCP Specific Types
export interface McpInitializeParams {
  protocolVersion: string;
  capabilities: Record<string, unknown>;
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface McpInitializeResult {
  protocolVersion: string;
  capabilities: {
    tools?: Record<string, unknown>;
  };
  serverInfo: {
    name: string;
    version: string;
  };
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpToolCallParams {
  name: string;
  arguments: Record<string, unknown>;
}

export interface McpToolCallResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

// Pattern Types
export interface PatternIndexEntry {
  id: string;
  category: string;
  name: string;
  description: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "stable" | "beta" | "experimental";
}

export interface PatternIndex {
  version: string;
  updated_at: string;
  patterns: PatternIndexEntry[];
}

export interface PatternEnvVar {
  key: string;
  required: boolean;
  description: string;
  example?: string;
}

export interface PatternFile {
  path: string;
  code: string;
  description?: string;
}

export interface PatternExternalSetup {
  provider: string;
  steps: string[];
}

export interface PatternEdgeCase {
  symptom: string;
  solution: string;
}

export interface Pattern {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: string;
  status: string;
  time_estimate?: string;
  install?: string;
  requires?: string[];
  enables?: string[];
  env?: PatternEnvVar[];
  files?: PatternFile[];
  external_setup?: PatternExternalSetup[];
  edge_cases?: PatternEdgeCase[];
  validation?: string[];
}

// Search Results
export interface SearchResult {
  patterns: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    difficulty: string;
    time_estimate?: string;
    status: string;
    requires?: string[];
    enables?: string[];
  }>;
  total: number;
}

// Sequence Results
export interface SequenceStep {
  order: number;
  id: string;
  name: string;
  reason: string;
}

export interface SequenceResult {
  sequence: SequenceStep[];
  total_time: string;
}

// Check Results
export interface CompatibilityIssue {
  type: "version_mismatch" | "missing_dependency" | "incompatible";
  package: string;
  current?: string;
  required?: string;
  severity: "error" | "warning";
}

export interface CheckResult {
  compatible: boolean;
  issues: CompatibilityIssue[];
  missing: string[];
  install_command?: string;
}

// Environment bindings for Cloudflare Workers
export interface Env {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  ENVIRONMENT?: string;
}
