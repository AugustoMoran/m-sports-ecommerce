import { useCallback, useRef } from 'react';

/**
 * Returns a ref callback to attach to a sentinel element.
 * When it becomes visible (with rootMargin), `onVisible` is called.
 */
const useInfiniteScroll = ({ onVisible, hasMore, loading }) => {
  const observer = useRef(null);

  const sentinelRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            onVisible();
          }
        },
        { rootMargin: '200px' } // preload before reaching bottom
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, onVisible]
  );

  return sentinelRef;
};

export default useInfiniteScroll;
