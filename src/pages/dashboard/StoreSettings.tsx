import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, DollarSign, Gift, Settings, Save, Calendar, Copy, AlertTriangle, Zap, Sun, Moon, RefreshCw, Star, AlertCircle, MessageSquare, Database, Truck, LayoutDashboard, CreditCard, Banknote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { HelpTooltip } from "@/components/ui/help-tooltip";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StoreSettings as StoreSettingsType, WeeklySchedule } from "@/types";

interface SpecialHour {
  id: string;
  date: string;
  name: string;
  isOpen: boolean;
  open?: string;
  close?: string;
  note?: string;
}

const StoreSettings = () => {
  const { isOwner } = useAuth();
  const { t } = useLanguage();
  const { data: settings, isLoading } = useStoreSettings();
  const { updateSettings } = useData();
  const defaultWeeklySchedule: WeeklySchedule = {
    monday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true },
    tuesday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true },
    wednesday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true },
    thursday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true },
    friday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true },
    saturday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true },
    sunday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true }
  };

  const [localSettings, setLocalSettings] = useState({
    opening_hours: { open: "08:00", close: "02:00" },
    weekly_schedule: defaultWeeklySchedule,
    special_hours: [] as SpecialHour[],
    free_game_threshold: { games_required: 5 },
    points_config: { points_per_dt: 1, dt_per_point: 1 },
    auth_config: { enable_sms_verification: true },
    sms_enabled: false,
    sms_phone: '',
    sms_api_key: '',
    // New Feature Toggles & Settings
    free_games_enabled: true,
    points_system_enabled: true,
    help_tooltips_enabled: true,
    tariff_display_mode: 'cards', // 'cards', 'table', 'comparison'
    data_limit_mb: 450,
    daily_summary_time: "22:00", // Default 10 PM
    delivery_settings: {
      rapid_post_enabled: false,
      local_delivery_enabled: false,
      rapid_post_cost: 7.000,
      local_delivery_cost: 5.000,
      delivery_zones: [] as string[]
    },
    theme_primary: '185 100% 50%',
    theme_secondary: '320 100% 60%',
    theme_accent: '270 100% 65%',
    default_pricing_ps4: '',
    default_pricing_ps5: '',
    payment_methods_config: {
      bank_transfer: { enabled: false, details: '' },
      d17: { enabled: false, details: '' },
      direct_card: { enabled: false }
    },
    // Notification settings
    notify_new_order: true,
    notify_low_stock: true,
    notify_daily_summary: false,
    enable_service_section: true,
    enable_service_prices: true
  });

  const [showSpecialHoursDialog, setShowSpecialHoursDialog] = useState(false);
  const [specialHoursForm, setSpecialHoursForm] = useState({
    date: '',
    name: '',
    isOpen: true,
    open: '09:00',
    close: '18:00',
    note: ''
  });

  const [isRestoring, setIsRestoring] = useState(false);

  // Robust Client-Side Backup
  const handleFullBackup = async () => {
    try {
      toast({ title: t('settings.toast.backup_started', "Backup Started"), description: t('settings.toast.backup_fetch', "Fetching data from secure database...") });

      const tables = ['clients', 'products', 'sales', 'gaming_sessions', 'expenses', 'services_catalog', 'orders'];
      const backupData: Record<string, unknown> = { timestamp: new Date().toISOString(), version: '1.0' };

      for (const table of tables) {
        const { data, error } = await (supabase.from as (t: string) => ReturnType<typeof supabase.from>)(table).select('*');
        if (error) throw error;
        backupData[table] = data;
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gamestore-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({ title: t('settings.toast.backup_complete', "Backup Complete"), description: t('settings.toast.backup_secured', "Your data has been secured successfully.") });
    } catch (e) {
      console.error("Backup failed:", e);
      toast({ title: t('settings.toast.backup_failed', "Backup Failed"), description: t('settings.toast.backup_err', "Could not fetch all data."), variant: "destructive" });
    }
  };


  const handleExportCSV = async (type: 'sales' | 'clients' | 'products') => {
    try {
      toast({ title: t('settings.toast.export_started', "Export Started"), description: t('settings.toast.export_fetch', `Fetching ${type} data...`) });
      const { data, error } = await supabase.from(type).select('*');
      if (error) throw error;
      if (!data || !data.length) {
        toast({ title: t('settings.toast.no_data', "No Data"), description: t('settings.toast.no_data_desc', "Nothing to export."), variant: "destructive" });
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + data.map((row: Record<string, unknown>) => headers.map(fieldName => {
          let val = row[fieldName];
          if (val === null || val === undefined) val = '';
          if (typeof val === 'object') val = JSON.stringify(val).replace(/"/g, '""'); // Escape quotes
          return `"${val}"`;
        }).join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: t('settings.toast.export_complete', "Export Complete"), description: t('settings.toast.csv_ready', "Your CSV file is ready.") });
    } catch (e) {
      console.error("Export error:", e);
      toast({ title: t('settings.toast.export_failed', "Export Failed"), description: t('settings.toast.export_err', "Could not fetch data."), variant: "destructive" });
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm("âš ï¸ WARNING: This will overwrite/merge data in your database. Are you SURE?")) {
      event.target.value = ''; // Reset input
      return;
    }

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const tables = ['clients', 'products', 'sales', 'gaming_sessions', 'expenses', 'services_catalog', 'orders'];

        for (const table of tables) {
          if (json[table] && Array.isArray(json[table])) {
            // Upsert in batches of 50 to avoid payload limits
            const batchSize = 50;
            for (let i = 0; i < json[table].length; i += batchSize) {
              const batch = json[table].slice(i, i + batchSize);
              const { error } = await (supabase.from as (t: string) => ReturnType<typeof supabase.from>)(table).upsert(batch, { onConflict: 'id' });
              if (error) {
                console.warn(`Error restoring ${table}:`, error);
              }
            }
          }
        }

        toast({ title: t('settings.toast.restore_complete', "Restore Complete"), description: t('settings.toast.restore_success', "Data has been successfully imported.") });
        setTimeout(() => window.location.reload(), 1500); // Reload to reflect changes
      } catch (err) {
        console.error("Restore failed:", err);
        toast({ title: t('settings.toast.restore_failed', "Restore Failed"), description: t('settings.toast.restore_err', "Invalid backup file or network error."), variant: "destructive" });
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  // Update local settings when data loads
  React.useEffect(() => {
    if (settings) {
      setLocalSettings(prevSettings => ({
        ...prevSettings,
        ...settings,
        weekly_schedule: {
          ...defaultWeeklySchedule,
          ...(settings.weekly_schedule || {})
        },
        auth_config: {
          ...(settings.auth_config || {}),
          enable_sms_verification: settings.auth_config?.enable_sms_verification ?? true,
        },
        // Ensure defaults for new settings if missing
        free_games_enabled: settings.free_games_enabled ?? true,
        points_system_enabled: settings.points_system_enabled ?? true,
        help_tooltips_enabled: settings.help_tooltips_enabled ?? true,
        tariff_display_mode: settings.tariff_display_mode ?? 'cards',
        data_limit_mb: settings.data_limit_mb ?? 450,
        daily_summary_time: settings.daily_summary_time ?? "22:00",
        enable_service_section: settings.enable_service_section ?? true,
        enable_service_prices: settings.enable_service_prices ?? true,
        special_hours: Array.isArray(settings.special_hours) ? (settings.special_hours as SpecialHour[]) : [],
        theme_primary: settings.theme_primary ?? '185 100% 50%',
        theme_secondary: settings.theme_secondary ?? '320 100% 60%',
        theme_accent: settings.theme_accent ?? '270 100% 65%',
        delivery_settings: {
          rapid_post_enabled: false,
          local_delivery_enabled: false,
          local_delivery_cost: 5.000,
          rapid_post_cost: 7.000,
          delivery_zones: [] as string[],
          ...(settings.delivery_settings || {})
        },
        default_pricing_ps4: settings.default_pricing_ps4 || '',
        default_pricing_ps5: settings.default_pricing_ps5 || '',
        payment_methods_config: {
          bank_transfer: settings.payment_methods_config?.bank_transfer ?? { enabled: false, details: '' },
          d17: settings.payment_methods_config?.d17 ?? { enabled: false, details: '' },
          direct_card: settings.payment_methods_config?.direct_card ?? { enabled: false }
        }
      }));
    }
  }, [settings]);

  // Only owners can access this page
  if (!isOwner) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{t('accessDenied.title')}</h2>
              <p className="text-muted-foreground">{t('accessDenied.message')}</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const handleSave = async () => {
    try {
      // Create a batch update object with all local settings
      const settingsToUpdate: Partial<StoreSettingsType> = {
        opening_hours: localSettings.opening_hours,
        weekly_schedule: localSettings.weekly_schedule,
        special_hours: localSettings.special_hours,
        auth_config: localSettings.auth_config,
        free_games_enabled: localSettings.free_games_enabled,
        points_system_enabled: localSettings.points_system_enabled,
        help_tooltips_enabled: localSettings.help_tooltips_enabled,
        tariff_display_mode: localSettings.tariff_display_mode,
        data_limit_mb: localSettings.data_limit_mb,
        daily_summary_time: localSettings.daily_summary_time,
        delivery_settings: localSettings.delivery_settings,
        theme_primary: localSettings.theme_primary,
        theme_secondary: localSettings.theme_secondary,
        theme_accent: localSettings.theme_accent,
        default_pricing_ps4: localSettings.default_pricing_ps4,
        default_pricing_ps5: localSettings.default_pricing_ps5,
        payment_methods_config: localSettings.payment_methods_config,
        enable_service_section: localSettings.enable_service_section,
        enable_service_prices: localSettings.enable_service_prices
      };

      // Add optional settings if they exist
      if (localSettings.sms_enabled !== undefined) settingsToUpdate.sms_enabled = localSettings.sms_enabled;
      if (localSettings.sms_phone !== undefined) settingsToUpdate.sms_phone = localSettings.sms_phone;
      if (localSettings.sms_api_key !== undefined) settingsToUpdate.sms_api_key = localSettings.sms_api_key;

      await updateSettings(settingsToUpdate);

      toast({
        title: t('settings.saveSuccessTitle'),
        description: t('settings.saveSuccessDescription')
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: t('settings.saveErrorTitle'),
        description: t('settings.saveErrorDescription'),
        variant: "destructive"
      });
    }
  };

  const updateSetting = (key: string, value: unknown) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Time validation helper (supports overnight hours)
  const validateTimeRange = (open: string, close: string): boolean => {
    if (!open || !close) return false;
    const openTime = new Date(`2000-01-01T${open}`);
    let closeTime = new Date(`2000-01-01T${close}`);

    // If close time is before open time, assume it's next day (overnight)
    if (closeTime <= openTime) {
      closeTime = new Date(`2000-01-02T${close}`);
    }

    return closeTime > openTime;
  };

  // Check if hours are overnight
  const isOvernight = (open: string, close: string): boolean => {
    if (!open || !close) return false;
    const openTime = new Date(`2000-01-01T${open}`);
    const closeTime = new Date(`2000-01-01T${close}`);
    return closeTime <= openTime;
  };



  // Quick preset functions
  const applyPreset = (preset: string) => {
    const weekends = ['saturday', 'sunday'];

    switch (preset) {
      case 'close-weekends': {
        const closeSchedule = { ...localSettings.weekly_schedule };
        weekends.forEach(day => {
          closeSchedule[day as keyof typeof closeSchedule].isOpen = false;
        });
        updateSetting('weekly_schedule', closeSchedule);
        toast({ title: t('settings.presetAppliedTitle'), description: t('settings.closeWeekendsDescription') });
        break;
      }

      case 'standard-hours': {
        const standardSchedule = {
          ...localSettings.weekly_schedule,
          monday: { isOpen: true, open: "09:00", close: "18:00", breakStart: "12:00", breakEnd: "13:00", hasBreak: true },
          tuesday: { isOpen: true, open: "09:00", close: "18:00", breakStart: "12:00", breakEnd: "13:00", hasBreak: true },
          wednesday: { isOpen: true, open: "09:00", close: "18:00", breakStart: "12:00", breakEnd: "13:00", hasBreak: true },
          thursday: { isOpen: true, open: "09:00", close: "18:00", breakStart: "12:00", breakEnd: "13:00", hasBreak: true },
          friday: { isOpen: true, open: "09:00", close: "18:00", breakStart: "12:00", breakEnd: "13:00", hasBreak: true },
          saturday: { isOpen: true, open: "10:00", close: "16:00", breakStart: "12:00", breakEnd: "13:00", hasBreak: false },
          sunday: { isOpen: false, open: "09:00", close: "18:00", breakStart: "12:00", breakEnd: "13:00", hasBreak: false }
        };
        updateSetting('weekly_schedule', standardSchedule);
        toast({ title: t('settings.standardPresetAppliedTitle'), description: t('settings.standardPresetDescription') });
        break;
      }

      case '24-hours': {
        const twentyFourHourSchedule = {
          ...localSettings.weekly_schedule,
          monday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true },
          tuesday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true },
          wednesday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true },
          thursday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true },
          friday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true },
          saturday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true },
          sunday: { isOpen: true, open: "08:00", close: "02:00", breakStart: "12:00", breakEnd: "13:30", hasBreak: true }
        };
        updateSetting('weekly_schedule', twentyFourHourSchedule);
        toast({ title: t('settings.24hPresetAppliedTitle'), description: t('settings.24hPresetDescription') });
        break;
      }
    }
  };

  // Check for schedule conflicts
  const hasScheduleConflicts = () => {
    return Object.entries(localSettings.weekly_schedule).some(([_, schedule]) => {
      if (!schedule.isOpen) return false;
      return !validateTimeRange(schedule.open, schedule.close) ||
        (schedule.hasBreak && !validateTimeRange(schedule.breakStart, schedule.breakEnd));
    });
  };

  // Special hours management
  const addSpecialHour = () => {
    if (!specialHoursForm.date || !specialHoursForm.name) {
      toast({ title: t('settings.specialHours.errorTitle'), description: t('settings.specialHours.errorMessage'), variant: "destructive" });
      return;
    }

    const newSpecialHour = {
      id: Date.now().toString(),
      ...specialHoursForm
    };

    updateSetting('special_hours', [...localSettings.special_hours, newSpecialHour]);
    setSpecialHoursForm({
      date: '',
      name: '',
      isOpen: true,
      open: '09:00',
      close: '18:00',
      note: ''
    });
    setShowSpecialHoursDialog(false);
    toast({ title: t('settings.specialHours.addSuccessTitle'), description: t('settings.specialHours.addSuccessDescription', { name: specialHoursForm.name }) });
  };

  const removeSpecialHour = (id: string) => {
    const updatedSpecialHours = (localSettings.special_hours as SpecialHour[]).filter(hour => hour.id !== id);
    updateSetting('special_hours', updatedSpecialHours);
    toast({ title: t('settings.specialHours.removeSuccessTitle') });
  };

  const hexToHSLString = (hex: string): string => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const hslStringToHex = (hsl: string): string => {
    const parts = hsl.split(' ');
    const h = parseInt(parts[0]) / 360;
    const s = parseInt(parts[1]?.replace('%', '') || '0') / 100;
    const l = parseInt(parts[2]?.replace('%', '') || '0') / 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const hue2rgb = (t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      r = hue2rgb(h + 1 / 3);
      g = hue2rgb(h);
      b = hue2rgb(h - 1 / 3);
    }
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">{t('settings.title')}</h1>
                <HelpTooltip content={t('help.settings')} />
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">
                {t('settings.subtitle')}
              </p>
            </div>
            <Button onClick={handleSave} className="w-full sm:w-auto shrink-0">
              <Save className="w-4 h-4 me-2" />
              <span className="hidden sm:inline">{t('settings.save')}</span>
              <span className="sm:hidden">{t('settings.saveShort')}</span>
            </Button>
          </div>

          <Tabs defaultValue="hours" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="hours" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Clock className="w-4 h-4" />
                <span className="truncate">{t('settings.tabs.hours')}</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <DollarSign className="w-4 h-4" />
                <span className="truncate">{t('settings.tabs.pointsAndPricing')}</span>
              </TabsTrigger>
              <TabsTrigger value="loyalty" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Gift className="w-4 h-4" />
                <span className="truncate">{t('settings.tabs.loyalty')}</span>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Truck className="w-4 h-4" />
                <span className="truncate">Delivery</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <CreditCard className="w-4 h-4" />
                <span className="truncate">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="display" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <LayoutDashboard className="w-4 h-4" />
                <span className="truncate">Display</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <MessageSquare className="w-4 h-4" />
                <span className="truncate">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Sun className="w-4 h-4" />
                <span className="truncate">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Database className="w-4 h-4" />
                <span className="truncate">Data & Backup</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hours" className="space-y-4 sm:space-y-6">

              {/* Default Operating Hours */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t('settings.defaultHours.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="open-time">{t('settings.defaultHours.openingTime')}</Label>
                      <Input
                        id="open-time"
                        type="time"
                        value={localSettings.opening_hours.open}
                        onChange={(e) => updateSetting('opening_hours', {
                          ...localSettings.opening_hours,
                          open: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="close-time">{t('settings.defaultHours.closingTime')}</Label>
                      <Input
                        id="close-time"
                        type="time"
                        value={localSettings.opening_hours.close}
                        onChange={(e) => updateSetting('opening_hours', {
                          ...localSettings.opening_hours,
                          close: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>{t('common.info')}:</strong> {t('settings.defaultHours.infoMessage', { open: localSettings.opening_hours.open, close: localSettings.opening_hours.close })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Weekly Schedule Section */}
              {isLoading ? (
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      {t('settings.weeklySchedule.loading')}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Schedule Statistics */}
                  <Card className="glass-card border-s-4 border-s-green-500">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {Object.values(localSettings.weekly_schedule).filter(day => day.isOpen).length}
                          </div>
                          <div className="text-xs text-muted-foreground">{t('settings.weeklySchedule.openDays')}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-indigo-600">
                            {Object.values(localSettings.weekly_schedule).filter(day =>
                              day.isOpen && isOvernight(day.open, day.close)
                            ).length}
                          </div>
                          <div className="text-xs text-muted-foreground">{t('settings.weeklySchedule.nightServices')}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {Object.values(localSettings.weekly_schedule).filter(day => day.hasBreak).length}
                          </div>
                          <div className="text-xs text-muted-foreground">{t('settings.weeklySchedule.withBreak')}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {localSettings.special_hours.length}
                          </div>
                          <div className="text-xs text-muted-foreground">{t('settings.weeklySchedule.specialEvents')}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {hasScheduleConflicts() ? '⚠️' : '✅'}
                          </div>
                          <div className="text-xs text-muted-foreground">{t('settings.weeklySchedule.validationStatus')}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions & Presets */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        {t('settings.quickActions.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const defaultSchedule = { ...localSettings.weekly_schedule };
                            Object.keys(defaultSchedule).forEach(day => {
                              defaultSchedule[day as keyof typeof defaultSchedule] = {
                                ...defaultSchedule[day as keyof typeof defaultSchedule],
                                open: localSettings.opening_hours.open,
                                close: localSettings.opening_hours.close
                              };
                            });
                            updateSetting('weekly_schedule', defaultSchedule);
                            toast({ title: t('settings.defaultHoursAppliedTitle'), description: t('settings.defaultHoursAppliedDescription') });
                          }}
                          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 hover:bg-green-50 hover:border-green-300 p-2 sm:p-3 h-auto"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="text-xs text-center sm:text-left leading-tight">{t('settings.quickActions.defaultHours')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset('close-weekends')}
                          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 hover:bg-gray-50 hover:border-gray-300 p-2 sm:p-3 h-auto"
                        >
                          <Moon className="w-4 h-4" />
                          <span className="text-xs text-center sm:text-left leading-tight">{t('settings.quickActions.closeWeekends')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset('standard-hours')}
                          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 hover:bg-blue-50 hover:border-blue-300 p-2 sm:p-3 h-auto"
                        >
                          <Sun className="w-4 h-4" />
                          <span className="text-xs text-center sm:text-left leading-tight">{t('settings.quickActions.standardHours')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset('24-hours')}
                          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 hover:bg-indigo-50 hover:border-indigo-300 p-2 sm:p-3 h-auto"
                        >
                          <Zap className="w-4 h-4" />
                          <span className="text-xs text-center sm:text-left leading-tight">{t('settings.quickActions.24hService')}</span>
                        </Button>
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">{t('settings.quickActions.simplifiedActions')}</p>
                            <p className="text-blue-700 dark:text-blue-300 text-xs">
                              {t('settings.quickActions.simplifiedActionsDescription')}
                            </p>
                          </div>
                        </div>
                      </div>
                      {hasScheduleConflicts() && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('settings.quickActions.conflictWarning')}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Weekly Schedule Planning */}
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-secondary" />
                        {t('settings.detailedWeeklyPlanning.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-sm text-muted-foreground">
                        <p>{t('settings.detailedWeeklyPlanning.description')}</p>
                      </div>

                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-[120px]">{t('settings.detailedWeeklyPlanning.day') || "Day"}</TableHead>
                              <TableHead className="w-[100px]">{t('settings.detailedWeeklyPlanning.status') || "Status"}</TableHead>
                              <TableHead>{t('settings.detailedWeeklyPlanning.operatingHours') || "Operating Hours"}</TableHead>
                              <TableHead className="w-[180px]">{t('settings.detailedWeeklyPlanning.lunchBreak') || "Lunch Break"}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(localSettings.weekly_schedule).map(([day, schedule]) => {
                              const dayNames = {
                                monday: t('common.days.monday'),
                                tuesday: t('common.days.tuesday'),
                                wednesday: t('common.days.wednesday'),
                                thursday: t('common.days.thursday'),
                                friday: t('common.days.friday'),
                                saturday: t('common.days.saturday'),
                                sunday: t('common.days.sunday')
                              };
                              const dayName = dayNames[day as keyof typeof dayNames];
                              const isValidTimeRange = schedule.isOpen ? validateTimeRange(schedule.open, schedule.close) : true;
                              const hasBreakConflict = schedule.hasBreak ? validateTimeRange(schedule.breakStart, schedule.breakEnd) : true;
                              const isRowError = (schedule.isOpen && !isValidTimeRange) || (schedule.hasBreak && !hasBreakConflict);

                              return (
                                <TableRow key={day} className={isRowError ? "bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20" : ""}>
                                  <TableCell className="font-medium capitalize">
                                    {dayName}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={schedule.isOpen}
                                        onCheckedChange={(checked) => updateSetting('weekly_schedule', {
                                          ...localSettings.weekly_schedule,
                                          [day]: { ...schedule, isOpen: checked }
                                        })}
                                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200 shadow-sm scale-90"
                                      />
                                      <span className={`text-xs font-medium ${schedule.isOpen ? 'text-green-600' : 'text-muted-foreground'}`}>
                                        {schedule.isOpen ? t('common.open') : t('common.closed')}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {schedule.isOpen ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="time"
                                          value={schedule.open}
                                          onChange={(e) => updateSetting('weekly_schedule', {
                                            ...localSettings.weekly_schedule,
                                            [day]: { ...schedule, open: e.target.value }
                                          })}
                                          className={`w-28 h-8 text-sm ${!isValidTimeRange ? 'border-red-500' : ''}`}
                                        />
                                        <span className="text-muted-foreground">-</span>
                                        <Input
                                          type="time"
                                          value={schedule.close}
                                          onChange={(e) => updateSetting('weekly_schedule', {
                                            ...localSettings.weekly_schedule,
                                            [day]: { ...schedule, close: e.target.value }
                                          })}
                                          className={`w-28 h-8 text-sm ${!isValidTimeRange ? 'border-red-500' : ''}`}
                                        />
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-sm italic">Closed all day</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {schedule.isOpen && (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Switch
                                            checked={schedule.hasBreak}
                                            onCheckedChange={(checked) => updateSetting('weekly_schedule', {
                                              ...localSettings.weekly_schedule,
                                              [day]: { ...schedule, hasBreak: checked }
                                            })}
                                            className="scale-75 origin-left"
                                          />
                                          <span className="text-xs text-muted-foreground">{schedule.hasBreak ? "Enabled" : "No Break"}</span>
                                        </div>
                                        {schedule.hasBreak && (
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="time"
                                              value={schedule.breakStart}
                                              onChange={(e) => updateSetting('weekly_schedule', {
                                                ...localSettings.weekly_schedule,
                                                [day]: { ...schedule, breakStart: e.target.value }
                                              })}
                                              className="w-20 h-7 text-xs px-1"
                                            />
                                            <span className="text-muted-foreground text-[10px]">-</span>
                                            <Input
                                              type="time"
                                              value={schedule.breakEnd}
                                              onChange={(e) => updateSetting('weekly_schedule', {
                                                ...localSettings.weekly_schedule,
                                                [day]: { ...schedule, breakEnd: e.target.value }
                                              })}
                                              className="w-20 h-7 text-xs px-1"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>


                      {/* Help & Tips */}
                      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                          <Settings className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">{t('settings.tips.title')}</h4>
                            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                              <li>{t('settings.tips.tip1')}</li>
                              <li>{t('settings.tips.tip2')}</li>
                              <li>{t('settings.tips.tip3')}</li>
                              <li>{t('settings.tips.tip4')}</li>
                              <li>{t('settings.tips.tip5')}</li>
                              <li>{t('settings.tips.tip6')}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Special Hours Section */}
                  <Card className="glass-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-purple-500" />
                          {t('settings.specialHours.title')}
                        </CardTitle>
                        <Button
                          onClick={() => setShowSpecialHoursDialog(true)}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Calendar className="w-4 h-4 me-2" />
                          {t('settings.specialHours.add')}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {localSettings.special_hours.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <p className="text-sm mb-2">{t('settings.specialHours.noSpecialHoursConfigured')}</p>
                          <p className="text-xs">{t('settings.specialHours.addSpecialHoursDescription')}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(Array.isArray(localSettings.special_hours) ? (localSettings.special_hours as SpecialHour[]) : [])
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map((specialHour) => (
                              <div key={specialHour.id} className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className="font-medium text-sm">{specialHour.name}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${specialHour.isOpen
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                      }`}>
                                      {specialHour.isOpen ? t('common.open') : t('common.closed')}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(specialHour.date).toLocaleDateString('fr-FR', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                    {specialHour.isOpen && ` â€¢ ${specialHour.open} - ${specialHour.close}`}
                                    {specialHour.note && ` â€¢ ${specialHour.note}`}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSpecialHour(specialHour.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  ðŸ—‘ï¸
                                </Button>
                              </div>
                            ))}
                        </div>
                      )}

                      <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="text-purple-800 dark:text-purple-200 font-medium mb-1">{t('settings.specialHours.title')}</p>
                            <p className="text-purple-700 dark:text-purple-300 text-xs">
                              {t('settings.specialHours.infoDescription')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Special Hours Dialog */}
                  <Dialog open={showSpecialHoursDialog} onOpenChange={setShowSpecialHoursDialog}>
                    <DialogContent className="w-[95vw] sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                          <span className="truncate">{t('settings.specialHours.addSpecialHour')}</span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2 sm:py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="special-date" className="text-sm">{t('common.date')}</Label>
                            <Input
                              id="special-date"
                              type="date"
                              value={specialHoursForm.date}
                              onChange={(e) => setSpecialHoursForm(prev => ({ ...prev, date: e.target.value }))}
                              min={new Date().toISOString().split('T')[0]}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="special-name" className="text-sm">{t('settings.specialHours.eventName')}</Label>
                            <Input
                              id="special-name"
                              placeholder={t('settings.specialHours.eventNamePlaceholder')}
                              value={specialHoursForm.name}
                              onChange={(e) => setSpecialHoursForm(prev => ({ ...prev, name: e.target.value }))}
                              className="text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Switch
                            id="special-is-open"
                            checked={specialHoursForm.isOpen}
                            onCheckedChange={(checked) => setSpecialHoursForm(prev => ({ ...prev, isOpen: checked }))}
                          />
                          <Label htmlFor="special-is-open" className="font-medium">
                            {specialHoursForm.isOpen ? t('settings.specialHours.openThatDay') : t('settings.specialHours.closedThatDay')}
                          </Label>
                        </div>

                        {specialHoursForm.isOpen && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="special-open">{t('settings.specialHours.openingTime')}</Label>
                              <Input
                                id="special-open"
                                type="time"
                                value={specialHoursForm.open}
                                onChange={(e) => setSpecialHoursForm(prev => ({ ...prev, open: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="special-close">{t('settings.specialHours.closingTime')}</Label>
                              <Input
                                id="special-close"
                                type="time"
                                value={specialHoursForm.close}
                                onChange={(e) => setSpecialHoursForm(prev => ({ ...prev, close: e.target.value }))}
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <Label htmlFor="special-note">{t('settings.specialHours.noteOptional')}</Label>
                          <Input
                            id="special-note"
                            placeholder={t('settings.specialHours.notePlaceholder')}
                            value={specialHoursForm.note}
                            onChange={(e) => setSpecialHoursForm(prev => ({ ...prev, note: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                        <Button variant="outline" onClick={() => setShowSpecialHoursDialog(false)} className="w-full sm:w-auto">
                          {t('common.cancel')}
                        </Button>
                        <Button onClick={addSpecialHour} className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto h-12 px-6 text-lg font-bold">
                          <Calendar className="w-5 h-5 me-2" />
                          {t('common.add')}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-secondary" />
                    {t('settings.pointsSystem.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable Points System</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow clients to earn and spend points on purchases and sessions.
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.points_system_enabled}
                      onCheckedChange={(checked) => updateSetting('points_system_enabled', checked)}
                    />
                  </div>

                  {localSettings.points_system_enabled && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="points-per-dt">{t('settings.pointsSystem.pointsPerDT')}</Label>
                          <Input
                            id="points-per-dt"
                            type="number"
                            min="0"
                            step="0.1"
                            value={localSettings.points_config.points_per_dt}
                            onChange={(e) => updateSetting('points_config', {
                              ...localSettings.points_config,
                              points_per_dt: parseFloat(e.target.value) || 0
                            })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('settings.pointsSystem.pointsPerDTDescription', { points: localSettings.points_config.points_per_dt })}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="dt-per-point">{t('settings.pointsSystem.dtPerPoint')}</Label>
                          <Input
                            id="dt-per-point"
                            type="number"
                            min="0"
                            step="0.001"
                            value={localSettings.points_config.dt_per_point}
                            onChange={(e) => updateSetting('points_config', {
                              ...localSettings.points_config,
                              dt_per_point: parseFloat(e.target.value) || 0
                            })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('settings.pointsSystem.dtPerPointDescription', { dt: localSettings.points_config.dt_per_point.toFixed(3) })}
                          </p>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">{t('common.example')}:</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.pointsSystem.exampleSpend', { points: 10 * localSettings.points_config.points_per_dt })}<br />
                          {t('settings.pointsSystem.exampleRedeem', { dt: (50 * localSettings.points_config.dt_per_point).toFixed(3) })}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="loyalty" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-accent" />
                    {t('settings.freeGameProgram.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable Free Game Program</Label>
                      <p className="text-sm text-muted-foreground">
                        Reward clients with a free game after a set number of sessions.
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.free_games_enabled}
                      onCheckedChange={(checked) => updateSetting('free_games_enabled', checked)}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700 border-2 border-transparent data-[state=checked]:border-primary/20 hover:scale-105 transition-all duration-300 shadow-sm"
                    />
                  </div>

                  {localSettings.free_games_enabled && (
                    <>
                      <div>
                        <Label htmlFor="free-game-threshold">{t('settings.freeGameProgram.gamesRequired')}</Label>
                        <Input
                          id="free-game-threshold"
                          type="number"
                          min="1"
                          value={localSettings.free_game_threshold.games_required}
                          onChange={(e) => updateSetting('free_game_threshold', {
                            games_required: parseInt(e.target.value) || 1
                          })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          After playing {localSettings.free_game_threshold.games_required} games in a row, customers get one free game
                        </p>
                      </div>

                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">How it works:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>â€¢ Customer plays {localSettings.free_game_threshold.games_required} consecutive games</li>
                          <li>â€¢ Next game is free (no charge)</li>
                          <li>â€¢ Counter resets after free game or break</li>
                          <li>â€¢ Applies to both per-game and per-time sessions</li>
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="delivery" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    {t('settings.delivery.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Rapid Post Settings */}
                  <div className="space-y-4 border-b pb-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-base">{t('settings.delivery.rapid_post.title')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.delivery.rapid_post.desc')}
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.delivery_settings.rapid_post_enabled}
                        onCheckedChange={(checked) => updateSetting('delivery_settings', {
                          ...localSettings.delivery_settings,
                          rapid_post_enabled: checked
                        })}
                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700 border-2 border-transparent data-[state=checked]:border-primary/20 hover:scale-105 transition-all duration-300 shadow-sm"
                      />
                    </div>
                    {localSettings.delivery_settings.rapid_post_enabled && (
                      <div className="ps-4 border-s-2 border-primary/20">
                        <Label>{t('settings.delivery.cost_label')}</Label>
                        <Input
                          type="number"
                          step="0.100"
                          value={localSettings.delivery_settings.rapid_post_cost}
                          onChange={(e) => updateSetting('delivery_settings', {
                            ...localSettings.delivery_settings,
                            rapid_post_cost: parseFloat(e.target.value) || 0
                          })}
                          className="w-32 mt-1"
                        />
                      </div>
                    )}
                  </div>

                  {/* Local Delivery Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-base">{t('settings.delivery.local.title')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.delivery.local.desc')}
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.delivery_settings.local_delivery_enabled}
                        onCheckedChange={(checked) => updateSetting('delivery_settings', {
                          ...localSettings.delivery_settings,
                          local_delivery_enabled: checked
                        })}
                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700 border-2 border-transparent data-[state=checked]:border-primary/20 hover:scale-105 transition-all duration-300 shadow-sm"
                      />
                    </div>
                    {localSettings.delivery_settings.local_delivery_enabled && (
                      <div className="ps-4 border-s-2 border-primary/20">
                        <Label>{t('settings.delivery.cost_label')}</Label>
                        <Input
                          type="number"
                          step="0.100"
                          value={localSettings.delivery_settings.local_delivery_cost}
                          onChange={(e) => updateSetting('delivery_settings', {
                            ...localSettings.delivery_settings,
                            local_delivery_cost: parseFloat(e.target.value) || 0
                          })}
                          className="w-32 mt-1"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    {t('settings.payments.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* D17 Settings */}
                  <div className="space-y-4 border-b pb-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-base">{t('settings.payments.d17.title')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.payments.d17.desc')}
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.payment_methods_config?.d17?.enabled}
                        onCheckedChange={(checked) => updateSetting('payment_methods_config', {
                          ...localSettings.payment_methods_config,
                          d17: { ...localSettings.payment_methods_config?.d17, enabled: checked }
                        })}
                      />
                    </div>
                    {localSettings.payment_methods_config?.d17?.enabled && (
                      <div className="ps-4 border-s-2 border-primary/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <Label>{t('settings.payments.d17.title')}</Label>
                          <Textarea
                            placeholder={t('settings.payments.d17.placeholder')}
                            value={localSettings.payment_methods_config?.d17?.details || ''}
                            onChange={(e) => updateSetting('payment_methods_config', {
                              ...localSettings.payment_methods_config,
                              d17: { ...localSettings.payment_methods_config?.d17, details: e.target.value }
                            })}
                            className="bg-background"
                          />
                          <p className="text-[10px] text-muted-foreground">{t('checkout.payment.ref_info')}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bank Transfer Settings */}
                  <div className="space-y-4 border-b pb-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-base">{t('settings.payments.bank.title')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.payments.bank.desc')}
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.payment_methods_config?.bank_transfer?.enabled}
                        onCheckedChange={(checked) => updateSetting('payment_methods_config', {
                          ...localSettings.payment_methods_config,
                          bank_transfer: { ...localSettings.payment_methods_config?.bank_transfer, enabled: checked }
                        })}
                      />
                    </div>
                    {localSettings.payment_methods_config?.bank_transfer?.enabled && (
                      <div className="ps-4 border-s-2 border-primary/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <Label>{t('settings.payments.bank.title')}</Label>
                          <Textarea
                            placeholder={t('settings.payments.bank.placeholder')}
                            value={localSettings.payment_methods_config?.bank_transfer?.details || ''}
                            onChange={(e) => updateSetting('payment_methods_config', {
                              ...localSettings.payment_methods_config,
                              bank_transfer: { ...localSettings.payment_methods_config?.bank_transfer, details: e.target.value }
                            })}
                            className="bg-background"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cash / Store Payment */}
                  <div className="p-4 border rounded-lg bg-green-500/5 border-green-500/20">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 bg-green-500/10 rounded-lg">
                        <Banknote className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-sm">{t('settings.payments.default.title')}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.payments.default.desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="display" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-primary" />
                    {t('settings.display.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tariff Display Mode */}
                  <div className="space-y-3">
                    <Label className="text-base">{t('settings.display.tariff.title')}</Label>
                    <p className="text-sm text-muted-foreground mb-2">{t('settings.display.tariff.desc')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div
                        className={`cursor-pointer border rounded-lg p-4 hover:border-primary transition-all ${localSettings.tariff_display_mode === 'cards' ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                        onClick={() => updateSetting('tariff_display_mode', 'cards')}
                      >
                        <div className="h-20 bg-muted/40 rounded mb-2 flex flex-wrap gap-1 p-1 content-start">
                          <div className="w-1/3 h-8 bg-muted-foreground/20 rounded"></div>
                          <div className="w-1/3 h-8 bg-muted-foreground/20 rounded"></div>
                          <div className="w-1/3 h-8 bg-muted-foreground/20 rounded"></div>
                        </div>
                        <h4 className="font-bold">{t('settings.display.tariff.cards')}</h4>
                        <p className="text-xs text-muted-foreground">{t('settings.display.tariff.cards_desc')}</p>
                      </div>

                      <div
                        className={`cursor-pointer border rounded-lg p-4 hover:border-primary transition-all ${localSettings.tariff_display_mode === 'table' ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                        onClick={() => updateSetting('tariff_display_mode', 'table')}
                      >
                        <div className="h-20 bg-muted/40 rounded mb-2 flex flex-col gap-1 p-1">
                          <div className="w-full h-2 bg-muted-foreground/20 rounded"></div>
                          <div className="w-full h-2 bg-muted-foreground/20 rounded"></div>
                          <div className="w-full h-2 bg-muted-foreground/20 rounded"></div>
                        </div>
                        <h4 className="font-bold">{t('settings.display.tariff.table')}</h4>
                        <p className="text-xs text-muted-foreground">{t('settings.display.tariff.table_desc')}</p>
                      </div>

                      <div
                        className={`cursor-pointer border rounded-lg p-4 hover:border-primary transition-all ${localSettings.tariff_display_mode === 'comparison' ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                        onClick={() => updateSetting('tariff_display_mode', 'comparison')}
                      >
                        <div className="h-20 bg-muted/40 rounded mb-2 flex gap-1 p-1">
                          <div className="w-1/2 h-full bg-muted-foreground/20 rounded"></div>
                          <div className="w-1/2 h-full bg-muted-foreground/20 rounded"></div>
                        </div>
                        <h4 className="font-bold">{t('settings.display.tariff.comparison')}</h4>
                        <p className="text-xs text-muted-foreground">{t('settings.display.tariff.comparison_desc')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">{t('settings.display.tooltips.title')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.display.tooltips.desc')}
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.help_tooltips_enabled}
                      onCheckedChange={(checked) => updateSetting('help_tooltips_enabled', checked)}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700 border-2 border-transparent data-[state=checked]:border-primary/20 hover:scale-105 transition-all duration-300 shadow-sm"
                    />
                  </div>
                  <div className="border-t pt-6 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable Service Section</Label>
                      <p className="text-sm text-muted-foreground">
                        Show or hide the entire "Réparations Expertes" section on the public homepage.
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.enable_service_section ?? true}
                      onCheckedChange={(checked) => updateSetting('enable_service_section', checked)}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700 border-2 border-transparent data-[state=checked]:border-primary/20 hover:scale-105 transition-all duration-300 shadow-sm"
                    />
                  </div>

                  <div className="border-t pt-6 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Show Estimated Prices</Label>
                      <p className="text-sm text-muted-foreground">
                        Show or hide the "À PARTIR DE X DT" estimated prices on service cards.
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.enable_service_prices ?? true}
                      onCheckedChange={(checked) => updateSetting('enable_service_prices', checked)}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700 border-2 border-transparent data-[state=checked]:border-primary/20 hover:scale-105 transition-all duration-300 shadow-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    SMS & Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Client Authentication Settings */}
                  <div className="space-y-4 border-b pb-6">
                    <h3 className="text-lg font-medium">Client Authentication</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-base">Enable SMS Verification</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow clients to verify their account using SMS OTP. Disable to use Email only.
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.auth_config?.enable_sms_verification ?? true}
                        onCheckedChange={(checked) => updateSetting('auth_config', {
                          ...localSettings.auth_config,
                          enable_sms_verification: checked
                        })}
                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700 border-2 border-transparent data-[state=checked]:border-primary/20 hover:scale-105 transition-all duration-300 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable SMS Forwarding (Admin)</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive daily summaries and critical alerts via SMS.
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.sms_enabled || false}
                      onCheckedChange={(checked) => updateSetting('sms_enabled', checked)}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700 border-2 border-transparent data-[state=checked]:border-primary/20 hover:scale-105 transition-all duration-300 shadow-sm"
                    />
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Recipient Phone Number</Label>
                      <Input
                        placeholder="+216 12 345 678"
                        value={localSettings.sms_phone || ''}
                        onChange={(e) => updateSetting('sms_phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SMS Provider API Key (Optional)</Label>
                      <Input
                        type="password"
                        placeholder="Enter API Key"
                        value={localSettings.sms_api_key || ''}
                        onChange={(e) => updateSetting('sms_api_key', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">If left empty, SMS logs will be simulated in the backend console.</p>
                    </div>
                  </div>
                </CardContent>

                {/* Owner Notifications */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Owner Alerts
                  </h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-base">New Order Alerts</Label>
                        <p className="text-sm text-muted-foreground">Receive notification when a new order is placed.</p>
                      </div>
                      <Switch
                        checked={localSettings.notify_new_order !== false}
                        onCheckedChange={(checked) => updateSetting('notify_new_order', checked)}
                        className="data-[state=checked]:bg-primary shadow-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-base">Low Stock Alerts</Label>
                        <p className="text-sm text-muted-foreground">Notify when product stock falls below threshold.</p>
                      </div>
                      <Switch
                        checked={localSettings.notify_low_stock !== false}
                        onCheckedChange={(checked) => updateSetting('notify_low_stock', checked)}
                        className="data-[state=checked]:bg-primary shadow-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="text-base">Daily Summary</Label>
                        <p className="text-sm text-muted-foreground">Receive end-of-day sales report.</p>
                      </div>
                      <Switch
                        checked={localSettings.notify_daily_summary || false}
                        onCheckedChange={(checked) => updateSetting('notify_daily_summary', checked)}
                        className="data-[state=checked]:bg-primary shadow-sm"
                      />
                    </div>
                  </div>
                </div>

              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-primary" />
                    ThÃ¨me Visuel & Neon
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label>Neon Primaire (Cyan default)</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={hslStringToHex(localSettings.theme_primary || '185 100% 50%')}
                          onChange={(e) => updateSetting('theme_primary', hexToHSLString(e.target.value))}
                          className="w-12 h-12 p-1 bg-transparent border-none"
                        />
                        <div className="flex-1 text-xs text-muted-foreground font-mono">
                          {localSettings.theme_primary}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">AppliquÃ© aux boutons principaux et effets Cyan.</p>
                    </div>

                    <div className="space-y-3">
                      <Label>Neon Secondaire (Magenta default)</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={hslStringToHex(localSettings.theme_secondary || '320 100% 60%')}
                          onChange={(e) => updateSetting('theme_secondary', hexToHSLString(e.target.value))}
                          className="w-12 h-12 p-1 bg-transparent border-none"
                        />
                        <div className="flex-1 text-xs text-muted-foreground font-mono">
                          {localSettings.theme_secondary}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">AppliquÃ© aux alertes et effets Magenta.</p>
                    </div>

                    <div className="space-y-3">
                      <Label>Neon Accent (Purple default)</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={hslStringToHex(localSettings.theme_accent || '270 100% 65%')}
                          onChange={(e) => updateSetting('theme_accent', hexToHSLString(e.target.value))}
                          className="w-12 h-12 p-1 bg-transparent border-none"
                        />
                        <div className="flex-1 text-xs text-muted-foreground font-mono">
                          {localSettings.theme_accent}
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">AppliquÃ© aux sÃ©lections et effets Purple.</p>
                    </div>
                  </div>

                  <div className="mt-8 p-4 rounded-xl border border-dashed border-primary/30 flex items-center justify-center gap-8 bg-black/20">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-full glass-card neon-cyan-glow flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary neon-icon" />
                      </div>
                      <span className="text-xs">Primaire</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-full glass-card neon-magenta-glow flex items-center justify-center">
                        <Star className="w-6 h-6 text-secondary neon-icon" />
                      </div>
                      <span className="text-xs">Secondaire</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-full glass-card neon-purple-glow flex items-center justify-center">
                        <Gift className="w-6 h-6 text-accent neon-icon" />
                      </div>
                      <span className="text-xs">Accent</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    {t('settings.notifications.title') || "Notifications & Alerts"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Daily Summary */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold">Daily Summary Report</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a daily summary of sales and sessions via SMS/Email.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="daily-summary-time" className="whitespace-nowrap">Send at:</Label>
                      <Input
                        id="daily-summary-time"
                        type="time"
                        value={localSettings.daily_summary_time}
                        onChange={(e) => updateSetting('daily_summary_time', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </div>

                  {/* SMS Settings (Existing, moved here or referenced) */}
                  <div className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">Enable SMS alerts for critical events.</p>
                      </div>
                      <Switch
                        checked={localSettings.sms_enabled}
                        onCheckedChange={(checked) => updateSetting('sms_enabled', checked)}
                      />
                    </div>
                    {localSettings.sms_enabled && (
                      <div className="grid gap-4 ps-4 border-s-2 border-primary/20">
                        <div className="grid gap-2">
                          <Label>Owner Phone Number</Label>
                          <Input
                            value={localSettings.sms_phone}
                            onChange={(e) => updateSetting('sms_phone', e.target.value)}
                            placeholder="+216 00 000 000"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>API Key (Optional)</Label>
                          <Input
                            type="password"
                            value={localSettings.sms_api_key}
                            onChange={(e) => updateSetting('sms_api_key', e.target.value)}
                            placeholder="****************"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Data Management & Backup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Backup Section */}

                  {/* CSV Export Section */}
                  <div className="p-4 border rounded-lg bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800 transition-all hover:bg-green-50 dark:hover:bg-green-900/20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                          <Table className="w-4 h-4" />
                          Export Data (CSV)
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Download specific datasets for Excel/Sheets analysis.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleExportCSV('sales')} className="hover:bg-green-100 dark:hover:bg-green-900 border-green-200 text-green-700">
                          Sales
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleExportCSV('clients')} className="hover:bg-green-100 dark:hover:bg-green-900 border-green-200 text-green-700">
                          Clients
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleExportCSV('products')} className="hover:bg-green-100 dark:hover:bg-green-900 border-green-200 text-green-700">
                          Products
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          <Copy className="w-4 h-4" />
                          Export Full Backup
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Download a complete JSON snapshot of your store (Clients, Sales, Products, etc.).
                        </p>
                      </div>
                      <Button variant="outline" onClick={handleFullBackup} className="w-full sm:w-auto hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                        <Copy className="w-4 h-4 me-2" />
                        Download JSON
                      </Button>
                    </div>
                  </div>

                  {/* Restore Section */}
                  <div className="p-4 border rounded-lg bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800 transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Restore from Backup
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Upload a previously exported JSON file to restore data. <span className="font-bold">Existing IDs will be updated.</span>
                        </p>
                      </div>
                      <div className="relative w-full sm:w-auto">
                        <Button variant="outline" disabled={isRestoring} className="w-full sm:w-auto pointer-events-none hover:bg-amber-100 dark:hover:bg-amber-900 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                          {isRestoring ? <RefreshCw className="w-4 h-4 me-2 animate-spin" /> : <Database className="w-4 h-4 me-2" />}
                          {isRestoring ? "Restoring..." : "Select Backup File"}
                        </Button>
                        <Input
                          type="file"
                          accept=".json"
                          onChange={handleRestoreBackup}
                          disabled={isRestoring}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cleanup Section */}
                  <div className="p-4 border rounded-lg bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-red-900 dark:text-red-100">Database Cleanup</h4>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-full">CAUTION</span>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Permanently delete old history (Sales, Sessions) to save space.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {[90, 180, 365].map(days => (
                        <Button
                          key={days}
                          variant="destructive"
                          size="sm"
                          className="opacity-90 hover:opacity-100"
                          onClick={() => {
                            if (confirm(`Delete data older than ${days} days?`)) {
                              fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://bck.gamestorezarzis.com.tn'}/api/admin/cleanup`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ days_to_keep: days, tables: ["sales", "gaming_sessions", "expenses"] })
                              }).then(r => r.ok ? toast({ title: t("settings.toast.done", "Done") }) : toast({ title: t("settings.toast.error", "Error"), variant: "destructive" }));
                            }
                          }}
                        >
                          Clean &gt; {days} Days
                        </Button>
                      ))}
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute >
  );
};

export default StoreSettings;
