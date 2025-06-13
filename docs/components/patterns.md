# 🎨 Component Patterns

This document outlines common component patterns, state management approaches, error handling strategies, and loading state patterns used throughout Wanderlist's component architecture.

## 📋 Overview

Wanderlist follows consistent patterns across all components to ensure maintainability, performance, and developer experience. These patterns have evolved through real-world usage and optimization efforts.

### **Core Pattern Principles**
- **Consistency**: Same patterns across similar components
- **Predictability**: Developers know what to expect
- **Performance**: Patterns optimized for React performance
- **Accessibility**: Built-in accessibility considerations
- **Type Safety**: Comprehensive TypeScript integration

## 🏗️ Common Component Patterns

### **1. Memoized Component Pattern**

#### **Standard Implementation**
```typescript
import React from 'react';

interface ComponentProps {
  // Props interface
}

const Component = React.memo<ComponentProps>(({ prop1, prop2 }) => {
  // Component implementation
  return (
    // JSX
  );
});

Component.displayName = 'Component';
export default Component;
export type { ComponentProps };
```

#### **With Performance Monitoring**
```typescript
import React from 'react';
import { perf } from '@/lib/utils/performance';

const Component = React.memo<ComponentProps>(({ prop1, prop2 }) => {
  // Performance monitoring
  const renderTimer = React.useMemo(() => perf.component('Component', 'update'), []);
  
  React.useEffect(() => {
    renderTimer.start();
    return () => {
      renderTimer.end();
    };
  });

  return (
    // JSX
  );
});
```

**Usage Guidelines**:
- Always use `React.memo` for components that receive props
- Add `displayName` for better debugging
- Export TypeScript interfaces for reusability
- Include performance monitoring in complex components

### **2. Grouped Props Pattern**

#### **Search Component Props**
```typescript
interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
  placeholder?: string;
}

interface ComponentProps {
  search: SearchProps;
  // Other grouped props
}

// Usage in parent component
const searchProps = useMemo(() => ({
  value: searchInput,
  onChange: handleSearchChange,
  onClear: handleClearSearch,
  disabled: loading,
  placeholder: "Search..."
}), [searchInput, handleSearchChange, handleClearSearch, loading]);

<Component search={searchProps} />
```

#### **Sort Component Props**
```typescript
interface SortOption {
  field: string;
  label: string;
  direction?: 'asc' | 'desc';
}

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

interface SortProps {
  state: SortState;
  options: SortOption[];
  onChange: (newSort: SortState) => void;
}

// Usage
const sortProps = useMemo(() => ({
  state: sortState,
  options: sortOptions,
  onChange: handleSortChange
}), [sortState, sortOptions, handleSortChange]);
```

**Benefits**:
- Logical grouping of related functionality
- Reduced prop drilling
- Better memoization opportunities
- Cleaner component interfaces

### **3. Conditional Rendering Pattern**

#### **Loading, Error, Empty, and Content States**
```typescript
const Component = React.memo<ComponentProps>(({ data, loading, error }) => {
  // Loading state
  if (loading) {
    return <ComponentLoading />;
  }

  // Error state
  if (error) {
    return <ComponentError error={error} onRetry={onRetry} />;
  }

  // Empty state
  if (!data || data.length === 0) {
    return <ComponentEmptyState />;
  }

  // Content state
  return (
    <div>
      {data.map(item => (
        <ComponentItem key={item.id} item={item} />
      ))}
    </div>
  );
});
```

#### **Feature Flag Pattern**
```typescript
const Component = React.memo<ComponentProps>(({ feature, children }) => {
  if (!feature.enabled) {
    return feature.fallback || null;
  }

  return (
    <div>
      {children}
      {feature.beta && <BetaLabel />}
    </div>
  );
});
```

### **4. Event Handler Pattern**

