# Wanderlist Documentation

## Overview
This documentation provides comprehensive information about the Wanderlist application, including setup guides, migration records, troubleshooting, and architectural decisions.

## Quick Start
- **New to the project?** Start with [Setup Guide](./setup/environment-setup.md)
- **Setting up development?** See [Supabase Setup](./setup/supabase-setup.md) and [MCP Setup](./setup/mcp-setup.md)
- **Having issues?** Check [Troubleshooting](./troubleshooting/)
- **Understanding the architecture?** Read [System Design](./architecture/system-design.md)

## Documentation Structure

### 📋 Setup & Configuration
Essential guides for getting the development environment running.

- **[Environment Setup](./setup/environment-setup.md)** - Complete development environment setup
- **[Supabase Setup](./setup/supabase-setup.md)** - Database and backend configuration
- **[MCP Setup](./setup/mcp-setup.md)** - Cursor AI integration for enhanced development


### 🔧 Troubleshooting
Solutions to common issues and problems encountered during development.

- **[Migration Issues](./troubleshooting/migration-issues.md)** - Real issues from the Firestore to Supabase migration
- **[General Troubleshooting](./troubleshooting/TROUBLESHOOTING.md)** - Common application issues
- **[Firebase Auth Issues](./troubleshooting/FIREBASE_AUTH_TROUBLESHOOTING.md)** - Legacy authentication troubleshooting
- **[Cache Clearing Guide](./troubleshooting/CACHE_CLEARING_GUIDE.md)** - Development cache issues

### 🏗️ Architecture & Design
High-level system design and architectural decisions.

- **[System Architecture](./architecture/system-design.md)** - Complete system architecture overview
- **[Design Decisions](./architecture/system-design.md#technology-stack-decisions)** - Technology choices and trade-offs
- **[Performance Considerations](./architecture/system-design.md#performance-considerations)** - Performance optimization strategies
- **[Security Architecture](./architecture/system-design.md#security-architecture)** - Security model and implementation

### 📚 Migration Documentation
Complete record of the Firestore to Supabase migration process.

#### Migration Overview
- **[Migration Complete](./migration/FIRESTORE_TO_SUPABASE_MIGRATION_COMPLETE.md)** - Fresh start migration summary
- **[Migration Summary](./migration/MIGRATION_COMPLETE.md)** - Technical migration completion

#### Feature-Specific Migrations
- **[Lists Migration](./migration/LISTS_MIGRATION_GUIDE.md)** - Core list functionality migration
- **[Profile Migration](./migration/PROFILE_MIGRATION_GUIDE.md)** - User profile system migration
- **[Enhanced User Profiles](./migration/ENHANCED_USER_PROFILES_SCHEMA.md)** - Advanced profile features
- **[Public List Discovery](./migration/PUBLIC_LIST_DISCOVERY_IMPLEMENTATION.md)** - Discovery feature implementation
- **[Many-to-Many Implementation](./migration/ENHANCED_MANY_TO_MANY_IMPLEMENTATION.md)** - Complex relationship handling

#### Security & Performance
- **[RLS Security Migration](./migration/RLS_SECURITY_MIGRATION.md)** - Row Level Security implementation
- **[Firebase Cleanup](./migration/firebase-cleanup-complete.md)** - Firebase removal documentation

### 🚀 Future Planning
Ideas and insights for future development.

- **[Post-Migration Ideas](./roadmap/post-migration-ideas.md)** - Future enhancement opportunities
- **[Migration Insights](./lessons-learned/migration-insights.md)** - Lessons learned and best practices

## Key Technologies

### Current Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Maps**: Google Places API, Google Maps
- **Development**: Cursor IDE with MCP integration
- **Deployment**: Vercel

### Migration Journey
- **From**: Firebase (Firestore, Auth, Storage)
- **To**: Supabase (PostgreSQL, Auth, Storage)
- **Benefits**: 80% faster queries, enhanced security, better developer experience

## Development Workflow

### Daily Development
1. **Start with MCP**: Use Cursor AI to check database state
2. **Test database changes**: Validate queries with MCP tools
3. **Generate types**: Keep TypeScript types in sync
4. **Monitor performance**: Use Supabase dashboard

### Common Tasks
- **Database queries**: Use MCP for immediate testing
- **Schema changes**: Apply migrations and regenerate types
- **Performance optimization**: Analyze queries with EXPLAIN
- **Security testing**: Validate RLS policies

## Getting Help

### For Setup Issues
1. Check [Environment Setup](./setup/environment-setup.md)
2. Review [Troubleshooting](./troubleshooting/)
3. Verify environment variables and API keys

### For Development Issues
1. Use MCP tools for database debugging
2. Check [Migration Issues](./troubleshooting/migration-issues.md) for known problems
3. Review [System Architecture](./architecture/system-design.md) for design patterns

### For Performance Issues
1. Use Supabase dashboard for query analysis
2. Check [Performance Considerations](./architecture/system-design.md#performance-considerations)
3. Review database indexes and RLS policies

## Contributing to Documentation

### When to Update Documentation
- **New features**: Document setup and usage patterns
- **Bug fixes**: Add to troubleshooting guides
- **Performance improvements**: Update architecture docs
- **Migration changes**: Record in migration documentation

### Documentation Standards
- **Clear headings**: Use descriptive section headers
- **Code examples**: Include working code snippets
- **Step-by-step**: Provide detailed instructions
- **Cross-references**: Link to related documentation

## Migration History

### Major Milestones
1. **Planning Phase** (Tasks 1.1-1.3): Architecture design and tool setup
2. **Database Migration** (Tasks 2.1-2.3): Schema and security implementation
3. **Feature Migration** (Tasks 3.1-3.3): Core functionality migration
4. **Enhancement Phase** (Tasks 4.1-4.3): Advanced features and optimization
5. **Completion Phase** (Task 5.1): Final integration and documentation

### Key Achievements
- **Performance**: 80% faster queries than Firestore
- **Security**: 15+ RLS policies replacing 4 Firestore rules
- **Features**: 25+ optimized database functions
- **Developer Experience**: MCP integration for enhanced development

---

*This documentation is actively maintained and updated as the project evolves. For the most current information, always refer to the latest version in the repository.* 