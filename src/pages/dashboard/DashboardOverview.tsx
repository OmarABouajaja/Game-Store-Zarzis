import React, { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useTodayStats } from "@/hooks/useStats";
import { useConsoles } from "@/hooks/useConsoles";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useActiveSessions } from "@/hooks/useGamingSessions";
import { useAllActiveShifts } from "@/hooks/useStaffShifts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/contexts/AnalyticsContext";
import { Sale, Profile } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DollarSign, TrendingUp, Users, Gamepad2, Wrench, CheckCircle2,
  Star, BarChart3, Settings, ArrowUpRight,
  Target, Zap, Percent, Activity, Receipt, Clock
} from "lucide-react";
import { AttendanceToggle } from "@/components/AttendanceToggle";
import { Skeleton } from "@/components/ui/skeleton";


// Helper to get the top income source across ALL transaction types
function getTopIncomeSource(
  sales: Sale[],
  sessions: { status: string; total_amount: number; created_at?: string }[],
  services: { status: string; final_cost?: number; quoted_price?: number; created_at: string }[],
  products: { id: string; name: string; name_fr?: string }[],
  labels: { gaming: string; services: string }
) {
  const counts: Record<string, { name: string; count: number; revenue: number }> = {};

  // Each sale row in DB = one product sale (product_id, quantity, unit_price, total_amount)
  sales.forEach(sale => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saleAny = sale as any;
    const productId = saleAny.product_id;
    const qty = saleAny.quantity || 1;
    const amount = Number(sale.total_amount || 0);

    // Look up product name from products array
    let productName: string;
    if (productId) {
      const product = products.find(p => p.id === productId);
      productName = product?.name_fr || product?.name || `Produit`;
    } else {
      productName = 'Vente';
    }

    if (!counts[productName]) counts[productName] = { name: productName, count: 0, revenue: 0 };
    counts[productName].count += qty;
    counts[productName].revenue += amount;
  });

  // Count gaming sessions as a category
  const completedSessions = sessions.filter(s => s.status === 'completed');
  if (completedSessions.length > 0) {
    const gamingRevenue = completedSessions.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    counts[labels.gaming] = { name: labels.gaming, count: completedSessions.length, revenue: gamingRevenue };
  }

  // Count services as a category
  const completedServices = services.filter(r => r.status === 'completed');
  if (completedServices.length > 0) {
    const serviceRevenue = completedServices.reduce((sum, r) => sum + Number(r.final_cost || r.quoted_price || 0), 0);
    counts[labels.services] = { name: labels.services, count: completedServices.length, revenue: serviceRevenue };
  }

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

const OverviewRevenueChart = React.lazy(() => import('@/components/dashboard/overview/OverviewRevenueChart'));

