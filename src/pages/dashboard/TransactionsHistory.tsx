import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Trash2, Search, ArrowLeft, ArrowRight, FileText, User, Calendar, ShoppingBag, Gamepad2, Clock } from "lucide-react";
import { format } from "date-fns";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Sale, GameSession } from "@/types";

// Define a unified transaction type
type Transaction = {
    id: string;
    type: 'sale' | 'session';
    date: string;
    amount: number;
    description: string;
    details?: string;
    clientName: string;
    staffName: string;
    paymentMethod: string;
    raw: Sale | GameSession; // Keep original object for actions like delete
};

const TransactionsHistory = () => {
    const { isOwner } = useAuth();
    const { t } = useLanguage();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<'sale' | 'session' | null>(null);

    const PAGE_SIZE = 10;

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            // Fetch recent Sales (Limit 100 for performance, can increase if needed)
            const salesPromise = supabase
                .from('sales')
                .select(`
                    *,
                    client:client_id(name, phone),
                    staff:staff_id(full_name),
                    product:product_id(name, name_fr)
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            // Fetch recent Completed Sessions
            const sessionsPromise = supabase
                .from('gaming_sessions')
                .select(`
                    *,
                    client:client_id(name, phone),
                    staff:staff_id(full_name)
                `)
                .eq('status', 'completed')
                .order('end_time', { ascending: false })
                .limit(100);

            const [salesRes, sessionsRes] = await Promise.all([salesPromise, sessionsPromise]);

            if (salesRes.error) throw salesRes.error;
            if (sessionsRes.error) throw sessionsRes.error;

            const salesData = salesRes.data || [];
            const sessionsData = sessionsRes.data || [];

            // Normalize Sales
            const normalizedSales: Transaction[] = salesData.map(sale => ({
                id: sale.id,
                type: 'sale',
                date: sale.created_at,
                amount: Number(sale.total_amount),
                description: (sale as any).product?.name_fr || t('transactions.unknown_product'),
                details: `Qty: ${sale.quantity}`,
                clientName: sale.client?.name || '-',
                staffName: (sale as any).staff?.full_name || t('transactions.unknown_staff'),
                paymentMethod: sale.payment_method || 'cash',
                raw: sale
            }));

            // Normalize Sessions
            const normalizedSessions: Transaction[] = sessionsData.map(session => ({
                id: session.id,
                type: 'session',
                // Use end_time as transaction date, fallback to created_at
                date: session.end_time || session.created_at,
                amount: Number(session.total_amount),
                description: t('transactions.gaming_session'),
                details: `${Math.round(session.duration_minutes || 0)} mins`,
                clientName: (session as any).client?.name || t('transactions.walk_in'),
                staffName: (session as any).staff?.full_name || t('transactions.unknown_staff'),
                paymentMethod: 'cash', // Sessions default to cash usually, or check logic
                raw: session
            }));

            // Merge and Sort
            const allTransactions = [...normalizedSales, ...normalizedSessions].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setTransactions(allTransactions);

        } catch (err: unknown) {
            console.error("Error fetching transactions:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            toast({ title: t('transactions.title'), description: errorMessage, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleDelete = async () => {
        if (!deleteId || !deleteType) return;
        try {
            const table = deleteType === 'sale' ? 'sales' : 'gaming_sessions';
            const { error } = await supabase.from(table).delete().eq('id', deleteId);

            if (error) throw error;

            toast({ title: t('transactions.delete_confirm') + " ✓" });

            // Optimistic Update
            setTransactions(prev => prev.filter(t => t.id !== deleteId));

            setDeleteId(null);
            setDeleteType(null);
            setDeleteId(null);
            setDeleteType(null);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Delete failed";
            toast({ title: t('transactions.delete_title'), description: errorMessage, variant: "destructive" });
        }
    };

    // Pagination Logic
    const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
    const paginatedTransactions = transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    if (!isOwner) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                        {t('transactions.access_denied')}
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-display text-3xl font-bold mb-2">{t('transactions.title')}</h1>
                            <p className="text-muted-foreground">{t('transactions.subtitle')}</p>
                        </div>
                        <HelpTooltip content={t('transactions.help')} />
                    </div>

                    <Card className="glass-card">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                {t('transactions.all')}
                            </CardTitle>
                            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg text-sm text-muted-foreground">
                                <span className="font-semibold">{transactions.length}</span> {t('transactions.recent_records')}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('transactions.col_date')}</TableHead>
                                            <TableHead>{t('transactions.col_type')}</TableHead>
                                            <TableHead>{t('transactions.col_description')}</TableHead>
                                            <TableHead>{t('transactions.col_client')}</TableHead>
                                            <TableHead>{t('transactions.col_staff')}</TableHead>
                                            <TableHead>{t('transactions.col_amount')}</TableHead>
                                            <TableHead className="text-right">{t('transactions.col_actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell colSpan={7} className="h-12 animate-pulse bg-muted/20" />
                                                </TableRow>
                                            ))
                                        ) : paginatedTransactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    {t('transactions.empty')}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedTransactions.map((t) => (
                                                <TableRow key={`${t.type}-${t.id}`}>
                                                    <TableCell className="font-medium whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span>{format(new Date(t.date), 'MMM d, yyyy')}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {format(new Date(t.date), 'HH:mm')}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {t.type === 'sale' ? (
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                                                <ShoppingBag className="w-3 h-3 me-1" />
                                                                {t('transactions.type_sale')}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                                                                <Gamepad2 className="w-3 h-3 me-1" />
                                                                {t('transactions.type_session')}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{t.description}</p>
                                                            <p className="text-xs text-muted-foreground">{t.details}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {t.clientName !== '-' ? (
                                                            <div className="flex items-center gap-1">
                                                                <User className="w-3 h-3 text-muted-foreground" />
                                                                <span>{t.clientName}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-xs px-2 py-1 rounded bg-secondary/10 text-secondary border border-secondary/20">
                                                            {t.staffName}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-bold text-primary">
                                                            {t.amount.toFixed(3)} DT
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => {
                                                                setDeleteId(t.id);
                                                                setDeleteType(t.type);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Client-Side Pagination Controls */}
                            <div className="flex items-center justify-between mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0 || isLoading}
                                >
                                    <ArrowLeft className="w-4 h-4 me-2" />
                                    {t('transactions.prev')}
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                    {t('transactions.page_of', { page: page + 1, total: totalPages || 1 })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1 || isLoading}
                                >
                                    {t('transactions.next')}
                                    <ArrowRight className="w-4 h-4 ms-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delete Confirmation */}
                    <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('transactions.delete_title')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('transactions.delete_desc')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    {t('transactions.delete_confirm')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
};

export default TransactionsHistory;
