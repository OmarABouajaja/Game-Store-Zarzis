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

function getLogicalBusinessDate(date: Date) {
    const logicalDate = new Date(date);
    if (logicalDate.getHours() < 8) {
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

// Helper to process sales for today (hourly using Business Day 08:00 -> 07:00)
function getTodayRevenue(transactions: Transaction[]) {
    // Business day hours: 8 AM to 7 AM next day
    const hours = [
        ...Array.from({ length: 16 }, (_, i) => i + 8), // 8 to 23
        ...Array.from({ length: 8 }, (_, i) => i)       // 0 to 7
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

// Helper to process sales for a daily range (Weekly or Monthly) using Business Days
function getDailyRevenueRange(transactions: Transaction[], daysBack: number) {
    const data = [];
    const now = new Date();
    const logicalToday = getLogicalBusinessDate(now);

    for (let i = daysBack - 1; i >= 0; i--) {
        const d = new Date(logicalToday);
        d.setDate(logicalToday.getDate() - i);
        const dateStr = getLocalDayStr(d);

        const dayRevenue = transactions
            .filter(t => getLocalDayStr(getLogicalBusinessDate(t.date)) === dateStr)
            .reduce((sum, t) => sum + t.amount, 0);

        // Format label based on range
        const displayLabel = d.toLocaleDateString('fr-FR', {
            weekday: daysBack <= 7 ? 'short' : undefined,
            day: 'numeric',
            month: daysBack > 7 ? 'short' : undefined
        });

        data.push({
            label: displayLabel,
            revenue: Number(dayRevenue.toFixed(2))
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

    const revenueData = useMemo(() => {
        if (isLoading) return [];
        
        // Merge all revenue streams
        // Fallback to propSales if context is empty
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
        if (timeRange === 'weekly') return getDailyRevenueRange(allTransactions, 7);
        return getDailyRevenueRange(allTransactions, 30);
    }, [contextSales, propSales, sessions, serviceRequests, timeRange, isLoading]);

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
                    {timeRange === 'today' ? t("dashboard.chart.daily_breakdown") :
                        timeRange === 'weekly' ? t("dashboard.chart.weekly_trend") :
                            t("dashboard.chart.monthly_trend")}
                </CardTitle>
                {isOwner && (
                    <Tabs value={timeRange} onValueChange={(v: string) => setTimeRange(v as 'today' | 'weekly' | 'monthly' | 'yearly')}>
                        <TabsList className="bg-black/20 h-8">
                            <TabsTrigger value="today" className="text-xs h-7">{t("sales.today")}</TabsTrigger>
                            <TabsTrigger value="weekly" className="text-xs h-7">{t("common.weekday")}</TabsTrigger>
                            <TabsTrigger value="monthly" className="text-xs h-7">{t("common.month") || 'Month'}</TabsTrigger>
                            <TabsTrigger value="yearly" className="text-xs h-7">{t("common.year") || 'Year'}</TabsTrigger>
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
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
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
                                dot={{ fill: "hsl(var(--primary))", r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
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
