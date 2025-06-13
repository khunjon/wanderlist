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
    // Skip tracking for bots and crawlers
    if (isBotUserAgent(navigator.userAgent)) {
      console.log('Skipping Mixpanel tracking for bot:', navigator.userAgent);
      return;
    }

    // Enhanced 404 detection
    const is404Page = detect404Page(url);
    
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
        path_category: categorize404Path(url),
        // Additional debug info
        detection_method: get404DetectionMethod(url)
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

// Helper function to detect bot user agents
function isBotUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;
  
  const botPatterns = [
    // Vercel bots
    /vercel-screenshot/i,
    /vercel-og/i,
    
    // Search engine crawlers
    /googlebot/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i,
    
    // SEO and monitoring tools
    /ahrefsbot/i,
    /semrushbot/i,
    /mj12bot/i,
    /dotbot/i,
    /rogerbot/i, // Moz
    /screaming frog/i,
    /sitebulb/i,
    
    // Uptime monitoring
    /pingdom/i,
    /uptimerobot/i,
    /statuscake/i,
    /site24x7/i,
    /newrelic/i,
    
    // Security scanners
    /nessus/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /nuclei/i,
    
    // Generic bot indicators
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /node-fetch/i,
    /axios/i,
    /postman/i,
    /insomnia/i,
    
    // Headless browsers (often used by bots)
    /headlesschrome/i,
    /phantomjs/i,
    /slimerjs/i,
    /htmlunit/i,
    
    // Preview/thumbnail generators
    /preview/i,
    /thumbnail/i,
    /screenshot/i,
    /capture/i,
    
    // Feed readers
    /feedfetcher/i,
    /rssreader/i,
    /feedparser/i,
    
    // Archive services
    /archive\.org/i,
    /wayback/i,
    /ia_archiver/i,
    
    // Other common bots
    /applebot/i,
    /discordbot/i,
    /slackbot/i,
    /skypeuripreview/i,
    /vkshare/i,
    /redditbot/i,
    /pinterestbot/i,
    /tumblr/i,
    
    // Development/testing tools
    /jest/i,
    /cypress/i,
    /selenium/i,
    /webdriver/i,
    /playwright/i,
    /puppeteer/i
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

// Enhanced 404 detection function
function detect404Page(url: string): boolean {
  // Method 1: Check document title
  const titleContains404 = document.title.includes('404') || document.title.includes('Not Found');
  
  // Method 2: Check if we're on the not-found route
  const isNotFoundRoute = window.location.pathname === '/not-found';
  
  // Method 3: Check if the URL doesn't match any known routes
  const knownRoutes = ['/lists', '/discover', '/search', '/profile', '/auth', '/login', '/signup', '/reset-password'];
  const isUnknownRoute = !knownRoutes.some(route => url.startsWith(route)) && 
                         url !== '/' && 
                         !url.startsWith('/api/') &&
                         url.length > 1; // Exclude root path
  
  // Method 4: Check if this is a list page that returned 404 (invalid list ID)
  const isInvalidListPage = url.startsWith('/lists/') && url !== '/lists' && titleContains404;
  
  return titleContains404 || isNotFoundRoute || isUnknownRoute || isInvalidListPage;
}

// Helper function to determine which method detected the 404
function get404DetectionMethod(url: string): string {
  const methods = [];
  
  if (document.title.includes('404') || document.title.includes('Not Found')) {
    methods.push('title');
  }
  
  if (window.location.pathname === '/not-found') {
    methods.push('not_found_route');
  }
  
  const knownRoutes = ['/lists', '/discover', '/search', '/profile', '/auth', '/login', '/signup', '/reset-password'];
  const isUnknownRoute = !knownRoutes.some(route => url.startsWith(route)) && 
                         url !== '/' && 
                         !url.startsWith('/api/') &&
                         url.length > 1;
  
  if (isUnknownRoute) {
    methods.push('unknown_route');
  }
  
  const isInvalidListPage = url.startsWith('/lists/') && url !== '/lists' && 
                           (document.title.includes('404') || document.title.includes('Not Found'));
  
  if (isInvalidListPage) {
    methods.push('invalid_list_id');
  }
  
  return methods.join(',') || 'none';
}

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
  if (!MIXPANEL_TOKEN || typeof window === 'undefined') {
    return;
  }

  try {
    // Skip tracking for bots and crawlers
    if (isBotUserAgent(navigator.userAgent)) {
      console.log('Skipping Mixpanel event tracking for bot:', navigator.userAgent);
      return;
    }

    // Check if mixpanel is properly initialized
    if (!mixpanel || typeof mixpanel.track !== 'function') {
      console.warn('Mixpanel not properly initialized, skipping event:', eventName);
      return;
    }

    mixpanel.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      // Ensure correct domain is tracked
      domain: window.location.hostname,
      current_url: window.location.href
    });
  } catch (error) {
    console.error('Error tracking Mixpanel event:', eventName, error);
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
    // Skip tracking for bots and crawlers
    if (typeof window !== 'undefined' && isBotUserAgent(navigator.userAgent)) {
      console.log('Skipping Mixpanel list view tracking for bot:', navigator.userAgent);
      return;
    }

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

  // Skip tracking for bots and crawlers
  if (typeof window !== 'undefined' && isBotUserAgent(navigator.userAgent)) {
    console.log('Skipping Mixpanel list create tracking for bot:', navigator.userAgent);
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
  if (!MIXPANEL_TOKEN || typeof window === 'undefined') {
    return;
  }

  try {
    // Skip tracking for bots and crawlers
    if (isBotUserAgent(navigator.userAgent)) {
      console.log('Skipping Mixpanel user identification for bot:', navigator.userAgent);
      return;
    }

    // Check if mixpanel is properly initialized
    if (!mixpanel || typeof mixpanel.identify !== 'function') {
      console.warn('Mixpanel not properly initialized, skipping user identification');
      return;
    }

    mixpanel.identify(userId);
    if (userProperties && mixpanel.people && typeof mixpanel.people.set === 'function') {
      mixpanel.people.set(userProperties);
    }
  } catch (error) {
    console.error('Error identifying Mixpanel user:', userId, error);
  }
};

export const setUserProperties = (properties: Record<string, any>) => {
  if (MIXPANEL_TOKEN) {
    // Skip tracking for bots and crawlers
    if (typeof window !== 'undefined' && isBotUserAgent(navigator.userAgent)) {
      console.log('Skipping Mixpanel user properties for bot:', navigator.userAgent);
      return;
    }

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