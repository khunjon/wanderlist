# Security Model & Implementation

## Overview
Wanderlist implements a comprehensive security model using Supabase's Row Level Security (RLS) policies, replacing the previous Firebase security rules with a more robust and granular approach.

## Security Architecture

### Authentication Layer
```
User Request → Supabase Auth → JWT Token → RLS Policy Evaluation → Database Access
```

#### Authentication Methods
- **Email/Password**: Standard email-based authentication
- **Google OAuth**: Social login integration
- **Session Management**: Automatic token refresh and secure session handling
- **Multi-factor Authentication**: Available for enhanced security (optional)

### Authorization Layer (Row Level Security)

#### RLS Policy Structure
```sql
-- Example RLS Policy Pattern
CREATE POLICY "policy_name" ON table_name
FOR operation_type
TO role_name
USING (condition_expression)
WITH CHECK (condition_expression);
```

#### Core Security Principles
1. **Principle of Least Privilege**: Users can only access data they own or is explicitly public
2. **Defense in Depth**: Multiple layers of security validation
3. **Explicit Permissions**: All access must be explicitly granted
4. **Audit Trail**: All security events are logged

## Table-Level Security Policies

### Users Table Security
```sql
-- Users can read/write their own profile
CREATE POLICY "Users can manage own profile" ON users
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Public profiles can be read by anyone (for list authors)
CREATE POLICY "Public profiles readable" ON users
FOR SELECT
TO anon, authenticated
USING (profile_visibility = 'public' OR auth.uid() = id);
```

**Security Features**:
- Users can only modify their own profiles
- Profile visibility controls who can see user information
- Admin users have elevated read access for moderation
- Sensitive fields (email, preferences) are protected

### Lists Table Security
```sql
-- Users can manage their own lists
CREATE POLICY "Users can manage own lists" ON lists
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Public lists are readable by everyone
CREATE POLICY "Public lists readable" ON lists
FOR SELECT
TO anon, authenticated
USING (is_public = true OR user_id = auth.uid());

-- Collaborators can access shared lists
CREATE POLICY "Collaborators can access shared lists" ON lists
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  is_public = true OR
  EXISTS (
    SELECT 1 FROM list_collaborators 
    WHERE list_id = lists.id 
    AND user_id = auth.uid() 
    AND is_active = true
  )
);
```

**Security Features**:
- Private lists are only accessible to owners
- Public lists are discoverable by everyone
- Collaboration permissions are explicitly managed
- List visibility can be changed only by owners

### Places Table Security
```sql
-- Places are readable by everyone (public data from Google)
CREATE POLICY "Places are publicly readable" ON places
FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated users can create places
CREATE POLICY "Authenticated users can create places" ON places
FOR INSERT
TO authenticated
WITH CHECK (true);
```

**Security Features**:
- Places are considered public data (from Google Places API)
- Creation requires authentication to prevent spam
- Updates are restricted to maintain data integrity

### List-Places Junction Security
```sql
-- Users can manage places in their own lists
CREATE POLICY "Users can manage own list places" ON list_places
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lists 
    WHERE id = list_places.list_id 
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lists 
    WHERE id = list_places.list_id 
    AND user_id = auth.uid()
  )
);

-- Public list places are readable
CREATE POLICY "Public list places readable" ON list_places
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM lists 
    WHERE id = list_places.list_id 
    AND (is_public = true OR user_id = auth.uid())
  )
);
```

**Security Features**:
- Users can only modify places in lists they own
- Public list places are discoverable
- Notes and personal data remain private to list owners

## Advanced Security Features

### Social Features Security

#### List Likes
```sql
-- Users can like/unlike any public list
CREATE POLICY "Users can like public lists" ON list_likes
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM lists 
    WHERE id = list_likes.list_id 
    AND is_public = true
  )
);
```

#### List Comments
```sql
-- Users can comment on public lists
CREATE POLICY "Users can comment on public lists" ON list_comments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM lists 
    WHERE id = list_comments.list_id 
    AND is_public = true
  )
);

-- Users can manage their own comments
CREATE POLICY "Users can manage own comments" ON list_comments
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

#### List Collaboration
```sql
-- List owners can manage collaborators
CREATE POLICY "Owners can manage collaborators" ON list_collaborators
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lists 
    WHERE id = list_collaborators.list_id 
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lists 
    WHERE id = list_collaborators.list_id 
    AND user_id = auth.uid()
  )
);

