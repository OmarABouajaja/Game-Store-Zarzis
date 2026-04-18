import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getBusinessDayBoundsStr } from "@/hooks/useTunisianTime";

export interface DailyStats {
  total_revenue: number;
  gaming_revenue: number;
  sales_revenue: number;
  service_revenue: number;
  total_sessions: number;
  total_sales: number;
  total_services: number;
}
export const useTodayStats = () => {
  return useQuery({
    queryKey: ["today-stats"],
    queryFn: async () => {
      const startOfDay = await getBusinessDayBoundsStr();

      const [sessionsRes, salesRes, servicesRes, countRes] = await Promise.all([
        supabase
          .from("gaming_sessions")
          .select("total_amount, status")
          .gte("created_at", startOfDay)
          .eq("status", "completed"),
        supabase
          .from("sales")
          .select("total_amount")
          .gte("created_at", startOfDay),
        supabase
          .from("service_requests")
          .select("final_cost, status")
          .gte("created_at", startOfDay)
          .eq("status", "completed"),
        supabase
          .from("gaming_sessions")
          .select("id", { count: "exact" })
          .gte("created_at", startOfDay)
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (salesRes.error) throw salesRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (countRes.error) throw countRes.error;

      const sessions = sessionsRes.data;
      const sales = salesRes.data;
      const services = servicesRes.data;
      const sessionCount = countRes.count;

      const gamingRevenue = sessions?.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0) || 0;
      const salesRevenue = sales?.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0) || 0;
      const serviceRevenue = services?.reduce((sum, s) => sum + (Number(s.final_cost) || 0), 0) || 0;

      return {
        total_revenue: gamingRevenue + salesRevenue + serviceRevenue,
        gaming_revenue: gamingRevenue,
        sales_revenue: salesRevenue,
        service_revenue: serviceRevenue,
        total_sessions: sessionCount || 0,
        total_sales: sales?.length || 0,
        total_services: services?.length || 0,
      } as DailyStats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useMonthlyStats = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  return useQuery({
    queryKey: ["monthly-stats", startOfMonth],
    queryFn: async () => {
      const [sessionsRes, salesRes, servicesRes] = await Promise.all([
        supabase
          .from("gaming_sessions")
          .select("total_amount")
          .gte("created_at", startOfMonth)
          .eq("status", "completed"),
        supabase
          .from("sales")
          .select("total_amount")
          .gte("created_at", startOfMonth),
        supabase
          .from("service_requests")
          .select("final_cost")
          .gte("created_at", startOfMonth)
          .eq("status", "completed")
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      if (salesRes.error) throw salesRes.error;
      if (servicesRes.error) throw servicesRes.error;

      const sessions = sessionsRes.data;
      const sales = salesRes.data;
      const services = servicesRes.data;

      const gamingRevenue = sessions?.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0) || 0;
      const salesRevenue = sales?.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0) || 0;
      const serviceRevenue = services?.reduce((sum, s) => sum + (Number(s.final_cost) || 0), 0) || 0;

      return {
        total_revenue: gamingRevenue + salesRevenue + serviceRevenue,
        gaming_revenue: gamingRevenue,
        sales_revenue: salesRevenue,
        service_revenue: serviceRevenue,
        total_sessions: sessions?.length || 0,
        total_sales: sales?.length || 0,
        total_services: services?.length || 0,
      } as DailyStats;
    },
  });
};