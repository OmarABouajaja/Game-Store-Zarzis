import React, { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus, Edit, Trash2, Calendar, Receipt,
    TrendingDown, CreditCard, Wallet, Pencil
} from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { useExpensesAutomation } from "@/hooks/useExpensesAutomation";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const ExpensesManagement = () => {
    const { role, user } = useAuth();
    const { data: expenses, isLoading, isError, error } = useExpenses();
    const createExpense = useCreateExpense();
    const updateExpense = useUpdateExpense();
    const deleteExpense = useDeleteExpense();
    const { toast } = useToast();
    const { t } = useLanguage();
    useExpensesAutomation();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "daily",
        expense_type: "",
        date: new Date().toISOString().split('T')[0]
    });

    const [activeTab, setActiveTab] = useState("daily");

    if (role !== "owner") {
        return <div>Access Denied</div>;
    }

    if (isError) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="p-8 text-center text-destructive">
                        <h2 className="text-xl font-bold mb-2">Error Loading Expenses</h2>
                        <p>{(error as Error)?.message || "Unknown error occurred"}</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </Button>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    const handleOpenAdd = () => {
        setEditingExpense(null);
        setFormData({
            description: "",
            amount: "",
            category: "daily",
            expense_type: "",
            date: new Date().toISOString().split('T')[0]
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (expense: any) => {
        setEditingExpense(expense);
        setFormData({
            description: expense.description,
            amount: expense.amount.toString(),
            category: expense.category,
            expense_type: expense.expense_type || "",
            date: expense.date
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        const amountNum = parseFloat(formData.amount);
        
        if (!formData.description || isNaN(amountNum) || amountNum <= 0) {
            toast({ 
                title: "Validation Error", 
                description: t('common.invalid_amount') || "Veuillez entrer une description et un montant valide.", 
                variant: "destructive" 
            });
            return;
        }

        if (!user?.id) {
            toast({ 
                title: "Auth Error", 
                description: "Session expirée. Veuillez vous reconnecter.", 
                variant: "destructive" 
            });
            return;
        }

        try {
            const payload = {
                description: formData.description.trim(),
                amount: amountNum,
                category: formData.category as any,
                expense_type: formData.expense_type || formData.category,
                date: formData.date,
                created_by: user.id
            };

            if (editingExpense) {
                await updateExpense.mutateAsync({ id: editingExpense.id, ...payload });
                toast({ title: "✅ Success", description: t('expenses.success_update') });
            } else {
                await createExpense.mutateAsync(payload);
                toast({ title: "✅ Success", description: t('expenses.success_add') });
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            console.error("Expense operation error:", error);
            toast({ 
                title: "❌ Error", 
                description: error?.message || "Operation failed", 
                variant: "destructive" 
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(t('expenses.delete_confirm'))) {
            await deleteExpense.mutateAsync(id);
            toast({ title: "✅ Deleted", description: t('expenses.success_delete') });
        }
    };



    // Filter Logic
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filteredExpenses = expenses?.filter(e => {
        if (!e.date) return false;
        const d = new Date(e.date);
        if (isNaN(d.getTime())) return false;

        // Basic Type Check
        if (activeTab === 'daily') {
            // For daily, show current month's daily expenses
            return e.category === 'daily' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }
        if (activeTab === 'monthly') {
            // For monthly, show current year's monthly expenses (or all?) - let's show all for now or current month?
            // "Monthly" usually means recurring, so showing active ones or history. 
            // Let's show filtered by category.
            return e.category === 'monthly';
        }
        if (activeTab === 'yearly') {
            return e.category === 'yearly' && d.getFullYear() === currentYear;
        }
        return true;
    }) || [];

    // Calculations
    const allCurrentMonth = expenses?.filter(e => {
        if (!e.date) return false;
        const d = new Date(e.date);
        if (isNaN(d.getTime())) return false;
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }) || [];

    const totalDaily = allCurrentMonth.filter(e => e.category === 'daily').reduce((sum, e) => sum + e.amount, 0);
    const totalMonthly = allCurrentMonth.filter(e => e.category === 'monthly').reduce((sum, e) => sum + e.amount, 0);

    // Yearly calculation (Total of all expenses this year)
    const allCurrentYear = expenses?.filter(e => {
        if (!e.date) return false;
        const d = new Date(e.date);
        if (isNaN(d.getTime())) return false;
        return d.getFullYear() === currentYear;
    }) || [];
    const totalYearly = allCurrentYear.reduce((sum, e) => sum + e.amount, 0);

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-display text-3xl font-bold mb-2">{t('expenses.title')}</h1>
                            <p className="text-muted-foreground">{t('expenses.subtitle')}</p>
                        </div>
                        <Button onClick={handleOpenAdd} className="gap-2">
                            <Plus className="w-4 h-4" /> {t('expenses.add_button')}
                        </Button>
                    </div>

                    {/* Summary Cards - Dynamic based on active tab or global */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="glass-card border-l-4 border-l-red-500">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-100 rounded-full">
                                        <Wallet className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('expenses.daily_month')}</p>
                                        {isLoading ? (
                                            <Skeleton className="h-8 w-24 bg-red-500/10" />
                                        ) : (
                                            <p className="text-2xl font-bold">{totalDaily.toFixed(3)} DT</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-card border-l-4 border-l-orange-500">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-orange-100 rounded-full">
                                        <CreditCard className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('expenses.monthly_fixed')}</p>
                                        {isLoading ? (
                                            <Skeleton className="h-8 w-24 bg-orange-500/10" />
                                        ) : (
                                            <p className="text-2xl font-bold">{totalMonthly.toFixed(3)} DT</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-card border-l-4 border-l-primary">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-full">
                                        <TrendingDown className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('expenses.total_yearly')}</p>
                                        {isLoading ? (
                                            <Skeleton className="h-8 w-24 bg-primary/10" />
                                        ) : (
                                            <p className="text-2xl font-bold">{totalYearly.toFixed(3)} DT</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="glass-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="w-5 h-5 text-primary" />
                                    {t('expenses.list_title')}
                                </CardTitle>
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="daily">{t('expenses.tab_daily')}</TabsTrigger>
                                        <TabsTrigger value="monthly">{t('expenses.tab_monthly')}</TabsTrigger>
                                        <TabsTrigger value="yearly">{t('expenses.tab_yearly')}</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {isLoading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-black/10 border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <Skeleton className="h-10 w-10 rounded-lg bg-white/5" />
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-5 w-48 bg-white/5" />
                                                        <div className="flex gap-2">
                                                            <Skeleton className="h-3 w-16 bg-white/5" />
                                                            <Skeleton className="h-3 w-12 bg-white/5" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Skeleton className="h-6 w-20 bg-white/5" />
                                                    <div className="flex gap-2">
                                                        <Skeleton className="h-8 w-8 bg-white/5" />
                                                        <Skeleton className="h-8 w-8 bg-white/5" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredExpenses && filteredExpenses.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {filteredExpenses.map((expense) => (
                                            <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5 hover:bg-black/40 transition-colors gap-3 sm:gap-0">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${expense.category === 'yearly' ? 'bg-purple-500/20 text-purple-500' :
                                                        expense.category === 'monthly' ? 'bg-orange-500/20 text-orange-500' :
                                                            'bg-red-500/20 text-red-500'}`}>
                                                        <Calendar className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{expense.description}</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs text-muted-foreground">{expense.date}</span>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold border ${expense.category === 'yearly' ? 'border-purple-500/30 text-purple-500' :
                                                                expense.category === 'monthly' ? 'border-orange-500/30 text-orange-500' :
                                                                    'border-red-500/30 text-red-500'
                                                                }`}>
                                                                {expense.category}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                                    <span className="text-lg font-bold text-red-500">-{expense.amount.toFixed(3)} DT</span>
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" className="h-9 w-9" onClick={() => handleOpenEdit(expense)}>
                                                            <Pencil className="w-5 h-5" />
                                                        </Button>
                                                        <Button variant="ghost" onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-400 h-9 w-9">
                                                            <Trash2 className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                                        <p className="text-muted-foreground text-sm">{t('expenses.no_expenses')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingExpense ? t('expenses.edit_title') : t('expenses.add_title')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>{t('expenses.description')}</Label>
                                <Input
                                    placeholder={t('expenses.description_placeholder')}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="text-base md:text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('expenses.amount')}</Label>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        className="text-base md:text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type de Dépense</Label>
                                    <Input
                                        placeholder="Ex: Facture, Achat..."
                                        value={formData.expense_type}
                                        onChange={e => setFormData({ ...formData, expense_type: e.target.value })}
                                        className="text-base md:text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('expenses.category')}</Label>
                                <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">{t('expenses.cat_daily')}</SelectItem>
                                        <SelectItem value="monthly">{t('expenses.cat_monthly')}</SelectItem>
                                        <SelectItem value="yearly">{t('expenses.cat_yearly')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('expenses.date')}</Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12 px-6 text-base">{t('expenses.cancel')}</Button>
                            <Button onClick={handleSubmit} className="h-12 px-8 text-lg font-bold">{t('expenses.save')}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DashboardLayout>
        </ProtectedRoute>
    );
};

export default ExpensesManagement;
