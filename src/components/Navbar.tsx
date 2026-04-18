import { useEffect, useState, useMemo, useCallback, type ElementType } from "react";
import { Link, useLocation } from "react-router-dom";
import { Gamepad2, Home, Wrench, Gamepad2 as Pad, Info, PhoneCall, CalendarClock, Menu, X, BookOpen, User, ShoppingCart, Settings, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

// Logo component with fallback
const LogoImage = ({ size }: { size: 'xs' | 'sm' }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-5 h-5 sm:w-6 sm:h-6',
    sm: 'w-6 h-6 sm:w-7 sm:h-7'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm'
  };

  if (imgError) {
    return <span className={`text-primary font-display font-bold ${textSizes[size]}`}>GS</span>;
  }

  // Use absolute path - works for Cloudflare Pages and most hosting
  const [clickCount, setClickCount] = useState(0);
  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 5) {
      window.location.href = '/management-gs-zarzis';
    }
    // Reset after some time
    setTimeout(() => setClickCount(0), 5000);
  };

  return (
    <img
      src="/gamestorelogocmp.png"
      alt="Game Store logo"
      className={`${sizeClasses[size]} object-contain cursor-pointer`}
      width={size === 'xs' ? 24 : 28}
      height={size === 'xs' ? 24 : 28}
      loading="eager"
      fetchPriority="high"
      decoding="async"
      onClick={handleLogoClick}
      onError={() => setImgError(true)}
    />
  );
};

type SectionId = "home" | "services" | "lounge" | "products" | "about" | "contact";

