import React, { createContext, useContext, useEffect, useState } from 'react';
import { useStoreSettings } from '@/hooks/useStoreSettings';

interface ThemeContextType {
    primary: string;
    secondary: string;
    accent: string;
    setTheme: (primary: string, secondary: string, accent: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: settings } = useStoreSettings();
    const [primary, setPrimary] = useState(settings?.theme_primary || '185 100% 50%'); // Default Cyan
    const [secondary, setSecondary] = useState(settings?.theme_secondary || '320 100% 60%'); // Default Magenta
    const [accent, setAccent] = useState(settings?.theme_accent || '270 100% 65%'); // Default Purple

    useEffect(() => {
        if (settings) {
            if (settings.theme_primary) setPrimary(settings.theme_primary);
            if (settings.theme_secondary) setSecondary(settings.theme_secondary);
            if (settings.theme_accent) setAccent(settings.theme_accent);
        }
    }, [settings]);

    useEffect(() => {
        // Apply colors to root
        const root = document.documentElement;
        root.style.setProperty('--primary', primary);
        root.style.setProperty('--secondary', secondary);
        root.style.setProperty('--accent', accent);

        // Also update neon specific ones if they are different
        root.style.setProperty('--neon-cyan', primary);
        root.style.setProperty('--neon-magenta', secondary);
        root.style.setProperty('--neon-purple', accent);
    }, [primary, secondary, accent]);

    const setTheme = (p: string, s: string, a: string) => {
        setPrimary(p);
        setSecondary(s);
        setAccent(a);
    };

    return (
        <ThemeContext.Provider value={{ primary, secondary, accent, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
