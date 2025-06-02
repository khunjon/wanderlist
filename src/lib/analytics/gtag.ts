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

// Track events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined') {
    ReactGA.event({
      action,
      category,
      label,
      value
    });
  }
}; 