# 🔐 Authentication API

This document covers all authentication endpoints, including Google OAuth integration, session management, password operations, and user registration.

## 📋 Overview

The Authentication API provides secure user authentication using Supabase Auth with Google OAuth integration, session management, and comprehensive security features.

### 🎯 **Key Features**
- **Google OAuth 2.0**: Seamless Google account integration
- **Email/Password Auth**: Traditional authentication method
- **Session Management**: Secure session handling with cookies
- **Password Recovery**: Secure password reset functionality
- **Multi-device Support**: Session management across devices
- **Security Headers**: CSRF protection and secure cookies

### 📊 **Performance Metrics**
| Operation | Avg Response Time | Cache Strategy | Security Level |
|-----------|-------------------|----------------|----------------|
| **Google OAuth** | 300ms | No cache | ✅ OAuth 2.0 |
| **Email Login** | 250ms | No cache | ✅ Encrypted |
| **Session Refresh** | 150ms | No cache | ✅ JWT Tokens |
| **Password Reset** | 200ms | No cache | ✅ Secure Links |

## 🔗 Base Endpoints

### **Base URL Pattern**
```
/api/auth/login           # Email/password login
/api/auth/register        # User registration
/api/auth/logout          # User logout
/api/auth/session         # Session management
/api/auth/password        # Password operations
/auth/callback            # OAuth callback (special route)
```

## 🚪 Authentication Endpoints

### **POST /api/auth/register** - User Registration

Register a new user with email and password.

#### **Request**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "display_name": "John Doe"
}
```

#### **Request Body Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | ✅ Yes | Valid email address |
| `password` | string | ✅ Yes | Password (min 8 characters) |
| `display_name` | string | ❌ No | User display name |

#### **Password Requirements**
- **Minimum Length**: 8 characters
- **Complexity**: Mix of letters, numbers, and symbols recommended
- **Security**: Passwords are hashed using bcrypt

#### **Response**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "email_confirmed_at": null,
    "created_at": "2025-06-10T16:00:00Z",
    "user_metadata": {
      "display_name": "John Doe"
    }
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.M2YwMDAwMDAwMDAwMDAwMA...",
    "expires_in": 3600,
    "expires_at": 1623456789,
    "token_type": "bearer"
  },
  "message": "Registration successful. Please check your email to confirm your account."
}
```

#### **Response Headers**
```http
Set-Cookie: sb-access-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Lax
Set-Cookie: sb-refresh-token=v1.M2YwMDAwMDAwMDAwMDAwMA...; HttpOnly; Secure; SameSite=Lax
X-Response-Time: 250ms
```

#### **Error Responses**
```json
// 400 - Invalid email format
{
  "error": "Invalid email address",
  "code": "VALIDATION_FAILED",
  "details": {
    "field": "email",
    "message": "Please provide a valid email address"
  }
}

// 400 - Weak password
{
  "error": "Password does not meet requirements",
  "code": "WEAK_PASSWORD",
  "details": {
    "requirements": [
      "Minimum 8 characters",
      "At least one uppercase letter",
      "At least one number"
    ]
  }
}

// 409 - Email already exists
{
  "error": "User already registered",
  "code": "USER_ALREADY_EXISTS",
  "details": {
    "email": "john.doe@example.com"
  }
}
```

### **POST /api/auth/login** - Email/Password Login

Authenticate user with email and password.

#### **Request**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

#### **Request Body Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | ✅ Yes | User email address |
| `password` | string | ✅ Yes | User password |

#### **Response**
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "email_confirmed_at": "2025-06-01T10:00:00Z",
    "last_sign_in_at": "2025-06-10T16:00:00Z",
    "user_metadata": {
      "display_name": "John Doe"
    }
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.M2YwMDAwMDAwMDAwMDAwMA...",
    "expires_in": 3600,
    "expires_at": 1623456789,
    "token_type": "bearer"
  }
}
```

#### **Error Responses**
```json
// 401 - Invalid credentials
{
  "error": "Invalid login credentials",
  "code": "INVALID_CREDENTIALS"
}

