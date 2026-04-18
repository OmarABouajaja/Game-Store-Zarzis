import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3 } from "lucide-react";
import { Sale } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useData } from "@/contexts/DataContext";

interface Transaction {
    date: Date;
    amount: number;
}

// Business day: 7:00 AM to 6:59 AM next day
function getLogicalBusinessDate(date: Date) {
    const logicalDate = new Date(date);
    if (logicalDate.getHours() < 7) {
        logicalDate.setDate(logicalDate.getDate() - 1);
    }
    return logicalDate;
}

function getLocalDayStr(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Jour: hourly from 7:00 AM to 6:59 AM next day (24 hours)
function getTodayRevenue(transactions: Transaction[]) {
    const hours = [
        ...Array.from({ length: 17 }, (_, i) => i + 7), // 7 to 23
        ...Array.from({ length: 7 }, (_, i) => i)        // 0 to 6
    ];

    const now = new Date();
    const todayStr = getLocalDayStr(getLogicalBusinessDate(now));

    return hours.map(hour => {
        const hourStr = hour.toString().padStart(2, '0');
        const hourRevenue = transactions
            .filter(t => {
                const itemDateStr = getLocalDayStr(getLogicalBusinessDate(t.date));
                const itemHour = t.date.getHours();
                return itemDateStr === todayStr && itemHour === hour;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            label: `${hourStr}:00`,
            revenue: Number(hourRevenue.toFixed(2))
        };
    });
}

// Semaine: Sunday to Saturday of the current week
function getWeeklyRevenue(transactions: Transaction[]) {
    const data = [];
    const now = new Date();
    const logicalToday = getLogicalBusinessDate(now);

    // Find Sunday of the current week
    const dayOfWeek = logicalToday.getDay(); // 0 = Sunday
    const sunday = new Date(logicalToday);
    sunday.setDate(logicalToday.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        const dateStr = getLocalDayStr(d);

        const dayRevenue = transactions
            .filter(t => getLocalDayStr(getLogicalBusinessDate(t.date)) === dateStr)
            .reduce((sum, t) => sum + t.amount, 0);

        const displayLabel = d.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric'
        });

        data.push({
            label: displayLabel,
            revenue: Number(dayRevenue.toFixed(2))
        });
    }
    return data;
}

// Mois: Current calendar month day by day
function getMonthlyRevenue(transactions: Transaction[]) {
    const data = [];
    const now = new Date();
    const logicalToday = getLogicalBusinessDate(now);
    const year = logicalToday.getFullYear();
    const month = logicalToday.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dateStr = getLocalDayStr(d);

        const dayRevenue = transactions
            .filter(t => getLocalDayStr(getLogicalBusinessDate(t.date)) === dateStr)
            .reduce((sum, t) => sum + t.amount, 0);

        data.push({
            label: day.toString(),
            revenue: Number(dayRevenue.toFixed(2))
        });
    }
    return data;
}

// Année: Each month of the current year
function getYearlyRevenue(transactions: Transaction[]) {
    const data = [];
    const now = new Date();
    const logicalToday = getLogicalBusinessDate(now);
    const year = logicalToday.getFullYear();

    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    for (let month = 0; month < 12; month++) {
        const monthRevenue = transactions
            .filter(t => {
                const logicalDate = getLogicalBusinessDate(t.date);
                return logicalDate.getFullYear() === year && logicalDate.getMonth() === month;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        data.push({
            label: monthNames[month],
            revenue: Number(monthRevenue.toFixed(2))
        });
    }
    return data;
}

interface OverviewRevenueChartProps {
    sales: Sale[];
    timeRange: 'today' | 'weekly' | 'monthly' | 'yearly';
    setTimeRange: (range: 'today' | 'weekly' | 'monthly' | 'yearly') => void;
    isOwner: boolean;
    isLoading?: boolean;
}

const OverviewRevenueChart = ({ sales: propSales, timeRange, setTimeRange, isOwner, isLoading }: OverviewRevenueChartProps) => {
    const { t } = useLanguage();
    const { sales: contextSales, sessions, serviceRequests } = useData();

    // Get current month name for the monthly chart title
    const currentMonthName = useMemo(() => {
        const now = new Date();
        return now.toLocaleDateString('fr-FR', { month: 'long' });
    }, []);

    const revenueData = useMemo(() => {
        if (isLoading) return [];

        // Merge all revenue streams
        const activeSales = contextSales?.length ? contextSales : (propSales || []);

        const allTransactions: Transaction[] = [
            ...(activeSales).map(s => ({
                date: new Date(s.created_at),
                amount: Number(s.total_amount)
            })),
            ...(sessions || [])
                .filter(s => s.status === 'completed' && s.created_at)
                .map(s => ({
                    date: new Date(s.created_at!),
                    amount: Number(s.total_amount || 0)
                })),
            ...(serviceRequests || [])
                .filter(s => s.status === 'completed')
                .map(s => ({
                    date: new Date(s.created_at),
                    amount: Number(s.final_cost || s.quoted_price || 0)
                }))
        ];

        if (timeRange === 'today') return getTodayRevenue(allTransactions);
        if (timeRange === 'weekly') return getWeeklyRevenue(allTransactions);
        if (timeRange === 'monthly') return getMonthlyRevenue(allTransactions);
        return getYearlyRevenue(allTransactions);
    }, [contextSales, propSales, sessions, serviceRequests, timeRange, isLoading]);

    const chartTitle = useMemo(() => {
        if (timeRange === 'today') return t("dashboard.chart.daily_breakdown");
        if (timeRange === 'weekly') return t("dashboard.chart.weekly_trend");
        if (timeRange === 'yearly') return `${t("dashboard.chart.monthly_trend")} ${new Date().getFullYear()}`;
        // Monthly: show the actual month name
        return `${currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)}`;
    }, [timeRange, t, currentMonthName]);

    if (isLoading) {
        return (
            <Card className="glass-card lg:col-span-2 h-[400px] flex flex-col p-6">
                <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-6 w-32 bg-white/5" />
                    <Skeleton className="h-8 w-48 bg-white/5" />
                </div>
                <Skeleton className="flex-1 w-full bg-white/5" />
            </Card>
        );
    }

    return (
        <Card className="glass-card lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    {chartTitle}
                </CardTitle>
                {isOwner && (
                    <Tabs value={timeRange} onValueChange={(v: string) => setTimeRange(v as 'today' | 'weekly' | 'monthly' | 'yearly')}>
                        <TabsList className="bg-black/20 h-8">
                            <TabsTrigger value="today" className="text-xs h-7">{t("sales.today")}</TabsTrigger>
                            <TabsTrigger value="weekly" className="text-xs h-7">{t("common.weekday")}</TabsTrigger>
                            <TabsTrigger value="monthly" className="text-xs h-7">{t("common.month")}</TabsTrigger>
                            <TabsTrigger value="yearly" className="text-xs h-7">{t("common.year")}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}
            </CardHeader>
            <CardContent>
                <div className="h-[250px] sm:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="label"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={timeRange === 'monthly' ? 10 : 12}
                                tickLine={false}
                                axisLine={false}
                                interval={timeRange === 'monthly' ? 2 : timeRange === 'today' ? 2 : 0}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value} DT`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    color: 'hsl(var(--card-foreground))'
                                }}
                                itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}
                                formatter={(value: number) => [`${value.toFixed(2)} DT`, 'Revenue']}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                dot={timeRange === 'monthly' ? false : { fill: "hsl(var(--primary))", r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default OverviewRevenueChart;
