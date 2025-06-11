# Supabase MCP Setup Instructions

## ⚠️ IMPORTANT: Complete the Setup

You need to replace the placeholder token in `.cursor/mcp.json` with your actual Supabase Personal Access Token.

### Steps:

1. **Get your Personal Access Token:**
   - Go to your Supabase dashboard
   - Navigate to **Settings** > **Access Tokens**
   - Click **Generate new token**
   - Name it "Cursor MCP Server"
   - Copy the generated token

2. **Update the configuration:**
   - Open `.cursor/mcp.json`
   - Replace `REPLACE_WITH_YOUR_PERSONAL_ACCESS_TOKEN` with your actual token
   - Save the file

3. **Restart Cursor:**
   - Close and reopen Cursor
   - Go to **Settings** > **MCP**
   - You should see a green "Active" status for the Supabase server

## 🛠️ Available MCP Tools

Once connected, you can ask me to:

- **Database Management:**
  - Create and modify tables
  - Run SQL queries
  - Generate TypeScript types from your schema
  - Fetch project configuration

- **Project Management:**
  - Create new Supabase projects
  - Pause and restore projects
  - Manage database branches (experimental)

- **Development:**
  - Fetch Supabase URLs and keys for your `.env.local`
  - Debug issues by retrieving logs
  - Track schema changes with migrations

## 🧪 Test the Connection

After setup, try asking me:
- "Show me my Supabase project configuration"
- "List all tables in my database"
- "Generate TypeScript types for my schema"
- "Create a new table for user preferences"

## 🔒 Security Note

- Keep your Personal Access Token secure
- Don't commit it to version control
- The token gives access to your Supabase account, so treat it like a password 