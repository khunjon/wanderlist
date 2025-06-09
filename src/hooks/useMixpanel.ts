import { useCallback } from 'react';
import { trackEvent, identifyUser, setUserProperties, mixpanel } from '@/lib/mixpanelClient';

export const useMixpanel = () => {
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    trackEvent(eventName, properties);
  }, []);

  const identify = useCallback((userId: string, userProperties?: Record<string, any>) => {
    identifyUser(userId, userProperties);
  }, []);

  const setProperties = useCallback((properties: Record<string, any>) => {
    setUserProperties(properties);
  }, []);

  const reset = useCallback(() => {
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.reset();
    }
  }, []);

  return {
    track,
    identify,
    setProperties,
    reset,
    mixpanel: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ? mixpanel : null
  };
}; 