#### **Memoized Handlers**
```typescript
const Component = React.memo<ComponentProps>(({ onAction, data }) => {
  // Memoized handler with stable reference
  const handleAction = useCallback((item: Item) => {
    onAction(item);
  }, [onAction]);

  // Handler with additional logic
  const handleComplexAction = useCallback(async (item: Item) => {
    try {
      setLoading(true);
      await onAction(item);
      // Success feedback
      toast.success('Action completed');
    } catch (error) {
      // Error handling
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  return (
    // JSX with handlers
  );
});
```

#### **Debounced Handler Pattern**
```typescript
import { debounce } from 'lodash';

const SearchComponent = React.memo<SearchProps>(({ onSearch }) => {
  const [query, setQuery] = useState('');

  // Immediate search for form submission
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    await onSearch(searchQuery);
  }, [onSearch]);

  // Debounced search for typing
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      performSearch(searchQuery);
    }, 300),
    [performSearch]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (newQuery.trim()) {
      debouncedSearch(newQuery);
    }
  }, [debouncedSearch]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    debouncedSearch.cancel(); // Cancel pending debounced search
    performSearch(query);
  }, [query, debouncedSearch, performSearch]);

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={query}
        onChange={handleInputChange}
        placeholder="Search..."
      />
    </form>
  );
});
```

## 🔄 State Management Patterns

### **1. Local State with Hooks**

#### **Simple State Management**
```typescript
const Component = React.memo(() => {
  const [isVisible, setIsVisible] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    // Component JSX
  );
});
```

#### **Complex State with useReducer**
```typescript
interface State {
  items: Item[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  searchQuery: string;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Item[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SELECT_ITEM'; payload: string }
  | { type: 'SET_SEARCH'; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, items: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SELECT_ITEM':
      return { ...state, selectedId: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    default:
      return state;
  }
};

const Component = React.memo(() => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleFetch = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const items = await fetchItems();
      dispatch({ type: 'FETCH_SUCCESS', payload: items });
    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', payload: error.message });
    }
  }, []);

  return (
    // Component JSX
  );
});
```

### **2. Ref Management Pattern**

#### **Multiple Refs for Complex Interactions**
```typescript
const SwipeView = React.memo<SwipeViewProps>(() => {
  // DOM refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Value refs (don't trigger re-renders)
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);
  const lastScrollYRef = useRef(0);
  
  // Cleanup refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    // Component JSX
  );
});
```

### **3. Effect Management Pattern**

#### **Data Fetching Effect**
```typescript
const Component = React.memo<ComponentProps>(({ id }) => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await api.getData(id);
        
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    // Component JSX
  );
});
```

#### **Event Listener Effect**
```typescript
const FloatingActionButton = React.memo(() => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false); // Hide on scroll down
      } else {
        setIsVisible(true); // Show on scroll up
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    // Component JSX
  );
});
```

## ❌ Error Handling Patterns

### **1. Component-Level Error Handling**

#### **Try-Catch with User Feedback**
```typescript
const Component = React.memo<ComponentProps>(({ onAction }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = useCallback(async (item: Item) => {
    try {
      setLoading(true);
      setError(null);
      
      await onAction(item);
      
      // Success feedback
      toast.success('Action completed successfully');
      
      // Haptic feedback on mobile
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      // Error feedback
      toast.error(errorMessage);
      
      // Log for debugging
      console.error('Action failed:', err);
      
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}
      
      <button 
        onClick={() => handleAction(item)}
        disabled={loading}
        className={`px-4 py-2 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Processing...' : 'Action'}
      </button>
    </div>
  );
});
```

#### **Error Boundary Pattern**
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ComponentErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-red-600 mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-600 mb-4">
            We're sorry, but something unexpected happened.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ComponentErrorBoundary>
  <Component />
</ComponentErrorBoundary>
```

### **2. Network Error Handling**

