import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
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
    const { sales, sessions, serviceRequests } = useData();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'today' | 'weekly' | 'monthly' | 'yearly'>('weekly');

    const loadExpenses = async () => {
        try {
            const { data, error } = await supabase
                .from(TABLES.EXPENSES)
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            setExpenses(data || []);
        } catch (err) {
            console.error('Error loading expenses for analytics:', err);
        }
    };

    useEffect(() => {
        loadExpenses().finally(() => setIsLoading(false));
    }, []);

    const summary = useMemo(() => {
        const getLogicalBusinessDate = (date: Date) => {
            const logicalDate = new Date(date);
            if (logicalDate.getHours() < 8) {
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

        // Filter data based on timeRange
        const filterByTime = (dateStr: string) => {
            const date = new Date(dateStr);
            if (timeRange === 'today') {
                return getLocalDayStr(getLogicalBusinessDate(date)) === todayStr;
            }
            if (timeRange === 'weekly') {
                const lastWeek = new Date(logicalNow);
                lastWeek.setDate(logicalNow.getDate() - 7);
                return getLogicalBusinessDate(date) >= lastWeek;
            }
            if (timeRange === 'monthly') {
                const lastMonth = new Date(logicalNow);
                lastMonth.setMonth(logicalNow.getMonth() - 1);
                return getLogicalBusinessDate(date) >= lastMonth;
            }
            if (timeRange === 'yearly') {
                return getLogicalBusinessDate(date).getFullYear() === logicalNow.getFullYear();
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
        const grossProfit = totalRev; // Simplified for now, can add COGS if tracked
        const netProfit = totalRev - totalExp;
        const margin = totalRev > 0 ? (netProfit / totalRev) * 100 : 0;

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
                margin: margin
            }
        };
    }, [sales, sessions, serviceRequests, expenses, timeRange]);

    const value = {
        summary,
        expenses,
        isLoading,
        timeRange,
        setTimeRange,
        refreshAnalytics: loadExpenses
    };

    return (
        <AnalyticsContext.Provider value={value}>
            {children}
        </AnalyticsContext.Provider>
    );
};
