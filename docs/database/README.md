---
title: "Database Documentation"
last_updated: "2025-01-15"
status: "current"
review_cycle: "monthly"
---

# 🗄️ Database Documentation

> **📍 Navigation:** [Documentation Hub](../README.md) → [Database Documentation](./README.md) → Database Overview

This directory contains comprehensive documentation for Wanderlist's PostgreSQL database, including schema design, performance optimization, maintenance procedures, and security implementation.

## 📋 Quick Reference

### 🎯 **Database Overview**
- **Database**: PostgreSQL 15+ (via Supabase)
- **Schema Version**: Latest (January 2025)
- **Tables**: 4 core tables with optimized relationships
- **Security**: Row Level Security (RLS) with 15+ policies
- **Functions**: 25+ database functions for optimized operations
- **Performance**: Sub-100ms query times with comprehensive monitoring

### 📊 **Implementation Status**
| Component | Status | Performance | Security |
|-----------|--------|-------------|----------|
| **Core Schema** | ✅ COMPLETED | 80% faster than Firestore | ✅ RLS Protected |
| **User Management** | ✅ COMPLETED | <50ms queries | ✅ Profile Privacy |
| **List Operations** | ✅ COMPLETED | <100ms queries | ✅ Owner/Public Access |
| **Place Management** | ✅ COMPLETED | <200ms with Google API | ✅ Deduplication |
| **Analytics Functions** | ✅ COMPLETED | <25ms aggregations | ✅ Privacy Compliant |
| **Real-time Subscriptions** | 🔄 IN PROGRESS | Basic implementation | Q3 2025 |
| **Advanced Indexing** | 📋 PLANNED | Materialized views | Q4 2025 |

### 📈 **Key Metrics**
| Metric | Value | Status |
|--------|-------|---------|
| **Tables** | 4 core tables | ✅ Optimized |
| **Indexes** | 75+ indexes | ⚠️ Over-indexed |
| **RLS Policies** | 15+ policies | ✅ Comprehensive |
| **Functions** | 25+ functions | ✅ Well-documented |
| **Query Performance** | <100ms avg | ✅ Excellent |

## 🏗️ Schema Overview

### 📊 **Core Tables**

#### **✅ 1. Users Table (`public.users`) - COMPLETED**
Extends Supabase auth.users with profile information.

```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  bio TEXT DEFAULT '' CHECK (LENGTH(bio) <= 500),
  instagram TEXT DEFAULT '' CHECK (LENGTH(instagram) <= 30),
  tiktok TEXT DEFAULT '' CHECK (LENGTH(tiktok) <= 24),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features**:
- **Profile Management**: Bio, social media links, profile photos
- **Admin System**: Role-based access control
- **Validation**: Input constraints for social media usernames
- **Audit Trail**: Created/updated timestamps

#### **✅ 2. Lists Table (`public.lists`) - COMPLETED**
Core entity for organizing places into collections.

```sql
CREATE TABLE public.lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (LENGTH(name) > 0),
  description TEXT DEFAULT '',
  city TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features**:
- **Privacy Control**: Public/private visibility
- **Categorization**: Tag-based organization
- **Analytics**: View count tracking
- **Geographic Context**: City-based grouping

#### **✅ 3. Places Table (`public.places`) - COMPLETED**
Stores Google Places data with local enhancements.

```sql
CREATE TABLE public.places (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  google_place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  rating DECIMAL(2, 1) DEFAULT 0,
  photo_url TEXT DEFAULT '',
  place_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features**:
- **Google Integration**: Unique Google Place ID mapping
- **Geographic Data**: Precise latitude/longitude coordinates
- **Rich Metadata**: Ratings, photos, place types
- **Deduplication**: Prevents duplicate place entries

#### **✅ 4. List Places Table (`public.list_places`) - COMPLETED**
Junction table connecting lists and places with user notes.

```sql
CREATE TABLE public.list_places (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE NOT NULL,
  notes TEXT DEFAULT '',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, place_id)
);
```

**Key Features**:
- **Many-to-Many Relationship**: Lists can contain multiple places
- **Personal Notes**: User-specific annotations for places
- **Temporal Tracking**: When places were added to lists
- **Uniqueness Constraint**: Prevents duplicate entries

## 🔗 Table Relationships

### 📊 **Entity Relationship Diagram**
```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Users    │──────▶│    Lists    │──────▶│ List_Places │
│             │ 1:N   │             │ 1:N   │             │
│ - id (PK)   │       │ - id (PK)   │       │ - id (PK)   │
│ - email     │       │ - user_id   │       │ - list_id   │
│ - name      │       │ - name      │       │ - place_id  │
│ - photo_url │       │ - is_public │       │ - notes     │
└─────────────┘       └─────────────┘       └─────────────┘
                                                    │
                                                    │ N:1
                                                    ▼
                                            ┌─────────────┐
                                            │   Places    │
                                            │             │
                                            │ - id (PK)   │
                                            │ - google_id │
                                            │ - name      │
                                            │ - location  │
                                            └─────────────┘
