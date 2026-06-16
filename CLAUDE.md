# FK_LEARNING_1

## Social Media Analysis with Apify MCP

This project uses the [Apify MCP server](https://github.com/apify/actors-mcp-server) to give Claude access to social media scrapers and web automation tools.

### What you can do

Ask Claude things like:
- "Analyze the Instagram profile @someaccount — how's their engagement?"
- "Scrape the latest 50 posts from @account and summarize the top-performing content"
- "What hashtags does @account use most?"
- "Compare the follower growth of these two TikTok accounts"

Apify provides 5,000+ ready-made scrapers for Instagram, TikTok, YouTube, LinkedIn, Twitter/X, and more.

### Setup

1. Get a free Apify API token at https://console.apify.com/account/integrations
2. Copy `.env.example` to `.env` and fill in your token:
   ```
   cp .env.example .env
   ```
3. Load the env var in your shell (or set it in Claude Code's environment):
   ```
   export APIFY_TOKEN=your_token_here
   ```
4. The MCP server starts automatically via Claude Code — no extra install needed (uses `npx`).

### MCP Config

The Apify MCP is configured in `.claude/settings.json`. It runs `@apify/actors-mcp-server` on demand using `npx`.
