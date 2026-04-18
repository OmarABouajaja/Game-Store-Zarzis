import { useEffect, useRef } from 'react';
import { useExpenses, useCreateExpense } from './useExpenses';
import { ExpenseCategory, Expense } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to handle automated recurring expenses (Monthly and Yearly).
 * It checks the previous cycle (last month or last year) and clones missing entries to the current cycle.
 */
export const useExpensesAutomation = () => {
    const { data: expenses, isLoading } = useExpenses();
    const createExpense = useCreateExpense();
    const { user } = useAuth();
    const hasRun = useRef(false);

    useEffect(() => {
        if (isLoading || !expenses || !user?.id || hasRun.current) return;
        hasRun.current = true;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 1. Monthly Automation
        const lastMonthDate = new Date(now);
        lastMonthDate.setMonth(now.getMonth() - 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        const lastMonthFixed = expenses.filter(e => {
            const d = new Date(e.date);
            return e.category === ExpenseCategory.MONTHLY && 
                   d.getMonth() === lastMonth && 
                   d.getFullYear() === lastMonthYear;
        });

        const currentMonthFixed = expenses.filter(e => {
            const d = new Date(e.date);
            return e.category === ExpenseCategory.MONTHLY && 
                   d.getMonth() === currentMonth && 
                   d.getFullYear() === currentYear;
        });

        // Clone if missing in current month (matching by description)
        lastMonthFixed.forEach(oldExp => {
            const alreadyExists = currentMonthFixed.some(curr => curr.description === oldExp.description);
            if (!alreadyExists) {
                console.log(`Automating Monthly Expense: ${oldExp.description}`);
                createExpense.mutate({
                    description: oldExp.description,
                    amount: oldExp.amount,
                    category: ExpenseCategory.MONTHLY,
                    expense_type: oldExp.expense_type || 'Automated Recurring',
                    date: now.toISOString().split('T')[0],
                    created_by: user.id
                });
            }
        });

        // 2. Yearly Automation
        const lastYear = currentYear - 1;
        const lastYearExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return e.category === ExpenseCategory.YEARLY && d.getFullYear() === lastYear;
        });

        const currentYearExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return e.category === ExpenseCategory.YEARLY && d.getFullYear() === currentYear;
        });

        lastYearExpenses.forEach(oldExp => {
            const alreadyExists = currentYearExpenses.some(curr => curr.description === oldExp.description);
            if (!alreadyExists) {
                console.log(`Automating Yearly Expense: ${oldExp.description}`);
                createExpense.mutate({
                    description: oldExp.description,
                    amount: oldExp.amount,
                    category: ExpenseCategory.YEARLY,
                    expense_type: oldExp.expense_type || 'Automated Recurring',
                    date: now.toISOString().split('T')[0],
                    created_by: user.id
                });
            }
        });

    }, [expenses, isLoading, user?.id]);
};
