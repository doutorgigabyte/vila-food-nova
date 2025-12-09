import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  initialPageSize?: number;
  pageSize?: number;
}

interface UseInfiniteScrollResult<T> {
  displayedItems: T[];
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  isLoading: boolean;
  observerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for implementing infinite scroll with automatic loading
 * Uses IntersectionObserver for efficient scroll detection
 */
export function useInfiniteScroll<T>(
  items: T[],
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollResult<T> {
  const { 
    threshold = 0.1, 
    initialPageSize = 12, 
    pageSize = 8 
  } = options;

  const [displayCount, setDisplayCount] = useState(initialPageSize);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const observerInstance = useRef<IntersectionObserver | null>(null);

  const displayedItems = items.slice(0, displayCount);
  const hasMore = displayCount < items.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    // Simulate async loading for smooth UX
    requestAnimationFrame(() => {
      setDisplayCount(prev => Math.min(prev + pageSize, items.length));
      setIsLoading(false);
    });
  }, [isLoading, hasMore, pageSize, items.length]);

  const reset = useCallback(() => {
    setDisplayCount(initialPageSize);
    setIsLoading(false);
  }, [initialPageSize]);

  // Reset when items change significantly
  useEffect(() => {
    if (items.length < displayCount) {
      setDisplayCount(Math.min(initialPageSize, items.length));
    }
  }, [items.length, displayCount, initialPageSize]);

  // Setup IntersectionObserver
  useEffect(() => {
    if (!observerRef.current) return;

    observerInstance.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold, rootMargin: '100px' }
    );

    observerInstance.current.observe(observerRef.current);

    return () => {
      observerInstance.current?.disconnect();
    };
  }, [hasMore, isLoading, loadMore, threshold]);

  return {
    displayedItems,
    hasMore,
    loadMore,
    reset,
    isLoading,
    observerRef
  };
}

export default useInfiniteScroll;
