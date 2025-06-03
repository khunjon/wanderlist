# Deploy Updated Firestore Security Rules

## Overview
The Firestore security rules have been updated to allow unauthenticated users to view public lists and their associated data. This enables the discover page to work for users who aren't logged in.

## What Changed
1. **Public lists** can now be read without authentication
2. **User profiles** can be read without authentication (to show list authors)
3. **ListPlaces** associated with public lists can be read without authentication
4. **All write operations** still require authentication

## Deployment Steps

### Option 1: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your Firebase project
   - Accept the default rules file name (`firestore.rules`)

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** > **Rules**
4. Copy and paste the rules from `firestore.rules` file
5. Click **Publish**

## Updated Rules Summary

The new rules allow:
- ✅ **Unauthenticated users** can read public lists
- ✅ **Unauthenticated users** can read user profiles (for list authors)
- ✅ **Unauthenticated users** can read places in public lists
- ❌ **Authentication still required** for creating, updating, or deleting content
- ❌ **Private lists remain private** and require authentication

## Testing

After deployment, test that:
1. Unauthenticated users can visit `/discover`
2. Unauthenticated users can click on public lists and view their content
3. Author information displays correctly on public lists
4. Private lists are still protected

## Security Considerations

- User profiles are now publicly readable, but this only includes basic information (name, photo, bio)
- Sensitive user data (email, admin status) should be handled carefully in the frontend
- Private lists and their content remain fully protected

## Rollback

If you need to rollback, you can revert to the previous rules that required authentication for all reads:

```javascript
// Previous rule for users (more restrictive)
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  allow read: if isAdmin();
}
```

Deploy the rollback rules using the same deployment steps above. 