#### **Retry Pattern with Exponential Backoff**
```typescript
const useRetryableRequest = <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const executeRequest = useCallback(async (retryAttempt: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await requestFn();
      setData(result);
      setRetryCount(0);
      
    } catch (err) {
      if (retryAttempt < maxRetries) {
        const delay = Math.pow(2, retryAttempt) * 1000; // Exponential backoff
        setTimeout(() => {
          setRetryCount(retryAttempt + 1);
          executeRequest(retryAttempt + 1);
        }, delay);
      } else {
        setError(err instanceof Error ? err.message : 'Request failed');
      }
    } finally {
      setLoading(false);
    }
  }, [requestFn, maxRetries]);

  return { data, loading, error, retry: () => executeRequest(), retryCount };
};
```

## ⏳ Loading State Patterns

### **1. Skeleton Loading Pattern**

#### **Matching Content Structure**
```typescript
const SkeletonCard = React.memo(() => (
  <div className="bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-700">
    <div className="px-4 py-4 sm:px-6 sm:py-6">
      <div className="animate-pulse">
        {/* Title row */}
        <div className="mb-2 sm:mb-3">
          <div className="h-6 bg-gray-700 rounded w-3/4"></div>
        </div>
        
        {/* Description area */}
        <div className="mb-3 sm:mb-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-3 bg-gray-700 rounded w-24"></div>
            <div className="h-3 bg-gray-700 rounded w-20"></div>
          </div>
          <div className="h-3 bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    </div>
  </div>
));

const ListsLoading = React.memo(() => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
});
```

#### **Progressive Loading Pattern**
```typescript
const Component = React.memo<ComponentProps>(({ data }) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setItemLoading = useCallback((id: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: loading }));
  }, []);

  return (
    <div>
      {data.map(item => (
        <div key={item.id} className="relative">
          {loadingStates[item.id] && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          <ItemComponent 
            item={item} 
            onAction={(action) => handleItemAction(item.id, action)}
          />
        </div>
      ))}
    </div>
  );
});
```

### **2. Button Loading States**

#### **Loading Button Pattern**
```typescript
interface LoadingButtonProps {
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const LoadingButton = React.memo<LoadingButtonProps>(({
  loading,
  disabled,
  children,
  onClick,
  variant = 'primary'
}) => {
  const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500"
  };

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${(loading || disabled) ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex items-center space-x-2">
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
        )}
        <span>{loading ? 'Loading...' : children}</span>
      </div>
    </button>
  );
});
```

### **3. Progressive Image Loading**

#### **Image with Placeholder Pattern**
```typescript
const ProgressiveImage = React.memo<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}>(({ src, alt, className, placeholder }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-700 animate-pulse rounded"></div>
      )}
      
      {error ? (
        <div className="absolute inset-0 bg-gray-700 flex items-center justify-center rounded">
          <svg className="h-8 w-8 text-gray-400" /* ... */>
            {/* Placeholder icon */}
          </svg>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover rounded transition-opacity duration-300 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
});
```

## 📱 Mobile-First Patterns

### **1. Touch Gesture Pattern**

#### **Swipe Detection**
```typescript
const SwipeableComponent = React.memo<SwipeableProps>(({ onSwipeLeft, onSwipeRight }) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    } else if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Component content */}
    </div>
  );
});
```

### **2. Responsive Design Pattern**

#### **Mobile-First Component**
```typescript
const ResponsiveComponent = React.memo(() => {
  return (
    <div className="
      grid 
      grid-cols-1 gap-3 
      sm:grid-cols-2 sm:gap-6 
      lg:grid-cols-3 
      xl:grid-cols-4
    ">
      {/* Mobile: 1 column, small gaps */}
      {/* Tablet: 2 columns, larger gaps */}
      {/* Desktop: 3 columns */}
      {/* Large desktop: 4 columns */}
    </div>
  );
});
```

## 🔗 Related Documentation

- **[Component Architecture](./README.md)** - Overall component organization
- **[Component Optimization](./optimization.md)** - Performance optimization techniques
- **[API Integration](../api/)** - How components integrate with backend APIs
- **[Database Integration](../database/)** - Database interaction patterns

---

*Last Updated: June 10, 2025* 