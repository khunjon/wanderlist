import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

export const initMixpanel = () => {
  if (!MIXPANEL_TOKEN) {
    console.warn('Mixpanel token is missing! Check your .env file.');
    return;
  }

  mixpanel.init(MIXPANEL_TOKEN, { 
    autocapture: true,
    // Additional configuration options
    track_pageview: true,
    persistence: 'localStorage'
  });
};

export const trackPageView = (url: string) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track('Page View', {
      url: url,
      timestamp: new Date().toISOString()
    });
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (MIXPANEL_TOKEN) {
    mixpanel.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString()
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

// Export the mixpanel instance for direct access if needed
export { mixpanel }; 