const SECTION_IDS: SectionId[] = ["home", "services", "lounge", "products", "about", "contact"];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { isStaff, isOwner } = useAuth();
  const [isMobile, setIsMobile] = useState(() => {
    // SSR-safe initial state
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [isPhone, setIsPhone] = useState(() => {
    // Detect phone vs tablet
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  const { t, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const { cartCount } = useCart();

  const navLinks: { name: string; href: string; icon: ElementType; id: string }[] = useMemo(() => [
    { name: t("nav.home"), href: "#home", icon: Home, id: "home" },
    { name: t("nav.shop"), href: "#products", icon: ShoppingCart, id: "products" },
    { name: t("nav.services"), href: "#services", icon: Wrench, id: "services" },
    { name: t("nav.gaming"), href: "#lounge", icon: Pad, id: "lounge" },
    { name: t("nav.about"), href: "#about", icon: Info, id: "about" },
    { name: t("nav.contact"), href: "#contact", icon: PhoneCall, id: "contact" },
  ], [t]);

  useEffect(() => {
    let ticking = false;
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 12);
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleResize = () => {
      // Debounce resize for better performance
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const mobile = window.innerWidth < 1024;
        const phone = window.innerWidth < 768;
        setIsMobile(mobile);
        setIsPhone(phone);
        if (mobile) {
          setExpanded(false);
        }
      }, 150);
    };

    handleScroll();
    handleResize();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    // Optimized IntersectionObserver with better performance settings
    let activeId: SectionId | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        // Use requestAnimationFrame to batch updates
        requestAnimationFrame(() => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.target.id !== activeId) {
              activeId = entry.target.id as SectionId;
              setActiveSection(activeId);
            }
          });
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-10% 0px -10% 0px' // Only trigger when section is more visible
      }
    );

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const handleFocus = useCallback(() => {
    if (window.innerWidth >= 1024) {
      setExpanded(true);
    }
  }, []);

  const handleBlur = useCallback(() => {
    // Don't collapse on blur immediately - let mouse leave handle it
    // This prevents flickering when clicking inside
  }, []);

  // Mobile bottom navigation (phone only)
  if (isPhone) {
    return (
      <>
        {/* Bottom Navigation Bar - Mobile App Style */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-[0_-4px_20px_hsl(var(--primary)/0.15)] overflow-x-auto">
          <div className="flex items-center justify-between px-2 py-2 safe-area-inset-bottom min-w-max">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 touch-manipulation min-w-[64px] ${isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                    }`}
                  title={link.name}
                >
                  <div className={`relative ${isActive ? "scale-110" : "scale-100"} transition-transform duration-200`}>
                    <Icon className="w-5 h-5" />
                    {isActive && (
                      <span className={`absolute -top-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.8)] ${isRTL ? '-left-1' : '-right-1'}`} />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium leading-tight ${isActive ? "opacity-100" : "opacity-70"}`}>
                    {link.name.length > 8 ? link.name.substring(0, 7) + "…" : link.name}
                  </span>
                </a>
              );
            })}



            {/* Added Cart Link for Mobile */}
            {(() => {
              const isCartActive = location.pathname === "/checkout";
              return (
                <Link
                  to="/checkout"
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 touch-manipulation min-w-[64px] ${isCartActive ? "text-primary scale-110" : "text-muted-foreground scale-100"}`}
                  title={t("nav.cart")}
                >
                  <div className="relative transition-transform duration-200">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className={`absolute -top-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm ${isRTL ? '-left-1' : '-right-1'}`}>
                        {cartCount}
                      </span>
                    )}
                    {isCartActive && cartCount === 0 && <span className={`absolute -top-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary)/0.8)] ${isRTL ? '-left-1' : '-right-1'}`} />}
                  </div>
                  <span className={`text-[10px] font-medium leading-tight ${isCartActive ? "opacity-100" : "opacity-70"}`}>
                    {t("nav.cart")}
                  </span>
                </Link>
              );
            })()}

          </div>
        </nav>

        {/* Mobile Login Button & Language Switcher */}
        <div className={`fixed top-2 z-40 flex flex-col gap-1.5 items-end bg-background/80 backdrop-blur-md rounded-xl p-1.5 border border-border/30 shadow-lg ${isRTL ? 'left-2' : 'right-2'}`}>
          {/* Login Button Mobile */}
          {(() => {
            const isLoggedIn = isStaff || isOwner || !!localStorage.getItem('client_user');
            return (
              <Link
                to={isStaff || isOwner ? "/dashboard" : (localStorage.getItem('client_user') ? "/" : "/client-auth")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary backdrop-blur-md shadow-sm hover:scale-105 active:scale-95 transition-all animate-in fade-in slide-in-from-top-2 duration-300`}
                title={isLoggedIn ? t("nav.logged_in") : t("nav.login")}
              >
                {isStaff || isOwner ? <LayoutDashboard className="w-4 h-4" /> : <User className="w-4 h-4" />}
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isLoggedIn ? t("nav.logged_in") : t("nav.login")}
                </span>
              </Link>
            );
          })()}
          <LanguageSwitcher />
        </div>

        {/* WhatsApp Booking Button */}
        <div className={`fixed bottom-20 z-40 ${isRTL ? 'left-3' : 'right-3'}`}>
          <a
            href="https://wa.me/21629290065?text=Bonjour%2C%20je%20souhaite%20r%C3%A9server%20une%20session%20gaming%20ou%20demander%20un%20devis%20de%20r%C3%A9paration."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_8px_24px_hsl(var(--primary)/0.4)] border-2 border-primary/60 hover:scale-110 active:scale-95 transition-all duration-300 touch-manipulation"
            aria-label={t("nav.book")}
          >
            <CalendarClock className="w-6 h-6" />
          </a>
        </div>
      </>
    );
  }

  // Desktop/Tablet Side Navigation
  return (
    <>
      <nav
        className={`group/nav fixed z-50 transition-all duration-300 ${isScrolled ? "top-2 sm:top-3" : "top-3 sm:top-5"} ${isRTL ? 'right-2 sm:right-3 md:right-4' : 'left-2 sm:left-3 md:left-4'}`}
        onMouseEnter={() => window.innerWidth >= 1024 && setExpanded(true)}
        onMouseLeave={() => window.innerWidth >= 1024 && setExpanded(false)}
        onClick={toggleExpanded}
      >
        <div
          className={`flex flex-col items-stretch gap-1 sm:gap-1.5 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg sm:rounded-xl p-1.5 sm:p-2 shadow-[0_8px_24px_hsl(var(--primary)/0.15)] transition-all duration-300 max-h-[calc(100vh-2rem)] overflow-y-auto ${isMobile
            ? expanded
              ? "w-[200px] sm:w-[220px]"
              : "w-[52px] sm:w-[56px]"
            : expanded
              ? "w-[200px] sm:w-[220px] md:w-[240px]"
              : "w-[52px] sm:w-[56px] md:w-[60px]"
            }`}
          aria-expanded={expanded}
          aria-label="Navigation"
          role="navigation"
          tabIndex={-1}
        >
          <a
            href="#home"
            onClick={(e) => {
              e.stopPropagation();
              if (isMobile) setExpanded(false);
            }}
            className={`flex items-center gap-1.5 sm:gap-2 group rounded-lg sm:rounded-xl px-1.5 sm:px-2 py-1.5 sm:py-2 bg-card/60 border border-border/40 hover:border-primary/50 transition-all touch-manipulation min-h-[44px] sm:min-h-[48px] active:scale-[0.98] ${expanded ? "justify-start" : "justify-center"
              }`}
            title="Game Store Zarzis"
          >
            {expanded ? (
              <>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/30 shrink-0">
                  <LogoImage size="sm" />
                </div>
                <div className="flex flex-col transition-all duration-300 max-w-[140px] sm:max-w-[160px] opacity-100">
                  <span className="font-display text-xs sm:text-sm font-bold text-gradient leading-tight">GAME STORE</span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">ZARZIS</span>
                </div>
              </>
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/30 shrink-0 mx-auto hover:bg-primary/15 transition-colors">
                <LogoImage size="xs" />
              </div>
            )}
          </a>

          <div className="flex flex-col gap-1 sm:gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeSection === link.id;
              const showActive = isActive && expanded;
              const collapsedActive = isActive && !expanded;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Close mobile menu when link is clicked
                    if (isMobile) {
                      setExpanded(false);
                    }
                  }}
                  className={`group relative flex items-center gap-2 sm:gap-2.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all duration-300 touch-manipulation min-h-[40px] sm:min-h-[44px] active:scale-[0.98] ${showActive
                    ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.25)]"
                    : collapsedActive
                      ? "bg-card/60 border-primary/30 text-primary"
                      : "bg-card/50 border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-muted/40"
                    }`}
                  title={link.name}
                >
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-4 sm:h-5 rounded-full transition-all duration-300 ${isActive ? "bg-primary/80 shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "bg-transparent"} ${isRTL ? '-right-0.5 sm:-right-1' : '-left-0.5 sm:-left-1'}`}
                  />
                  <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${collapsedActive ? "text-primary" : ""}`} />
                  <span
                    className={`text-xs sm:text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${expanded
                      ? "max-w-[150px] sm:max-w-[170px] opacity-100"
                      : "max-w-0 opacity-0"
                      }`}
                    aria-hidden={!expanded}
                  >
                    {link.name}
                  </span>
                  <span
                    className={`absolute h-0.5 sm:h-1 w-2 sm:w-2.5 rounded-full transition-all duration-300 ${showActive ? "opacity-100 bg-primary" : "opacity-0 group-hover:opacity-50 bg-primary/70"} ${isRTL ? 'left-2 sm:left-2.5' : 'right-2 sm:right-2.5'}`}
                  />
                </a>
              );
            })}
          </div>

          {/* Cart Link */}
          {(() => {
            const isCartActive = location.pathname === "/checkout";
            return (
              <Link
                to="/checkout"
                onClick={() => isMobile && setExpanded(false)}
                className={`group relative flex items-center gap-2 sm:gap-2.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all duration-300 touch-manipulation min-h-[40px] sm:min-h-[44px] active:scale-[0.98] ${isCartActive
                  ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.25)]"
                  : "bg-card/50 border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-muted/40"
                  }`}
                title={t("nav.cart")}
              >
                <span className={`absolute top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-4 sm:h-5 rounded-full transition-all duration-300 ${isCartActive ? "bg-primary/80 shadow-[0_0_8px_hsl(var(--primary)/0.5)]" : "bg-transparent"} ${isRTL ? '-right-0.5 sm:-right-1' : '-left-0.5 sm:-left-1'}`} />
                <div className="relative">
                  <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                  {cartCount > 0 && (
                    <span className={`absolute -top-2 w-4 h-4 bg-accent text-accent-foreground text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm ${isRTL ? '-left-2' : '-right-2'}`}>
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className={`text-xs sm:text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${expanded ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0"}`}>
                  {t("nav.cart")}
                </span>
              </Link>
            );
          })()}


          {/* Staff Login Link Hidden for Security */}

          {/* Mobile toggle button - shown only on mobile */}
          {isMobile && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`mt-1.5 sm:mt-2 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg transition-all touch-manipulation min-h-[40px] sm:min-h-[44px] w-full ${expanded
                ? "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 active:bg-primary/30"
                : "bg-card/50 border border-border/50 text-muted-foreground hover:bg-card/60 hover:text-primary"
                }`}
              aria-label={expanded ? t("nav.close_menu") : t("nav.open_menu")}
              aria-expanded={expanded}
              type="button"
            >
              {expanded ? (
                <X className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              ) : (
                <Menu className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              )}
            </button>
          )}

          {/* Language Switcher & Login Button - Always visible on mobile/tablet, expandable on desktop */}
          {expanded && (
            <div className="flex flex-col gap-2 pt-1.5 sm:pt-2 border-t border-border/50">
              {/* Login Button Desktop */}
              {(() => {
                const isLoggedIn = isStaff || isOwner || !!localStorage.getItem('client_user');
                return (
                  <Link
                    to={isStaff || isOwner ? "/dashboard" : (localStorage.getItem('client_user') ? "/" : "/client-auth")}
                    onClick={() => isMobile && setExpanded(false)}
                    className={`group relative flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 rounded-lg sm:rounded-xl border transition-all duration-300 touch-manipulation min-h-[40px] sm:min-h-[44px] active:scale-[0.98] bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 shadow-sm`}
                    title={isLoggedIn ? t("nav.logged_in") : t("nav.login")}
                  >
                    <div className="relative">
                      {isStaff || isOwner ? <LayoutDashboard className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" /> : <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />}
                      {isLoggedIn && <span className={`absolute -top-1 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_hsl(var(--primary)/0.6)] ${isRTL ? '-left-1' : '-right-1'}`} />}
                    </div>
                    <span className={`text-xs sm:text-sm font-bold uppercase tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${expanded ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0"}`}>
                      {isLoggedIn ? t("nav.logged_in") : t("nav.login")}
                    </span>
                  </Link>
                );
              })()}

              <LanguageSwitcher />
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