const DashboardOverview = () => {
  const { user, role } = useAuth();
  const { sales, clients, products, sessions: dataSessions, serviceRequests: dataServiceRequests, isLoading: isDataLoading } = useData();
  const { t, language, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const { data: todayStats } = useTodayStats();
  const { data: consoles } = useConsoles();
  const { data: serviceRequests } = useServiceRequests();
  const { data: activeSessions } = useActiveSessions();
  const { summary, timeRange, setTimeRange, isLoading: isAnalyticsLoading } = useAnalytics();
  const { data: activeShiftsRaw } = useAllActiveShifts();

  const isOwner = role === "owner";

  // Workers can only see 'today' stats and chart
  useEffect(() => {
    if (!isOwner && timeRange !== 'today') {
      setTimeRange('today');
    }
  }, [isOwner, timeRange, setTimeRange]);

  // Deduplicate active shifts by staff_id for display
  const activeShifts = useMemo(() => {
    if (!activeShiftsRaw) return [];

    const uniqueStaffIds = new Set<string>();
    return activeShiftsRaw.filter((shift: any) => {
      if (uniqueStaffIds.has(shift.staff_id)) return false;
      uniqueStaffIds.add(shift.staff_id);
      return true;
    });
  }, [activeShiftsRaw]);

  // Calculate real-time stats (Keeping these as they are operational, not just financial)
  const availableConsoles = consoles?.filter(c => c.status === 'available').length || 0;
  const totalConsoles = consoles?.length || 0;
  const pendingServices = serviceRequests?.filter((r: any) => r.status === 'pending').length || 0;

  // Top income source across ALL transaction types
  const topProducts = useMemo(() => getTopIncomeSource(
    sales || [],
    dataSessions || [],
    dataServiceRequests || [],
    products || [],
    { gaming: t("dashboard.gaming_revenue"), services: t("nav.services") }
  ), [sales, dataSessions, dataServiceRequests, products, t]);

  const handleShareRecap = () => {
    const now = new Date();
    const locale = language === 'ar' ? 'ar-TN' : (language === 'en' ? 'en-GB' : 'fr-FR');
    const dateStr = now.toLocaleDateString(locale);

    const recap = `
📊 ${t("nav.dashboard")} - ${dateStr}
------------------------------
💰 ${t("dashboard.revenue_total")}: ${summary.revenue.total.toFixed(3)} DT
🎮 ${t("dashboard.gaming_revenue")}: ${summary.revenue.gaming.toFixed(3)} DT
🛍️ ${t("nav.sales")}: ${summary.revenue.sales.toFixed(3)} DT
🔧 ${t("nav.services")}: ${summary.revenue.services.toFixed(3)} DT

📉 ${t("dashboard.expenses")}: ${summary.expenses.total.toFixed(3)} DT
✨ ${t("dashboard.net_profit")}: ${summary.profit.net.toFixed(3)} DT
📈 ${t("dashboard.profit_margin")}: ${summary.profit.margin.toFixed(1)}%

🔝 ${t("dashboard.top_product")}: ${topProducts[0]?.name || 'N/A'}
------------------------------
Game Store Zarzis - Intelligence Business
    `.trim();

    navigator.clipboard.writeText(recap);
    import("sonner").then(({ toast }) => {
      toast.success(t("dashboard.recap_copied"), {
        description: t("dashboard.recap_desc")
      });
    });
  };



  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                {isOwner ? t("dashboard.financial_overview") : t("dashboard.operational_dashboard")}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {isOwner
                  ? t("dashboard.financial_analysis_desc")
                  : `${t("dashboard.welcome")} ${user?.email?.split('@')[0]} ! ${t("dashboard.manage_daily")}`
                }
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <AttendanceToggle />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="glass-card gap-2 neon-cyan-glow relative">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="hidden sm:inline">
                      {activeShifts?.length
                        ? t("dashboard.staff_on_shift", { count: activeShifts.length })
                        : t("dashboard.no_staff_on_shift")
                      }
                    </span>
                    <span className="sm:hidden font-bold">{activeShifts?.length || 0}</span>
                    {activeShifts && activeShifts.length > 0 && (
                      <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]`} />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 glass-card border-white/10 p-0 overflow-hidden" align="end">
                  <div className="p-3 border-b border-white/5 bg-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {t("sidebar.staff_management")}
                    </h4>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto">
                    {activeShifts && activeShifts.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {activeShifts.map((shift: any) => (
                          <div key={shift.id} className="p-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary uppercase">
                              {((shift.profile as Profile)?.full_name || (shift.profile as Profile)?.email || "?").substring(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {(shift.profile as Profile)?.full_name || t("common.welcome_back")}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                {t("attendance.in_service")} • {new Date(shift.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                        <p className="text-xs text-muted-foreground italic">{t("dashboard.no_staff_on_shift")}</p>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {isOwner && (
                <Button variant="outline" size="sm" className="glass-card gap-2 neon-purple-glow" onClick={handleShareRecap}>
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="hidden sm:inline">{t("dashboard.share_recap")}</span>
                </Button>
              )}
              <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 me-1 sm:mr-2" />
                <span className="hidden sm:inline">{t("dashboard.real_time")}</span>
                <span className="sm:hidden">Live</span>
              </Badge>
            </div>
          </div>

          {/* KPI Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {isOwner ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className={`glass-card glossy-reflection neon-cyan-glow ${isRTL ? 'border-r-4 border-r-green-500' : 'border-l-4 border-l-green-500'}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2 min-h-[2.5em] leading-tight flex items-center">
                            {timeRange === 'today' ? t("dashboard.chart.net_profit_today") :
                              timeRange === 'weekly' ? t("dashboard.chart.net_profit_weekly") :
                                timeRange === 'monthly' ? t("dashboard.chart.net_profit_monthly") : t("dashboard.chart.net_profit_yearly")}
                          </p>
                          {isAnalyticsLoading ? (
                            <Skeleton className="h-8 w-24 sm:w-32 bg-white/5" />
                          ) : (
                            <p className={`text-xl sm:text-2xl font-bold ${summary.profit.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {summary.profit.net.toFixed(3)} DT
                            </p>
                          )}
                          <div className="flex items-center mt-1 text-[10px] sm:text-xs">
                            <span className="text-muted-foreground me-1 truncate">
                              {t("dashboard.gross")}: {isAnalyticsLoading ? "..." : summary.revenue.total.toFixed(2)}
                            </span>
                            <span className="text-red-400 truncate">
                              {t("dashboard.exp")}: {isAnalyticsLoading ? "..." : summary.expenses.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-500/20 rounded-full flex-shrink-0">
                          <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 neon-icon" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className={`glass-card glossy-reflection neon-magenta-glow ${isRTL ? 'border-r-4 border-r-blue-500' : 'border-l-4 border-l-blue-500'}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2 min-h-[2.5em] leading-tight flex items-center">{t("dashboard.profit_margin")}</p>
                          {isAnalyticsLoading ? (
                            <Skeleton className="h-8 w-24 sm:w-32 bg-white/5" />
                          ) : (
                            <p className="text-xl sm:text-2xl font-bold text-blue-600">
                              {summary.profit.margin.toFixed(1)}%
                            </p>
                          )}
                          <div className="flex items-center mt-1">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 me-1" />
                            <span className="text-[10px] sm:text-xs text-blue-500 truncate">{summary.profit.margin > 15 ? t("dashboard.healthy") : t("dashboard.low_margin")}</span>
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-500/20 rounded-full flex-shrink-0">
                          <Percent className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 neon-icon" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className={`glass-card glossy-reflection neon-purple-glow ${isRTL ? 'border-r-4 border-r-purple-500' : 'border-l-4 border-l-purple-500'}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2 min-h-[2.5em] leading-tight flex items-center">{t("dashboard.active_clients")}</p>
                          {isDataLoading ? (
                            <Skeleton className="h-8 w-24 sm:w-32 bg-white/5" />
                          ) : (
                            <p className="text-xl sm:text-2xl font-bold text-purple-600">{clients?.length || 0}</p>
                          )}
                          <div className="flex items-center mt-1">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 me-1" />
                            <span className="text-[10px] sm:text-xs text-purple-500 truncate">{t("dashboard.total_registered")}</span>
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-500/20 rounded-full flex-shrink-0">
                          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 neon-icon" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className={`glass-card glossy-reflection neon-magenta-glow ${isRTL ? 'border-r-4 border-r-orange-500' : 'border-l-4 border-l-orange-500'}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2 min-h-[2.5em] leading-tight flex items-center">{t("dashboard.top_product")}</p>
                          {isDataLoading ? (
                            <Skeleton className="h-8 w-full bg-white/5" />
                          ) : (
                            <p className="text-xl sm:text-2xl font-bold text-orange-600 truncate">
                              {topProducts[0]?.name || 'N/A'}
                            </p>
                          )}
                          <div className="flex items-center mt-1">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 me-1" />
                            <span className="text-[10px] sm:text-xs text-orange-500 truncate">{isDataLoading ? "..." : (topProducts[0]?.count || 0)} transactions</span>
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-500/20 rounded-full flex-shrink-0">
                          <Star className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 neon-icon" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className={`glass-card glossy-reflection neon-cyan-glow ${isRTL ? 'border-r-4 border-r-green-500' : 'border-l-4 border-l-green-500'}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2 min-h-[2.5em] leading-tight flex items-center">{t("dashboard.today_revenue")}</p>
                          <p className="text-xl sm:text-2xl font-bold text-green-600">
                            {(todayStats?.total_revenue || 0).toFixed(3)} DT
                          </p>
                          <div className="flex items-center mt-1">
                            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 me-1" />
                            <span className="text-[10px] sm:text-xs text-green-500">+8.2%</span>
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-500/20 rounded-full flex-shrink-0">
                          <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 neon-icon" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className={`glass-card glossy-reflection neon-magenta-glow ${isRTL ? 'border-r-4 border-r-blue-500' : 'border-l-4 border-l-blue-500'}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2 min-h-[2.5em] leading-tight flex items-center">{t("dashboard.gaming_revenue")}</p>
                          <p className="text-xl sm:text-2xl font-bold text-blue-600">
                            {(todayStats?.gaming_revenue || 0).toFixed(3)} DT
                          </p>
                          <div className="flex items-center mt-1">
                            <Gamepad2 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 me-1" />
                            <span className="text-[10px] sm:text-xs text-blue-500 truncate">{activeSessions?.length || 0} {t("dashboard.active_sessions")}</span>
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-500/20 rounded-full flex-shrink-0">
                          <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 neon-icon" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className={`glass-card glossy-reflection neon-purple-glow ${isRTL ? 'border-r-4 border-r-purple-500' : 'border-l-4 border-l-purple-500'}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2 min-h-[2.5em] leading-tight flex items-center">{t("dashboard.available_consoles")}</p>
                          <p className="text-xl sm:text-2xl font-bold text-purple-600">
                            {availableConsoles}/{totalConsoles}
                          </p>
                          <div className="flex items-center mt-1">
                            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 me-1" />
                            <span className="text-[10px] sm:text-xs text-purple-500 truncate">
                              {totalConsoles > 0 ? Math.round((availableConsoles / totalConsoles) * 100) : 0}% {t("dashboard.available")}
                            </span>
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-500/20 rounded-full flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 neon-icon" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className={`glass-card glossy-reflection neon-magenta-glow ${isRTL ? 'border-r-4 border-r-orange-500' : 'border-l-4 border-l-orange-500'}`}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-2 min-h-[2.5em] leading-tight flex items-center">{t("dashboard.pending_services")}</p>
                          <p className="text-xl sm:text-2xl font-bold text-orange-600">
                            {pendingServices}
                          </p>
                          <div className="flex items-center mt-1">
                            <Wrench className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 me-1" />
                            <span className="text-[10px] sm:text-xs text-orange-500 truncate">{t("dashboard.to_process")}</span>
                          </div>
                        </div>
                        <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-500/20 rounded-full flex-shrink-0">
                          <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 neon-icon" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </div>

          {/* Common Revenue Graph & Recent Sales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <React.Suspense fallback={
              <Card className="glass-card lg:col-span-2 h-[300px] flex items-center justify-center p-6">
                <div className="w-full h-full space-y-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-32 bg-white/5" />
                    <Skeleton className="h-8 w-48 bg-white/5" />
                  </div>
                  <Skeleton className="h-[200px] w-full bg-white/5" />
                </div>
              </Card>
            }>
              <OverviewRevenueChart
                sales={sales || []}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                isOwner={isOwner}
                isLoading={isDataLoading}
              />
            </React.Suspense>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-secondary" />
                  {t("dashboard.recent_sales")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pe-2 custom-scrollbar scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {sales && sales.length > 0 ? (
                    sales.slice(0, 10).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 hover:bg-black/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Sale #{sale.id.slice(0, 4)}</p>
                            <p className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <span className="font-bold text-green-500">+{Number(sale.total_amount).toFixed(2)} DT</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">{t('dashboard.no_sales')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Section - Intelligent Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isOwner && (
              <>
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      {t("dashboard.margin_analysis")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{t("dashboard.top_margin_categories")}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span>{t("dashboard.active_sessions")}</span>
                        <span className="font-bold text-green-500">~95% {t("dashboard.profit_margin")}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>{t("services.badge")}</span>
                        <span className="font-bold text-blue-500">~70% {t("dashboard.profit_margin")}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>{t("nav.sales")}</span>
                        <span className="font-bold text-orange-500">~25% {t("dashboard.profit_margin")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      {t("dashboard.inventory.alerts")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Low Stock Filter */}
                    {isDataLoading ? (
                      <p className="text-sm text-muted-foreground">{t("dashboard.checking_stock")}</p>
                    ) : (products.filter(p => p.stock_quantity <= 5).length > 0) ? (
                      products.filter(p => p.stock_quantity <= 5).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center">
                              <Receipt className="w-4 h-4 text-orange-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{p.name_fr || p.name}</p>
                              <p className="text-xs text-orange-600 font-bold">{p.stock_quantity} {t("dashboard.inventory.left")}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="h-8 text-xs underline" onClick={() => window.location.href = '/dashboard/products'}>{t("dashboard.inventory.restock")}</Button>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center bg-green-500/10 rounded-lg border border-green-500/20">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="text-sm font-medium text-green-600">{t("dashboard.inventory.healthy")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {!isOwner && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {t("dashboard.quick_actions")}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = '/dashboard/sessions'}>
                    <CardContent className="p-4 text-center">
                      <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <span className="font-medium">{t("dashboard.new_session")}</span>
                    </CardContent>
                  </Card>
                  <Card className="glass-card hover:border-secondary/50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = '/dashboard/sales'}>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-secondary" />
                      <span className="font-medium">{t("dashboard.sell_product")}</span>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Management Overview / Shortcuts */}
          {isOwner && (
            <div>
              <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                {t("dashboard.management_overview")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <motion.div whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="glass-card glossy-reflection border-none neon-magenta-glow cursor-pointer"
                    onClick={() => window.location.href = '/dashboard/products'}>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <Zap className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-secondary neon-icon" />
                      <span className="font-medium text-sm sm:text-base">{t("dashboard.products")}</span>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="glass-card glossy-reflection border-none neon-cyan-glow cursor-pointer"
                    onClick={() => window.location.href = '/dashboard/pricing'}>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-accent neon-icon" />
                      <span className="font-medium text-sm sm:text-base">{t("dashboard.pricing")}</span>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="glass-card glossy-reflection border-none neon-purple-glow cursor-pointer"
                    onClick={() => window.location.href = '/dashboard/staff'}>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-primary neon-icon" />
                      <span className="font-medium text-sm sm:text-base">{t("dashboard.staff")}</span>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="glass-card glossy-reflection border-none neon-magenta-glow cursor-pointer"
                    onClick={() => window.location.href = '/dashboard/expenses'}>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <Receipt className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-red-500 neon-icon" />
                      <span className="font-medium text-sm sm:text-base">{t("dashboard.expenses")}</span>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="glass-card glossy-reflection border-none neon-purple-glow cursor-pointer"
                    onClick={() => window.location.href = '/dashboard/blog'}>
                    <CardContent className="p-3 sm:p-4 text-center">
                      <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-500 neon-icon" />
                      <span className="font-medium text-sm sm:text-base">{t("dashboard.blog")}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default DashboardOverview;
