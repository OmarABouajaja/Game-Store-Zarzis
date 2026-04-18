import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function OnboardingOverlay() {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Check if user has seen onboarding
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenOnboarding) {
            // Small delay for better UX
            const timer = setTimeout(() => setOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('hasSeenOnboarding', 'true');
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <span className="text-primary">{t('onboarding.client.welcome')}</span> 🎮
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        {t('onboarding.client.subtitle')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex gap-3">
                        <div className="h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 flex text-primary">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-medium">{t('onboarding.client.xp.title')}</h4>
                            <p className="text-sm text-muted-foreground">{t('onboarding.client.xp.desc')}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 flex text-primary">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-medium">{t('onboarding.client.rewards.title')}</h4>
                            <p className="text-sm text-muted-foreground">{t('onboarding.client.rewards.desc')}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 flex text-primary">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-medium">{t('onboarding.client.bonus.title')}</h4>
                            <p className="text-sm text-muted-foreground">{t('onboarding.client.bonus.desc')}</p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleClose} className="w-full sm:w-auto">
                        {t('onboarding.client.getStarted')} <ArrowRight className="w-4 h-4 ms-2" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
