# Mixpanel Integration

This document explains how to use Mixpanel analytics in the Wanderlist application.

## Setup

1. **Environment Variable**: Add your Mixpanel project token to your `.env.local` file:
   ```
   NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_project_token_here
   ```

2. **Get Your Token**: 
   - Go to your Mixpanel project
   - Navigate to Settings > Project Settings
   - Copy your Project Token

## Usage

### Using the Hook

The easiest way to track events is using the `useMixpanel` hook:

```tsx
import { useMixpanel } from '@/hooks/useMixpanel';

function MyComponent() {
  const { track, identify, setProperties } = useMixpanel();

  const handleButtonClick = () => {
    track('Button Clicked', {
      button_name: 'Save Place',
      page: 'place-details'
    });
  };

  const handleUserLogin = (userId: string, userEmail: string) => {
    identify(userId, {
      email: userEmail,
      signup_date: new Date().toISOString()
    });
  };

  return (
    <button onClick={handleButtonClick}>
      Save Place
    </button>
  );
}
```

### Direct Import

You can also import functions directly:

```tsx
import { trackEvent, identifyUser } from '@/lib/mixpanelClient';

// Track an event
trackEvent('Place Added', {
  place_type: 'restaurant',
  list_name: 'Favorites'
});

// Identify a user
identifyUser('user123', {
  email: 'user@example.com',
  plan: 'premium'
});
```

## Common Events to Track

Here are some suggested events for the Wanderlist app:

### User Events
- `User Signed Up`
- `User Logged In`
- `User Logged Out`
- `Profile Updated`

### Place Events
- `Place Added`
- `Place Removed`
- `Place Viewed`
- `Place Shared`

### List Events
- `List Create` - When a user creates a new list
- `List View` - When a user views a list (their own or others)
- `List Shared` - When a user shares a list
- `List Deleted` - When a user deletes a list

### Search Events
- `Search Performed`
- `Place Searched`
- `Filter Applied`

### Example Implementation

```tsx
// In a place component
const { track, trackListView, trackListCreate } = useMixpanel();

const handleAddPlace = (place: Place, listId: string) => {
  // Your existing logic...
  
  track('Place Added', {
    place_id: place.google_place_id,
    place_name: place.name,
    place_type: place.types?.[0],
    list_id: listId,
    source: 'search_results'
  });
};

// List tracking examples
const handleListView = (list: List, author: User) => {
  trackListView({
    list_id: list.id,
    list_name: list.name,
    list_author: author.displayName || author.email,
    list_creation_date: list.created_at,
    is_public: list.is_public,
    place_count: list.places?.length || 0,
    view_count: list.view_count || 0
  });
};

const handleListCreate = (newList: List, user: User) => {
  trackListCreate({
    list_id: newList.id,
    list_name: newList.name,
    list_author: user.displayName || user.email,
    list_creation_date: newList.created_at,
    is_public: newList.is_public,
    city: newList.city,
    tags: newList.tags,
    description: newList.description
  });
};
```

## User Identification

User identification is **automatically handled** when users log in or sign up! The integration automatically:

- ✅ Identifies users with their Supabase user ID
- ✅ Sets user properties (email, name, signup date, etc.)
- ✅ Tracks login and logout events
- ✅ Distinguishes between new signups and returning logins
- ✅ Resets user data on logout

### Automatic Events Tracked

The following events are automatically tracked:

- **User Signed Up** - When a new user creates an account (email or Google)
- **User Logged In** - When a returning user signs in
- **User Logged Out** - When a user signs out

### Manual User Identification

If you need to manually identify a user or update their properties:

```tsx
// In your auth component
const { identify, setProperties } = useMixpanel();

const handleUserProfileUpdate = (user: User) => {
  // Update user properties
  setProperties({
    display_name: user.displayName,
    bio: user.bio,
    profile_completion: calculateCompletionPercentage(user),
    last_active: new Date().toISOString()
  });
};
```

## Features

- **Smart Page Tracking**: Page views are tracked manually for better Next.js integration (no duplicates)
- **Autocapture**: Mixpanel will automatically capture clicks and form submissions
- **User Identification**: Link events to specific users
- **Custom Properties**: Add context to your events
- **TypeScript Support**: Full TypeScript support with proper types
- **Domain Tracking**: Correctly tracks your custom domain (not Vercel internal URLs)

## Testing

To test your Mixpanel integration:

1. Run your app in development mode
2. Perform some actions (click buttons, navigate pages, etc.)
3. Check the Mixpanel Live View in your dashboard to see events coming in

## Domain Tracking Fix

The integration automatically handles custom domain tracking for Vercel deployments. It ensures that:

- ✅ Your custom domain appears in Mixpanel (not the Vercel internal domain)
- ✅ Page URLs are tracked with the correct domain
- ✅ All events include proper domain information

### Manual Domain Update

If you need to manually update domain properties:

```tsx
import { updateDomainProperties } from '@/lib/mixpanelClient';

// Call this if domain tracking seems incorrect
updateDomainProperties();
```

## Privacy Considerations

- Only track events that provide value for analytics
- Be mindful of user privacy and comply with GDPR/CCPA
- Consider allowing users to opt-out of analytics
- Don't track sensitive information like passwords or personal details 