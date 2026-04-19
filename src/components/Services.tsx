import { Smartphone, Monitor, Gamepad, Settings, User, ShoppingCart, Wrench, Filter } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useData } from "@/contexts/DataContext";
import { memo, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const Services = () => {
  const { t, language } = useLanguage();
  const { data: storeSettings } = useStoreSettings();
  const { services: dynamicServices } = useData();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: t("services.filter.all"), icon: Filter },
    { id: "phone", label: t("services.filter.phone"), icon: Smartphone },
    { id: "console", label: t("services.filter.console"), icon: Gamepad },
    { id: "controller", label: t("services.filter.controller"), icon: Settings },
    { id: "pc", label: t("services.filter.pc"), icon: Monitor },
    { id: "accounts", label: t("services.filter.accounts"), icon: User },
  ];

  // Map service category to icons for fallback
  const getServiceIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'phone': return Smartphone;
      case 'pc': return Monitor;
      case 'console': return Gamepad;
      case 'controller': return Settings;
      case 'accounts': return User;
      case 'sales': return ShoppingCart;
      default: return Wrench;
    }
  };

  const getServiceColors = (index: number) => {
    const colors = [
      { bgClass: "bg-primary/10", textClass: "text-primary", glowClass: "group-hover:glow-primary" },
      { bgClass: "bg-secondary/10", textClass: "text-secondary", glowClass: "group-hover:glow-secondary" },
      { bgClass: "bg-accent/10", textClass: "text-accent", glowClass: "group-hover:glow-accent" },
    ];
    return colors[index % colors.length];
  };

  const filteredServices = useMemo(() => {
    let filtered = dynamicServices;
    if (activeCategory !== "all") {
      filtered = filtered.filter(s => s.category?.toLowerCase().includes(activeCategory.toLowerCase()));
    }
    return filtered.map((service, index) => ({
      ...service,
      icon: getServiceIcon(service.category || ''),
      ...getServiceColors(index)
    }));
  }, [dynamicServices, activeCategory]);

  return (
    <section id="services" className="py-8 sm:py-12 md:py-16 lg:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">
        <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <span className="text-primary font-display text-[10px] sm:text-xs md:text-sm tracking-widest uppercase mb-2 sm:mb-3 block">
            {t("services.badge")}
          </span>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">
            {t("services.title1")}
            <span
              className="text-gradient"
              style={{
                animation: 'rgb-shift 8s ease-in-out infinite'
              }}
            >
              {t("services.title2")}
            </span>
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-2xl mx-auto px-4 mb-8">
            {t("services.subtitle")}
          </p>

          {/* Category Filters - Horizontal scroll on mobile */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide mb-8">
            <div className="flex gap-2 sm:gap-3 justify-start sm:justify-center min-w-max sm:min-w-0">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                  className="rounded-full px-4 sm:px-5 py-2 h-10 sm:h-11 text-sm sm:text-base font-medium touch-manipulation active:scale-95 transition-all whitespace-nowrap"
                >
                  <cat.icon className="w-4 h-4 sm:w-5 sm:h-5 me-2" />
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {filteredServices.map((service, index) => (
            <div
              key={service.id}
              className="group relative h-full transition-all duration-500 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 rounded-2xl sm:rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative h-full glass-card rounded-2xl sm:rounded-3xl overflow-hidden border border-white/5 hover:border-primary/40 transition-all duration-500 bg-background/40 backdrop-blur-xl flex flex-col shadow-2xl">
                {/* Service Image/Icon Header */}
                <div className="h-40 sm:h-48 relative overflow-hidden bg-muted/20">
                  {service.image_url ? (
                    <>
                      <img
                        src={service.image_url}
                        alt={service.name_fr || service.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                    </>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${service.bgClass} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-30" />
                      <service.icon className={`w-12 h-12 sm:w-16 sm:h-16 ${service.textClass} opacity-60 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500`} />
                    </div>
                  )}
                  {service.is_complex && <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                    <Badge className="bg-secondary/90 hover:bg-secondary text-white border-none shadow-lg backdrop-blur-md px-3 py-1 text-[10px] sm:text-xs font-bold tracking-wider">
                      {t("services.expert_care")}
                    </Badge>
                  </div>
                  }
                </div>

                <div className="p-5 sm:p-7 flex-1 flex flex-col relative">
                  <h3 className="font-display text-lg sm:text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors tracking-tight leading-tight">
                    {language === 'ar' ? (service.name_ar || service.name) : (language === 'fr' ? (service.name_fr || service.name) : service.name)}
                  </h3>

                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-6 flex-1 line-clamp-4 group-hover:line-clamp-none transition-all duration-500">
                    {language === 'ar' ? (service.description_ar || service.description) : (language === 'fr' ? (service.description_fr || service.description) : service.description) || t("services.default_desc")}
                  </p>

                  <div className={`flex items-center justify-between mt-auto pt-6 border-t border-white/10 group/price ${storeSettings?.enable_service_prices === false ? 'flex-row-reverse' : ''}`}>
                    {storeSettings?.enable_service_prices !== false && (
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">{t("services.price_start")}</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl sm:text-2xl font-display font-black text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]">
                            {service.price || 0}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-primary/80">{t("services.currency")}</span>
                        </div>
                      </div>
                    )}

                    <a href="#contact" className="relative group/btn overflow-hidden rounded-xl">
                      <div className="absolute inset-0 bg-primary opacity-20 group-hover/btn:opacity-30 transition-opacity" />
                      <Button variant="ghost" className="relative z-10 font-bold text-xs sm:text-sm px-5 py-2 h-auto text-primary border border-primary/30 group-hover/btn:border-primary transition-all">
                        {t("services.book_now")}
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section >
  );
};

export default memo(Services);
