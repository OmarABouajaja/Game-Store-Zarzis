import { useState } from "react";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ShoppingBag, Truck, CheckCircle, XCircle, Clock, Search, Eye, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Order, OrderItem } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

const OrdersManagement = () => {
    const { t } = useLanguage();
    const { data: orders, isLoading } = useOrders();
    const updateStatus = useUpdateOrderStatus();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const filteredOrders = orders?.filter(order => {
        const matchesSearch = order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.client_phone?.includes(searchTerm);
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await updateStatus.mutateAsync({ id, status: newStatus });
            toast({ title: t('orders.status.updated'), description: `${t('orders.status.marked_as')} ${newStatus}` });
        } catch (error) {
            toast({ title: t('orders.error'), description: t('orders.error.update'), variant: "destructive" });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 me-1" /> {t('orders.filter.pending')}</Badge>;
            case 'processing': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Truck className="w-3 h-3 me-1" /> {t('orders.filter.processing')}</Badge>;
            case 'completed': return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 me-1" /> {t('orders.filter.completed')}</Badge>;
            case 'cancelled': return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 me-1" /> {t('orders.filter.cancelled')}</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-bold">{t('orders.title')}</h1>
                        <p className="text-muted-foreground">{t('orders.subtitle')}</p>
                    </div>
                </div>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('orders.search')}
                            className="ps-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder={t('orders.table.status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('orders.filter.all')}</SelectItem>
                            <SelectItem value="pending">{t('orders.filter.pending')}</SelectItem>
                            <SelectItem value="processing">{t('orders.filter.processing')}</SelectItem>
                            <SelectItem value="completed">{t('orders.filter.completed')}</SelectItem>
                            <SelectItem value="cancelled">{t('orders.filter.cancelled')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Orders Table */}
                <Card className="glass-card">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('orders.table.id')}</TableHead>
                                    <TableHead>{t('orders.table.customer')}</TableHead>
                                    <TableHead>{t('orders.table.total')}</TableHead>
                                    <TableHead>{t('orders.table.delivery')}</TableHead>
                                    <TableHead>{t('orders.table.payment')}</TableHead>
                                    <TableHead>{t('orders.table.date')}</TableHead>
                                    <TableHead>{t('orders.table.status')}</TableHead>
                                    <TableHead className="text-right">{t('orders.table.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-20" />
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ms-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredOrders && filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{order.client_name}</span>
                                                    <span className="text-xs text-muted-foreground">{order.client_phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold">{order.total_amount?.toFixed(3)} DT</TableCell>
                                            <TableCell className="capitalize text-sm text-muted-foreground">{order.delivery_method?.replace('_', ' ')}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge variant="secondary" className="text-[10px] py-0 uppercase">
                                                        {order.payment_method?.replace('_', ' ')}
                                                    </Badge>
                                                    {order.payment_reference && (
                                                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[80px]" title={order.payment_reference}>
                                                            Ref: {order.payment_reference}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {order.created_at ? format(new Date(order.created_at), 'MMM d, HH:mm') : '-'}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
                                                        <DialogHeader>
                                                            <DialogTitle>{t('orders.detail.title')} #{order.id.slice(0, 8)}</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                                <div>
                                                                    <span className="font-bold block">{t('orders.detail.customer')}</span>
                                                                    {order.client_name} <br />
                                                                    {order.client_phone} <br />
                                                                    {order.client_email}
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold block">{t('orders.detail.delivery')}</span>
                                                                    <span className="capitalize">{order.delivery_method?.replace('_', ' ')}</span> <br />
                                                                    {order.delivery_address || t('orders.detail.no_address')}
                                                                </div>
                                                                <div className="md:col-span-2 pt-2 mt-2 border-t">
                                                                    <span className="font-bold block text-primary mb-1">{t('orders.detail.notes')}</span>
                                                                    <div className="p-3 bg-muted/40 rounded-lg text-xs whitespace-pre-wrap font-mono border">
                                                                        {order.notes || t('orders.detail.no_notes')}
                                                                    </div>
                                                                </div>
                                                                <div className="md:col-span-2 pt-2 mt-2 border-t flex justify-between items-center">
                                                                    <div>
                                                                        <span className="font-bold block text-primary">{t('orders.detail.payment_info')}</span>
                                                                        <span className="capitalize">{order.payment_method?.replace('_', ' ')}</span>
                                                                        {order.payment_reference && (
                                                                            <span className="ms-2 px-1.5 py-0.5 bg-muted rounded font-mono text-xs">
                                                                                Ref: {order.payment_reference}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'} className={order.payment_status === 'paid' ? 'bg-green-500' : ''}>
                                                                        {order.payment_status || 'pending'}
                                                                    </Badge>
                                                                </div>
                                                            </div>

                                                            <div className="border rounded-lg p-2 bg-muted/20">
                                                                <span className="font-bold text-sm mb-2 block">{t('orders.detail.items')}</span>
                                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                                    {order.items && Array.isArray(order.items) && order.items.map((item: OrderItem, idx: number) => (
                                                                        <div key={idx} className="flex justify-between items-center text-sm p-1 border-b last:border-0 border-muted/20">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium">{item.quantity}x {item.name}</span>
                                                                                {item.product_type === 'digital' && (
                                                                                    <div className="flex flex-col gap-1 mt-1">
                                                                                        <Badge variant="outline" className="text-[10px] w-fit h-4 text-blue-500 border-blue-200 bg-blue-50">
                                                                                            {t('orders.detail.digital_needed')}
                                                                                        </Badge>
                                                                                        {item.digital_content && (
                                                                                            <div className="flex items-center gap-2 mt-1 p-1.5 bg-muted rounded border group/code">
                                                                                                <code className="text-[10px] font-mono truncate max-w-[150px]">{item.digital_content}</code>
                                                                                                <Button
                                                                                                    variant="ghost"
                                                                                                    size="icon"
                                                                                                    className="h-4 w-4 opacity-0 group-hover/code:opacity-100 transition-opacity"
                                                                                                    onClick={() => {
                                                                                                        navigator.clipboard.writeText(item.digital_content);
                                                                                                        toast({ title: "Copied!", description: "Digital code copied to clipboard." });
                                                                                                    }}
                                                                                                >
                                                                                                    <Copy className="h-3 w-3" />
                                                                                                </Button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <span className="font-mono">{(item.price * item.quantity).toFixed(3)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                                                                    <span>{t('orders.table.total')}</span>
                                                                    <span>{order.total_amount?.toFixed(3)} DT</span>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                <span className="font-bold text-sm">{t('orders.detail.update_status')}</span>
                                                                <div className="flex gap-2 flex-wrap">
                                                                    {['pending', 'processing', 'completed', 'cancelled'].map(status => (
                                                                        <Button
                                                                            key={status}
                                                                            size="sm"
                                                                            variant={order.status === status ? "default" : "outline"}
                                                                            className="capitalize"
                                                                            onClick={() => handleStatusUpdate(order.id, status)}
                                                                        >
                                                                            {t(`orders.filter.${status}`)}
                                                                        </Button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={8} className="text-center py-8">{t('orders.empty')}</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default OrdersManagement;
