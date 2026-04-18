import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PointsTransaction } from "@/types";

export const usePointsTransactions = (clientId?: string) => {
  return useQuery({
    queryKey: ["points-transactions", clientId],
    queryFn: async () => {
      let query = supabase
        .from("points_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PointsTransaction[];
    },
  });
};

export const useCreatePointsTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: {
      client_id: string;
      transaction_type: "earned" | "spent" | "refund" | "bonus" | "adjustment";
      amount: number;
      description?: string;
      reference_type?: string;
      reference_id?: string;
      staff_id?: string;
    }) => {
      const { data, error } = await (supabase.rpc as any)('process_loyalty_transaction', {
        p_client_id: transaction.client_id,
        p_amount: transaction.amount,
        p_transaction_type: transaction.transaction_type,
        p_description: transaction.description || null,
        p_reference_type: transaction.reference_type || null,
        p_reference_id: transaction.reference_id || null,
        p_staff_id: transaction.staff_id || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

export const useRedeemPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      client_id,
      points_to_redeem,
      description,
      staff_id,
    }: {
      client_id: string;
      points_to_redeem: number;
      description: string;
      staff_id: string;
    }) => {
      const { data, error } = await (supabase.rpc as any)('process_loyalty_transaction', {
        p_client_id: client_id,
        p_amount: -Math.abs(points_to_redeem),
        p_transaction_type: "spent",
        p_description: description,
        p_reference_type: null,
        p_reference_id: null,
        p_staff_id: staff_id || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["points-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};
