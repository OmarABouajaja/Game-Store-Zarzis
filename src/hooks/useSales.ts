import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getBusinessDayBoundsStr } from "@/hooks/useTunisianTime";

export interface Sale {
  id: string;
  client_id: string | null;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: string;
  points_used: number;
  points_earned: number;
  staff_id: string;
  notes: string | null;
  created_at: string;
}

export const useTodaySales = () => {
  return useQuery({
    queryKey: ["today-sales"],
    queryFn: async () => {
      const startOfDay = await getBusinessDayBoundsStr();
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          product:products(*),
          client:clients(*)
        `)
        .gte("created_at", startOfDay)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sale: Omit<Sale, "id" | "created_at">) => {
      // Create the sale
      const { data: newSale, error: saleError } = await supabase
        .from("sales")
        .insert(sale)
        .select()
        .single();

      if (saleError) throw saleError;

      // Atomically decrement stock using RPC, with fallback
      try {
        const { error: rpcError } = await supabase.rpc('decrement_stock', {
          p_product_id: sale.product_id,
          p_quantity: sale.quantity
        });

        if (rpcError) {
          // Fallback: read-then-update (less safe but functional)
          console.warn('RPC decrement_stock not available, using fallback:', rpcError.message);
          const { data: product } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", sale.product_id)
            .single();

          if (product) {
            await supabase
              .from("products")
              .update({ stock_quantity: Math.max(0, product.stock_quantity - sale.quantity) })
              .eq("id", sale.product_id);
          }
        }
      } catch (stockErr) {
        console.warn('Stock update failed (sale still recorded):', stockErr);
      }

      return newSale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};