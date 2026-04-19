import React, { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Gamepad2,
  LayoutDashboard,
  Users,
  Wrench,
  ShoppingCart,
  Settings,
  LogOut,
  DollarSign,
  Package,
  FileText,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Menu,
  X,
  Truck,
  Calendar,
  Book,
  Key,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useActiveSessions, useSessionsSubscription } from "@/hooks/useGamingSessions";
import { useOrdersSubscription } from "@/hooks/useOrders";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserGuide } from "@/components/onboarding/UserGuide";
import Interactive3DBackground from "@/components/Interactive3DBackground";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";

// assertive 4-beep sound
const playBeep = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playNote = (delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + delay + 0.2);
      gain.gain.setValueAtTime(0.5, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.2);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.2);
    };

    playNote(0);
    playNote(0.2);
    playNote(0.4);
    playNote(0.6);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, role, isOwner: authIsOwner, isStaff, isLoading, signOut } = useAuth();
  const { t, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  // Activate Realtime Subscription (Debounced)
  useSessionsSubscription();
  useOrdersSubscription();

  // High-level alarm state
  const { data: activeSessions } = useActiveSessions();
  const [mutedSessions, setMutedSessions] = useState<string[]>([]);
  const [isGlobalMute, setIsGlobalMute] = useState(false);
  const notifiedSessionsRef = useRef<Set<string>>(new Set());

  // Use the isOwner status from AuthContext
  const isOwner = authIsOwner;

  // Global Alarm Check logic
  useEffect(() => {
    if (!activeSessions || isGlobalMute) return;

    const checkAlarms = () => {
      const now = new Date().getTime();
      let shouldPlaySound = false;
      const currentOverdueIds: string[] = [];

      activeSessions.forEach((session: any) => {
        if (!session.start_time || session.status !== 'active') return;

        const startTime = new Date(session.start_time).getTime();
        const elapsedMinutes = (now - startTime) / (1000 * 60);
        let isOverdue = false;

        if (session.session_type === 'hourly') {
          const limitMinutes = session.pricing?.game_duration_minutes || 0;
          const extraTime = session.extra_time_minutes || 0;
          const totalLimit = limitMinutes + extraTime;
          if (totalLimit > 0 && elapsedMinutes > totalLimit) isOverdue = true;
        } else if (session.session_type === 'per_game') {
          const durationPerGame = session.pricing?.game_duration_minutes || 15;
          const totalGames = session.games_played || 1;
          const totalProlongations = session.extra_time_minutes || 0;
          const expectedDuration = (totalGames * durationPerGame) + (totalProlongations * (durationPerGame / 2));
          if (elapsedMinutes > (expectedDuration + 5)) isOverdue = true;
        }

        if (isOverdue) {
          currentOverdueIds.push(session.id);

          if (!mutedSessions.includes(session.id)) {
            // Check global mute setting from localStorage
            const isMuted = localStorage.getItem('sound_muted') === 'true';
            if (!isMuted) {
              shouldPlaySound = true;
            }
          }

          // Visual Notification (Toast) - only if not already notified
          if (!notifiedSessionsRef.current.has(session.id)) {
            const stationNum = session.console?.station_number || '?';
            toast({
              title: `⚠️ TIME UP: Station #${stationNum}`,
              description: "Action required in Gaming Sessions",
              variant: "destructive",
            });
            notifiedSessionsRef.current.add(session.id);
          }
        }
      });

      // Cleanup notified set for sessions that are no longer active/overdue
      const overdueSet = new Set(currentOverdueIds);
      notifiedSessionsRef.current.forEach(id => {
        if (!overdueSet.has(id)) notifiedSessionsRef.current.delete(id);
      });

      if (shouldPlaySound) {
        playBeep();
      }
    };

    const intervalId = setInterval(checkAlarms, 10000); // 10s persistent check
    checkAlarms();

    return () => clearInterval(intervalId);
  }, [activeSessions, mutedSessions]); // removed isGlobalMute dependency as we use localStorage

  // Force re-render logic removed as it causes flickering. 
  // React state updates (isOwner) will naturally trigger re-renders.

  // Show loading while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
          <p className="text-xs text-muted-foreground">Authenticating user role...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/staff-login");
  };

  const workerNavItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: t("sidebar.financial_overview") },
    { path: "/dashboard/sessions", icon: Gamepad2, label: t("sidebar.session_management") },
    { path: "/dashboard/services", icon: Wrench, label: t("sidebar.service_management") },
    { path: "/dashboard/sales", icon: ShoppingCart, label: t("sidebar.sales_management") },
    { path: "/dashboard/orders", icon: Truck, label: "Orders" },
    { path: "/dashboard/clients", icon: Users, label: t("sidebar.client_management") },
    { path: "/user-guide", icon: Book, label: t("sidebar.user_guide") },
  ];

  const ownerNavItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: t("sidebar.financial_overview") },
    { path: "/dashboard/sessions", icon: Gamepad2, label: t("sidebar.session_management") },
    { path: "/dashboard/services", icon: Wrench, label: t("sidebar.service_management") },
    { path: "/dashboard/sales", icon: ShoppingCart, label: t("sidebar.sales_management") },
    { path: "/dashboard/transactions", icon: FileText, label: t("sidebar.history") },
    { path: "/dashboard/clients", icon: Users, label: t("sidebar.client_management") },
    { path: "/dashboard/orders", icon: Truck, label: t("sidebar.orders") },
    { path: "/dashboard/products", icon: Package, label: t("sidebar.product_inventory") },
    { path: "/dashboard/pricing", icon: DollarSign, label: t("sidebar.pricing_config") },
    { path: "/dashboard/consoles", icon: Gamepad2, label: t("sidebar.console_settings") },
    { path: "/dashboard/staff", icon: Users, label: t("sidebar.staff_management") },
    { path: "/dashboard/attendance", icon: Calendar, label: t("sidebar.attendance") },
    { path: "/dashboard/blog", icon: FileText, label: t("sidebar.blog_marketing") },
    { path: "/dashboard/expenses", icon: Receipt, label: t("sidebar.charges_management") },
    { path: "/user-guide", icon: Book, label: t("sidebar.user_guide") },
    { path: "/dashboard/settings", icon: Settings, label: t("sidebar.store_settings") },
  ];

  const finalNavItems = isOwner ? ownerNavItems : workerNavItems;
  const navItems = finalNavItems;

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <Interactive3DBackground />
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className={cn(
          "md:hidden fixed top-4 z-[60] p-2 rounded-lg bg-card border border-border shadow-lg",
          isRTL ? "right-4" : "left-4"
        )}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[55]"
          onClick={() => setMobileOpen(false)}
          role="button"
          aria-label="Close menu"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 h-screen transition-all duration-500 ease-in-out z-[60] flex flex-col",
          // Glassmorphism + Border
          "bg-card/80 backdrop-blur-xl border-e border-border/50 shadow-2xl",
          isRTL ? "right-0 border-s" : "left-0 border-e",

          // Layout behavior
          "flex", // Always flex, manage visibility via transform
          collapsed ? "md:w-20" : "md:w-64", // Desktop width
          // Mobile state
          !mobileOpen && "-translate-x-full md:translate-x-0",
          mobileOpen && "translate-x-0 w-72 shadow-2xl"
        )}
      >
        {/* Header Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
          {!collapsed && (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-sm tracking-tight">Game Store</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-none" aria-label="Dashboard navigation">
          {navItems.map((item, index) => {
            // Optional: Group separators for clearer organization
            const isStartOfGroup = index === 0 ||
              (isOwner && (index === 6 || index === 11 || index === 14)); // Grouping logic: Overview | Management | Settings

            return (
              <React.Fragment key={item.path}>
                {!collapsed && isStartOfGroup && index !== 0 && (
                  <div className="px-3 py-2 mt-2 mb-1">
                    <div className="h-px bg-border/50 user-select-none" />
                  </div>
                )}
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                        // Active State
                        location.pathname === item.path
                          ? "bg-primary/10 text-primary shadow-sm font-medium"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:shadow-sm",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                        location.pathname === item.path && "text-primary"
                      )} />

                      {(!collapsed || mobileOpen) && (
                        <span className="text-sm tracking-wide">{item.label}</span>
                      )}

                      {/* Active Indicator Strip */}
                      {location.pathname === item.path && !collapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-primary rounded-e-full opacity-50" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="font-medium z-[70]">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border/50 bg-background/30 backdrop-blur-sm space-y-2">
          {/* Collapse Toggle (Desktop Only) */}
          <div className="hidden md:flex justify-end px-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-muted"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </Button>
          </div>

          <div className={cn("flex justify-center transition-all", collapsed ? "px-0" : "px-2")}>
            <LanguageSwitcher collapsed={collapsed} />
          </div>

          {!collapsed && (
            <div className="mx-2 p-3 rounded-xl bg-gradient-to-br from-card to-muted border border-border/50 flex items-center gap-3 mb-2 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="font-bold text-xs text-primary">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium truncate">{user?.email}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] text-muted-foreground capitalize">{role}</p>
                </div>
              </div>
            </div>
          )}

          <PasswordChangeDialog
            trigger={
              <button
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden w-full text-left",
                  "text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:shadow-sm",
                  collapsed && "justify-center px-2"
                )}
                aria-label={collapsed ? t("password.security") : undefined}
              >
                <Key className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                {(!collapsed || mobileOpen) && (
                  <span className="text-sm tracking-wide">{t("password.security")}</span>
                )}
              </button>
            }
          />

          <button
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden w-full text-left",
              "text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:shadow-sm",
              collapsed && "justify-center px-2"
            )}
            onClick={handleSignOut}
            aria-label={collapsed ? t("sidebar.sign_out") : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
            {(!collapsed || mobileOpen) && (
              <span className="text-sm tracking-wide">{t("sidebar.sign_out")}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        id="main-content"
        className={cn(
          "flex-1 transition-all duration-500 ease-in-out min-h-screen",
          isRTL
            ? collapsed ? "md:mr-20" : "md:mr-64"
            : collapsed ? "md:ml-20" : "md:ml-64"
        )}
      >
        {/* Top Navbar for Mobile / Breadcrumbs could go here */}
        <div className={cn(
          "h-16 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between",
          "hidden md:flex" // Only show as sticky header on desktop, mobile has its own
        )}>
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="opacity-50 hover:opacity-100 transition-opacity cursor-default">Dashboard</span>
            <ChevronRight className="w-4 h-4 mx-2 opacity-50" />
            <span className="font-medium text-foreground capitalize">
              {navItems.find(i => i.path === location.pathname)?.label || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Optional: Add search or alerts here */}
            <button
              onClick={() => navigate("/dashboard/settings")}
              className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center hover:bg-secondary/40 transition-colors"
              title={t("sidebar.store_settings")}
              aria-label={t("sidebar.store_settings")}
            >
              <Settings className="w-4 h-4 opacity-70" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className={cn(
          "p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500",
          isRTL && "text-right"
        )}>
          {children}

          {/* Footer Signature */}


          <UserGuide />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
