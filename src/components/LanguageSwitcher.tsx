import { Check, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  collapsed?: boolean;
}

const LanguageSwitcher = ({ collapsed }: LanguageSwitcherProps) => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: "fr" as const, label: "Français", short: "FR" },
    { code: "en" as const, label: "English", short: "EN" },
    { code: "ar" as const, label: "العربية", short: "AR" },
  ];

  const activeClasses = "bg-primary text-primary-foreground shadow-md scale-100 font-bold";
  const idleClasses = "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-105 font-medium";

  // Collapsed View: Modern Dropdown (Minimalist)
  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="group flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background/50 hover:bg-primary/10 border border-border/50 hover:border-primary/30 transition-all duration-300"
            aria-label="Select Language"
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors stroke-1.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="min-w-[120px] p-2 gap-1 shadow-xl border-border/50 bg-background/95 backdrop-blur-md rounded-xl">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 text-sm",
                language === lang.code ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
              )}
            >
              <span>{lang.label}</span>
              {language === lang.code && <Check className="w-3.5 h-3.5 ms-2 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Expanded View: Minimalist Segmented Control
  return (
    <div className="flex items-center justify-center p-1 rounded-full bg-muted/30 border border-border/30 backdrop-blur-sm">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`
            relative z-10 flex items-center justify-center px-3 py-1.5 rounded-full text-[10px] sm:text-xs transition-all duration-300
            ${language === lang.code ? activeClasses : idleClasses}
          `}
          aria-label={`Switch to ${lang.label}`}
          aria-pressed={language === lang.code}
          type="button"
        >
          {lang.short}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
