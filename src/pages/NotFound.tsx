import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gamepad2, Home, Headphones, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Floating gaming icons */}
        <div className="absolute top-20 left-[20%] opacity-10 animate-float">
          <Gamepad2 className="w-16 h-16 text-primary" />
        </div>
        <div className="absolute bottom-32 right-[15%] opacity-10 animate-float delay-700">
          <Headphones className="w-12 h-12 text-accent" />
        </div>
      </div>

      <div className="relative z-10 text-center max-w-xl mx-auto">
        {/* Logo */}
        <Link to="/" className="inline-block mb-8 group">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/20 group-hover:scale-105 transition-all duration-300">
            <img
              src="/gamestorelogocmp.png"
              alt="Game Store Zarzis"
              className="w-12 h-12 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <Gamepad2 className="w-10 h-10 text-primary hidden" />
          </div>
        </Link>

        {/* 404 Number with glitch effect */}
        <div className="relative mb-6">
          <h1 className="text-[120px] sm:text-[180px] font-display font-bold leading-none bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            {t("error.404.code")}
          </h1>
          {/* Glitch layers */}
          <h1
            className="absolute inset-0 text-[120px] sm:text-[180px] font-display font-bold leading-none text-primary/20 animate-glitch-1"
            aria-hidden
          >
            404
          </h1>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4">
          {t("error.404.subtitle")}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
          {t("error.404.description")}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/">
            <Button
              size="lg"
              className="gap-2 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25"
            >
              <Home className="w-5 h-5" />
              {t("error.back_home")}
            </Button>
          </Link>

          <Link to="/#lounge">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 px-8 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
            >
              <Gamepad2 className="w-5 h-5" />
              {t("error.gaming_zone")}
            </Button>
          </Link>

          <Link to="/#contact">
            <Button
              variant="ghost"
              size="lg"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="w-5 h-5" />
              {t("error.contact_us")}
            </Button>
          </Link>
        </div>

        {/* Fun message */}
        <p className="mt-12 text-sm text-muted-foreground/60 font-mono">
          <span className="text-primary">&gt;</span> ERROR_CODE: PAGE_NOT_FOUND
          <br />
          <span className="text-accent">&gt;</span> SUGGESTION: Return to base
        </p>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .delay-700 {
          animation-delay: 0.7s;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        @keyframes glitch-1 {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 2px); }
        }
        .animate-glitch-1 {
          animation: glitch-1 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