// 401 - Email not confirmed
{
  "error": "Email not confirmed",
  "code": "EMAIL_NOT_CONFIRMED",
  "details": {
    "message": "Please check your email and click the confirmation link"
  }
}

// 429 - Too many attempts
{
  "error": "Too many login attempts",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retry_after": 300,
    "message": "Please wait 5 minutes before trying again"
  }
}
```

### **GET /api/auth/google** - Google OAuth Login

Initiate Google OAuth authentication flow.

#### **Request**
```http
GET /api/auth/google?redirect_to=/dashboard
```

#### **Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `redirect_to` | string | ❌ No | URL to redirect after successful auth |

#### **Response**
```http
HTTP/1.1 302 Found
Location: https://accounts.google.com/oauth/authorize?client_id=...&redirect_uri=...&scope=...
```

#### **OAuth Flow**
1. **User clicks "Sign in with Google"**
2. **Redirect to Google OAuth**: User authorizes the application
3. **Google redirects to callback**: `/auth/callback` with authorization code
4. **Token exchange**: Server exchanges code for access token
5. **User creation/login**: User profile created or updated
6. **Session establishment**: User logged in with session cookies

### **GET /auth/callback** - OAuth Callback

Handle OAuth callback from Google (special Next.js route).

#### **Request**
```http
GET /auth/callback?code=4/0AX4XfWh...&state=...
```

#### **Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | ✅ Yes | OAuth authorization code |
| `state` | string | ❌ No | CSRF protection state parameter |

#### **Response**
```http
HTTP/1.1 302 Found
Location: /dashboard
Set-Cookie: sb-access-token=...; HttpOnly; Secure
Set-Cookie: sb-refresh-token=...; HttpOnly; Secure
```

#### **Error Handling**
```http
HTTP/1.1 302 Found
Location: /login?error=oauth_error&message=Authentication failed
```

## 🔄 Session Management

### **GET /api/auth/session** - Get Current Session

Retrieve current user session information.

#### **Request**
```http
GET /api/auth/session
Authorization: Bearer <token>
```

#### **Response**
```json
{
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.M2YwMDAwMDAwMDAwMDAwMA...",
    "expires_in": 3600,
    "expires_at": 1623456789,
    "token_type": "bearer",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "john.doe@example.com",
      "email_confirmed_at": "2025-06-01T10:00:00Z",
      "last_sign_in_at": "2025-06-10T16:00:00Z"
    }
  }
}
```

#### **Error Responses**
```json
// 401 - No active session
{
  "error": "No active session",
  "code": "NO_SESSION"
}

// 401 - Session expired
{
  "error": "Session expired",
  "code": "SESSION_EXPIRED",
  "details": {
    "expired_at": "2025-06-10T15:00:00Z"
  }
}
```

### **POST /api/auth/refresh** - Refresh Session

Refresh an expired session using refresh token.

#### **Request**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "v1.M2YwMDAwMDAwMDAwMDAwMA..."
}
```

#### **Response**
```json
{
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.M2YwMDAwMDAwMDAwMDAwMA...",
    "expires_in": 3600,
    "expires_at": 1623460389,
    "token_type": "bearer"
  }
}
```

### **POST /api/auth/logout** - User Logout

Log out user and invalidate session.

#### **Request**
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### **Response**
```json
{
  "message": "Logged out successfully"
}
```

#### **Response Headers**
```http
Set-Cookie: sb-access-token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0
Set-Cookie: sb-refresh-token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0
```

## 🔑 Password Management

### **POST /api/auth/password/reset** - Request Password Reset

Send password reset email to user.

