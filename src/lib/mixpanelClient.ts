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
    autocapture: true,
    track_pageview: true,
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
  if (MIXPANEL_TOKEN) {
    // Ensure we're tracking the full URL with the correct domain
    const fullUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${url}` 
      : url;
    
    mixpanel.track('Page View', {
      url: fullUrl,
      path: url,
      domain: typeof window !== 'undefined' ? window.location.hostname : '',
      timestamp: new Date().toISOString()
    });
  }
};

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