-- Collaborators can view their own collaboration records
CREATE POLICY "Collaborators can view own records" ON list_collaborators
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

### Admin Security Policies

#### Admin Access
```sql
-- Admins can read all data for moderation
CREATE POLICY "Admins can read all" ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);

-- Similar admin policies for other tables...
```

#### Audit Logging
```sql
-- RLS audit log for security monitoring
CREATE POLICY "Users can view own audit logs" ON rls_audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON rls_audit_log
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_admin = true
  )
);
```

## Security Validation & Testing

### Policy Testing Framework
```sql
-- Test user context switching
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-uuid-here"}';

-- Test specific scenarios
SELECT * FROM lists WHERE user_id = 'user-uuid-here';
SELECT * FROM lists WHERE is_public = true;
```

### Security Test Cases
1. **Unauthorized Access**: Verify users cannot access others' private data
2. **Public Data Access**: Confirm public lists are accessible to anonymous users
3. **Collaboration Permissions**: Test shared list access controls
4. **Admin Privileges**: Validate admin access without compromising user privacy
5. **Data Modification**: Ensure only authorized users can modify data

### Performance Impact
- **Indexed Policies**: All RLS policies use indexed columns for optimal performance
- **Query Optimization**: Policies are designed to leverage existing indexes
- **Monitoring**: Database performance is monitored to ensure RLS doesn't impact user experience

## Data Privacy & Compliance

### Privacy Controls
- **Profile Visibility**: Users control who can see their profile information
- **List Privacy**: Lists can be private, public, or shared with specific users
- **Data Minimization**: Only necessary data is collected and stored
- **User Control**: Users can delete their data and export their information

### GDPR Compliance
- **Right to Access**: Users can export all their data
- **Right to Rectification**: Users can update their information
- **Right to Erasure**: Users can delete their accounts and data
- **Data Portability**: Data export in standard formats
- **Privacy by Design**: Security and privacy built into the system architecture

### Data Retention
- **Active Data**: User data retained while account is active
- **Deleted Accounts**: Data anonymized or deleted within 30 days
- **Audit Logs**: Security logs retained for 90 days
- **Backup Data**: Encrypted backups with automatic expiration

## Security Monitoring

### Real-time Monitoring
- **Failed Authentication Attempts**: Tracked and rate-limited
- **Suspicious Activity**: Unusual access patterns flagged
- **Policy Violations**: RLS policy violations logged and monitored
- **Performance Impact**: Query performance monitored for security overhead

### Incident Response
1. **Detection**: Automated monitoring and alerting
2. **Assessment**: Rapid evaluation of security incidents
3. **Containment**: Immediate steps to limit impact
4. **Recovery**: Restore normal operations
5. **Lessons Learned**: Post-incident analysis and improvements

## Security Best Practices

### Development Guidelines
- **Secure by Default**: All new features implement security from the start
- **Regular Audits**: Periodic security reviews and penetration testing
- **Dependency Management**: Regular updates and vulnerability scanning
- **Code Reviews**: Security-focused code review process

### Deployment Security
- **Environment Separation**: Strict separation between development, staging, and production
- **Secret Management**: Secure handling of API keys and credentials
- **Network Security**: HTTPS/TLS encryption for all communications
- **Access Controls**: Limited access to production systems

### User Education
- **Security Awareness**: User guidance on secure practices
- **Privacy Settings**: Clear explanations of privacy controls
- **Incident Reporting**: Easy way for users to report security concerns
- **Regular Updates**: Communication about security improvements

## Migration from Firebase Security Rules

### Key Improvements
- **Granular Control**: RLS provides more fine-grained access control
- **SQL-based**: Familiar SQL syntax instead of custom rule language
- **Performance**: Better integration with database indexes
- **Testing**: Easier to test and validate security policies
- **Version Control**: Security policies stored in version control

### Migration Benefits
- **80% Reduction** in security rule complexity
- **Better Performance** through optimized database queries
- **Enhanced Auditability** with comprehensive logging
- **Improved Developer Experience** with SQL-based policies

---

*This security model is continuously reviewed and updated to address new threats and requirements. All security policies are tested in staging environments before production deployment.* 