#### **Request**
```http
POST /api/auth/password/reset
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

#### **Response**
```json
{
  "message": "Password reset email sent. Please check your inbox."
}
```

#### **Security Features**
- **Rate Limiting**: Maximum 3 requests per hour per email
- **Secure Links**: Time-limited reset tokens (1 hour expiry)
- **Email Verification**: Reset only sent to verified email addresses

### **POST /api/auth/password/update** - Update Password

Update user password (requires authentication).

#### **Request**
```http
POST /api/auth/password/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "OldPassword123!",
  "new_password": "NewSecurePassword456!"
}
```

#### **Request Body Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `current_password` | string | ✅ Yes | Current user password |
| `new_password` | string | ✅ Yes | New password (min 8 characters) |

#### **Response**
```json
{
  "message": "Password updated successfully"
}
```

#### **Error Responses**
```json
// 400 - Current password incorrect
{
  "error": "Current password is incorrect",
  "code": "INVALID_CURRENT_PASSWORD"
}

// 400 - New password too weak
{
  "error": "New password does not meet requirements",
  "code": "WEAK_PASSWORD"
}
```

## 🛡️ Security Features

### **CSRF Protection**
```http
# CSRF token included in forms
X-CSRF-Token: abc123...

# State parameter for OAuth
GET /api/auth/google?state=random_csrf_token
```

### **Secure Cookies**
```http
# Production cookie settings
Set-Cookie: sb-access-token=...; HttpOnly; Secure; SameSite=Lax; Path=/
Set-Cookie: sb-refresh-token=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

### **Rate Limiting**
| Endpoint | Rate Limit | Window | Scope |
|----------|------------|--------|-------|
| **Login** | 5 attempts | 15 minutes | Per IP + Email |
| **Register** | 3 attempts | 1 hour | Per IP |
| **Password Reset** | 3 attempts | 1 hour | Per Email |
| **OAuth** | 10 attempts | 1 hour | Per IP |

### **Session Security**
- **JWT Tokens**: Signed with secure secret
- **Token Rotation**: Refresh tokens rotated on use
- **Expiry Management**: Access tokens expire in 1 hour
- **Secure Storage**: HttpOnly cookies prevent XSS

## 🔄 Real-time Authentication

### **Auth State Changes**
```typescript
// Listen for authentication state changes
supabase.auth.onAuthStateChange((event, session) => {
  switch (event) {
    case 'SIGNED_IN':
      console.log('User signed in:', session.user)
      // Redirect to dashboard
      break
    case 'SIGNED_OUT':
      console.log('User signed out')
      // Redirect to login
      break
    case 'TOKEN_REFRESHED':
      console.log('Token refreshed:', session)
      // Update stored session
      break
    case 'USER_UPDATED':
      console.log('User updated:', session.user)
      // Update user profile
      break
  }
})
```

### **Session Persistence**
```typescript
// Check for existing session on app load
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  // User is authenticated
  setUser(session.user)
} else {
  // User needs to log in
  redirectToLogin()
}
```

## 🔗 Integration Examples

### **Frontend Authentication**
```typescript
// Google OAuth login
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  if (error) {
    console.error('OAuth error:', error)
  }
}

// Email/password login
async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) {
    console.error('Login error:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, user: data.user }
}

// Check authentication status
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

### **Protected Routes**
```typescript
// Middleware for protected API routes
export async function authMiddleware(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  
  // Add user to request context
  request.user = user
  return NextResponse.next()
}
```

### **Automatic Token Refresh**
```typescript
// Set up automatic token refresh
let refreshTimer: NodeJS.Timeout

function setupTokenRefresh(session: Session) {
  // Clear existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }
  
  // Calculate refresh time (5 minutes before expiry)
  const expiresIn = session.expires_in * 1000
  const refreshTime = expiresIn - (5 * 60 * 1000)
  
  refreshTimer = setTimeout(async () => {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (data.session) {
      setupTokenRefresh(data.session)
    }
  }, refreshTime)
}
```

## 🔗 Related Documentation

- **[Users API](./users.md)** - User profile management after authentication
- **[Security Policies](../security/)** - Row Level Security and data protection
- **[Supabase Auth](https://supabase.com/docs/guides/auth)** - Official Supabase authentication documentation
- **[Google OAuth Setup](../setup/supabase-configuration.md)** - OAuth configuration guide

---

*Last Updated: June 10, 2025* 