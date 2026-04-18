import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface SessionConsumption {
    id: string;
    session_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    created_at: string;
    product?: {
        name: string;
        name_fr: string;
        price: number;
        points_earned: number;
    };
}

export const useSessionConsumptions = (sessionId: string | null) => {
    return useQuery({
        queryKey: ["session-consumptions", sessionId],
        queryFn: async () => {
            if (!sessionId) return [];

            const { data, error } = await supabase
                .from("session_consumptions")
                .select(`
          *,
          product:products(name, name_fr, price, points_earned)
        `)
                .eq("session_id", sessionId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            return data as SessionConsumption[];
        },
        enabled: !!sessionId,
    });
};

export const useAddSessionConsumption = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            session_id,
            product_id,
            quantity,
            unit_price
        }: {
            session_id: string;
            product_id: string;
            quantity: number;
            unit_price: number;
        }) => {
            const { data, error } = await supabase
                .from("session_consumptions")
                .insert({
                    session_id,
                    product_id,
                    quantity,
                    unit_price
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["session-consumptions", variables.session_id] });
            // Also invalidate active sessions in case we display total somewhere? 
            // Currently session total in DB doesn't include consumptions until end.
        },
    });
};

export const useDeleteSessionConsumption = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("session_consumptions")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["session-consumptions"] });
        },
    });
};

export const useUpdateSessionConsumption = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
            const { data, error } = await supabase
                .from("session_consumptions")
                .update({ quantity })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["session-consumptions"] });
        },
    });
};
