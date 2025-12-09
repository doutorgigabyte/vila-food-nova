import { useCallback, useMemo, useState, useRef } from 'react';

interface UseVirtualizedListOptions {
  itemHeight: number;
  containerHeight: number;
  overscanCount?: number;
}

interface VirtualizedResult<T> {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetTop: number;
  handleScroll: (scrollTop: number) => void;
  scrollTop: number;
}

/**
 * Hook for simple virtualization without external dependencies
 * Calculates which items should be visible based on scroll position
 */
export function useVirtualizedList<T>(
  items: T[],
  options: UseVirtualizedListOptions
): VirtualizedResult<T> {
  const { itemHeight, containerHeight, overscanCount = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { startIndex, endIndex, visibleItems, offsetTop } = useMemo(() => {
    const totalItems = items.length;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    
    const rawStartIndex = Math.floor(scrollTop / itemHeight);
    const startIdx = Math.max(0, rawStartIndex - overscanCount);
    const endIdx = Math.min(totalItems - 1, rawStartIndex + visibleCount + overscanCount);
    
    return {
      startIndex: startIdx,
      endIndex: endIdx,
      visibleItems: items.slice(startIdx, endIdx + 1),
      offsetTop: startIdx * itemHeight
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscanCount]);

  const handleScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetTop,
    handleScroll,
    scrollTop
  };
}

export default useVirtualizedList;
