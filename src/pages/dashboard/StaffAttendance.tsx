import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar as CalendarIcon, User, AlertCircle, Briefcase, CalendarDays, TrendingUp, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, differenceInMinutes, isValid } from "date-fns";
import { DateRange } from "react-day-picker";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { Profile } from "@/types";

interface StaffSession {
    id: string;
    staff_id: string;
    check_in: string;
    check_out?: string;
    duration_minutes?: number;
    profile?: Profile;
}

interface AttendanceStats {
    totalMinutes: number;
    shifts: number;
    days: string[];
}

const StaffAttendance = () => {
    const { user, isOwner } = useAuth();
    const { t, language } = useLanguage();
    // Default to current month range
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    });
    const [selectedStaffId, setSelectedStaffId] = useState<string>('all');

    // Valid Duration Helper
    const getDuration = (checkIn: string, checkOut?: string) => {
        const start = new Date(checkIn);
        const end = checkOut ? new Date(checkOut) : new Date();
        if (!isValid(start)) return 0;
        return differenceInMinutes(end, start);
    };

    // Live Timer State (forces re-render every minute)
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch All Staff (for Filter)
    const { data: staffProfiles } = useQuery({
        queryKey: ['all-staff-profiles'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name');
            if (error) throw error;
            return data || [];
        },
        enabled: isOwner // Only fetch if owner
    });

    // Fetch sessions for the selected range
    const { data: sessionsRaw, isLoading, isError, error } = useQuery({
        queryKey: ['staff-sessions-range', dateRange?.from?.toISOString(), dateRange?.to?.toISOString(), now.getMinutes()],
        queryFn: async () => {
            if (!dateRange?.from) return [];

            let query = supabase
                .from('staff_shifts')
                .select('*')
                .gte('check_in', dateRange.from.toISOString());

            if (dateRange.to) {
                const endDate = new Date(dateRange.to);
                endDate.setHours(23, 59, 59, 999);
                query = query.lte('check_in', endDate.toISOString());
            }

            const { data: shifts, error: fetchError } = await query.order('check_in', { ascending: false });

            if (fetchError) throw fetchError;
            if (!shifts || shifts.length === 0) return [];

            // Manual join since FK seems missing in Supabase types/schema
            const staffIds = Array.from(new Set(shifts.map(s => s.staff_id)));

            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', staffIds);

            if (profilesError) throw profilesError;

            // map profiles to shifts
            return shifts.map(shift => {
                const profile = profiles?.find(p => p.id === shift.staff_id);
                return {
                    ...shift,
                    profile: profile || null
                };
            });
        },
        enabled: !!dateRange?.from
    });

    // Normalize sessions to always be an array
    const allSessions = useMemo(() => Array.isArray(sessionsRaw) ? sessionsRaw : [], [sessionsRaw]);

    // Filter sessions by selected staff
    const sessions = useMemo(() => {
        if (selectedStaffId === 'all') return allSessions;
        return allSessions.filter(s => s.staff_id === selectedStaffId);
    }, [allSessions, selectedStaffId]);

    // Calculate Period Stats (Live) - Memoized for performance
    const stats = useMemo(() => sessions.reduce((acc: AttendanceStats, session: StaffSession) => {
        if (!session?.check_in) return acc;

        let duration = session.duration_minutes;
        if (!duration && !session.check_out) {
            duration = differenceInMinutes(new Date(), new Date(session.check_in));
        } else if (!duration && session.check_out) {
            duration = differenceInMinutes(new Date(session.check_out), new Date(session.check_in));
        }

        acc.totalMinutes += (duration || 0);
        acc.shifts += 1;

        const checkInDate = new Date(session.check_in);
        if (isValid(checkInDate)) {
            const day = checkInDate.toDateString();
            if (!acc.days.includes(day)) acc.days.push(day);
        }

        return acc;
    }, { totalMinutes: 0, shifts: 0, days: [] }), [sessions]);


    const totalHours = (stats.totalMinutes / 60).toFixed(1);
    const avgHoursPerDay = stats.days.length > 0 ? (stats.totalMinutes / 60 / stats.days.length).toFixed(1) : "0.0";

    // Helper to extract profile data safely
    const getStaffInfo = (session: StaffSession) => {
        const profile = session?.profile as Profile | undefined;
        // Handle case where profile might be returned as array from join
        if (Array.isArray(profile)) {
            const first = profile[0] as Profile;
            return first?.email || first?.full_name || t("attendance.unknown_staff");
        }
        return profile?.email || profile?.full_name || t("attendance.unknown_staff");
    };

    const safeFormat = (date: string | Date | undefined, formatStr: string) => {
        if (!date) return "---";
        const d = new Date(date);
        if (!isValid(d)) return "---";
        return format(d, formatStr);
    };

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-display text-3xl font-bold mb-2">{t("attendance.title")}</h1>
                            <p className="text-muted-foreground">{t("attendance.subtitle")}</p>
                        </div>
                        {isOwner && (
                            <div className="flex items-center gap-2 bg-background/50 p-1 rounded-lg border border-border/40">
                                <Users className="w-4 h-4 ms-2 text-muted-foreground" />
                                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                    <SelectTrigger className="w-[200px] border-none shadow-none bg-transparent h-8">
                                        <SelectValue placeholder={t("attendance.all_staff")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("attendance.all_staff")}</SelectItem>
                                        {staffProfiles?.map((staff: Pick<Profile, 'id' | 'full_name' | 'email'>) => (
                                            <SelectItem key={staff.id} value={staff.id}>
                                                {staff.full_name || staff.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <CalendarIcon className="w-5 h-5 text-primary" />
                                        {t("attendance.select_period")}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("attendance.filter_by_date")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-center pb-6">
                                    <Calendar
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        className="rounded-md border shadow-sm bg-card/50"
                                        numberOfMonths={1}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="glass-card border-s-4 border-s-primary bg-primary/5">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("attendance.period_summary")}</p>
                                            <h3 className="text-xl font-bold text-foreground">
                                                {dateRange?.from ? safeFormat(dateRange.from, "MMM d") : '--'}
                                                {' - '}
                                                {dateRange?.to ? safeFormat(dateRange.to, "MMM d") : '--'}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                                            <span className="text-sm text-muted-foreground">{t("attendance.total_worked")}</span>
                                            <span className="font-bold text-lg">{totalHours} <span className="text-xs font-normal text-muted-foreground">{t("attendance.hrs")}</span></span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                                            <span className="text-sm text-muted-foreground">{t("attendance.shifts_completed")}</span>
                                            <span className="font-bold text-lg">{stats.shifts}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">{t("attendance.avg_daily")}</span>
                                            <span className="font-bold text-lg text-secondary">{avgHoursPerDay} <span className="text-xs font-normal text-muted-foreground">{t("attendance.hrs_day")}</span></span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-8">
                            <Card className="glass-card h-full min-h-[500px]">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-secondary" />
                                        {t("attendance.shift_history")}
                                    </CardTitle>
                                    <CardDescription>
                                        {t("attendance.detailed_logs")}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {isLoading ? (
                                            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-muted-foreground">
                                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                <p>{t("attendance.loading")}</p>
                                            </div>
                                        ) : sessions.length > 0 ? (
                                            sessions.map((session) => {
                                                let durationMinutes = session.duration_minutes;
                                                const isActive = !session.check_out;

                                                if (isActive) {
                                                    durationMinutes = differenceInMinutes(new Date(), new Date(session.check_in));
                                                } else if (!durationMinutes && session.check_out) {
                                                    durationMinutes = differenceInMinutes(new Date(session.check_out), new Date(session.check_in));
                                                }

                                                const displayHours = Math.floor((durationMinutes || 0) / 60);
                                                const displayMinutes = Math.round((durationMinutes || 0) % 60);

                                                return (
                                                    <div key={session.id} className="group flex items-center justify-between p-4 rounded-xl border bg-card/40 hover:bg-card/60 transition-all hover:shadow-md hover:border-primary/20">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10">
                                                                <CalendarDays className="w-5 h-5 text-foreground/80" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-bold text-foreground">{safeFormat(session.check_in, 'EEEE, MMM d')}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {safeFormat(session.check_in, 'HH:mm')}
                                                                        {' → '}
                                                                        {session.check_out ? safeFormat(session.check_out, 'HH:mm') : t("attendance.now")}
                                                                    </span>
                                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                                                    <span>{getStaffInfo(session)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            {isActive ? (
                                                                <div className="flex flex-col items-end">
                                                                    <Badge variant="default" className="mb-1 bg-green-500 hover:bg-green-600 border-green-400/50 shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse">
                                                                        {t("attendance.active")}
                                                                    </Badge>
                                                                    <span className="font-mono text-sm text-foreground/80">
                                                                        {displayHours}h {displayMinutes}m
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="font-bold text-lg text-primary leading-none">
                                                                        {displayHours}h {displayMinutes}m
                                                                    </span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{t("attendance.duration")}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                                                <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                                                <p className="text-lg font-medium">{t("attendance.no_shifts")}</p>
                                                <p className="text-sm opacity-60">{t("attendance.try_different_range")}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
};

export default StaffAttendance;

