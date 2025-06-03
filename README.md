# Placemarks

A better way to save and organize places from Google Maps.

## Features

### Core Functionality
- User authentication (Firebase Auth)
- **Enhanced User Profiles**: Users can create a private bio (up to 500 characters) and add their Instagram and TikTok usernames for future use
- Search for places using Google Places API
- Create and manage custom lists of places
- **Improved Add Places Flow**: Enhanced search experience with contextual titles, manual search (no auto-search), better mobile UX, and comprehensive user feedback including loading states, success indicators, and detailed error messages
- Add places to lists with one click
- Organize lists with tags for easy categorization
- Edit and delete your lists
- Add personal notes to saved places
- View saved lists with place details (name, address, rating, photos)

### Modern User Experience
- **Multiple View Modes**: Grid view, interactive map view, and immersive swipe view
- **Swipe View**: Instagram story-style browsing with touch gestures and keyboard navigation
- **Mobile-First Design**: Fully responsive with optimized mobile interactions
- **Clean Interface**: Streamlined UI with improved information hierarchy
- **Smart Search**: Search your personal lists and discover public lists from other users

### List Management
- **Public/Private Lists**: Share your lists publicly or keep them private
- **Enhanced List Display**: Organized information showing location, description, author, and last updated date
- **Contextual Actions**: Edit mode with prominent action buttons
- **Tag Organization**: Categorize lists with custom tags (visible in detailed view)

### Discovery Features
- **Discover Page**: Browse public lists created by other users
- **List Analytics**: View counts and engagement metrics
- **Author Profiles**: See who created each list with profile photos and display names

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Maps Integration**: Google Places API
- **Deployment**: Vercel

## User Interface

### List Views
- **Grid View**: Traditional card-based layout for browsing multiple places
- **Map View**: Interactive map showing all places with location markers
- **Swipe View**: Full-screen, story-style browsing with:
  - Touch/swipe gestures for navigation
  - Keyboard shortcuts (arrow keys, spacebar, escape)
  - Immersive photo backgrounds with gradient overlays
  - Easy access to notes with slide-up panel
  - Progress indicator and smooth transitions

### Mobile Optimization
- **Touch-Friendly Controls**: Large tap targets and swipe gestures
- **Responsive Sort Controls**: Full-width on mobile, compact on desktop
- **Adaptive Layouts**: Content reflows optimally for different screen sizes
- **Context-Aware Actions**: Edit buttons and features appear when appropriate

### Enhanced Information Display
Lists now show information in a logical hierarchy:
1. **Location** (with location pin emoji)
2. **Description** 
3. **Author** (with profile photo and display name)
4. **Last Updated Date**
5. **Tags and Privacy Status**

### Profile Management
- **Personal Bio**: Add a personal bio up to 500 characters (currently private)
- **Social Media Integration**: Connect your Instagram and TikTok accounts to your profile (for future use)
- **Profile Photo Upload**: Upload and manage your profile picture
- **Privacy Controls**: All profile information is currently kept private

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Google Cloud account with Maps/Places API enabled

### Environment Setup

1. Clone the repository
2. Create a `.env.local` file in the root directory with the following variables:

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Firebase Setup

1. Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication with Email/Password and Google Sign-in methods
3. Create a Firestore database
4. Set up the security rules (example below)

### Firestore Security Rules

**Important**: The security rules have been updated to allow unauthenticated users to view public lists for the discover functionality. Deploy these updated rules to your Firebase project:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Users can read/write their own documents, admins can read all
    // Also allow reading user profiles for authors of public lists (for discovery)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if isAdmin(); // Admins can read all user documents
      // Allow reading user profiles without authentication (for public list authors)
      // This enables showing author information on public lists
      allow read: if true;
    }
    
    // Lists can be read by owner, if they're public (even without auth), or by admins
    match /lists/{listId} {
      allow create: if request.auth != null;
      // Allow reading public lists without authentication for discovery
      // Allow reading own lists when authenticated
      // Allow admins to read all lists
      allow read: if resource.data.isPublic == true || 
                     (request.auth != null && resource.data.userId == request.auth.uid) ||
                     (request.auth != null && isAdmin());
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Places can be read by anyone (they're public data)
    match /places/{placeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // ListPlaces can be read by anyone if the parent list is public
    // Can be written only by the list owner or admins
    match /listPlaces/{listPlaceId} {
      allow create: if request.auth != null;
      // Allow reading if the parent list is public (for discovery)
      // Allow reading/writing if user owns the list
      // Allow admins to read all listPlaces
      allow read: if get(/databases/$(database)/documents/lists/$(resource.data.listId)).data.isPublic == true ||
                     (request.auth != null && get(/databases/$(database)/documents/lists/$(resource.data.listId)).data.userId == request.auth.uid) ||
                     (request.auth != null && isAdmin());
      allow update, delete: if request.auth != null && 
                               (get(/databases/$(database)/documents/lists/$(resource.data.listId)).data.userId == request.auth.uid ||
                                isAdmin());
    }
  }
}
```

**To deploy these rules:**
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in your project: `firebase init firestore`
4. Deploy the rules: `firebase deploy --only firestore:rules`

**Key Changes:**
- Public lists can now be read without authentication
- This enables the discover page to work for unauthenticated users
- Authentication is still required for interactive features (future like/favorite functionality)

### Firebase Storage Rules

Make sure to also configure Firebase Storage Rules to allow users to upload profile photos:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile photos: users can upload and read their own photos
    match /profile-photos/{userId} {
      allow read;  // Allow everyone to read profile photos
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Google Cloud Setup

1. Create a new project in Google Cloud Console
2. Enable the Places API and Maps JavaScript API
3. Create an API key with appropriate restrictions
4. Add the API key to your `.env.local` file

## Project Structure

- `src/app/` - Next.js app directory with routes
  - `lists/` - List management pages
  - `discover/` - Public list discovery
  - `search/` - Place search functionality
- `src/components/` - React components
  - `SwipeView.tsx` - Immersive swipe view component
  - `ui/` - Reusable UI components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and API clients
- `src/types/` - TypeScript type definitions

## Key Components

### SwipeView Component
A modern, Instagram story-style interface for browsing places:
- **Full-screen immersive experience** with photo backgrounds
- **Touch gesture support** for mobile devices
- **Keyboard navigation** for desktop users
- **Notes integration** with slide-up panel
- **Progress tracking** with visual indicators

### Enhanced List Management
- **Contextual editing** with streamlined workflows
- **Mobile-optimized controls** that adapt to screen size
- **Smart information hierarchy** for better readability
- **Improved search functionality** with personalized placeholders

## Next.js 15 Compatibility

This project has been updated to work with Next.js 15, which introduces some important changes:

- Dynamic route segments now receive params as a Promise that must be awaited
- Client components that use hooks like `useSearchParams` must be wrapped in Suspense boundaries
- The project architecture separates server and client components for optimal performance

## Deployment

The easiest way to deploy the application is using Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add the environment variables in the Vercel dashboard
4. Deploy!

### Vercel Environment Variables

Make sure to add all the environment variables listed in the Environment Setup section to your Vercel project settings.

### Firebase Auth Configuration

When deploying to Vercel, make sure to:
1. Add your deployment domain to the authorized domains list in Firebase Authentication settings
2. If testing on a preview deployment, add the preview URL to authorized domains as well

## Troubleshooting

If you encounter the "auth/unauthorized-domain" error when testing with Google Auth:
1. Go to the Firebase Console
2. Navigate to Authentication > Settings > Authorized domains
3. Add your domain (including `localhost` for local development)

## License

This project is licensed under the MIT License.
