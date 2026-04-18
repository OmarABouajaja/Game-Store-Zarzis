import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const useAllActiveShifts = () => {
  return useQuery({
    queryKey: ["all-active-shifts"],
    queryFn: async () => {
      // 1. Fetch active shifts
      const { data: shifts, error: shiftsError } = await supabase
        .from("staff_shifts")
        .select("*")
        .is("check_out", null)
        .order("check_in", { ascending: false });

      if (shiftsError) throw shiftsError;

      if (!shifts || shifts.length === 0) return [];

      // 2. Fetch profiles for these shifts
      const staffIds = Array.from(new Set(shifts.map(s => s.staff_id)));

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", staffIds);

      if (profilesError) throw profilesError;

      // 3. Attach profile to shift
      return shifts.map(shift => {
        const profile = profiles?.find(p => p.id === shift.staff_id);
        return {
          ...shift,
          profile: profile || null
        };
      });
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};