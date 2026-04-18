import { HelpCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
    content: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    className?: string;
}

export const HelpTooltip = ({ content, side = "top", className }: HelpTooltipProps) => {
    const { data: settings } = useStoreSettings();

    // If help tooltips are disabled globally, don't render anything
    if (settings?.help_tooltips_enabled === false) {
        return null;
    }

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className={cn("inline-flex items-center justify-center text-muted-foreground/60 hover:text-primary transition-colors cursor-help", className)}
                        aria-label="More information"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side={side} className="max-w-xs text-sm bg-card/95 backdrop-blur-sm border-border">
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
