import ReactGA from 'react-ga4';

// Initialize Google Analytics
export const initGA = () => {
  const MEASUREMENT_ID = 'G-MH9B9EQTEY';
  
  if (typeof window !== 'undefined') {
    ReactGA.initialize(MEASUREMENT_ID);
  }
};

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined') {
    ReactGA.send({ hitType: 'pageview', page: url });
  }
};

// Track events with optional custom dimensions
export const event = ({ action, category, label, value, customDimensions }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customDimensions?: Record<string, string>;
}) => {
  if (typeof window !== 'undefined') {
    const eventData: any = {
      action,
      category,
      label,
      value
    };

    // Add custom dimensions if provided
    if (customDimensions) {
      Object.entries(customDimensions).forEach(([key, value]) => {
        eventData[key] = value;
      });
    }

    ReactGA.event(eventData);
  }
};

// Specific event for list views
export const trackListView = (listName: string, listId: string) => {
  event({
    action: 'list_view',
    category: 'Lists',
    label: listId,
    customDimensions: {
      list_name: listName
    }
  });
};

// Specific event for list creation
export const trackListCreate = (listName: string, listId: string) => {
  event({
    action: 'list_create',
    category: 'Lists',
    label: listId,
    customDimensions: {
      list_name: listName
    }
  });
}; 