import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Order, OrderFormData } from "@/types";

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (orderData: OrderFormData) => {
            // Insert Order with all client fields directly
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    client_name: orderData.client_name,
                    client_phone: orderData.client_phone,
                    client_email: orderData.client_email || null,
                    delivery_address: orderData.delivery_address || null,
                    subtotal: orderData.subtotal,
                    delivery_cost: orderData.delivery_cost,
                    delivery_method: orderData.delivery_method,
                    total_amount: orderData.total_amount,
                    items: orderData.items, // JSONB column
                    payment_method: orderData.payment_method || 'cash',
                    payment_reference: orderData.payment_reference || null,
                    payment_status: 'pending',
                    status: 'pending',
                    notes: orderData.notes || null
                })
                .select()
                .single();

            if (orderError) throw orderError;
            return order;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
};

export const useOrders = () => {
    return useQuery({
        queryKey: ["orders"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Order[];
        },
    });
};

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error } = await supabase
                .from("orders")
                .update({ status })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
};
