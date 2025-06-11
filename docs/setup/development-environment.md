# Environment Setup Guide

## Overview
This guide walks you through setting up the complete development environment for Wanderlist, including Supabase, Google Cloud services, and MCP integration for enhanced AI-assisted development.

## Prerequisites

### Required Software
- **Node.js 18+** and npm
- **Git** for version control
- **Cursor IDE** (recommended for MCP integration)
- **Modern web browser** for testing

### Required Accounts
- **Supabase account** at [supabase.com](https://supabase.com)
- **Google Cloud account** with billing enabled
- **Vercel account** (for deployment)

## Environment Variables Setup

### 1. Create Environment File
Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Maps Integration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# MCP Configuration (for Cursor AI Development)
SUPABASE_PERSONAL_ACCESS_TOKEN=your-personal-access-token
```

### 2. Environment Variable Descriptions

#### Supabase Variables
- **`NEXT_PUBLIC_SUPABASE_URL`**: Your Supabase project URL
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Public anonymous key for client-side operations
- **`SUPABASE_SERVICE_ROLE_KEY`**: Service role key for server-side operations (keep secret!)

#### Google Cloud Variables
- **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`**: API key for Google Places and Maps services

#### Application Variables
- **`NEXT_PUBLIC_APP_URL`**: Base URL of your application (for redirects and links)

#### MCP Variables
- **`SUPABASE_PERSONAL_ACCESS_TOKEN`**: Personal access token for MCP database operations

## Supabase Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `wanderlist` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Wait for project creation (2-3 minutes)

### 2. Get Supabase Credentials
1. Go to **Settings** → **API**
2. Copy the following values to your `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Set Up Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql` from the project root
3. Paste and execute the SQL to create tables, functions, and policies

### 4. Configure Authentication
1. Go to **Authentication** → **Settings**
2. Configure **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**: 
   - `http://localhost:3000/auth/callback`
   - Your production domain when deploying

#### Enable Google OAuth (Optional)
1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials (see Google Cloud setup below)

### 5. Set Up Storage (for profile photos)
1. Go to **Storage**
2. Create a new bucket named `profile-photos`
3. Set bucket to **Public** for profile photo access
4. Configure RLS policies for the bucket

### 6. Generate Personal Access Token (for MCP)
1. Go to **Settings** → **Access Tokens**
2. Click **Generate new token**
3. Give it a descriptive name: `MCP Development Token`
4. Copy the token to `SUPABASE_PERSONAL_ACCESS_TOKEN` in `.env.local`

## Google Cloud Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Note your **Project ID**

### 2. Enable Required APIs
Enable these APIs in the **APIs & Services** → **Library**:
- **Places API**
- **Maps JavaScript API**
- **Geocoding API** (optional, for enhanced location features)

### 3. Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the API key to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`

### 4. Secure API Key (Recommended)
1. Click on your API key to edit it
2. Under **Application restrictions**:
   - For development: Choose **HTTP referrers** and add `localhost:3000`
   - For production: Add your production domain
3. Under **API restrictions**:
   - Choose **Restrict key**
   - Select only the APIs you enabled above

### 5. Set Up Google OAuth (Optional)
If you want Google sign-in:
1. Go to **APIs & Services** → **OAuth consent screen**
2. Configure your OAuth consent screen
3. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
4. Choose **Web application**
5. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
6. Copy **Client ID** and **Client Secret** to Supabase Auth settings

## MCP Integration Setup

### 1. Verify MCP Configuration
Check that `.cursor/mcp.json` exists with:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server"],
      "env": {
        "SUPABASE_PERSONAL_ACCESS_TOKEN": ""
      }
    }
  }
}
```

### 2. Configure MCP Environment
The MCP server will automatically use the `SUPABASE_PERSONAL_ACCESS_TOKEN` from your environment.

### 3. Test MCP Integration
1. Restart Cursor IDE
2. Open a new chat
3. Try asking: "Show me all tables in the database"
4. If working, you should see your Supabase tables listed

### 4. MCP Capabilities
With MCP enabled, you can:
- **Query database directly**: "Show me all lists in the database"
- **Execute SQL**: "Run this SQL query: SELECT COUNT(*) FROM users"
- **Generate types**: "Generate TypeScript types for the current schema"
- **Deploy functions**: "Deploy this database function and test it"
- **Analyze performance**: "Explain the performance of this query"

## Project Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd wanderlist
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Verify Environment
```bash
# Check that all environment variables are set
npm run env-check  # If you have this script, or manually verify
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Verify Setup
1. Open [http://localhost:3000](http://localhost:3000)
2. Try creating an account
3. Test place search functionality
4. Verify database operations work

## Development Workflow

### Daily Development
1. **Start with MCP**: Use MCP to check database state
2. **Test database changes**: Use MCP to test queries before implementing
3. **Generate types**: Regenerate TypeScript types after schema changes
4. **Monitor performance**: Use Supabase dashboard to monitor query performance

### Common MCP Commands
```bash
# In Cursor chat, try these commands:
"List all tables in the database"
"Show me the schema for the lists table"
"Execute: SELECT COUNT(*) FROM lists WHERE is_public = true"
"Generate TypeScript types for the current schema"
"Test this database function: get_user_lists('uuid-here')"
```

## Troubleshooting

### Environment Issues
```bash
# Verify environment variables are loaded
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Check for common issues
npm run build  # Should complete without errors
```

### Supabase Connection Issues
1. **Check project status**: Ensure Supabase project is not paused
2. **Verify URLs**: Ensure URLs don't have trailing slashes
3. **Test connection**: Use Supabase dashboard to test queries
4. **Check RLS**: Ensure Row Level Security policies allow your operations

### Google Maps Issues
1. **API key restrictions**: Ensure localhost is allowed for development
2. **Billing**: Ensure Google Cloud billing is enabled
3. **Quotas**: Check API usage quotas in Google Cloud Console

### MCP Issues
1. **Token validity**: Ensure personal access token is valid
2. **Restart Cursor**: Restart after adding token
3. **Network**: Check network connectivity to Supabase
4. **Permissions**: Ensure token has necessary permissions

## Production Deployment

### Environment Variables for Production
When deploying to Vercel or other platforms:

```bash
# Update these for production
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# MCP token not needed in production
```

### Production Checklist
- [ ] Update Supabase Auth redirect URLs
- [ ] Update Google Cloud API key restrictions
- [ ] Configure custom domain (if using)
- [ ] Set up monitoring and error tracking
- [ ] Test all functionality in production environment

## Security Considerations

### Environment Variables
- **Never commit** `.env.local` to version control
- **Use different keys** for development and production
- **Rotate keys regularly** especially if compromised
- **Limit API key permissions** to only what's needed

### Supabase Security
- **Enable RLS** on all tables
- **Test policies thoroughly** with different user contexts
- **Use service role key** only on server-side
- **Monitor access logs** in Supabase dashboard

### Google Cloud Security
- **Restrict API keys** to specific domains/IPs
- **Monitor API usage** for unusual patterns
- **Set up billing alerts** to prevent unexpected charges
- **Use least privilege** for OAuth scopes

---

*This setup guide should be updated as the project evolves and new requirements are added.* 