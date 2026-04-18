import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { supabase } from "@/lib/supabase";
import { useStoreSettings } from "@/hooks/useStoreSettings";

// Allow testing time from console (dev mode only)
declare global {
  interface Window {
    __TEST_TUNISIAN_TIME__?: Date;
    __TEST_TIME_CHANGE__?: () => void;
  }
}

const isDev = import.meta.env.DEV;

interface TimeStatus {
  isOpen: boolean;
  hoursUntilOpen: number;
  minutesUntilOpen: number;
  currentTime: string;
  currentHour: number;
}

const TUNISIAN_TIMEZONE = "Africa/Tunis";
const OPENING_HOUR = 9;
const CLOSING_HOUR = 1; // 1:00 AM (01:00)

/**
 * Custom hook to get Tunisian time and store status
 * Test time override (window.__TEST_TUNISIAN_TIME__) is only available in dev mode
 */
// Helper function to calculate status (defined outside hook to avoid initialization issues)
const calculateStatus = (settings?: any): TimeStatus => {
    try {
      // Use test time only in dev mode, otherwise use current time
      const now = (isDev && window.__TEST_TUNISIAN_TIME__) ? window.__TEST_TUNISIAN_TIME__ : new Date();
      
      // Get current time in Tunisian timezone
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: TUNISIAN_TIMEZONE,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      });
      
      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: TUNISIAN_TIMEZONE,
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
      });

      const dayFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: TUNISIAN_TIMEZONE,
        weekday: "long"
      });

      const parts = formatter.formatToParts(now);
      const hourPart = parts.find(part => part.type === 'hour');
      const minutePart = parts.find(part => part.type === 'minute');
      
      const tunisianHour = hourPart ? parseInt(hourPart.value, 10) : 0;
      const tunisianMinute = minutePart ? parseInt(minutePart.value, 10) : 0;
      const currentTime = timeFormatter.format(now);
      
      // If we are before 8 AM, we are technically still in "yesterday's" business day
      const logicalDate = new Date(now);
      if (tunisianHour < 8) {
        logicalDate.setDate(logicalDate.getDate() - 1);
      }
      const currentDay = dayFormatter.format(logicalDate).toLowerCase();
      
      let openingHour = OPENING_HOUR;
      let closingHour = CLOSING_HOUR;
      let isOpen = false;
      let hoursUntilOpen = 0;
      let minutesUntilOpen = 0;

      if (settings && (settings.weekly_schedule || settings.opening_hours)) {
         const daySchedule = settings.weekly_schedule ? settings.weekly_schedule[currentDay] : null;
         
         if (daySchedule && daySchedule.isOpen === false) {
             return { isOpen: false, hoursUntilOpen: 0, minutesUntilOpen: 0, currentTime, currentHour: tunisianHour };
         }
         
         if (daySchedule && daySchedule.open && daySchedule.close) {
             openingHour = parseInt(daySchedule.open.split(':')[0], 10);
             closingHour = parseInt(daySchedule.close.split(':')[0], 10);
         } else if (settings.opening_hours && settings.opening_hours.open && settings.opening_hours.close) {
             openingHour = parseInt(settings.opening_hours.open.split(':')[0], 10);
             closingHour = parseInt(settings.opening_hours.close.split(':')[0], 10);
         }
         
         let openingMinutes = openingHour * 60;
         if (daySchedule && daySchedule.open) {
             openingMinutes += parseInt(daySchedule.open.split(':')[1], 10) || 0;
         } else if (settings.opening_hours && settings.opening_hours.open) {
             openingMinutes += parseInt(settings.opening_hours.open.split(':')[1], 10) || 0;
         }
         
         const currentMinutes = tunisianHour * 60 + tunisianMinute;
         
         if (closingHour <= openingHour) {
             isOpen = tunisianHour >= openingHour || tunisianHour < closingHour;
         } else {
             isOpen = tunisianHour >= openingHour && tunisianHour < closingHour;
         }

         if (!isOpen) {
             const totalMinutesUntil = openingMinutes > currentMinutes ? (openingMinutes - currentMinutes) : (24 * 60 - currentMinutes + openingMinutes);
             hoursUntilOpen = Math.floor(totalMinutesUntil / 60);
             minutesUntilOpen = totalMinutesUntil % 60;
         }
      } else {
         isOpen = tunisianHour >= OPENING_HOUR || tunisianHour < CLOSING_HOUR;
         if (!isOpen) {
            const openingMinutes = OPENING_HOUR * 60;
            const currentMinutes = tunisianHour * 60 + tunisianMinute;
            const totalMinutesUntil = openingMinutes > currentMinutes ? (openingMinutes - currentMinutes) : (24 * 60 - currentMinutes + openingMinutes);
            hoursUntilOpen = Math.floor(totalMinutesUntil / 60);
            minutesUntilOpen = totalMinutesUntil % 60;
         }
      }
      
      return {
        isOpen,
        hoursUntilOpen,
        minutesUntilOpen,
        currentTime,
        currentHour: tunisianHour,
      };
    } catch (error) {
      logger.error("Error calculating Tunisian time:", error);
      // Fallback to current time
      const now = new Date();
      return {
        isOpen: now.getHours() >= OPENING_HOUR,
        hoursUntilOpen: 0,
        minutesUntilOpen: 0,
        currentTime: now.toLocaleTimeString(),
        currentHour: now.getHours(),
      };
    }
  };

