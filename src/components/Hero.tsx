import { useMemo, memo, useState, useEffect } from "react";
import { Gamepad2, Wrench, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const Hero = () => {
  const { t } = useLanguage();

  const [consoleCount, setConsoleCount] = useState<string>("10");

  useEffect(() => {
    const fetchConsoleCount = async () => {
      try {
        const { count, error } = await supabase
          .from('consoles')
          .select('*', { count: 'exact', head: true });

        if (count !== null && !error) {
          setConsoleCount(count.toString().padStart(2, '0'));
        }
      } catch (e) {
        console.error("Failed to fetch console count", e);
      }
    };

    fetchConsoleCount();
  }, []);

  // Memoize stats array to prevent recreation on each render
  const stats = useMemo(() => [
    { value: consoleCount, label: t("hero.stat1.label"), color: "primary" },
    { value: t("hero.stat2.value"), label: t("hero.stat2.label"), color: "foreground" },
    { value: t("hero.stat3.value"), label: t("hero.stat3.label"), color: "accent" },
  ], [t, consoleCount]);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16" itemScope itemType="https://schema.org/WebPage">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center" style={{ contain: 'layout style' }}>
          
          {/* Responsive Centered Logo */}
          <div 
            className="flex justify-center w-full mb-6 sm:mb-8 md:mb-10 px-4"
            style={{
              animation: 'fade-in 0.8s ease-out forwards, soft-glow 6s ease-in-out infinite'
            }}
          >
            <img 
              src="/logo/logo-bleu-transparent.png" 
              alt="Game Store Zarzis Logo" 
              className="h-20 sm:h-28 md:h-36 lg:h-44 w-auto object-contain drop-shadow-[0_0_15px_hsl(var(--primary)/0.3)] transition-transform duration-500 hover:scale-105"
              fetchPriority="high"
            />
          </div>

          {/* Main Heading - LCP element */}
          <h1
            className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-3 sm:mb-4 md:mb-5 leading-tight"
            style={{
              contain: 'layout style',
              animation: 'slide-up 0.6s ease-out forwards'
            }}
          >
            <span className="text-foreground">{t("hero.title1")}</span>
            <span
              className="text-gradient"
              style={{
                animation: 'rgb-shift 8s ease-in-out infinite, soft-glow 6s ease-in-out infinite'
              }}
            >
              {t("hero.title2")}
            </span>
            <span className="text-foreground">{t("hero.title3")}</span>
          </h1>

          {/* Subheading */}
          <p
            className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10 px-2 leading-relaxed"
            style={{
              animation: 'fade-in 0.8s ease-out 0.2s forwards'
            }}
          >
            {t("hero.subtitle")}
          </p>

          {/* CTA Buttons - Improved mobile touch targets */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12 md:mb-14 px-2"
            style={{
              animation: 'fade-in 0.8s ease-out 0.4s forwards'
            }}
          >
            <a
              href="https://wa.me/21629290065?text=Bonjour%2C%20je%20souhaite%20r%C3%A9server%20une%20session%20gaming."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-base sm:text-lg font-bold h-12 sm:h-14 px-6 sm:px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-300 w-full sm:w-auto min-w-[180px] hover:scale-[1.03] touch-manipulation active:scale-[0.97]"
            >
              <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
              {t("hero.cta1")}
            </a>
            <a
              href="https://wa.me/21629290065?text=Bonjour%2C%20je%20souhaite%20demander%20un%20devis%20pour%20une%20r%C3%A9paration."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-base sm:text-lg font-bold h-12 sm:h-14 px-6 sm:px-8 bg-muted/50 border-2 border-primary/50 text-foreground hover:bg-muted/70 hover:border-primary transition-all duration-300 w-full sm:w-auto min-w-[180px] hover:scale-[1.03] touch-manipulation active:scale-[0.97]"
            >
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
              {t("hero.cta2")}
            </a>
          </div>

          {/* Stats - Enhanced mobile cards */}
          <div
            className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-3xl mx-auto"
            style={{
              animation: 'fade-in 0.8s ease-out 0.6s forwards'
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center rounded-xl sm:rounded-2xl bg-muted/40 border border-border/60 p-3 sm:p-4 md:p-5 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_hsl(var(--primary)/0.2)]"
              >
                <div className={`font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-${stat.color} mb-1.5 sm:mb-2 drop-shadow-[0_6px_20px_hsl(var(--primary)/0.4)]`}>
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-[10px] sm:text-xs md:text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(Hero);
