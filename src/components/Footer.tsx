import { Gamepad2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { memo } from "react";
import { CreatorCredit } from "@/components/CreatorCredit";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="py-8 md:py-12 pb-24 md:pb-12 border-t border-border/50 bg-card/60 backdrop-blur-sm">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex flex-col items-center justify-center gap-6 md:gap-8">
          {/* Logo Section */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-primary/70 via-primary/60 to-accent/70 flex items-center justify-center overflow-hidden border-2 border-primary shadow-[0_0_25px_hsl(var(--primary)/0.6),0_0_40px_hsl(var(--primary)/0.3)]">
              <img src="/gamestorelogocmp.png" alt="Game Store logo" className="w-6 h-6 md:w-7 md:h-7 object-contain brightness-125 contrast-125 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" width="28" height="28" loading="lazy" decoding="async" />
            </div>
            <div className="flex flex-col">
              <span
                className="font-display text-sm md:text-lg font-bold text-gradient leading-tight"
                style={{
                  animation: 'rgb-shift 8s ease-in-out infinite'
                }}
              >
                GAME STORE
              </span>
              <span className="text-[10px] md:text-xs text-muted-foreground">ZARZIS</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-center">
            <a href="#services" className="text-muted-foreground hover:text-primary transition-colors text-xs md:text-sm hover:underline">
              {t("nav.services")}
            </a>
            <a href="#lounge" className="text-muted-foreground hover:text-primary transition-colors text-xs md:text-sm hover:underline">
              {t("nav.gaming")}
            </a>
            <a href="#about" className="text-muted-foreground hover:text-primary transition-colors text-xs md:text-sm hover:underline">
              {t("nav.about")}
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors text-xs md:text-sm hover:underline">
              {t("nav.contact")}
            </a>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors text-xs md:text-sm hover:underline">
              Terms
            </Link>
            <Link to="/delivery" className="text-muted-foreground hover:text-primary transition-colors text-xs md:text-sm hover:underline">
              Delivery
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-muted-foreground text-xs md:text-sm text-center">
            {t("footer.copyright")}
          </p>

          {/* Creator Credit - Static on homepage with mobile spacing */}
          <div className="w-full">
            <CreatorCredit variant="static" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);
