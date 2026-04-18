import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export const AttendanceToggle: React.FC = () => {
    const { isClockedIn, clockIn, clockOut, isStaff, isLoading, currentSessionStartTime } = useAuth() as any;
    const { t } = useLanguage();
    const [pending, setPending] = useState(false);
    const [duration, setDuration] = useState("");

    React.useEffect(() => {
        if (!isClockedIn || !currentSessionStartTime) {
            setDuration("");
            return;
        }

        const updateTimer = () => {
            if (!currentSessionStartTime) return;
            const start = new Date(currentSessionStartTime);
            const now = new Date();

            // Safety check for invalid dates
            if (isNaN(start.getTime())) {
                setDuration("");
                return;
            }

            const diff = now.getTime() - start.getTime();
            if (diff < 0) {
                setDuration("0h 0m");
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setDuration(`${hours}h ${minutes}m`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [isClockedIn, currentSessionStartTime]);

    if (!isStaff) return null;

    const handleToggle = async () => {
        setPending(true);
        try {
            if (isClockedIn) {
                await clockOut();
                toast.success(t("attendance.success_out"));
            } else {
                await clockIn();
                toast.success(t("attendance.success_in"));
            }
        } catch (error: any) {
            console.error("Attendance Toggle Error:", error);
            toast.error(error.message || "Attendance update failed. Please check your connection or database permissions.");
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="flex items-center gap-3 p-2 rounded-xl bg-card border shadow-sm">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase text-muted-foreground font-bold leading-none mb-1 px-1">
                    {t("attendance.staff_status")}
                </span>
                <Badge
                    variant={isClockedIn ? "default" : "secondary"}
                    className={cn(
                        "h-6 px-2 gap-1.5",
                        isClockedIn ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-muted text-muted-foreground"
                    )}
                >
                    <div className={cn("w-1.5 h-1.5 rounded-full", isClockedIn ? "bg-green-500 animate-pulse" : "bg-muted-foreground")} />
                    {isClockedIn ? (
                        <>
                            {t("attendance.in_service")}
                            {duration && <span className="ms-1 opacity-80 border-s border-green-500/30 ps-1.5">{duration}</span>}
                        </>
                    ) : t("attendance.offline")}
                </Badge>
            </div>

            <Button
                variant={isClockedIn ? "outline" : "default"}
                size="sm"
                onClick={handleToggle}
                disabled={pending || isLoading}
                className={cn(
                    "gap-2 h-10 px-4 transition-all duration-300",
                    isClockedIn
                        ? "border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                        : "bg-primary hover:scale-105"
                )}
            >
                {pending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : isClockedIn ? (
                    <>
                        <LogOut className="w-4 h-4" />
                        {t("attendance.clock_out")}
                    </>
                ) : (
                    <>
                        <LogIn className="w-4 h-4" />
                        {t("attendance.clock_in")}
                    </>
                )}
            </Button>
        </div>
    );
};

