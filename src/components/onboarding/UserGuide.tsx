import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, X } from "lucide-react";

export const UserGuide = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const hasSeenGuide = localStorage.getItem("user_guide_dismissed");
        if (!hasSeenGuide) {
            setIsOpen(true);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem("user_guide_dismissed", "true");
        setIsOpen(false);
    };

    const steps = [
        {
            title: "Welcome to Game Store Zarzis! 🎮",
            description: "You've successfully set up your new management system. Since we start with a clean slate, here are a few steps to get you up and running.",
        },
        {
            title: "1. Configure Your Store 🏪",
            description: "Go to **Store Settings** (bottom of sidebar) to set your opening hours, store name, and other preferences.",
        },
        {
            title: "2. Set Up Pricing 💰",
            description: "Navigate to **Pricing Config** to define your hourly rates for PS5, PS4, and other services. This is crucial for session calculations.",
        },
        {
            title: "3. Add Consoles 🕹️",
            description: "Visit **Console Settings** to add your gaming stations (e.g., PS5 Station 1, Station 2). They will appear on the dashboard.",
        },
        {
            title: "4. Create Products & Services 📦",
            description: "Add items to your **Inventory** and define repair services in **Service Management** to start selling.",
        },
        {
            title: "You're Ready! 🚀",
            description: "That's it! You can verify everything in the dashboard. Need help? Check the documentation or contact support.",
        },
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            handleDismiss();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {step === 0 ? "👋" : step === steps.length - 1 ? "🎉" : <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">{step}</span>}
                        {steps[step].title}
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-base">
                        {steps[step].description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-1 mt-4 mb-2 justify-center">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : "w-2 bg-muted"
                                }`}
                        />
                    ))}
                </div>

                <DialogFooter className="flex sm:justify-between items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-muted-foreground">
                        Skip
                    </Button>
                    <Button onClick={handleNext} className="gap-2">
                        {step === steps.length - 1 ? "Get Started" : "Next"}
                        {step === steps.length - 1 ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
