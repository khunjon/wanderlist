# 🏗️ System Architecture Overview

This section contains comprehensive documentation for Wanderlist's system architecture, design decisions, and technical patterns.

## 🎯 High-Level System Design

### 📊 Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │    │   (Supabase)    │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • React UI      │    │ • PostgreSQL    │    │ • Google Places │
│ • TypeScript    │    │ • Auth System   │    │ • Google Maps   │
│ • Tailwind CSS  │    │ • Real-time     │    │ • Vercel        │
│ • State Mgmt    │    │ • Storage       │    │ • CDN           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Development   │
                    │   Tools (MCP)   │
                    ├─────────────────┤
                    │ • Cursor AI     │
                    │ • Database Ops  │
                    │ • Type Gen      │
                    │ • Performance   │
                    └─────────────────┘
```

### 🔧 Core Components

#### **Frontend Layer**
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling system
- **React Hooks** - State management and lifecycle

#### **Backend Layer**
- **Supabase** - Backend-as-a-Service platform
- **PostgreSQL** - Relational database with ACID compliance
- **Row Level Security** - Database-level authorization
- **Real-time Subscriptions** - Live data synchronization

#### **External Services**
- **Google Places API** - Location search and details
- **Google Maps** - Interactive map display
- **Vercel** - Deployment and hosting platform
- **CDN** - Global content delivery

## 🎯 Key Technology Decisions

### ✅ **Frontend Architecture**

#### **Next.js 15 Choice**
- **Server-Side Rendering** → Better SEO for public list discovery
- **API Routes** → Simplified backend integration
- **File-based Routing** → Intuitive project structure
- **TypeScript Support** → Built-in type safety
- **Performance** → Automatic optimization and code splitting

#### **State Management Strategy**
- **React Hooks** → Simple component-level state
- **Supabase Real-time** → Server state synchronization
- **No Redux** → Avoid complexity for our use case
- **Local Storage** → Persist user preferences

### ✅ **Backend Architecture**

#### **PostgreSQL over NoSQL**
- **Relational Data** → Clear relationships (users → lists → places)
- **Complex Queries** → Joins, aggregations, full-text search
- **ACID Compliance** → Data consistency for critical operations
- **Scalability** → PostgreSQL scales well for our use case
- **Developer Experience** → SQL familiarity and powerful querying

#### **Supabase Platform Choice**
- **Rapid Development** → Auto-generated APIs and types
- **Built-in Auth** → Secure authentication with multiple providers
- **Real-time Features** → WebSocket subscriptions out of the box
- **Row Level Security** → Database-level authorization
- **Storage Integration** → File uploads and management

### ✅ **Security Model**
- **Row Level Security** → Database-enforced permissions
- **JWT Authentication** → Stateless, scalable auth tokens
- **Google OAuth** → Secure third-party authentication
- **HTTPS Everywhere** → End-to-end encryption

## 📁 Architecture Documentation

### ✅ Available Now
- **[overview.md](./overview.md)** - Complete system architecture and design decisions
- **[LIST_LOADING_OPTIMIZATION.md](./LIST_LOADING_OPTIMIZATION.md)** - Hybrid client/server loading solution
- **[CLIENT_TO_API_MIGRATION.md](./CLIENT_TO_API_MIGRATION.md)** - Client-side to server-side API patterns

### 🔄 Coming Soon
- **technology-decisions.md** - Detailed technology stack rationale
- **data-flow.md** - Data flow patterns and state management
- **caching-strategy.md** - Caching layers and invalidation strategies
- **scalability.md** - Scalability considerations and patterns
- **deployment-architecture.md** - Production deployment and infrastructure
- **monitoring-architecture.md** - Observability and monitoring systems

## 🎯 Design Patterns

### 🗄️ **Database Function Pattern**
```sql
-- Complex operations as database functions
CREATE OR REPLACE FUNCTION get_enhanced_user_lists(user_uuid UUID)
RETURNS TABLE(...) AS $$
BEGIN
  -- Complex logic with multiple joins and aggregations
  -- Better performance than multiple client-side queries
  -- Atomic operations with proper error handling
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Benefits:**
- Reduced network round trips
- Better performance through database optimization
- Atomic operations with transaction safety
- Centralized business logic

### ⚛️ **Component Architecture Pattern**
```typescript
// Clear separation between UI and business logic
export function ListComponent({ listId }: { listId: string }) {
  const { data: list, loading, error } = useList(listId)
  const { addPlace, removePlace } = useListMutations(listId)
  
  if (loading) return <ListSkeleton />
  if (error) return <ErrorBoundary error={error} />
  
  return <ListDisplay list={list} onAddPlace={addPlace} />
}
```

### 🔐 **Security Pattern**
```typescript
// Database-level security with RLS policies
CREATE POLICY "Users can manage own lists" ON lists
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

## 🔗 Related Documentation

### 📊 **Specialized Areas**
- **[Database](../database/)** - Database schema, queries, and optimization
- **[Security](../security/)** - Security policies and implementation details
- **[Performance](../performance/)** - Performance optimization strategies
- **[API](../api/)** - API design and integration patterns

### 🛠️ **Implementation Guides**
- **[Components](../components/)** - Component architecture and patterns
- **[Setup](../setup/)** - Development environment and deployment
- **[Troubleshooting](../troubleshooting/)** - Common issues and solutions

## 🚀 Architecture Evolution

### 📈 **Migration Journey**
- **From:** Firebase (Firestore, Auth, Storage)
- **To:** Supabase (PostgreSQL, Auth, Storage)
- **Benefits:** 80% faster queries, enhanced security, better developer experience

### 🎯 **Key Achievements**
- **Performance:** 80% faster queries than Firestore
- **Security:** 15+ RLS policies replacing 4 Firestore rules
- **Features:** 25+ optimized database functions
- **Developer Experience:** MCP integration for enhanced development

### 🔮 **Future Considerations**
- **Microservices:** Potential service decomposition for scale
- **Event-Driven Architecture:** Real-time collaboration improvements
- **Edge Computing:** Global performance optimization
- **AI Integration:** Smart recommendations and automation

---

*Last Updated: June 10, 2025* 