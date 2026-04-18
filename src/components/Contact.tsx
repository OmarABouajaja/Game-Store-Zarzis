import { useState, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, Mail, Instagram, Facebook, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Contact = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const message = `*${t("contact.form.title")}*\n\n*${t("contact.form.name")}:* ${formData.name}\n*${t("contact.form.email")}:* ${formData.email}\n*${t("contact.form.subject")}:* ${formData.subject}\n\n*${t("contact.form.message")}:*\n${formData.message}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/21629290065?text=${encodedMessage}`, "_blank");
  }, [formData, t]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }, []);

  return (
    <section id="contact" className="py-10 sm:py-14 md:py-20 lg:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />

      <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">
        <div className="text-center mb-8 sm:mb-10 md:mb-14 lg:mb-16">
          <span className="text-primary font-display text-xs md:text-sm tracking-widest uppercase mb-3 md:mb-4 block">
            {t("contact.badge")}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6">
            {t("contact.title1")}
            <span
              className="text-gradient"
              style={{
                animation: 'rgb-shift 8s ease-in-out infinite'
              }}
            >
              {t("contact.title2")}
            </span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto px-4">
            {t("contact.subtitle")}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
            {/* Address - Clickable Google Maps Link */}
            <a
              href="https://maps.app.goo.gl/ztEYdhmckRsQeyh57"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 flex items-start gap-2.5 sm:gap-3 border border-border/50 hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_8px_24px_hsl(var(--primary)/0.15)] transition-all duration-300 cursor-pointer group active:scale-[0.98] touch-manipulation"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors">
                <MapPin className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-bold text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1 text-foreground group-hover:text-primary transition-colors">{t("contact.location")}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base group-hover:text-foreground transition-colors">{t("contact.location.value")}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>

            {/* Hours - Non-clickable info card */}
            <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 flex items-start gap-2.5 sm:gap-3 border border-border/50">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-secondary" />
              </div>
              <div>
                <h4 className="font-display font-bold text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1">{t("contact.hours")}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base">{t("contact.hours.value")}</p>
              </div>
            </div>

            {/* Phone - Clickable tel: link */}
            <a
              href="tel:+21629290065"
              className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 flex items-start gap-2.5 sm:gap-3 border border-border/50 hover:border-accent/60 hover:bg-accent/5 hover:shadow-[0_8px_24px_hsl(var(--accent)/0.15)] transition-all duration-300 cursor-pointer group active:scale-[0.98] touch-manipulation"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center flex-shrink-0 transition-colors">
                <Phone className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-accent group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-bold text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1 text-foreground group-hover:text-accent transition-colors">{t("contact.phone")}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base group-hover:text-foreground transition-colors">{t("contact.phone.value")}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </a>

            {/* Email - Clickable mailto: link */}
            <a
              href="mailto:game.store.zarzis@gmail.com"
              className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 flex items-start gap-2.5 sm:gap-3 border border-border/50 hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_8px_24px_hsl(var(--primary)/0.15)] transition-all duration-300 cursor-pointer group active:scale-[0.98] touch-manipulation"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors">
                <Mail className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-bold text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1 text-foreground group-hover:text-primary transition-colors">{t("contact.email")}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm md:text-base break-all group-hover:text-foreground transition-colors">{t("contact.email.value")}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </a>

            <div className="flex items-center gap-3 sm:gap-4 pt-2 md:pt-4 flex-wrap">
              <span className="text-muted-foreground text-xs md:text-sm">{t("contact.follow")}</span>
              <a
                href="https://www.instagram.com/game.store.zarzis?igsh=ZjUzeG02YjlwMnBn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-orange-500/20 flex items-center justify-center hover:from-purple-600/30 hover:via-pink-600/30 hover:to-orange-500/30 transition-all duration-300 border border-purple-500/30 hover:border-purple-400/50 hover:shadow-[0_0_15px_hsl(280_100%_60%/0.4)]"
                title="Instagram"
              >
                <Instagram className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
              </a>


              <a
                href="https://www.tiktok.com/@game.store.zarzis?_r=1&_t=ZS-925SLkmPqV6"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-black/40 flex items-center justify-center hover:bg-black/60 transition-all duration-300 border border-gray-700/50 hover:border-gray-600/70 hover:shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                title="TikTok"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="https://wa.me/21629290065"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-green-500/20 flex items-center justify-center hover:bg-green-500/30 transition-all duration-300 border border-green-500/30 hover:border-green-400/50 hover:shadow-[0_0_15px_hsl(142_71%_45%/0.4)]"
                title={`${t("contact.phone")} : +216 29 290 065`}
              >
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
              </a>
            </div>
          </div>

          <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 hover:shadow-[0_12px_32px_hsl(var(--primary)/0.15)] transition-all duration-300">
            <h3 className="font-display text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 md:mb-5">{t("contact.form.title")}</h3>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
              <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="text-xs md:text-sm text-muted-foreground mb-2 block">{t("contact.form.name")}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none transition-colors text-[16px] md:text-base"
                    placeholder={t("contact.form.name.placeholder")}
                  />
                </div>
                <div>
                  <label className="text-xs md:text-sm text-muted-foreground mb-2 block">{t("contact.form.email")}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none transition-colors text-[16px] md:text-base"
                    placeholder={t("contact.form.email.placeholder")}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs md:text-sm text-muted-foreground mb-2 block">{t("contact.form.subject")}</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none transition-colors text-sm md:text-base"
                >
                  <option value="">{t("contact.form.subject")}</option>
                  <option value={t("contact.form.subject.repair")}>{t("contact.form.subject.repair")}</option>
                  <option value={t("contact.form.subject.gaming")}>{t("contact.form.subject.gaming")}</option>
                  <option value={t("contact.form.subject.general")}>{t("contact.form.subject.general")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs md:text-sm text-muted-foreground mb-2 block">{t("contact.form.message")}</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none transition-colors resize-none text-sm md:text-base"
                  placeholder={t("contact.form.message.placeholder")}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm sm:text-base font-semibold h-10 sm:h-11 px-6 sm:px-7 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-[0_0_16px_hsl(var(--primary)/0.4)] transition-all duration-300 w-full touch-manipulation min-h-[40px] active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {t("contact.form.send")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(Contact);
