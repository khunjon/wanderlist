import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

// Get the correct domain for tracking
const getTrackingDomain = () => {
  if (typeof window === 'undefined') return '';
  
  // Use the actual domain from the browser
  return window.location.origin;
};

export const initMixpanel = () => {
  if (!MIXPANEL_TOKEN) {
    console.warn('Mixpanel token is missing! Check your .env file.');
    return;
  }

  const trackingDomain = getTrackingDomain();

  mixpanel.init(MIXPANEL_TOKEN, { 
    autocapture: false, // Disable automatic click and form tracking
    track_pageview: false, // Disable automatic page views to prevent duplicates
    persistence: 'localStorage',
    // Force the correct domain for tracking
    api_host: 'https://api.mixpanel.com',
    // Set custom properties to override domain detection
    property_blacklist: [], // Don't blacklist any properties
    // Override the default domain detection
    cross_subdomain_cookie: false,
    secure_cookie: true,
    // Custom domain tracking
    loaded: function(mixpanel) {
      // Override the default domain with our custom domain
      if (trackingDomain) {
        mixpanel.register({
          '$current_url': window.location.href,
          '$referrer': document.referrer,
          'domain': window.location.hostname,
          'url_origin': trackingDomain
        });
      }
    }
  });
};

export const trackPageView = (url: string) => {
  if (MIXPANEL_TOKEN && typeof window !== 'undefined') {
    // Check if this is a 404 page by looking at the document title
    const is404Page = document.title.includes('404') || document.title.includes('Not Found');
    
    // Ensure we're tracking the full URL with the correct domain
    const fullUrl = `${window.location.origin}${url}`;
    
    if (is404Page) {
      // Track as a special 404 event instead of normal page view
      mixpanel.track('404 Page View', {
        incorrect_path: url,
        full_url: fullUrl,
        referrer: document.referrer,
        domain: window.location.hostname,
        title: document.title,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        // Categorize the type of 404 for better analysis
        path_category: categorize404Path(url)
      });
    } else {
      // Normal page view tracking
      mixpanel.track('Page View', {
        // Standard Mixpanel page view properties
        '$current_url': fullUrl,
        '$referrer': document.referrer,
        // Custom properties for better analytics
        url: fullUrl,
        path: url,
        domain: window.location.hostname,
        title: document.title,
        timestamp: new Date().toISOString(),
        // Additional context
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height
      });
    }
  }
};

// Helper function to categorize 404 paths for better analytics
function categorize404Path(path: string): string {
  if (!path) return 'unknown';
  
  // Remove leading slash for analysis
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Categorize based on path patterns
  if (cleanPath.startsWith('lists/')) return 'list_page';
  if (cleanPath.startsWith('profile')) return 'profile_page';
  if (cleanPath.startsWith('search')) return 'search_page';
  if (cleanPath.startsWith('discover')) return 'discover_page';
  if (cleanPath.startsWith('auth/')) return 'auth_page';
  if (cleanPath.startsWith('api/')) return 'api_endpoint';
  if (cleanPath.includes('.')) return 'file_request';
  if (cleanPath === '') return 'root_page';
  
  // Check for common patterns
  if (/^[a-f0-9-]{36}$/.test(cleanPath)) return 'uuid_direct_access';
  if (/^\d+$/.test(cleanPath)) return 'numeric_id';
  if (cleanPath.length > 50) return 'very_long_path';
  
  return 'other';
}

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      // Ensure correct domain is tracked
      domain: typeof window !== 'undefined' ? window.location.hostname : '',
      current_url: typeof window !== 'undefined' ? window.location.href : ''
    });
  }
};

// List-specific tracking functions
export const trackListView = (listData: {
  list_id: string;
  list_name: string;
  list_author: string;
  list_creation_date: string;
  is_public?: boolean;
  place_count?: number;
  view_count?: number;
}) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('List View', {
      list_id: listData.list_id,
      list_name: listData.list_name,
      list_author: listData.list_author,
      list_creation_date: listData.list_creation_date,
      is_public: listData.is_public || false,
      place_count: listData.place_count || 0,
      view_count: listData.view_count || 0,
      timestamp: new Date().toISOString(),
      domain: typeof window !== 'undefined' ? window.location.hostname : '',
      current_url: typeof window !== 'undefined' ? window.location.href : ''
    });
  }
};

export const trackListCreate = (listData: {
  list_id: string;
  list_name: string;
  list_author: string;
  list_creation_date: string;
  is_public?: boolean;
  city?: string;
  tags?: string[];
  description?: string;
}) => {
  if (!MIXPANEL_TOKEN) {
    console.warn('Mixpanel token is missing - List Create event not tracked');
    return;
  }

  const eventData = {
    list_id: listData.list_id,
    list_name: listData.list_name,
    list_author: listData.list_author,
    list_creation_date: listData.list_creation_date,
    is_public: listData.is_public || false,
    city: listData.city || '',
    tags: listData.tags || [],
    tag_count: listData.tags?.length || 0,
    description: listData.description || '',
    has_description: !!(listData.description && listData.description.trim()),
    timestamp: new Date().toISOString(),
    domain: typeof window !== 'undefined' ? window.location.hostname : '',
    current_url: typeof window !== 'undefined' ? window.location.href : ''
  };

  try {
    mixpanel.track('List Create', eventData);
  } catch (error) {
    console.error('Error sending List Create event:', error);
  }
};

export const identifyUser = (userId: string, userProperties?: Record<string, any>) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.identify(userId);
    if (userProperties) {
      mixpanel.people.set(userProperties);
    }
  }
};

export const setUserProperties = (properties: Record<string, any>) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.people.set(properties);
  }
};

// Function to manually update domain properties if needed
export const updateDomainProperties = () => {
  if (MIXPANEL_TOKEN && typeof window !== 'undefined') {
    mixpanel.register({
      '$current_url': window.location.href,
      '$referrer': document.referrer,
      'domain': window.location.hostname,
      'url_origin': window.location.origin
    });
  }
};

// Export the mixpanel instance for direct access if needed
export { mixpanel }; 