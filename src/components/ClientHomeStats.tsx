import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/lib/supabase";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Coins,
    Award,
    Gamepad2,
    User,
    Star,
    LogOut,
    ChevronRight,
    ShoppingCart,
    History,
    TrendingUp,
    Gift,
    CheckCircle,
    AlertCircle,
    Wrench,
    Package,
    Clock,
    ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingOverlay } from "@/components/ui/onboarding-overlay";

export const ClientHomeStats = () => {
    const { user, signOut } = useAuth();
    const { t } = useLanguage();
    const { products, pointsTransactions, clients, serviceRequests, orders } = useData();
    const { data: storeSettings } = useStoreSettings();
    const [localClient, setLocalClient] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const pointsEnabled = storeSettings?.points_system_enabled !== false;
    const freeGamesEnabled = storeSettings?.free_games_enabled !== false;

    // Identification logic
    const client = (() => {
        const item = localStorage.getItem('client_user');
        if (!item) return localClient || null;

        let identifier = '';
        try {
            const stored = JSON.parse(item);
            identifier = typeof stored === 'object' ? (stored?.email || stored?.phone || stored?.name) : stored;
        } catch (e) {
            identifier = item; // It's a plain string
        }

        if (!identifier) return localClient || null;

        return clients?.find(c =>
            c.email === identifier ||
            c.phone === identifier ||
            c.name === identifier ||
            c.id === identifier
        ) || localClient;
    })() || null;

    useEffect(() => {
        if (client) return;

        const fetchSpecificClient = async () => {
            const item = localStorage.getItem('client_user');
            if (!item) return;

            let identifier = '';
            try {
                const stored = JSON.parse(item);
                identifier = typeof stored === 'object' ? (stored?.email || stored?.phone) : stored;
            } catch (e) {
                identifier = item;
            }

            if (!identifier) return;

            setLoading(true);
            try {
                // PostgREST needs double quotes for values with special characters in .or() filter
                const { data, error } = await supabase
                    .from('clients')
                    .select('*')
                    .or(`email.eq."${identifier}",phone.eq."${identifier}"`)
                    .maybeSingle();

                if (data && !error) {
                    setLocalClient(data);
                }
            } catch (err) {
                console.error("Error fetching client for Home Page dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSpecificClient();
    }, [clients, client]);

    if (!client) return null;

    const clientTransactions = pointsTransactions?.filter(t => t.client_id === client.id) || [];
    const clientServiceRequests = serviceRequests?.filter(r =>
        r.client_id === client.id ||
        r.client_phone === client.phone ||
        (client.email && r.client_email === client.email)
    ) || [];

    const clientOrders = (orders as any[])?.filter(o =>
        o.client_id === client.id ||
        o.client_phone === client.phone ||
        (client.email && o.client_email === client.email)
    ) || [];

    const freeGameThreshold = 5;
    const currentStreak = client.total_games_played % freeGameThreshold;
    const freeGameProgress = (currentStreak / freeGameThreshold) * 100;
    const availableRewards = products?.filter(p => p.points_price && p.points_price > 0 && p.is_active) || [];

    const handleRedeemReward = (reward: any) => {
        if (client.points >= (reward.points_price || 0)) {
            setMessage({
                type: 'success',
                text: t('client.dashboard.redeem_success')
            });
            setTimeout(() => setMessage(null), 6000);
        } else {
            setMessage({
                type: 'error',
                text: t('client.dashboard.redeem_error', { amount: reward.points_price - client.points })
            });
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const handleLogout = async () => {
        localStorage.removeItem('client_user');
        await signOut();
        window.location.reload();
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
    };

    return (
        <motion.div
            className="container mx-auto px-4 -mt-10 mb-16 relative z-20"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <OnboardingOverlay />

            <div className="max-w-4xl mx-auto space-y-6">
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                        >
                            <Alert className={`${message.type === 'success' ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-red-500/50 bg-red-500/10 text-red-400'} shadow-lg border-2`}>
                                <div className="flex items-center gap-3">
                                    {message.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                                    <AlertDescription className="text-xs font-black uppercase tracking-tight">{message.text}</AlertDescription>
                                </div>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Points Card */}
                    {pointsEnabled && (
                        <motion.div variants={itemVariants}>
                            <Card className="glass-card overflow-hidden border-primary/20 relative group shadow-2xl hover:border-primary/40 transition-all duration-500 cursor-default">
                                <div className="absolute -top-10 -end-10 p-12 opacity-5 group-hover:opacity-10 transition-all duration-700 bg-primary rounded-full blur-3xl" />
                                <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <motion.div
                                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-yellow-600/10 border border-yellow-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)] shrink-0"
                                            animate={{ rotateY: [0, 360] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Coins className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                        </motion.div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">{t('client.dashboard.power_points')}</p>
                                            <p className="text-4xl font-black italic tracking-tighter text-white drop-shadow-sm">
                                                {client.points}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5">
                                        <Badge className="h-5 px-2 text-[9px] border-primary/30 text-primary-foreground bg-primary/80 uppercase font-black tracking-widest shadow-[0_0_10px_rgba(var(--primary),0.3)]">
                                            <Star className="w-3 h-3 me-1 fill-white animate-pulse" />
                                            Zarzis Pro
                                        </Badge>
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            ID: {client.id?.slice(0, 8)}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Milestone Card */}
                    {freeGamesEnabled && (
                        <motion.div variants={itemVariants}>
                            <Card className="glass-card border-blue-500/20 bg-blue-500/5 relative overflow-hidden group hover:border-blue-500/40 transition-all duration-500">
                                <div className="absolute top-0 start-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Award className="w-4 h-4 text-blue-400" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-400">{t('client.dashboard.milestone')}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-mono font-bold text-blue-300 border-blue-500/30">
                                            {currentStreak}/{freeGameThreshold}
                                        </Badge>
                                    </div>
                                    <div className="relative h-2.5 bg-blue-500/10 rounded-full mb-3 overflow-hidden border border-blue-500/10">
                                        <motion.div
                                            className="absolute top-0 start-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${freeGameProgress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                        <p className="font-bold uppercase tracking-tighter">
                                            {t('client.dashboard.sessions_left', { amount: freeGameThreshold - currentStreak })}
                                        </p>
                                        <div className="flex gap-1.5">
                                            {[...Array(freeGameThreshold)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all duration-500 ${i < currentStreak
                                                        ? 'bg-blue-500/40 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                                        : 'bg-secondary/20 border-white/5 text-white/5'
                                                        }`}
                                                >
                                                    <Gamepad2 className="w-3 h-3" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>

                {/* Action Tabs - Integrated Dashboard Content */}
                <motion.div variants={itemVariants}>
                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList className={`grid w-full ${pointsEnabled ? 'grid-cols-3' : 'grid-cols-1'} bg-secondary/10 h-10 p-1 border border-white/10 rounded-2xl shadow-inner shadow-black/20`}>
                            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black text-[9px] uppercase tracking-[0.1em] transition-all duration-300">
                                {t('client.dashboard.overview')}
                            </TabsTrigger>
                            {pointsEnabled && (
                                <>
                                    <TabsTrigger value="rewards" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black text-[9px] uppercase tracking-[0.1em] transition-all duration-300">
                                        {t('client.dashboard.shop')}
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black text-[9px] uppercase tracking-[0.1em] transition-all duration-300">
                                        {t('client.dashboard.activity')}
                                    </TabsTrigger>
                                </>
                            )}
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Service Requests Overview */}
                                <Card className="glass-card border-white/5 bg-card/40 flex flex-col h-full overflow-hidden">
                                    <CardHeader className="p-4 pb-2 border-b border-white/5 flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Wrench className="w-4 h-4 text-primary" />
                                            <CardTitle className="text-xs uppercase font-black tracking-widest leading-none">{t('client.dashboard.repairs')}</CardTitle>
                                        </div>
                                        {clientServiceRequests.length > 0 && (
                                            <Badge className="h-4 px-1.5 text-[8px] bg-primary/20 text-primary border-0 font-bold">{clientServiceRequests.length}</Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-4 flex-1">
                                        {clientServiceRequests.length > 0 ? (
                                            <div className="space-y-3">
                                                {clientServiceRequests.slice(0, 2).map((req, i) => (
                                                    <div key={i} className="flex flex-col gap-1 p-2 rounded-lg bg-white/5 border border-white/5">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-[10px] font-bold text-white uppercase italic">{req.device_model || req.device_type || t("client.label.device")}</span>
                                                            <Badge className={`h-4 px-1 text-[8px] border-0 font-black tracking-tighter ${req.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                                req.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                                                    'bg-yellow-500/20 text-yellow-400'
                                                                }`}>
                                                                {t(`client.status.${req.status}`) || req.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-[9px] text-muted-foreground line-clamp-1">{req.issue_description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-24 opacity-30 text-center">
                                                <Clock className="w-8 h-8 mb-2" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">{t('client.dashboard.no_repairs')}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Orders Overview */}
                                <Card className="glass-card border-white/5 bg-card/40 flex flex-col h-full overflow-hidden">
                                    <CardHeader className="p-4 pb-2 border-b border-white/5 flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-blue-400" />
                                            <CardTitle className="text-xs uppercase font-black tracking-widest leading-none">{t('client.dashboard.orders')}</CardTitle>
                                        </div>
                                        {clientOrders.length > 0 && (
                                            <Badge className="h-4 px-1.5 text-[8px] bg-blue-500/20 text-blue-400 border-0 font-bold">{clientOrders.length}</Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-4 flex-1">
                                        {clientOrders.length > 0 ? (
                                            <div className="space-y-3">
                                                {clientOrders.slice(0, 2).map((order, i) => (
                                                    <div key={i} className="flex flex-col gap-1 p-2 rounded-lg bg-white/5 border border-white/5">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-[10px] font-bold text-white uppercase italic">#{order.order_number || order.id?.slice(0, 6)}</span>
                                                            <Badge className={`h-4 px-1 text-[8px] border-0 font-black tracking-tighter ${order.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                                                                order.status === 'ready' ? 'bg-primary/20 text-primary' :
                                                                    'bg-muted/20 text-muted-foreground'
                                                                }`}>
                                                                {t(`client.status.${order.status}`) || order.status}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                                                            <span>{order.items?.length || 0} {t("client.label.items")}</span>
                                                            <span className="font-mono text-white/60">{order.total_amount} DT</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-24 opacity-30 text-center">
                                                <ShoppingCart className="w-8 h-8 mb-2" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">{t('client.dashboard.no_orders')}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="rewards" className="animate-in fade-in zoom-in-95 duration-500">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {availableRewards.length > 0 ? availableRewards.slice(0, 6).map((reward) => (
                                    <Card key={reward.id} className="glass-card border-white/10 hover:border-primary/50 transition-all duration-500 overflow-hidden group bg-card/60 hover:translate-y-[-2px] hover:shadow-xl shadow-black/40">
                                        <CardContent className="p-3 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-secondary/50 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-primary/5 transition-all duration-500 overflow-hidden shadow-inner">
                                                {reward.image_url ? (
                                                    <img src={reward.image_url} alt={reward.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125" />
                                                ) : (
                                                    <Gift className="w-5 h-5 text-primary/40 group-hover:text-primary transition-colors duration-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-[11px] truncate text-white uppercase tracking-tight group-hover:text-primary transition-colors duration-300">{reward.name}</h3>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <div className="flex items-center gap-1 bg-yellow-500/15 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                                        <Coins className="w-2.5 h-2.5 text-yellow-500" />
                                                        <span className="text-[10px] font-black text-yellow-500 tracking-tighter italic">{reward.points_price}</span>
                                                    </div>
                                                    {reward.price && reward.price > 0 && (
                                                        <span className="text-[9px] text-muted-foreground font-mono opacity-50">{reward.price} DT</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className={`h-8 px-4 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all duration-300 ${client.points >= (reward.points_price || 9999)
                                                    ? 'bg-primary text-primary-foreground hover:scale-105 shadow-[0_5px_15px_rgba(var(--primary),0.3)]'
                                                    : 'bg-white/5 text-muted-foreground border border-white/5 cursor-not-allowed opacity-40'
                                                    }`}
                                                disabled={client.points < (reward.points_price || 9999)}
                                                onClick={() => handleRedeemReward(reward)}
                                            >
                                                {client.points >= (reward.points_price || 9999) ? t('client.dashboard.take') : t('client.dashboard.locked')}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )) : (
                                    <div className="col-span-full text-center py-12 glass-card opacity-40 border-dashed border-white/20">
                                        <p className="text-[11px] uppercase font-black tracking-[0.2em]">{t('client.dashboard.shop_empty')}</p>
                                    </div>
                                )}
                            </div>

                            {availableRewards.length > 6 && (
                                <div className="text-center mt-6">
                                    <Link to="/client-auth">
                                        <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-6 rounded-full hover:bg-primary hover:text-white transition-all duration-500">
                                            {t('client.dashboard.explore_all')} <ChevronRight className="w-4 h-4 ms-1" />
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <Card className="glass-card border-white/10 max-h-[300px] overflow-auto custom-scrollbar-thin bg-card/60 shadow-xl">
                                <CardContent className="p-0">
                                    <div className="divide-y divide-white/5">
                                        {clientTransactions.length > 0 ? [...clientTransactions].reverse().slice(0, 15).map((tx, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition-all group"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border-2 transition-transform duration-500 group-hover:scale-110 ${tx.amount > 0 ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-primary/10 border-primary/20 text-primary'
                                                        }`}>
                                                        {tx.amount > 0 ? <TrendingUp className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="font-black text-[11px] truncate uppercase tracking-tight text-white/90 group-hover:text-primary transition-colors">
                                                            {tx.description || t('client.dashboard.system_update')}
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground/60 font-mono mt-0.5 uppercase">
                                                            {new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`font-black text-sm italic tracking-tighter ${tx.amount > 0 ? 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]'}`}>
                                                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                                                    </span>
                                                    <Badge className="h-3.5 px-1 text-[7px] border-0 bg-white/5 text-muted-foreground font-mono">
                                                        BAL: {tx.balance_after}
                                                    </Badge>
                                                </div>
                                            </motion.div>
                                        )) : (
                                            <div className="text-center py-20 opacity-30">
                                                <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                <p className="font-black text-[11px] uppercase tracking-[0.2em]">{t('client.dashboard.no_activity')}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </motion.div>

                {/* Welcome & Logout floating indicator */}
                <motion.div variants={itemVariants} className="flex justify-center">
                    <div className="bg-background/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-2 flex items-center gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-t-white/20">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center p-[1px] shadow-lg shadow-primary/20">
                                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                        <User className="w-4 h-4 text-primary" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white/90 uppercase tracking-widest leading-none mb-0.5">
                                    {t('common.welcome_back')}
                                </span>
                                <span className="text-[9px] font-bold text-primary italic leading-none truncate max-w-[120px]">
                                    {client.name}
                                </span>
                            </div>
                        </div>

                        <Separator orientation="vertical" className="h-6 opacity-30 bg-white/20" />

                        <div className="flex items-center gap-2">
                            <Link to="/client-auth">
                                <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all shadow-sm">
                                    <ExternalLink className="w-4 h-4" />
                                </Button>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="group w-8 h-8 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive hover:bg-destructive hover:text-white transition-all duration-500 shadow-lg shadow-destructive/5 active:scale-90"
                                title={t('client.dashboard.logout')}
                            >
                                <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div >
        </motion.div >
    );
};

const Separator = ({ orientation = "horizontal", className = "" }: { orientation?: "horizontal" | "vertical", className?: string }) => (
    <div className={`${orientation === "horizontal" ? "w-full h-px" : "h-full w-px"} bg-border ${className}`} />
);
