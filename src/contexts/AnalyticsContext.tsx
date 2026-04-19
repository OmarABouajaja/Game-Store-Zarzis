import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { useData } from './DataContext';
import { supabase, TABLES } from '@/lib/supabase';
import { Expense, AnalyticsSummary, ExpenseCategory } from '@/types';

interface AnalyticsContextType {
    summary: AnalyticsSummary;
    expenses: Expense[];
    isLoading: boolean;
    timeRange: 'today' | 'weekly' | 'monthly' | 'yearly';
    setTimeRange: (range: 'today' | 'weekly' | 'monthly' | 'yearly') => void;
    refreshAnalytics: () => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
    const context = useContext(AnalyticsContext);
    if (context === undefined) {
        throw new Error('useAnalytics must be used within an AnalyticsProvider');
    }
    return context;
};

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { sales, sessions, serviceRequests, products = [] } = useData();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'today' | 'weekly' | 'monthly' | 'yearly'>('weekly');

    const loadExpenses = useCallback(async () => {
        try {
            // Use 'any' if 'expenses' isn't in the generated Supabase types
            const { data, error } = await supabase
                .from(TABLES.EXPENSES as any)
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            setExpenses((data as any[]) || []);
        } catch (err) {
            console.error('Error loading expenses for analytics:', err);
        }
    }, []);

    useEffect(() => {
        loadExpenses().finally(() => setIsLoading(false));
    }, []);

    const summary = useMemo(() => {
        // Business day: 7:00 AM to 6:59 AM next day
        const getLogicalBusinessDate = (date: Date) => {
            const logicalDate = new Date(date);
            if (logicalDate.getHours() < 7) {
                logicalDate.setDate(logicalDate.getDate() - 1);
            }
            return logicalDate;
        };

        const getLocalDayStr = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const now = new Date();
        const logicalNow = getLogicalBusinessDate(now);
        const todayStr = getLocalDayStr(logicalNow);

        // Weekly: Sunday to Saturday of current week
        const dayOfWeek = logicalNow.getDay(); // 0 = Sunday
        const weekStart = new Date(logicalNow);
        weekStart.setDate(logicalNow.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Monthly: Current calendar month
        const monthStart = new Date(logicalNow.getFullYear(), logicalNow.getMonth(), 1);
        const monthEnd = new Date(logicalNow.getFullYear(), logicalNow.getMonth() + 1, 0, 23, 59, 59, 999);

        // Filter data based on timeRange
        const filterByTime = (dateStr: string) => {
            const date = new Date(dateStr);
            const logicalDate = getLogicalBusinessDate(date);
            if (timeRange === 'today') {
                return getLocalDayStr(logicalDate) === todayStr;
            }
            if (timeRange === 'weekly') {
                return logicalDate >= weekStart && logicalDate <= weekEnd;
            }
            if (timeRange === 'monthly') {
                return logicalDate >= monthStart && logicalDate <= monthEnd;
            }
            if (timeRange === 'yearly') {
                return logicalDate.getFullYear() === logicalNow.getFullYear();
            }
            return true;
        };

        // Revenue Calculations
        const filteredSales = sales.filter(s => filterByTime(s.created_at));
        const filteredSessions = sessions.filter(s => s.status === 'completed' && filterByTime(s.created_at || ''));
        const filteredServices = serviceRequests.filter(r => r.status === 'completed' && filterByTime(r.created_at));

        const salesRev = filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
        const gamingRev = filteredSessions.reduce((sum, s) => sum + Number(s.total_amount), 0);
        const serviceRev = filteredServices.reduce((sum, r) => sum + Number(r.final_cost || r.quoted_price || 0), 0);

        const totalRev = salesRev + gamingRev + serviceRev;

        // Expense Calculations
        const filteredExpenses = expenses.filter(e => filterByTime(e.date));
        const dailyExp = filteredExpenses.filter(e => e.category === ExpenseCategory.DAILY).reduce((sum, e) => sum + e.amount, 0);
        const monthlyExp = filteredExpenses.filter(e => e.category === ExpenseCategory.MONTHLY).reduce((sum, e) => sum + e.amount, 0);
        const yearlyExp = filteredExpenses.filter(e => e.category === ExpenseCategory.YEARLY).reduce((sum, e) => sum + e.amount, 0);
        const totalExp = dailyExp + monthlyExp + yearlyExp;

        // Profitability
        // Calculate COGS (Cost of Goods Sold) using products array
        const cogs = filteredSales.reduce((sum, s) => {
            const saleAny = s as any;
            if (!saleAny.product_id) return sum;
            const product = products.find(p => p.id === saleAny.product_id);
            const costParam = Number(product?.cost_price || 0);
            const qty = Number(saleAny.quantity || 1);
            return sum + (costParam * qty);
        }, 0);

        const grossProfit = totalRev - cogs;
        const netProfit = grossProfit - totalExp;
        const margin = totalRev > 0 ? (netProfit / totalRev) * 100 : 0;

        // Calculate specific margins to eliminate 'triangular' placeholders
        const gamingMargin = gamingRev > 0 ? 100 : 0; // Pure service (no primary cost assigned yet)
        const serviceMargin = serviceRev > 0 ? 100 : 0; // Service labor (parts separately computed if needed)
        const salesMargin = salesRev > 0 ? ((salesRev - cogs) / salesRev) * 100 : 0;

        return {
            revenue: {
                total: totalRev,
                gaming: gamingRev,
                sales: salesRev,
                services: serviceRev
            },
            expenses: {
                total: totalExp,
                daily: dailyExp,
                monthly: monthlyExp,
                yearly: yearlyExp
            },
            profit: {
                gross: grossProfit,
                net: netProfit,
                margin: margin,
                categoryMargins: {
                    gaming: gamingMargin,
                    services: serviceMargin,
                    sales: salesMargin
                }
            }
        };
    }, [sales, sessions, serviceRequests, expenses, timeRange, products]);

    const value = useMemo(() => ({
        summary,
        expenses,
        isLoading,
        timeRange,
        setTimeRange,
        refreshAnalytics: loadExpenses
    }), [summary, expenses, isLoading, timeRange, loadExpenses]);

    return (
        <AnalyticsContext.Provider value={value}>
            {children}
        </AnalyticsContext.Provider>
    );
};
