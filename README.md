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

- **Frontend**: Next.js 14 with TypeScript
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

## Deployment

The easiest way to deploy the application is using Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add the environment variables in the Vercel dashboard
4. Deploy!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
