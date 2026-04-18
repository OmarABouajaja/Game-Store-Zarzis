import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Pricing {
  id: string;
  name: string;
  console_type: string;
  price_type: string;
  price: number;
  game_duration_minutes: number | null;
  extra_time_price: number | null;
  points_earned: number;
  is_active: boolean;
  sort_order: number;
}

export const usePricing = () => {
  return useQuery({
    queryKey: ["pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      return data as Pricing[];
    },
  });
};

export const useUpdatePricing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pricing: Partial<Pricing> & { id: string }) => {
      const { error } = await supabase
        .from("pricing")
        .update(pricing)
        .eq("id", pricing.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
  });
};

export const useCreatePricing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pricing: Omit<Pricing, "id">) => {
      const { data, error } = await supabase
        .from("pricing")
        .insert([pricing])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
  });
};

export const useDeletePricing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pricing")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
  });
};