import { useEffect, useCallback } from 'react';

// Smart prefetching hook for better performance
export const usePrefetch = () => {
  const prefetchRoute = useCallback((route: string) => {
    // Prefetch route components
    const routeComponents: Record<string, string[]> = {
      '/': [],
      '/services': ['Services'],
      '/gaming': ['GamingLounge'],
      '/about': ['About'],
      '/contact': ['Contact'],
    };

    const components = routeComponents[route];
    if (components) {
      components.forEach(component => {
        // Create a link element for prefetching
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = `/src/components/${component}.tsx`;
        link.as = 'script';
        document.head.appendChild(link);

        // Clean up after prefetch
        setTimeout(() => {
          document.head.removeChild(link);
        }, 30000); // Remove after 30 seconds
      });
    }
  }, []);

  const prefetchResource = useCallback((url: string, as: string = 'fetch') => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = as;
    document.head.appendChild(link);

    // Clean up after prefetch
    setTimeout(() => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    }, 30000);
  }, []);

  const prefetchOnHover = useCallback((element: HTMLElement, route: string) => {
    let timeoutId: NodeJS.Timeout;

    const handleMouseEnter = () => {
      // Debounce prefetching
      timeoutId = setTimeout(() => {
        prefetchRoute(route);
      }, 100);
    };

    const handleMouseLeave = () => {
      clearTimeout(timeoutId);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timeoutId);
    };
  }, [prefetchRoute]);

  const prefetchOnVisible = useCallback((element: HTMLElement, route: string) => {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            prefetchRoute(route);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [prefetchRoute]);

  // Prefetch critical resources on mount
  useEffect(() => {
    // Prefetch fonts
    prefetchResource('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;600;700&display=swap', 'style');

    // Prefetch API data if needed
    // prefetchResource('/api/data.json', 'fetch');
  }, [prefetchResource]);

  return {
    prefetchRoute,
    prefetchResource,
    prefetchOnHover,
    prefetchOnVisible,
  };
};
