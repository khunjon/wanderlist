# Wanderlist

A better way to save and organize places from Google Maps.

## Features

- User authentication (Firebase Auth)
- Search for places using Google Places API
- Create and manage custom lists of places
- Add places to lists with one click
- Clean, mobile-first responsive design
- View saved lists with place details (name, address, rating, photos)

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Maps Integration**: Google Places API
- **Deployment**: Vercel

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

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Lists can be read by owner or if they're public
    match /lists/{listId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || resource.data.isPublic == true);
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Places can be read by anyone (they're public data)
    match /places/{placeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // ListPlaces can be read/written by the list owner
    match /listPlaces/{listPlaceId} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth != null && get(/databases/$(database)/documents/lists/$(resource.data.listId)).data.userId == request.auth.uid;
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
- `src/components/` - React components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and API clients
- `src/types/` - TypeScript type definitions

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