export const useTunisianTime = (): TimeStatus => {
  const { data: storeSettingsData } = useStoreSettings();

  const [status, setStatus] = useState<TimeStatus>(() => {
    return calculateStatus(storeSettingsData);
  });

  useEffect(() => {
    const updateStatus = () => {
      setStatus(calculateStatus(storeSettingsData));
    };

    // Initial check
    updateStatus();

    // Listen for test time changes (dev mode only)
    let handleTestTimeChange: (() => void) | null = null;
    if (isDev) {
      handleTestTimeChange = () => updateStatus();
      window.__TEST_TIME_CHANGE__ = handleTestTimeChange;
      window.addEventListener('testTimeChange', handleTestTimeChange);
    }

    // Update every minute (only if not using test time in dev mode)
    // Use longer interval to reduce re-renders - only update when status might change
    const interval = (isDev && window.__TEST_TUNISIAN_TIME__) 
      ? null 
      : setInterval(updateStatus, 60000);
    
    return () => {
      if (interval) clearInterval(interval);
      if (isDev && handleTestTimeChange) {
        window.removeEventListener('testTimeChange', handleTestTimeChange);
        delete window.__TEST_TIME_CHANGE__;
      }
    };
  }, [storeSettingsData]); // Depend on storeSettingsData


  return status;
};

/**
 * Get today's date string (YYYY-MM-DD) in Tunisia timezone.
 * Use this for "today" queries to avoid UTC date mismatches after midnight.
 */
export const getTunisianToday = (): string => {
  try {
    const now = new Date();
    // en-CA locale returns YYYY-MM-DD format
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Tunis",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return new Date().toISOString().split("T")[0];
  }
};

/**
 * Returns the dynamic "business day start" based on the actual weekly_schedule
 * configuration in Supabase. It uses the Tunisian timezone to determine the boundary.
 */
export const getBusinessDayBoundsStr = async (): Promise<string> => {
  try {
    const { data: scheduleRes } = await supabase.from('store_settings').select('value').eq('key', 'weekly_schedule').maybeSingle();
    const { data: hoursRes } = await supabase.from('store_settings').select('value').eq('key', 'opening_hours').maybeSingle();
    
    let scheduleDict: any = {};
    if (scheduleRes && scheduleRes.value) scheduleDict = typeof scheduleRes.value === 'string' ? JSON.parse(scheduleRes.value) : scheduleRes.value;
    
    let openingHoursDict: any = {};
    if (hoursRes && hoursRes.value) openingHoursDict = typeof hoursRes.value === 'string' ? JSON.parse(hoursRes.value) : hoursRes.value;

    const now = new Date();
    const formatOpts = { timeZone: 'Africa/Tunis', hour12: false };
    const currentDayStr = new Intl.DateTimeFormat('en-US', { ...formatOpts, weekday: 'long' }).format(now).toLowerCase();
    
    // Get YYYY-MM-DD in Tunisian timezone
    const formatTunisianDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Tunis",
        year: "numeric", month: "2-digit", day: "2-digit"
      }).format(date);
    };

    const tunisianDateStr = formatTunisianDate(now);
    
    const currentHourStr = new Intl.DateTimeFormat('en-US', { ...formatOpts, hour: 'numeric' }).format(now);
    const currentHour = parseInt(currentHourStr, 10);
    
    const daySchedule = scheduleDict[currentDayStr];
    let openHour = 8; // Global fallback
    if (openingHoursDict && openingHoursDict.open) {
      openHour = parseInt(openingHoursDict.open.split(':')[0], 10);
    }
    
    if (daySchedule && daySchedule.open) {
      openHour = parseInt(daySchedule.open.split(':')[0], 10);
    }
    
    // If the current time is strictly before the set opening hour, we belong to yesterday's business shift.
    if (currentHour < openHour) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDateStr = formatTunisianDate(yesterday);
      
      const ysDayStr = new Intl.DateTimeFormat('en-US', { ...formatOpts, weekday: 'long' }).format(yesterday).toLowerCase();
      const ysSchedule = scheduleDict[ysDayStr];
      let ysOpenHour = 8;
      if (openingHoursDict && openingHoursDict.open) {
        ysOpenHour = parseInt(openingHoursDict.open.split(':')[0], 10);
      }
      
      if (ysSchedule && ysSchedule.open) {
        ysOpenHour = parseInt(ysSchedule.open.split(':')[0], 10);
      }
      return `${yesterdayDateStr}T${ysOpenHour.toString().padStart(2, '0')}:00:00`;
    }
    
    return `${tunisianDateStr}T${openHour.toString().padStart(2, '0')}:00:00`;
  } catch(e) {
    logger.error("Failed to fetch business day bounds", e);
    const tunisianDateStr = getTunisianToday();
    // Default fallback to 06:00 AM logic if DB fetch fails
    return `${tunisianDateStr}T06:00:00`; 
  }
};