```

### 🔄 **Relationship Details**
- **Users → Lists**: One-to-Many (User can have multiple lists)
- **Lists → List_Places**: One-to-Many (List can contain multiple places)
- **Places → List_Places**: One-to-Many (Place can be in multiple lists)
- **Users → List_Places**: Indirect through Lists (for RLS policies)

## 🔐 Row Level Security (RLS) Model

### 🛡️ **Security Overview**
Wanderlist implements comprehensive Row Level Security to ensure data privacy and proper access control.

#### **✅ Security Principles - COMPLETED**
1. **User Data Isolation**: Users can only access their own data
2. **Public Content Discovery**: Public lists are discoverable by all users
3. **Admin Override**: Administrators have read access to all data
4. **Authenticated Operations**: Most operations require authentication

### 🔒 **RLS Policies by Table**

#### **✅ Users Table Policies - COMPLETED**
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile  
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Public profiles readable (for list authors)
CREATE POLICY "Public profiles readable" ON public.users
  FOR SELECT USING (true);

-- Enable user registration
CREATE POLICY "Enable insert for authenticated users" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### **✅ Lists Table Policies - COMPLETED**
```sql
-- Users can create lists
CREATE POLICY "Users can create lists" ON public.lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own lists
CREATE POLICY "Users can read own lists" ON public.lists
  FOR SELECT USING (auth.uid() = user_id);

-- Public lists are discoverable
CREATE POLICY "Public lists are readable" ON public.lists
  FOR SELECT USING (is_public = true);

-- Users can modify their own lists
CREATE POLICY "Users can update own lists" ON public.lists
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## 📁 Database Documentation Structure

### **✅ Core Documentation - COMPLETED**
- **[Database Schema](./schema.sql)** - Complete PostgreSQL schema with all tables and indexes
- **[Performance Optimization](./performance.md)** - Query optimization and indexing strategies
- **[Maintenance Procedures](./maintenance.md)** - Database maintenance and monitoring
- **[Index Monitoring](./index-monitoring.md)** - Index performance analysis and optimization
- **[Materialized Views](./materialized-views.md)** - View optimization strategies

### **✅ Database Functions - COMPLETED**
- **[Functions Overview](./functions/README.md)** - Database function patterns and architecture
- **[User Management Functions](./functions/user-management.md)** - User-related database operations
- **[List Operations Functions](./functions/list-operations.md)** - List management and optimization
- **[Analytics Functions](./functions/analytics.md)** - Analytics and tracking functions
- **[Monitoring Functions](./functions/monitoring.md)** - Database monitoring and health checks

---

## 🔗 Related Documentation

### **🏗️ Architecture & Design**
- **[System Architecture](../architecture/overview.md)** - Database role in overall system design
- **[Security Model](../security/README.md)** - RLS policies and security implementation
- **[API Design](../api/README.md)** - Database integration with API endpoints

### **⚡ Performance & Optimization**
- **[Performance Overview](../performance/README.md)** - Database performance in system context
- **[Performance Monitoring](../performance/monitoring.md)** - Database monitoring tools and setup
- **[Performance Utilities](../performance/utilities.md)** - Development tools for database optimization

### **🛠️ Development & Setup**
- **[Supabase Configuration](../setup/supabase-configuration.md)** - Database setup and configuration
- **[MCP Integration](../setup/mcp-integration.md)** - AI-assisted database development
- **[Database Troubleshooting](../troubleshooting/database.md)** - Common database issues and solutions

### **📖 Historical Context**
- **[Migration History](../history/README.md)** - Firebase to Supabase migration process
- **[Architecture Decisions](../history/decisions.md)** - Database technology and design decisions
- **[Lessons Learned](../history/lessons-learned.md)** - Database migration insights

## 🎯 Next Steps

### **For New Developers**
1. **[Database Schema](./schema.sql)** - Understand the complete data model
2. **[Database Functions](./functions/README.md)** - Learn database function patterns
3. **[API Integration](../api/README.md)** - See how database connects to APIs

### **For Database Development**
1. **[Performance Optimization](./performance.md)** - Query optimization techniques
2. **[Database Functions](./functions/)** - Implementing business logic in database
3. **[Security Policies](../security/README.md)** - RLS policy implementation

### **For Performance Optimization**
1. **[Index Monitoring](./index-monitoring.md)** - Index performance analysis
2. **[Materialized Views](./materialized-views.md)** - Advanced optimization techniques
3. **[Performance Monitoring](../performance/monitoring.md)** - Database performance tracking

### **For Troubleshooting**
1. **[Database Issues](../troubleshooting/database.md)** - Common problems and solutions
2. **[Performance Issues](../troubleshooting/performance.md)** - Database performance debugging
3. **[Maintenance Procedures](./maintenance.md)** - Proactive database maintenance

---

*📍 **Parent Topic:** [Database Documentation](./README.md) | **Documentation Hub:** [Main Index](../README.md)*

CREATE POLICY "Users can delete own lists" ON public.lists
  FOR DELETE USING (auth.uid() = user_id);
