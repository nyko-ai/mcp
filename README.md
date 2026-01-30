# Nyko MCP Server

MCP (Model Context Protocol) server that provides battle-tested implementation patterns to AI coding assistants like Claude Code, Cursor, and Windsurf.

## What is Nyko?

Nyko provides production-ready code patterns for common features:
- **Auth**: Supabase OAuth (Google, GitHub), Magic Links, Protected Routes
- **Payments**: Stripe Checkout, Webhooks, Customer Portal
- **Database**: RLS Policies, Migrations
- **Deploy**: Docker Compose, GitHub Actions + Vercel
- **API**: Rate Limiting with Upstash

## Usage

### With Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "nyko": {
      "url": "https://nyko-mcp.nyko-ai.workers.dev/mcp"
    }
  }
}
```

Then ask Claude:
- "Set up Google OAuth with Supabase"
- "Add Stripe payments to my app"
- "Create protected routes"

### Available Tools

| Tool | Description |
|------|-------------|
| `nyko_search` | Search for patterns by keyword |
| `nyko_get` | Get complete pattern with code, env vars, and setup steps |
| `nyko_sequence` | Get ordered list of patterns for a complete feature |
| `nyko_check` | Check if a pattern is compatible with your project |

## Development

### Prerequisites

- Node.js 18+
- Wrangler CLI (`npm install -g wrangler`)

### Setup

```bash
# Clone the repo
git clone https://github.com/nyko-ai/mcp.git
cd mcp

# Install dependencies
npm install

# Copy env vars example
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your Upstash credentials (optional for local dev)

# Start dev server
npm run dev
```

### Testing

```bash
# Test initialize
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'

# Test tools/list
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# Test nyko_search
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"nyko_search","arguments":{"query":"google oauth"}}}'
```

### Deploy

```bash
# Login to Cloudflare
wrangler login

# Set secrets
wrangler secret put UPSTASH_REDIS_REST_URL
wrangler secret put UPSTASH_REDIS_REST_TOKEN

# Deploy
npm run deploy
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  MCP Client (Claude Code, Cursor)                       │
│                        │                                │
│                        ▼                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Cloudflare Worker (MCP Server)          │   │
│  │                                                  │   │
│  │  /mcp (POST) - MCP protocol endpoint            │   │
│  │  /sse (GET)  - Server-sent events (future)      │   │
│  │  /health     - Health check                     │   │
│  └─────────────────────────────────────────────────┘   │
│                        │                                │
│         ┌──────────────┼──────────────┐                │
│         ▼              ▼              ▼                │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐          │
│  │  Upstash  │  │  GitHub   │  │ (Future)  │          │
│  │   Redis   │  │    Raw    │  │ Supabase  │          │
│  │  (cache)  │  │ (patterns)│  │    DB     │          │
│  └───────────┘  └───────────┘  └───────────┘          │
└─────────────────────────────────────────────────────────┘
```

## Contributing

Patterns are stored in the [nyko-ai/patterns](https://github.com/nyko-ai/patterns) repository. See the contributing guide there for adding new patterns.

## License

MIT
