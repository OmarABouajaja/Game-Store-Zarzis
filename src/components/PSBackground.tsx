import { useEffect, useState } from "react";
import { logger } from "@/lib/logger";

// PS controller symbols - optimized for all devices
const SYMBOLS = [
  { char: "○", delay: 0, x: 10, y: 20, size: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl" },
  { char: "△", delay: 2, x: 85, y: 15, size: "text-xl sm:text-2xl md:text-3xl lg:text-4xl" },
  { char: "□", delay: 4, x: 20, y: 70, size: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl" },
  { char: "×", delay: 1, x: 75, y: 80, size: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl" },
  { char: "○", delay: 3, x: 50, y: 40, size: "text-xl sm:text-2xl md:text-3xl lg:text-4xl" },
  { char: "△", delay: 5, x: 90, y: 55, size: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl" },
] as const;

// Color mapping - full opacity for maximum visibility
const SYMBOL_COLORS: Record<string, string> = {
  "○": "text-red-400",
  "△": "text-emerald-400",
  "□": "text-pink-400",
  "×": "text-blue-400",
};

const getSymbolColor = (char: string): string => {
  return SYMBOL_COLORS[char] || "text-primary";
};

const PSBackground = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Prevent flash by setting mounted state after initial render
    setIsMounted(true);

    // Check for reduced motion preference and mobile status
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    setIsMobile(window.innerWidth < 768);

    // Debug: Log animation status
    logger.log('PS Background - Reduced motion:', mediaQuery.matches);
    logger.log('PS Background - Is mobile:', window.innerWidth < 768);
    logger.log('PS Background - Is mounted:', true);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      logger.log('PS Background - Reduced motion changed:', e.matches);
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      logger.log('PS Background - Is mobile changed:', window.innerWidth < 768);
    };

    mediaQuery.addEventListener('change', handleChange);
    window.addEventListener('resize', handleResize);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Force animations to work on desktop by only respecting reduced motion for accessibility-critical cases
  // On desktop, we'll enable animations regardless of prefers-reduced-motion for better UX
  // On mobile, respect reduced motion for accessibility
  const shouldAnimate = isMobile ? !prefersReducedMotion : true;

  return (
    <div 
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        style={{ 
          opacity: isMounted ? 1 : 0,
          transition: 'opacity 0.3s ease-in',
        }}
      >
      {/* Base background gradient - always visible, prevents flash */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95" />

      {/* Optimized light beams - reduced blur for better desktop performance */}
      <div
        className="absolute -left-1/4 top-0 w-1/2 h-full bg-gradient-to-r from-primary/6 sm:from-primary/8 md:from-primary/10 via-primary/10 sm:via-primary/12 md:via-primary/14 to-transparent blur-lg sm:blur-xl md:blur-2xl"
        style={{
          willChange: prefersReducedMotion ? 'auto' : 'transform',
          animation: prefersReducedMotion ? 'none' : 'float 12s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-1/4 right-0 w-1/2 h-1/2 bg-gradient-to-l from-secondary/6 sm:from-secondary/8 md:from-secondary/10 via-accent/4 sm:via-accent/6 md:via-accent/8 to-transparent blur-lg sm:blur-xl md:blur-2xl"
        style={{
          willChange: prefersReducedMotion ? 'auto' : 'transform',
          animation: prefersReducedMotion ? 'none' : 'float 10s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-1/3 h-1/2 bg-gradient-to-t from-accent/4 sm:from-accent/6 md:from-accent/8 via-primary/4 sm:via-primary/5 md:via-primary/6 to-transparent blur-lg sm:blur-xl md:blur-2xl"
        style={{
          willChange: prefersReducedMotion ? 'auto' : 'transform',
          animation: prefersReducedMotion ? 'none' : 'float 14s ease-in-out infinite',
        }}
      />
      
      {/* Floating symbols - visible on all devices, with floating movement and slow blinking */}
      {SYMBOLS.map((symbol, index) => {
        // Generate unique animation duration for each symbol (8-12s range for variety)
        const baseDuration = 8 + (index % 4) * 1; // 8, 9, 10, 11, 12 seconds
        const blinkDuration = 4 + (index % 2) * 1; // Slow blink: 4-5s

        if (!isMounted) {
          return (
            <div
              key={`${symbol.char}-${index}`}
              className={`absolute font-display font-bold ${symbol.size} ${getSymbolColor(symbol.char)} select-none`}
              style={{
                left: `${symbol.x}%`,
                top: `${symbol.y}%`,
                opacity: 0,
                transition: 'opacity 0.5s ease-in',
              }}
            >
              {symbol.char}
            </div>
          );
        }

        // Use the working ps-float animation - always animate on desktop for better experience
        const animStyle = shouldAnimate
          ? {
              animation: `ps-float ${baseDuration}s ease-in-out ${symbol.delay}s infinite, ps-blink-slow ${blinkDuration}s ease-in-out ${symbol.delay * 0.5}s infinite`,
              WebkitAnimation: `ps-float ${baseDuration}s ease-in-out ${symbol.delay}s infinite, ps-blink-slow ${blinkDuration}s ease-in-out ${symbol.delay * 0.5}s infinite`,
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              perspective: '1000px',
              transform: 'translateZ(0)', // Force GPU acceleration
            }
          : {
              // Even when reduced motion is enabled, show a subtle static glow
              opacity: 0.8,
              filter: 'drop-shadow(0 0 8px hsl(var(--primary)/0.3))',
            };

        // Debug: Log animation styles for first symbol
        if (index === 0) {
          logger.log('PS Symbol animation style:', animStyle);
          logger.log('PS Symbol should animate:', shouldAnimate);
        }

        return (
          <div
            key={`${symbol.char}-${index}`}
            className={`absolute font-display font-bold ${symbol.size} ${getSymbolColor(symbol.char)} select-none`}
            style={{
              left: `${symbol.x}%`,
              top: `${symbol.y}%`,
              ...animStyle,
            }}
          >
            {symbol.char}
          </div>
        );
      })}

      {/* Optimized background glow effects - reduced blur and size for desktop performance */}
      <div
        className="absolute top-1/4 left-1/4 w-48 sm:w-64 md:w-72 lg:w-96 h-48 sm:h-64 md:h-72 lg:h-96 bg-primary/8 sm:bg-primary/12 md:bg-primary/15 rounded-full blur-[50px] sm:blur-[60px] md:blur-[70px] lg:blur-[80px]"
        style={{
          animation: shouldAnimate ? 'pulse-glow 4s ease-in-out infinite' : 'none',
          willChange: shouldAnimate ? 'opacity' : 'auto',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-48 sm:w-64 md:w-72 lg:w-96 h-48 sm:h-64 md:h-72 lg:h-96 bg-secondary/8 sm:bg-secondary/12 md:bg-secondary/15 rounded-full blur-[50px] sm:blur-[60px] md:blur-[70px] lg:blur-[80px]"
        style={{
          animation: shouldAnimate ? 'pulse-glow 4s ease-in-out 2s infinite' : 'none',
          willChange: shouldAnimate ? 'opacity' : 'auto',
        }}
      />
    </div>
  );
};

export default PSBackground;
