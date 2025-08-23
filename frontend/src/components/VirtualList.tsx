import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  overscan?: number;
  scrollToIndex?: number;
  onScrollToIndex?: (index: number) => void;
  className?: string;
  style?: React.CSSProperties;
  getItemKey?: (item: T, index: number) => string | number;
  onScroll?: (scrollTop: number) => void;
  threshold?: number;
}

export const VirtualList = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  scrollToIndex,
  onScrollToIndex,
  className = '',
  style = {},
  getItemKey = (_, index) => index,
  onScroll,
  threshold = 10
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, overscan, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    
    onScroll?.(newScrollTop);

    // Clear previous timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [onScroll]);

  // Scroll to specific index
  const scrollToIndexHandler = useCallback((index: number) => {
    if (scrollElementRef.current && index >= 0 && index < items.length) {
      const targetScrollTop = index * itemHeight;
      scrollElementRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
      onScrollToIndex?.(index);
    }
  }, [itemHeight, items.length, onScrollToIndex]);

  // Handle external scroll to index
  useEffect(() => {
    if (scrollToIndex !== undefined) {
      scrollToIndexHandler(scrollToIndex);
    }
  }, [scrollToIndex, scrollToIndexHandler]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Total height of all items
  const totalHeight = items.length * itemHeight;

  // Offset for visible items
  const offsetY = visibleRange.startIndex * itemHeight;

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-list overflow-auto ${className}`}
      style={{ height: containerHeight, ...style }}
      onScroll={handleScroll}
    >
      {/* Total container */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startIndex + index;
            const key = getItemKey(item, actualIndex);
            const isVisible = !isScrolling || actualIndex % threshold === 0;

            return (
              <div
                key={key}
                style={{ height: itemHeight }}
                className="virtual-list-item"
              >
                {renderItem(item, actualIndex, isVisible)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Hook for managing virtual list state
export interface UseVirtualListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface UseVirtualListReturn {
  scrollToIndex: (index: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  isScrolledToTop: boolean;
  isScrolledToBottom: boolean;
  currentIndex: number;
}

export const useVirtualList = (
  itemCount: number,
  options: UseVirtualListOptions
): UseVirtualListReturn => {
  const { itemHeight, containerHeight } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollToIndexValue, setScrollToIndexValue] = useState<number>();

  const currentIndex = Math.floor(scrollTop / itemHeight);
  const isScrolledToTop = scrollTop === 0;
  const isScrolledToBottom = scrollTop >= (itemCount * itemHeight) - containerHeight;

  const scrollToIndex = useCallback((index: number) => {
    setScrollToIndexValue(index);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollToIndex(0);
  }, [scrollToIndex]);

  const scrollToBottom = useCallback(() => {
    scrollToIndex(itemCount - 1);
  }, [scrollToIndex, itemCount]);

  return {
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    isScrolledToTop,
    isScrolledToBottom,
    currentIndex
  };
};

export default VirtualList;