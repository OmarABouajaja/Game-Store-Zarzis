import { lazy, Suspense, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { ClientHomeStats } from "@/components/ClientHomeStats";
import PSBackground from "@/components/PSBackground";
import ConsoleCounter from "@/components/ConsoleCounter";
import { useStoreSettings } from "@/hooks/useStoreSettings";

import SEO from "@/components/SEO";

// Load critical components immediately, lazy load non-critical ones
const ProductsShowcase = lazy(() => import("@/components/ProductsShowcase"));
const Services = lazy(() => import("@/components/Services"));
const GamingLounge = lazy(() => import("@/components/GamingLounge"));
const About = lazy(() => import("@/components/About"));
const Contact = lazy(() => import("@/components/Contact"));
const Footer = lazy(() => import("@/components/Footer"));
const NewsShowcase = lazy(() => import("@/components/NewsShowcase"));

const Index = () => {
  const navigate = useNavigate();
  const [isPhone, setIsPhone] = useState(false);
  const { data: storeSettings } = useStoreSettings();

  useEffect(() => {
    // Handle Supabase auth redirects
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.substring(1));

    // Check for errors
    const error = hashParams.get("error");
    const errorDescription = hashParams.get("error_description");

    if (error || errorDescription) {
      toast.error(errorDescription?.replace(/\+/g, " ") || error || "Authentication error");
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }

    // Handle Password Reset
    if (hash.includes("type=recovery")) {
      navigate(`/reset-password${hash}`);
      return;
    }

    // Handle Magic Link
    if (hash.includes("type=magiclink")) {
      navigate("/dashboard");
      toast.success("Authentifié avec succès !");
    }
  }, [navigate]);

  useEffect(() => {
    const checkPhone = () => {
      setIsPhone(window.innerWidth < 768);
    };
    checkPhone();
    window.addEventListener('resize', checkPhone);
    return () => window.removeEventListener('resize', checkPhone);
  }, []);

  return (
    <div className={`min-h-screen bg-background relative ${isPhone ? 'pb-20' : ''}`}>
      {/* Background loaded immediately to prevent flash */}
      <PSBackground />
      <SEO
        title="Accueil"
        description="Votre destination ultime pour le gaming et la réparation tech à Zarzis. Réparation iPhone, PC, consoles et zone gaming 4K."
      />
      <ConsoleCounter />
        <main id="main-content">
        <Navbar />
        <Hero />
        <ClientHomeStats />
        <Suspense fallback={null}>
          <ProductsShowcase />
        </Suspense>
        <Suspense fallback={null}>
          <NewsShowcase />
        </Suspense>
        {storeSettings?.enable_service_section !== false && (
          <Suspense fallback={null}>
            <Services />
          </Suspense>
        )}
        <Suspense fallback={null}>
          <GamingLounge />
        </Suspense>
        <Suspense fallback={null}>
          <About />
        </Suspense>
        <Suspense fallback={null}>
          <Contact />
        </Suspense>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>

        {/* Structured Data for SEO - WebSite */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Game Store Zarzis",
            "url": "https://www.gamestorezarzis.com.tn",
            "inLanguage": ["fr", "en", "ar"],
          })
        }} />

        {/* BreadcrumbList Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Accueil",
                "item": "https://www.gamestorezarzis.com.tn#home"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Services",
                "item": "https://www.gamestorezarzis.com.tn#services"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "Zone Gaming",
                "item": "https://www.gamestorezarzis.com.tn#lounge"
              },
              {
                "@type": "ListItem",
                "position": 4,
                "name": "À Propos",
                "item": "https://www.gamestorezarzis.com.tn#about"
              },
              {
                "@type": "ListItem",
                "position": 5,
                "name": "Contact",
                "item": "https://www.gamestorezarzis.com.tn#contact"
              }
            ]
          })
        }} />
        </main>
    </div>
  );
};

export default Index;
