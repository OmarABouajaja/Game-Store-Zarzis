import { Shield, Clock, Award, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { memo } from "react";

const About = () => {
  const { t } = useLanguage();

  const values = [
    {
      icon: Shield,
      titleKey: "about.value1.title",
      descKey: "about.value1.desc",
    },
    {
      icon: Clock,
      titleKey: "about.value2.title",
      descKey: "about.value2.desc",
    },
    {
      icon: Award,
      titleKey: "about.value3.title",
      descKey: "about.value3.desc",
    },
    {
      icon: Heart,
      titleKey: "about.value4.title",
      descKey: "about.value4.desc",
    },
  ];

  return (
    <section id="about" className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute top-0 right-0 w-[150px] sm:w-[250px] md:w-[350px] lg:w-[450px] h-[150px] sm:h-[250px] md:h-[350px] lg:h-[450px] bg-primary/10 rounded-full blur-[80px] sm:blur-[100px] md:blur-[120px] lg:blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[150px] sm:w-[250px] md:w-[350px] lg:w-[450px] h-[150px] sm:h-[250px] md:h-[350px] lg:h-[450px] bg-secondary/10 rounded-full blur-[80px] sm:blur-[100px] md:blur-[120px] lg:blur-[150px]" />
      <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10 items-center">
          {/* Visual Side */}
          <div className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/3] max-w-lg mx-auto">
            <div className="absolute inset-0 glass-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 flex flex-col justify-center hover:shadow-[0_16px_40px_hsl(var(--primary)/0.18)] transition-all duration-300">
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="font-display text-base sm:text-lg md:text-xl font-bold text-primary">G</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-sm sm:text-base md:text-lg font-bold truncate">Game Store Zarzis</h3>
                      <p className="text-muted-foreground text-[9px] sm:text-[10px] md:text-xs">{t("about.est")}</p>
                    </div>
                  </div>
                  
                  <div className="h-px bg-border" />
                  
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    {t("about.story")}
                  </p>
                  
                  {/* Stats Section */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3 pt-1">
                    <div className="text-center p-2 sm:p-2.5 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                      <div className="text-lg sm:text-xl md:text-2xl font-display font-bold text-primary mb-0.5">
                        {t("about.stat1.value")}
                      </div>
                      <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                        {t("about.stat1.label")}
                      </div>
                    </div>
                    <div className="text-center p-2 sm:p-2.5 rounded-lg bg-secondary/5 border border-secondary/20 hover:bg-secondary/10 transition-colors">
                      <div className="text-lg sm:text-xl md:text-2xl font-display font-bold text-secondary mb-0.5">
                        {t("about.stat2.value")}
                      </div>
                      <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                        {t("about.stat2.label")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative blurs */}
              <div className="absolute -top-4 md:-top-6 -left-4 md:-left-6 w-24 md:w-32 h-24 md:h-32 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 md:-bottom-6 -right-4 md:-right-6 w-24 md:w-32 h-24 md:h-32 bg-secondary/10 rounded-full blur-2xl" />
            </div>
          </div>

          {/* Text content */}
          <div className="order-1 lg:order-2">
            <span className="text-primary font-display text-[10px] sm:text-xs md:text-sm tracking-widest uppercase mb-2 sm:mb-3 md:mb-4 block">
              {t("about.badge")}
            </span>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold mb-2 sm:mb-3 md:mb-4 lg:mb-6 leading-tight">
              {t("about.title1")}
              <span className="text-gradient">{t("about.title2")}</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8 md:mb-10 leading-relaxed">
              {t("about.subtitle")}
            </p>

            {/* Values Grid */}
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {values.map((value, index) => (
                <div
                  key={value.titleKey}
                  className="flex gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 rounded-lg hover:bg-muted/30 transition-colors duration-200"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110">
                    <value.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-bold text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1">{t(value.titleKey)}</h4>
                    <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm leading-relaxed">{t(value.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(About);
