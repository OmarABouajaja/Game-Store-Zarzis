import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ServiceRequest } from "@/types";

export const useServiceRequests = (status?: string) => {
  return useQuery({
    queryKey: ["service-requests", status],
    queryFn: async () => {
      const query = supabase
        .from("service_requests")
        .select(`
          *,
          service:services_catalog(*)
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query.eq("status", status);
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), 5000)
      );

      const result = await Promise.race([query, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) {
        console.error("Error fetching service requests:", error);
        throw error;
      }
      return data;
    },
  });
};

export const useTodayServiceRequests = () => {
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["today-service-requests", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select(`
          *,
          service:services_catalog(*)
        `)
        .gte("created_at", `${today}T00:00:00`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateServiceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: Omit<ServiceRequest, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("service_requests")
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["today-service-requests"] });
    },
  });
};

export const useUpdateServiceRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: Partial<ServiceRequest> & { id: string }) => {
      const { error } = await supabase
        .from("service_requests")
        .update(request)
        .eq("id", request.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["today-service-requests"] });
    },
  });
};