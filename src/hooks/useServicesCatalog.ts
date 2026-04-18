import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ServiceCatalog } from "@/types";

export const useServicesCatalog = (activeOnly = true) => {
  return useQuery({
    queryKey: ["services-catalog", activeOnly],
    queryFn: async () => {
      const query = supabase
        .from("services_catalog")
        .select("*")
        .order("sort_order");

      if (activeOnly) {
        query.eq("is_active", true);
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), 5000)
      );

      const result = await Promise.race([query, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) {
        console.error("Error fetching services catalog:", error);
        throw error;
      }
      return data as ServiceCatalog[];
    },
  });
};

export const useUpdateServiceCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: Partial<ServiceCatalog> & { id: string }) => {
      const { error } = await supabase
        .from("services_catalog")
        .update(service)
        .eq("id", service.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services-catalog"] });
    },
  });
};

export const useCreateServiceCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: Partial<ServiceCatalog>) => {
      const { data, error } = await supabase
        .from("services_catalog")
        .insert([service])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services-catalog"] });
    },
  });
};

export const useDeleteServiceCatalog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from("services_catalog")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services-catalog"] });
    },
  });
};