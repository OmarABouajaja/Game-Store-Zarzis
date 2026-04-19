import { useState, useEffect, useRef, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useConsoles } from "@/hooks/useConsoles";
import { usePricing } from "@/hooks/usePricing";
import { useClients, useCreateClient, useClientByPhone } from "@/hooks/useClients";
import { useStartSession, useEndSession, useTodaySessions, useActiveSessions, useAddGameToSession } from "@/hooks/useGamingSessions";
import { useCreatePointsTransaction } from "@/hooks/usePointsTransactions";
import { useCreateSale } from "@/hooks/useSales";
import { useSessionConsumptions, useDeleteSessionConsumption, useUpdateSessionConsumption, SessionConsumption } from "@/hooks/useSessionConsumptions";
import { useStoreSettings, useUpdateStoreSetting } from "@/hooks/useStoreSettings";
import { useGameShortcuts, useCreateGameShortcut, useDeleteGameShortcut } from "@/hooks/useGameShortcuts";
import { Client, GameSession, StoreSettings, Pricing, Console } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gamepad2, Play, Square, Plus, Clock, Gift, User, Star, MoreVertical, Timer, Bell, BellOff, AlertTriangle, Wrench, Edit, Trash2, DollarSign, Zap, Coffee, Utensils, Loader2, Printer } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useData } from "@/contexts/DataContext";
import { useNavigate } from "react-router-dom";
import { ShortcutManagerDialog } from "@/components/dashboard/ShortcutManagerDialog";
import { QuickSaleMenu } from "@/components/dashboard/QuickSaleMenu";
import { SchemaStatus } from "@/components/dashboard/SchemaStatus";
import { ClientSearch } from "@/components/dashboard/ClientSearch";

// Redundant local playBeep removed - handled globally in DashboardLayout

const SessionsManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Local State
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [selectedConsole, setSelectedConsole] = useState<string | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<string>("");
  const [selectedClientForSession, setSelectedClientForSession] = useState<Client | null>(null); // For start dialog
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [gameNotes, setGameNotes] = useState("");
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const [newShortcutName, setNewShortcutName] = useState("");
  const [selectedSession, setSelectedSession] = useState<GameSession & { pricing?: Pricing; console?: Console } | null>(null);
  const [gamesInSession, setGamesInSession] = useState(0);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [endSessionStep, setEndSessionStep] = useState<'summary' | 'confirm'>('summary');

  // Data Hooks
  const { data: consoles } = useConsoles();
  const { data: pricing } = usePricing();
  const { data: activeSessions } = useActiveSessions();
  const { data: storeSettingsData } = useStoreSettings();

  const uniqueConsoleTypes = useMemo(() => {
    const types = new Set<string>();
    consoles?.forEach(c => {
      if (c.console_type) types.add(c.console_type.toUpperCase());
    });
    pricing?.forEach(p => {
      if (p.console_type) types.add(p.console_type.toUpperCase());
    });
    const arr = Array.from(types).sort((a,b) => b.localeCompare(a)); 
    return arr.length > 0 ? arr : ['PS5', 'PS4'];
  }, [consoles, pricing]);
  const { gameShortcuts, deleteGameShortcut, isLoading: isDataLoading, clients } = useData();

  // Consumption Data for Selected Session
  const { data: sessionConsumptions, isLoading: isConsumptionsLoading } = useSessionConsumptions(selectedSession?.id);
  const deleteSessionConsumption = useDeleteSessionConsumption();
  const updateSessionConsumption = useUpdateSessionConsumption();
  const createSale = useCreateSale();

  // New State for Consumption Dialog
  const [isConsumptionDialogOpen, setIsConsumptionDialogOpen] = useState(false);
  const [selectedSessionForConsumption, setSelectedSessionForConsumption] = useState<GameSession & { pricing?: Pricing; console?: Console } | null>(null);

  // Mutations
  const startSession = useStartSession();
  const endSession = useEndSession();
  const createPointsTransaction = useCreatePointsTransaction();
  const addGameToSession = useAddGameToSession();
  const createClient = useCreateClient();
  const updateSetting = useUpdateStoreSetting();


  // Keyboard shortcuts for Console Instant Start & Game Selection
  useEffect(() => {
    // If a dialog is open, we disable global console shortcuts to avoid accidental starts while typing
    if (isStartDialogOpen || isEndDialogOpen || isExtendDialogOpen || isShortcutsDialogOpen) return;

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const pressedKey = e.key.toUpperCase();

      // 0. Global Actions
      if (pressedKey === 'K') {
        e.preventDefault();
        setIsManagerOpen(true);
        return;
      }
      if (pressedKey === 'C') {
        e.preventDefault();
        setIsCafeMenuOpen(true);
        return;
      }

      // 1. Console Shortcuts (Instant Start / Context Action)
      if (consoles && pricing) {
        const targetConsole = consoles.find(c => c.shortcut_key === pressedKey);

        if (targetConsole) {
          e.preventDefault();

          // Determine Action based on status
          const isActive = targetConsole.status === 'in_use' || activeSessions?.some(s => s.console_id === targetConsole.id);
          const session = activeSessions?.find(s => s.console_id === targetConsole.id);

          if (targetConsole.status === 'maintenance') {
            toast({ title: "Maintenance", description: `${targetConsole.name} is in maintenance mode.`, variant: "destructive" });
            return;
          }

          if (isActive && session) {
            // Already active? Open extension dialog
            openExtendDialog(session);
            return;
          }

          // Auto-start logic (Available)
          // Find applicable pricing
          let applicablePricing = targetConsole.default_pricing_id
            ? pricing.find(p => p.id === targetConsole.default_pricing_id)
            : null;

          if (!applicablePricing && storeSettingsData) {
            const consoleType = (targetConsole.console_type || '').toUpperCase();
            const globalDefaultKey = `default_pricing_${consoleType.toLowerCase()}`;
            const globalDefaultId = (storeSettingsData as any)?.[globalDefaultKey];

            if (globalDefaultId && globalDefaultId !== 'none') {
              applicablePricing = pricing.find(p => p.id === globalDefaultId);
            }
          }

          if (!applicablePricing) {
            const targetType = (targetConsole.console_type || '').toUpperCase();
            applicablePricing = pricing.find(p => p.console_type.toUpperCase() === targetType && p.price_type === 'hourly')
              || pricing.find(p => p.console_type.toUpperCase() === targetType);
          }

          if (!applicablePricing) {
            toast({ title: "Configuration Error", description: `Aucun tarif trouvé pour ${targetConsole.name}.`, variant: "destructive" });
            openStartDialog(targetConsole.id);
            return;
          }

          try {
            toast({ title: "Starting Session...", description: `Launching ${targetConsole.name}` });
            await startSession.mutateAsync({
              console_id: targetConsole.id,
              pricing_id: applicablePricing.id,
              session_type: applicablePricing.price_type,
              staff_id: user?.id || '',
              notes: t('sessions.quick_start_note')
            });
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Start Failed";
            toast({ title: "Start Failed", description: message, variant: "destructive" });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStartDialogOpen, isEndDialogOpen, isExtendDialogOpen, isShortcutsDialogOpen, consoles, pricing, user, startSession, activeSessions, storeSettingsData]);

  // ⌨️ Dialog-specific Keyboard Listeners
  useEffect(() => {
    if (!isStartDialogOpen && !isEndDialogOpen && !isExtendDialogOpen) return;

    const handleDialogKeys = (e: KeyboardEvent) => {
      // Don't trigger if typing in input FIELDS
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Exception: Handle 'Enter' to submit if in Start Dialog
        if (e.key === 'Enter' && isStartDialogOpen) {
          handleStartSession();
        }
        return;
      }

      const key = e.key;

      if (isStartDialogOpen && gameShortcuts) {
        const pressedKey = key.toUpperCase();
        const matched = gameShortcuts.find(s => s.shortcut_key === pressedKey);
        if (matched) {
          setGameNotes(matched.name);
          toast({ title: "Game Selected", description: matched.name });
        }
      }

      if (isExtendDialogOpen) {
        if (key === '+' || key === 'Enter') {
          e.preventDefault();
          handleExtendSession();
        }
      }

      if (isEndDialogOpen) {
        if (key === '+') {
          e.preventDefault();
          setGamesInSession(prev => prev + 1);
        } else if (key === '-') {
          e.preventDefault();
          const startTime = new Date(selectedSession?.start_time || 0).getTime();
          const now = new Date().getTime();
          const elapsedMinutes = (now - startTime) / 60000;
          const tarifDuration = selectedSession?.pricing?.game_duration_minutes || 0;
          const minGames = (tarifDuration > 0 && elapsedMinutes < tarifDuration) ? 0 : 1;
          setGamesInSession(prev => Math.max(minGames, prev - 1));
        } else if (key === 'Enter') {
          e.preventDefault();
          handleEndSession();
        }
      }
    };

    window.addEventListener('keydown', handleDialogKeys);
    return () => window.removeEventListener('keydown', handleDialogKeys);
  }, [isStartDialogOpen, isEndDialogOpen, isExtendDialogOpen, gameShortcuts, selectedSession, gamesInSession]);





  // Settings
  const freeGameThreshold = storeSettingsData?.free_game_threshold?.games_required || 5;

  const getConsoleSession = (consoleId: string) => {
    return activeSessions?.find((s: GameSession) => s.console_id === consoleId);
  };

  // Alarm State (Now handled globally in DashboardLayout)
  const [overdueSessions, setOverdueSessions] = useState<string[]>([]); // Visual highlights only

  useEffect(() => {
    if (!activeSessions) return;
    const now = new Date().getTime();
    const newOverdue: string[] = [];

    activeSessions.forEach((session: GameSession) => {
      if (!session.start_time) return;
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

      if (isOverdue) newOverdue.push(session.id);
    });
    setOverdueSessions(newOverdue);
  }, [activeSessions]);

  // Live Points & Revenue Calculation
  const [estimatedPoints, setEstimatedPoints] = useState(0);
  const [estimatedRevenue, setEstimatedRevenue] = useState(0);

  useEffect(() => {
    if (!selectedSession) {
      setEstimatedPoints(0);
      setEstimatedRevenue(0);
      return;
    }

    const calculate = () => {
      const pricingInfo = selectedSession.pricing;
      if (!pricingInfo) return { points: 0, revenue: 0 };

      let revenue = 0;
      let points = 0;

      if (selectedSession.session_type === 'hourly') {
        const startTime = new Date(selectedSession.start_time);
        const now = new Date();
        const diffMs = now.getTime() - startTime.getTime();
        const hoursPlayed = Math.ceil(diffMs / (1000 * 60 * 60));
        revenue = hoursPlayed * Number(pricingInfo.price);

        if (storeSettingsData?.points_system_enabled !== false) {
          const pointsPerDT = storeSettingsData?.points_config?.points_per_dt || 1;
          points = Math.floor(revenue * pointsPerDT);
        }
      } else {
        // Per game
        const totalGames = gamesInSession;
        let freeGames = 0;
        const prolongationCount = selectedSession.extra_time_minutes || 0;
        const prolongationFee = Number(pricingInfo.extra_time_price || 0);

        if (storeSettingsData?.free_games_enabled !== false) {
          if (totalGames >= freeGameThreshold + 1) {
            freeGames = Math.floor(totalGames / (freeGameThreshold + 1));
          }
        }
        const actualPaidGames = totalGames - freeGames;
        revenue = (actualPaidGames * Number(pricingInfo.price)) + (prolongationCount * prolongationFee);

        if (storeSettingsData?.points_system_enabled !== false) {
          points = actualPaidGames * Number(pricingInfo.points_earned || 1);
        }
      }
      return { revenue, points };
    };

    const { revenue, points } = calculate();
    setEstimatedPoints(points);
    setEstimatedRevenue(revenue);
  }, [selectedSession, gamesInSession, storeSettingsData]);

  const handleMuteSession = (sessionId: string) => {
    // Note: Global muting is handled by DashboardLayout
    toast({ title: "Mute feature moved", description: "Alarms are now global. Check layout for muting." });
  };

  const handleStartSession = async () => {
    if (!selectedConsole || !selectedPricing || !user) return;

    try {
      await startSession.mutateAsync({
        console_id: selectedConsole,
        pricing_id: selectedPricing,
        session_type: pricing?.find((p) => p.id === selectedPricing)?.price_type || "hourly",
        staff_id: user.id,
        client_id: null, // Always walk-in at start
        notes: gameNotes,
      });

      toast({ title: "Session started!" });
      setIsStartDialogOpen(false);
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error starting session";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleExtendSession = async () => {
    if (!selectedSession) return;

    try {
      const pricingInfo = selectedSession.pricing;
      if (selectedSession.session_type === 'per_game') {
        // Add 1 game (default if not specified or specify in pricing)
        // For per_game, extension usually means adding 1 more item.
        await addGameToSession.mutateAsync({
          session_id: selectedSession.id,
          games_played: (selectedSession.games_played || 1) + 1,
          extra_time_minutes: selectedSession.extra_time_minutes || 0
        });
        toast({ title: "Extended", description: "Added 1 game to session." });
      } else {
        // Add configurable minutes from pricing
        const minsToAdd = pricingInfo?.game_duration_minutes || 30;
        await addGameToSession.mutateAsync({
          session_id: selectedSession.id,
          games_played: selectedSession.games_played,
          extra_time_minutes: (selectedSession.extra_time_minutes || 0) + minsToAdd
        });
        toast({ title: "Extended", description: `Added ${minsToAdd} minutes to session.` });
      }
      setIsExtendDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error extending session";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }

  const handleExtendProlongation = async () => {
    if (!selectedSession) return;

    try {
      // Use extra_time_minutes as a counter for prolongations in per_game sessions
      await addGameToSession.mutateAsync({
        session_id: selectedSession.id,
        games_played: selectedSession.games_played,
        extra_time_minutes: (selectedSession.extra_time_minutes || 0) + 1
      });
      toast({ title: "Prolongation Added", description: "Football extra time recorded." });
      setIsExtendDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error adding prolongation";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleEndSession = async () => {
    if (!selectedSession) return;

    if (endSessionStep === 'summary') {
      setEndSessionStep('confirm');
      return;
    }

    const session = selectedSession;
    const pricingInfo = session.pricing;
    let gamingTotal = 0;
    const extraAmount = 0;
    let calculatedPoints = 0;

    // 1. Calculate Gaming Cost
    if (session.session_type === "hourly") {
      const startTime = new Date(session.start_time);
      const endTime = new Date();
      const diffMs = endTime.getTime() - startTime.getTime();
      const hoursPlayed = diffMs / (1000 * 60 * 60);
      gamingTotal = Math.ceil(hoursPlayed) * Number(pricingInfo.price);

      if (storeSettingsData?.points_system_enabled !== false) {
        const pointsPerDT = storeSettingsData?.points_config?.points_per_dt || 1;
        calculatedPoints = Math.floor(gamingTotal * pointsPerDT);
      }
    } else {
      const totalGames = gamesInSession;
      const prolongationCount = session.extra_time_minutes || 0;
      const prolongationFee = Number(pricingInfo.extra_time_price || 0);

      let freeGames = 0;
      if (storeSettingsData?.free_games_enabled !== false) {
        if (totalGames >= freeGameThreshold + 1) {
          freeGames = Math.floor(totalGames / (freeGameThreshold + 1));
        }
      }

      const actualPaidGames = totalGames - freeGames;
      gamingTotal = (actualPaidGames * Number(pricingInfo.price)) + (prolongationCount * prolongationFee);

      if (storeSettingsData?.points_system_enabled !== false) {
        calculatedPoints = actualPaidGames * Number(pricingInfo.points_earned || 1);
      }
    }

    setPointsEarned(calculatedPoints);

    // 2. Calculate Consumption Total
    const consumptionTotal = sessionConsumptions?.reduce((sum: number, c: SessionConsumption) => sum + (c.unit_price * c.quantity), 0) || 0;
    const grandTotal = gamingTotal + consumptionTotal;

    try {
      let clientId = selectedClientForSession?.id;

      // Create client if in creation mode
      if (isCreatingClient && newClientName && newClientPhone) {
        const newClient = await createClient.mutateAsync({
          phone: newClientPhone,
          name: newClientName,
        });
        clientId = newClient.id;
      }

      // 3. Process Consumptions as Sales
      if (sessionConsumptions && sessionConsumptions.length > 0) {
        for (const item of sessionConsumptions) {
          await createSale.mutateAsync({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: item.unit_price * item.quantity,
            payment_method: "cash",
            points_used: 0,
            points_earned: item.product?.points_earned ? (item.product.points_earned * item.quantity) : 0,
            client_id: clientId || null,
            staff_id: user?.id || '',
            notes: `Session Consumption #${session.id}`,
            session_id: session.id,
          } as any);

          // Delete from temporary table
          await deleteSessionConsumption.mutateAsync(item.id);
        }
      }

      // 4. End Gaming Session
      await endSession.mutateAsync({
        session_id: session.id,
        console_id: session.console_id,
        total_amount: gamingTotal, // Store only gaming revenue in session record
        games_played: gamesInSession,
        extra_amount: extraAmount,
        points_earned: calculatedPoints,
        client_id: clientId,
      });

      // Award points (Gaming)
      if (storeSettingsData?.points_system_enabled !== false && clientId && calculatedPoints > 0) {
        await createPointsTransaction.mutateAsync({
          client_id: clientId,
          amount: calculatedPoints,
          transaction_type: "earned",
          description: `Gaming Session on ${session.console?.station_number ? 'Console #' + session.console.station_number : 'Console'}`,
          reference_type: "session",
          reference_id: session.id,
          staff_id: user.id
        });
      }

      setPointsEarned(0);
      toast({
        title: t('sessions.ended_toast'),
        description: `Gaming: ${gamingTotal.toFixed(3)} + Items: ${consumptionTotal.toFixed(3)} = ${grandTotal.toFixed(3)} DT`
      });
      setIsEndDialogOpen(false);
      setSelectedSession(null);
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error ending session";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setSelectedConsole(null);
    setSelectedPricing("");
    setSelectedClientForSession(null);
    setIsCreatingClient(false);
    setNewClientPhone("");
    setNewClientName("");
    setGameNotes("");
  }

  const getSessionDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const openStartDialog = (consoleId: string) => {
    setSelectedConsole(consoleId);

    // Auto-select Pricing according to the hierarchy:
    // 1. Console-specific default
    // 2. Global default for console type
    // 3. First hourly rate for type
    const targetConsoleObj = consoles?.find(c => c.id === consoleId);
    let pricingToSelect = "";

    if (targetConsoleObj?.default_pricing_id) {
      pricingToSelect = targetConsoleObj.default_pricing_id;
    } else if (storeSettingsData && targetConsoleObj) {
      const type = targetConsoleObj.console_type.toUpperCase();
      const key = `default_pricing_${type.toLowerCase()}`;
      const globalId = (storeSettingsData as any)?.[key];

      if (globalId && globalId !== 'none') {
        pricingToSelect = globalId;
      }
    }

    // Still empty? Last fallback
    if (!pricingToSelect && targetConsoleObj && pricing) {
      const type = targetConsoleObj.console_type.toUpperCase();
      const fallback = pricing.find(p => p.console_type.toUpperCase() === type && p.price_type === 'hourly')
        || pricing.find(p => p.console_type.toUpperCase() === type);
      if (fallback) pricingToSelect = fallback.id;
    }


    setSelectedPricing(pricingToSelect);
    setIsStartDialogOpen(true);
  };

  const openEndDialog = (session: any) => {
    setSelectedSession(session);

    let initialGames = session.games_played || 1;

    // Initialize with the database value (Manual Count)
    // We let the user decide if they want to switch to "Suggested" in the dialog UI
    initialGames = session.games_played || 1;

    setGamesInSession(initialGames);
    setEndSessionStep('summary');
    setIsEndDialogOpen(true);
  };


  const openExtendDialog = (session: any) => {
    setSelectedSession(session);
    setIsExtendDialogOpen(true);
  }

  const handleSetShortcutDefault = async (pricingId: string, consoleType: string) => {
    const key = `default_pricing_${consoleType.toLowerCase()}`;
    try {
      await updateSetting.mutateAsync({ key, value: pricingId });
      toast({
        title: t('sessions.default_rate_updated'),
        description: `Nouveau raccourci configuré pour ${consoleType}.`,
      });
    } catch (error: any) {
      toast({
        title: t('sessions.error_generic'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Sound Toggle State
  const [isSoundMuted, setIsSoundMuted] = useState(() => {
    const stored = localStorage.getItem('sound_muted');
    return stored === 'true';
  });
  const [isCafeMenuOpen, setIsCafeMenuOpen] = useState(false);
  const [isQuickRefOpen, setIsQuickRefOpen] = useState(false);

  const toggleSound = () => {
    const newState = !isSoundMuted;
    setIsSoundMuted(newState);
    localStorage.setItem('sound_muted', String(newState));
    toast({
      title: newState ? t('sessions.sound_muted_toast') : t('sessions.sound_enabled_toast'),
      description: newState ? t('sessions.alarms_silent_toast') : t('sessions.alarms_active_toast')
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <SchemaStatus />

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-secondary/10 to-transparent p-4 sm:p-5 rounded-2xl border border-border/30">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 mb-1">
                <Gamepad2 className="w-6 h-6 text-primary" />
                {t('sessions.title')}
                <HelpTooltip content={t('help.sessions')} />
              </h1>
              <p className="text-muted-foreground text-sm">
                {t('sessions.subtitle')}
              </p>
            </div>

            {/* Global Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSound}
                className={isSoundMuted ? "text-muted-foreground bg-background/50" : "text-primary border-primary/20 bg-primary/10 shadow-[0_0_10px_rgba(var(--primary),0.2)]"}
                title={isSoundMuted ? t('sessions.unmute_alarms') : t('sessions.mute_alarms')}
              >
                {isSoundMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </Button>

              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => setIsCafeMenuOpen(true)}>
                <Coffee className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('sessions.cafe_menu')}</span>
              </Button>

              <Sheet open={isQuickRefOpen} onOpenChange={setIsQuickRefOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="border-secondary/30 text-secondary hover:bg-secondary/10">
                    <Zap className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('sessions.pricing_shortcuts')}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="glass-modal border-white/10 w-full sm:max-w-[540px] overflow-y-auto">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2 text-2xl">
                      <Zap className="w-6 h-6 text-secondary fill-secondary" />
                      {t('sessions.quick_reference')}
                    </SheetTitle>
                    <SheetDescription>
                      {t('sessions.quick_reference_desc')}
                      <br />
                      <span className="text-xs text-muted-foreground mt-2 block">
                        {t('sessions.set_default_hint')}
                      </span>
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-8">
                    {/* Visual List Only (No Redundant Dropdowns) */}
                    {uniqueConsoleTypes.map(type => (
                      <div key={type} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <h3 className="font-bold text-lg flex items-center gap-2">
                            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">{type}</Badge>
                            {t('sessions.available_rates')}
                          </h3>
                        </div>

                        <div className="grid gap-3">
                          {pricing?.filter(p => {
                            const pType = p.console_type.toUpperCase();
                            return pType === type || (type === 'PS4' && pType === 'PS4_PRO');
                          }).map(p => {
                            const isDefault = (storeSettingsData as any)?.[`default_pricing_${type.toLowerCase()}`] === p.id;

                            return (
                              <div key={p.id} className={`p-4 rounded-xl border transition-all flex items-center justify-between group ${isDefault ? 'bg-secondary/20 border-secondary/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-black/20 border-white/5'
                                }`}>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white">{p.name}</span>
                                    {isDefault && <Badge className="bg-secondary text-black text-[10px] h-4">{t('sessions.default')}</Badge>}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase tracking-wider">
                                    <span>{p.price_type === 'hourly' ? t('sessions.time_type') : t('sessions.game_type')}</span>
                                    <span>•</span>
                                    <span className="font-bold text-primary">{p.price.toFixed(3)} DT</span>
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  variant={isDefault ? "hero" : "ghost"}
                                  disabled={isDefault}
                                  className={isDefault ? "h-9 w-9 p-0" : "opacity-0 group-hover:opacity-100 h-9 px-3"}
                                  onClick={() => handleSetShortcutDefault(p.id, type)}
                                >
                                  {isDefault ? <Star className="w-4 h-4 fill-current" /> : (
                                    <>
                                      <Zap className="w-4 h-4 me-2" />
                                      <span className="text-xs">{t('sessions.set_default')}</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>

              {user?.role === 'owner' && (
                <Button variant="outline" size="sm" onClick={() => setIsManagerOpen(true)}>
                  <Edit className="w-4 h-4 me-2" />
                  {t('sessions.manage_shortcuts')}
                </Button>
              )}
            </div>
          </div>

          <ShortcutManagerDialog isOpen={isManagerOpen} onOpenChange={setIsManagerOpen} />

          {/* Active Shortcuts (Flash/Fast Tarifs) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uniqueConsoleTypes.map(type => {
              const defaultId = (storeSettingsData as any)?.[`default_pricing_${type.toLowerCase()}`];
              const defaultPricing = pricing?.find(p => p.id === defaultId);

              return (
                <Card key={type} className="glass-card border-none bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 bg-primary/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/20 transition-all duration-700" />
                  <CardContent className="p-4 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-background/40 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
                        <Zap className="w-6 h-6 text-primary fill-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">{t('sessions.quick_launch')} {type}</h3>
                        {defaultPricing ? (
                          <div className="flex items-center gap-2">
                            <p className="font-black text-lg group-hover:text-primary transition-colors">{defaultPricing.name}</p>
                            <Badge variant="outline" className="text-[9px] h-4 px-1 bg-background/30">{t('sessions.auto')}</Badge>
                          </div>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">{t('sessions.not_configured')}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {defaultPricing && (
                        <>
                          <p className="font-black text-2xl text-primary drop-shadow-sm">{defaultPricing.price.toFixed(3)} <span className="text-sm font-bold text-muted-foreground">DT</span></p>
                          <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">{defaultPricing.price_type === 'hourly' ? t('sessions.per_hour') : t('sessions.per_game')}</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Console Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {consoles?.map((console) => {
              const session = getConsoleSession(console.id);
              const isMaintenance = console.status === "maintenance";
              // A console is active if it has a session OR its status is set to in_use
              const isActive = !!session || console.status === "in_use";
              const isOverdue = session && overdueSessions.includes(session.id);

              return (
                <div key={console.id} className="relative group">
                  <div
                    className={`glass-card rounded-xl p-2 sm:p-3 md:p-4 transition-all h-full flex flex-col items-center justify-between relative ${isOverdue
                      ? "border-red-600 bg-red-600/20 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                      : isMaintenance
                        ? "border-muted bg-muted/10 opacity-60 grayscale cursor-not-allowed"
                        : isActive
                          ? "border-red-500/50 bg-red-500/10 cursor-pointer hover:scale-105"
                          : "border-green-500/50 bg-green-500/10 hover:border-green-500 cursor-pointer hover:scale-105"
                      }`}
                    onClick={() => !isActive && !isMaintenance && openStartDialog(console.id)}
                  >
                    {/* Status Icon */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${isOverdue ? "bg-red-600 animate-bounce" : isMaintenance ? "bg-muted/20" : isActive ? "bg-red-500/20" : "bg-green-500/20"
                      }`}>
                      {isOverdue ? (
                        <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      ) : isMaintenance ? (
                        <Wrench className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground" />
                      ) : (
                        <Gamepad2 className={`w-6 h-6 sm:w-7 sm:h-7 ${isActive ? "text-red-500" : "text-green-500"}`} />
                      )}
                    </div>

                    <h3 className="font-display font-bold text-base sm:text-lg mb-1">#{console.station_number}</h3>
                    <Badge variant="outline" className="mb-1 sm:mb-2 text-[10px] uppercase">{console.console_type}</Badge>

                    {isActive && session ? (
                      <div className="text-center space-y-1 w-full">
                        <div className={`flex items-center justify-center gap-1 text-xs font-mono py-1 rounded ${isOverdue ? "bg-red-600 text-white font-bold" : "text-red-400 bg-black/20"
                          }`}>
                          <Clock className="w-3 h-3" />
                          {getSessionDuration(session.start_time)}
                        </div>

                        {session.session_type === 'per_game' && (
                          <div className="flex items-center justify-center gap-1 text-sm font-bold text-primary bg-primary/10 rounded-md px-2 py-0.5 border border-primary/20">
                            <Gamepad2 className="w-3.5 h-3.5" />
                            <span>{session.games_played || 1}</span>
                          </div>
                        )}

                        <p className="text-[10px] text-muted-foreground truncate w-full px-2">
                          {session.pricing?.name || "Session"}
                          {session.extra_time_minutes > 0 && session.session_type === 'per_game' && (
                            <span className="ms-1 text-primary font-bold">
                              (Ex +{session.extra_time_minutes})
                            </span>
                          )}
                        </p>

                        {isOverdue && (
                          <p className="text-[10px] text-red-500 font-bold uppercase animate-pulse">{t('sessions.time_up')}</p>
                        )}
                      </div>
                    ) : isMaintenance ? (
                      <span className="text-xs text-muted-foreground font-bold italic uppercase">{t('sessions.maintenance')}</span>
                    ) : (
                      <span className="text-xs text-green-500 font-bold">{t('sessions.available')}</span>
                    )}

                    {/* Games Count Badge (Absolute Top Right) */}
                    {isActive && session && session.session_type === 'per_game' && (
                      <div className="absolute top-2 right-2 z-20 flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-lg border border-primary/50 animate-in zoom-in">
                        {session.games_played || 1} <span className="text-[8px] ms-0.5 opacity-70">G</span>
                      </div>
                    )}
                  </div>

                  {isActive && session && (
                    <div className="absolute bottom-2 left-2 right-2 py-2 px-4 bg-black/95 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-around shadow-2xl z-30 animate-in slide-in-from-bottom-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-12 w-12 rounded-full text-primary hover:bg-primary/20 hover:text-primary transition-colors"
                        onClick={(e) => { e.stopPropagation(); openExtendDialog(session); }}
                        title={t('sessions.extend_tooltip')}
                      >
                        <Plus className="w-6 h-6" />
                      </Button>

                      <div className="w-px h-8 bg-white/20" />

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-12 w-12 rounded-full text-secondary hover:bg-secondary/20 hover:text-secondary transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSessionForConsumption(session);
                          setIsConsumptionDialogOpen(true);
                        }}
                        title={t('sessions.add_consumption_tooltip')}
                      >
                        <Utensils className="w-5 h-5" />
                      </Button>

                      <div className="w-px h-8 bg-white/20" />

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-12 w-12 rounded-full text-destructive hover:bg-destructive/20 hover:text-destructive transition-colors"
                        onClick={(e) => { e.stopPropagation(); openEndDialog(session); }}
                        title={t('sessions.end_tooltip')}
                      >
                        <Square className="w-5 h-5 fill-current" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Session Dialog */}
        <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md w-[95vw] rounded-xl">
            <DialogHeader>
              <DialogTitle>{t('sessions.start_new')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Game Shortcuts - Desktop Only per request */}
              {gameShortcuts && gameShortcuts.length > 0 && (
                <div className="hidden md:block">
                  <Label className="mb-2 block">{t('sessions.quick_start')}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {gameShortcuts.filter(s => s.is_active).map(shortcut => (
                      <div
                        key={shortcut.id}
                        className={`p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors flex flex-col items-center gap-1 relative ${gameNotes === shortcut.name ? 'ring-2 ring-primary bg-primary/10' : ''}`}
                        onClick={() => setGameNotes(shortcut.name)}
                      >
                        {shortcut.shortcut_key && (
                          <span className="absolute top-1 right-1 text-[10px] font-mono bg-background border px-1 rounded opacity-70">
                            {shortcut.shortcut_key}
                          </span>
                        )}
                        <span className="text-xl">{shortcut.icon || '🎮'}</span>
                        <span className="text-xs font-medium text-center truncate w-full">{shortcut.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>{t('sessions.game_notes')}</Label>
                <Input
                  placeholder={t('sessions.game_notes_placeholder')}
                  value={gameNotes}
                  onChange={(e) => setGameNotes(e.target.value)}
                  className="text-base md:text-sm"
                />
              </div>

              <div>
                <Label className="mb-2 block">{t('sessions.pricing_config')}</Label>

                {/* 🚀 Quick Pricing Reference Grid */}
                {selectedConsole && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {pricing?.filter(p => {
                      const c = consoles?.find(con => con.id === selectedConsole);
                      return c && p.console_type.toLowerCase() === c.console_type.toLowerCase();
                    }).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        disabled={startSession.isPending}
                        className={`p-3 border rounded-xl transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden ${selectedPricing === p.id
                          ? 'border-primary bg-primary/20 ring-2 ring-primary/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                          : 'bg-black/20 border-white/5 hover:border-primary/50 hover:bg-black/40'
                          } ${startSession.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => setSelectedPricing(p.id)}
                      >
                        {selectedPricing === p.id && (
                          <div className="absolute top-1 right-1">
                            <Star className="w-3 h-3 text-primary fill-primary" />
                          </div>
                        )}
                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${p.price_type === 'hourly' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                          }`}>
                          {p.price_type === 'hourly' ? t('sessions.time_type') : t('sessions.game_type')}
                        </span>
                        <span className="text-lg font-bold text-white leading-tight">{p.price.toFixed(3)} <span className="text-xs">DT</span></span>
                        <span className="text-[10px] text-muted-foreground truncate w-full px-1">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                <Select value={selectedPricing} onValueChange={setSelectedPricing}>
                  <SelectTrigger className="bg-black/40 border-white/10 h-11">
                    <SelectValue placeholder={t('sessions.choose_rate')} />
                  </SelectTrigger>
                  <SelectContent className="glass-modal border-white/10">
                    {pricing?.filter(p => !selectedConsole || (consoles?.find(c => c.id === selectedConsole)?.console_type && p.console_type === consoles?.find(c => c.id === selectedConsole)?.console_type))
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id} className="focus:bg-primary/20 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] h-4 uppercase">{p.price_type === 'per_game' ? 'Jeu' : 'H'}</Badge>
                            <span>{p.name} - <span className="font-bold text-primary">{p.price.toFixed(3)} DT</span></span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="hero"
                className="w-full h-12 text-lg font-bold"
                onClick={handleStartSession}
                disabled={!selectedPricing || startSession.isPending}
              >
                <Play className="w-5 h-5 me-2" />
                {t('sessions.start_session')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Extend Session Dialog */}
        <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md w-[95vw] rounded-xl">
            <DialogHeader>
              <DialogTitle>{t('sessions.extend_session')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center p-6 bg-secondary/10 rounded-xl mb-4">
                {selectedSession?.session_type === 'per_game' ? (
                  <div className="text-center">
                    <Gamepad2 className="w-10 h-10 text-secondary mx-auto mb-2" />
                    <p className="text-lg font-bold">{t('sessions.add_game')}</p>
                    <p className="text-sm text-muted-foreground">{t('sessions.rate')}: +{selectedSession.pricing?.price?.toFixed(3)} DT</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('sessions.current_games')}: {selectedSession.games_played}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Timer className="w-10 h-10 text-secondary mx-auto mb-2" />
                    <p className="text-lg font-bold">{t('sessions.add_minutes', { minutes: selectedSession?.pricing?.game_duration_minutes || 30 })}</p>
                    <p className="text-sm text-muted-foreground">{t('sessions.rate')}: +{selectedSession?.pricing?.extra_time_price?.toFixed(3) || '0.000'} DT</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('sessions.current_duration')}: {getSessionDuration(selectedSession?.start_time || new Date().toISOString())}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  className="w-full h-14 text-lg font-bold uppercase tracking-wider"
                  size="lg"
                  onClick={handleExtendSession}
                  disabled={addGameToSession.isPending}
                >
                  <Plus className="w-6 h-6 me-2" />
                  {selectedSession?.session_type === 'per_game' ? t('sessions.add_match') : t('sessions.confirm_extension')}
                </Button>

                {selectedSession?.session_type === 'per_game' && (
                  <Button
                    className="w-full bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
                    variant="outline"
                    size="lg"
                    onClick={handleExtendProlongation}
                    disabled={addGameToSession.isPending}
                  >
                    <Timer className="w-5 h-5 me-2" />
                    {t('sessions.add_prolongation')} (+{selectedSession.pricing?.extra_time_price?.toFixed(3) || '0.000'} DT)
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* End Session Dialog */}
        <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md w-[95vw] rounded-xl">
            <DialogHeader>
              <DialogTitle>{t('sessions.end_session', 'End Session')}</DialogTitle>
            </DialogHeader>
            {selectedSession && (
              <div className="space-y-4">
                {endSessionStep === 'summary' ? (
                  <>
                <div className="glass-card rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-display text-xl font-bold">
                    {getSessionDuration(selectedSession.start_time)}
                  </p>
                </div>

                {/* Consumption Summary Block */}
                <div className="glass-card rounded-lg p-3 sm:p-4 border-secondary/20 bg-secondary/5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-secondary" /> Consommations (Tabs)
                    </h4>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs bg-secondary/10 hover:bg-secondary/20 text-secondary" 
                      onClick={() => {
                        setSelectedSessionForConsumption(selectedSession);
                        setIsConsumptionDialogOpen(true);
                      }}
                    >
                      <Plus className="w-3 h-3 me-1" /> Add
                    </Button>
                  </div>
                  {sessionConsumptions && sessionConsumptions.length > 0 ? (
                    <>
                      <div className="space-y-1 max-h-32 overflow-y-auto pe-1 custom-scrollbar">
                        {isConsumptionsLoading ? (
                        <div className="flex justify-center py-2"><Loader2 className="animate-spin w-5 h-5 text-primary" /></div>
                      ) : (
                        sessionConsumptions?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => {
                                  if (item.quantity <= 1) {
                                    deleteSessionConsumption.mutate(item.id);
                                  } else {
                                    updateSessionConsumption.mutate({ id: item.id, quantity: item.quantity - 1 });
                                  }
                                }} 
                                disabled={updateSessionConsumption.isPending || deleteSessionConsumption.isPending}
                              >
                                -
                              </Button>
                              <span>{item.quantity}x {item.product?.name || 'Item'}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => {
                                  updateSessionConsumption.mutate({ id: item.id, quantity: item.quantity + 1 });
                                }} 
                                disabled={updateSessionConsumption.isPending || deleteSessionConsumption.isPending}
                              >
                                +
                              </Button>
                            </div>
                            <span className="font-mono">{((item.unit_price * item.quantity).toFixed(3))}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-bold text-sm">
                      <span>Subtotal Consumables:</span>
                      <span className="text-secondary">
                        {sessionConsumptions.reduce((sum: number, c: SessionConsumption) => sum + (c.unit_price * c.quantity), 0).toFixed(3)} DT
                      </span>
                    </div>
                    </>
                  ) : (
                    <div className="py-3 text-center text-xs text-muted-foreground italic">
                      No consumables attached yet
                    </div>
                  )}
                </div>

                {selectedSession.session_type === 'per_game' && (
                  <div className="space-y-4">
                    {/* Counter Control */}
                    <div>
                      <Label className="flex justify-between items-center">
                        <span>{t('sessions.total_games_played')}</span>
                        <Badge variant={gamesInSession !== (() => {
                          const startTime = new Date(selectedSession.start_time).getTime();
                          const now = new Date().getTime();
                          const elapsedMinutes = (now - startTime) / 60000;
                          const tarifDuration = selectedSession.pricing?.game_duration_minutes || 0;
                          return tarifDuration > 0 ? Math.ceil(elapsedMinutes / tarifDuration) : 1;
                        })() ? "destructive" : "secondary"}>
                          {gamesInSession !== (() => {
                            const startTime = new Date(selectedSession.start_time).getTime();
                            const now = new Date().getTime();
                            const elapsedMinutes = (now - startTime) / 60000;
                            const tarifDuration = selectedSession.pricing?.game_duration_minutes || 0;
                            return tarifDuration > 0 ? Math.ceil(elapsedMinutes / tarifDuration) : 1;
                          })() ? t('sessions.modified') : t('sessions.matches_suggestion')}
                        </Badge>
                      </Label>

                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setGamesInSession(Math.max(0, gamesInSession - 1))}
                          className="h-12 w-12"
                        >
                          <span className="text-xl">-</span>
                        </Button>
                        <div className="flex-1 text-center bg-background/50 rounded-lg border-2 border-primary/20 h-12 flex items-center justify-center relative overflow-hidden">
                          <span className="font-display text-2xl font-bold">{gamesInSession}</span>
                          <span className="absolute bottom-1 text-[8px] text-muted-foreground uppercase tracking-widest">Manual Count</span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setGamesInSession(gamesInSession + 1)}
                          className="h-12 w-12"
                        >
                          <span className="text-xl">+</span>
                        </Button>
                      </div>
                    </div>

                    {/* Suggestion Block */}
                    <div className="glass-card p-3 rounded-lg border-primary/20 bg-primary/5 flex justify-between items-center group cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => {
                        const startTime = new Date(selectedSession.start_time).getTime();
                        const now = new Date().getTime();
                        const elapsedMinutes = (now - startTime) / 60000;
                        const tarifDuration = selectedSession.pricing?.game_duration_minutes || 0;
                        const suggested = tarifDuration > 0 ? Math.ceil(elapsedMinutes / tarifDuration) : 1;
                        setGamesInSession(suggested);
                        toast({ title: "Applied Suggested Count", description: `Updated count to ${suggested} games.` });
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Estimated by Time</span>
                        <div className="flex items-end gap-2">
                          <span className="font-display text-xl font-bold text-primary">
                            {(() => {
                              const startTime = new Date(selectedSession.start_time).getTime();
                              const now = new Date().getTime();
                              const elapsedMinutes = (now - startTime) / 60000;
                              const tarifDuration = selectedSession.pricing?.game_duration_minutes || 0;
                              return tarifDuration > 0 ? Math.ceil(elapsedMinutes / tarifDuration) : 1;
                            })()}
                          </span>
                          <span className="text-xs mb-1">Predicted Games</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Based on duration: {getSessionDuration(selectedSession.start_time)}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/20">
                        Use Suggested
                      </Button>
                    </div>

                    {/* Free Game Info */}
                    {storeSettingsData?.free_games_enabled !== false && gamesInSession >= freeGameThreshold + 1 && (
                      <div className="glass-card rounded-lg p-3 border-secondary/30 flex items-center gap-3">
                        <div className="p-2 bg-secondary/20 rounded-full text-secondary">
                          <Gift className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-secondary">Free Game Unlocked!</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(gamesInSession / (freeGameThreshold + 1))} free game(s) deducted from total.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 pt-2 border-t">
                  <Label>Client (Mandatory for Points)</Label>

                  {!isCreatingClient ? (
                    <ClientSearch
                      onSelect={setSelectedClientForSession}
                      selectedClient={selectedClientForSession}
                      onCreateNew={() => setIsCreatingClient(true)}
                    />
                  ) : (
                    <div className="space-y-3 bg-muted/30 p-3 rounded-lg border animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase text-primary">New Client</Label>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsCreatingClient(false)}>{t('common.cancel', 'Cancel')}</Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Input
                          placeholder="Client Name"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          className="text-base md:text-sm"
                        />
                        <Input
                          placeholder="Phone Number"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          className="text-base md:text-sm"
                        />
                      </div>
                    </div>
                  )}
                  {selectedClientForSession && storeSettingsData?.points_system_enabled !== false && (
                    <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-xs space-y-1">
                      <div className="flex justify-between items-center text-green-700 dark:text-green-400">
                        <span>Current Balance:</span>
                        <span className="font-bold">
                          {(Array.isArray(clients) ? clients.find(c => c.id === selectedClientForSession.id)?.points : selectedClientForSession.points) ?? 0} pts
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-green-600 dark:text-green-500 font-medium border-t border-green-500/20 pt-1 mt-1">
                        <span>Points to be earned:</span>
                        <span>+{estimatedPoints} pts</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Grand Total Display */}
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center mt-4">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total à Payer</p>
                  <p className="font-display text-4xl font-bold text-primary">
                    {(estimatedRevenue + (sessionConsumptions?.reduce((sum: number, c: SessionConsumption) => sum + (c.unit_price * c.quantity), 0) || 0)).toFixed(3)}
                    <span className="text-lg ms-1 text-muted-foreground">DT</span>
                  </p>
                </div>
                  </>
                ) : (
                  <div className="bg-white text-black p-6 rounded-lg font-mono shadow-inner border border-gray-200 w-full mx-auto max-w-sm relative print-receipt-container">
                    {/* Simulated ZigZag Receipt Top/Bottom if desired, but rounded is fine */}
                    <button 
                      className="no-print absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                      onClick={() => window.print()}
                      title={t('sessions.print_receipt')}
                    >
                      <Printer size={18} />
                    </button>
                    <div className="text-center mb-6 pe-6">
                      <h3 className="text-xl font-bold uppercase tracking-widest mb-1">Game Store Zarzis</h3>
                      <p className="text-xs text-gray-500 uppercase">Gaming Lounge Receipt</p>
                    </div>
                    
                    <div className="border-b border-dashed border-gray-400 pb-3 mb-3 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-500">Date:</span>
                        <span className="font-semibold">{new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Console:</span>
                        <span className="font-semibold">{consoles?.find(c => c.id === selectedSession.console_id)?.name || 'N/A'}</span>
                      </div>
                      {selectedClientForSession && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-500">Client:</span>
                          <span className="font-semibold max-w-[150px] truncate">{selectedClientForSession.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between items-start font-semibold">
                        <div className="flex flex-col">
                          <span>{t('sessions.gaming_session_label')}</span>
                          <span className="text-gray-500 text-xs font-normal">
                             {selectedSession.session_type === 'hourly' ? `Duration: ${getSessionDuration(selectedSession.start_time)}` : `Matches: ${gamesInSession}`}
                          </span>
                        </div>
                        <span>{estimatedRevenue.toFixed(3)} DT</span>
                      </div>

                      {sessionConsumptions && sessionConsumptions.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-gray-100">
                          <span className="text-xs uppercase text-gray-500 mb-1 block">Consumables</span>
                          {sessionConsumptions.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-start text-xs mb-1">
                              <span>{item.quantity}x {item.product?.name || 'Item'}</span>
                              <span>{(item.unit_price * item.quantity).toFixed(3)} DT</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t-2 border-dashed border-gray-800 pt-3 mt-4">
                      <div className="flex justify-between items-end">
                        <span className="font-bold text-lg uppercase">Total</span>
                        <span className="font-black text-2xl">
                          {(estimatedRevenue + (sessionConsumptions?.reduce((sum: number, c: SessionConsumption) => sum + (c.unit_price * c.quantity), 0) || 0)).toFixed(3)}
                          <span className="text-sm ms-1">DT</span>
                        </span>
                      </div>
                      {estimatedPoints > 0 && (
                        <div className="flex justify-between items-center mt-2 text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">
                          <span>Points Earned:</span>
                          <span>+{estimatedPoints} pts</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 no-print">
                  {endSessionStep === 'confirm' && (
                    <Button variant="outline" onClick={() => setEndSessionStep('summary')} className="flex-1">
                      Back
                    </Button>
                  )}
                  <Button
                    variant={endSessionStep === 'confirm' ? "default" : "secondary"}
                    className={endSessionStep === 'confirm' 
                      ? "flex-1 h-12 text-lg font-extrabold tracking-wider border-none bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 hover:scale-[1.02]" 
                      : "flex-1 h-12 text-lg font-bold"}
                    onClick={handleEndSession}
                    disabled={endSession.isPending || (isCreatingClient && (!newClientName || !newClientPhone)) || isConsumptionsLoading}
                  >
                    {(endSession.isPending || isConsumptionsLoading) ? <Loader2 className="animate-spin w-5 h-5 me-2" /> : endSessionStep === 'confirm' ? <Square className="w-5 h-5 me-2" /> : <Play className="w-5 h-5 me-2" />}
                    {endSession.isPending ? t('sessions.ending_btn') : isConsumptionsLoading ? t('sessions.loading_btn') : endSessionStep === 'confirm' ? t('sessions.confirm_pay_btn') : t('sessions.review_payment_btn')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Quick Sale Café Menu */}
        <QuickSaleMenu
          isOpen={isCafeMenuOpen}
          onOpenChange={setIsCafeMenuOpen}
          clientId={null} // Can be linked to active session client if needed
        />

        <QuickSaleMenu
          isOpen={isConsumptionDialogOpen}
          onOpenChange={(open) => {
            setIsConsumptionDialogOpen(open);
            if (!open) setSelectedSessionForConsumption(null);
          }}
          sessionId={selectedSessionForConsumption?.id}
        />
      </DashboardLayout>
    </ProtectedRoute >
  );
};

export default SessionsManagement;
