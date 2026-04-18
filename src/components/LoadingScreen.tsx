import { useState, useEffect } from "react";
import { Gamepad2 } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Safety timeout - ensure loading completes even if progress gets stuck
    const safetyTimeout = setTimeout(() => {
      setProgress(100);
      setShowContent(true);
      setTimeout(onComplete, 500);
    }, 3000); // Max 3 seconds

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          clearTimeout(safetyTimeout);
          setTimeout(() => {
            setShowContent(true);
            setTimeout(onComplete, 500);
          }, 300);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500 ${
        showContent ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: 'hsl(222 47% 6%)' }}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Animated Gamepad Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-primary/30 to-accent/30 p-8 rounded-2xl border border-primary/50">
            <Gamepad2 
              className="w-16 h-16 md:w-20 md:h-20 text-primary animate-float animate-rotate" 
              style={{ 
                filter: 'drop-shadow(0 0 20px hsl(var(--primary)))'
              }}
            />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-4">
          <h2
            className="font-display text-2xl md:text-3xl font-bold text-gradient"
            style={{
              animation: 'rgb-shift 8s ease-in-out infinite'
            }}
          >
            Game Store Zarzis
          </h2>
          <p className="text-muted-foreground text-sm md:text-base animate-pulse">
            Chargement...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 md:w-80 h-2 bg-muted rounded-full overflow-hidden border border-border/50">
          <div
            className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Progress Percentage */}
        <p className="text-xs md:text-sm text-muted-foreground font-mono">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;