```

#### **Places Table Policies**
```sql
-- Places are public data (Google Places)
CREATE POLICY "Places are readable" ON public.places
  FOR SELECT USING (true);

-- Authenticated users can create places
CREATE POLICY "Authenticated users can create places" ON public.places
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

#### **List Places Table Policies**
```sql
-- Users can manage places in their own lists
CREATE POLICY "Users can add places to own lists" ON public.list_places
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = list_id AND user_id = auth.uid()
    )
  );

-- Users can read places from their lists and public lists
CREATE POLICY "Users can read own list places" ON public.list_places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = list_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public list places are readable" ON public.list_places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = list_id AND is_public = true
    )
  );
```

### 🔧 **Security Best Practices**
1. **Function Security**: All functions use `SECURITY DEFINER` for controlled access
2. **Input Validation**: Database-level constraints prevent invalid data
3. **Audit Trail**: Timestamps track all data modifications
4. **Admin Policies**: Separate policies for administrative access

## ⚡ Database Functions Summary

### 📊 **Core Functions**

#### **1. User List Management**
```sql
-- Get user lists with place counts
CREATE OR REPLACE FUNCTION get_user_lists_with_counts(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  city TEXT,
  tags TEXT[],
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  view_count INTEGER,
  place_count BIGINT
);
```

**Purpose**: Efficiently retrieve user lists with aggregated place counts
**Performance**: Single query vs multiple round trips
**Usage**: Primary function for lists page

#### **2. Analytics Functions**
```sql
-- Increment list view count
CREATE OR REPLACE FUNCTION increment_list_view_count(list_uuid UUID)
RETURNS void;
```

**Purpose**: Track list popularity for discovery algorithms
**Performance**: Atomic operation with minimal overhead
**Usage**: Called when users view public lists

### 🔧 **Monitoring Functions**
```sql
-- Database health monitoring
CREATE OR REPLACE FUNCTION check_table_bloat()
CREATE OR REPLACE FUNCTION get_urgent_maintenance_tables()
CREATE OR REPLACE FUNCTION get_autovacuum_settings()
CREATE OR REPLACE FUNCTION perform_maintenance_vacuum()
```

**Purpose**: MCP-integrated database monitoring and maintenance
**Performance**: Real-time health assessment
**Usage**: Automated maintenance and performance optimization

### 📈 **Materialized Views Functions**
```sql
-- Materialized views readiness assessment
CREATE OR REPLACE FUNCTION should_implement_materialized_views()
CREATE OR REPLACE FUNCTION analyze_mv_candidates()
CREATE OR REPLACE FUNCTION get_mv_implementation_roadmap()
```

**Purpose**: Scalability planning and performance optimization
**Performance**: Automated scaling decision support
**Usage**: Growth-based optimization triggers

## 📁 Documentation Structure

### 📋 **File Organization**
```
docs/database/
├── README.md                    # This overview document
├── schema.sql                   # Complete database schema
├── performance.md               # Performance optimization guide
├── maintenance.md               # Database maintenance procedures
├── index-monitoring.md          # Index performance monitoring
├── materialized-views.md        # Materialized views strategy
└── functions/                   # Individual function documentation
    ├── README.md               # Functions overview
    ├── user-management.md      # User-related functions
    ├── list-operations.md      # List management functions
    ├── analytics.md            # Analytics and tracking functions
    └── monitoring.md           # Database monitoring functions
```

### 🔗 **Quick Navigation**

#### **📊 Schema & Design**
- **[Complete Schema](./schema.sql)** - Full database schema with all tables, indexes, and policies
- **[Performance Guide](./performance.md)** - Query optimization and performance monitoring
- **[Maintenance Procedures](./maintenance.md)** - Database maintenance and health monitoring

#### **🔧 Operations & Monitoring**
- **[Index Monitoring](./index-monitoring.md)** - Index performance and optimization
- **[Materialized Views](./materialized-views.md)** - Scalability and caching strategy
- **[Functions Documentation](./functions/)** - Detailed function documentation

#### **🚀 Performance & Optimization**
- **Query Performance**: Sub-100ms average response times
- **Index Strategy**: Optimized for common query patterns
- **Monitoring**: MCP-integrated real-time monitoring
- **Scalability**: Materialized views roadmap for growth

## 🎯 Key Performance Highlights

### ⚡ **Current Performance**
- **Average Query Time**: 0.12ms (excellent)
- **Index Hit Ratio**: >95% (optimal)
- **Planning Time**: 1.6ms (good)
- **Function Performance**: Optimized for common operations

### 📈 **Optimization Achievements**
- **80% Faster Queries**: Compared to previous Firebase implementation
- **15+ RLS Policies**: Comprehensive security implementation
- **25+ Database Functions**: Optimized server-side operations
- **Real-time Subscriptions**: Efficient change notifications

### 🔧 **Monitoring & Maintenance**
- **MCP Integration**: Real-time database monitoring
- **Automated Maintenance**: Proactive table bloat management
- **Performance Tracking**: Continuous query optimization
- **Scalability Planning**: Growth-based optimization triggers

---

*Last Updated: January 15, 2025* 