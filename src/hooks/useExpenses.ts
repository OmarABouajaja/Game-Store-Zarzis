import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, TABLES } from "@/lib/supabase";
import { Expense } from "@/types";

export const useExpenses = () => {
    return useQuery({
        queryKey: ["expenses"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from(TABLES.EXPENSES)
                .select("*")
                .order("date", { ascending: false });

            if (error) throw error;
            return data as Expense[];
        },
    });
};

export const useUpdateExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (expense: Partial<Expense> & { id: string }) => {
            const { error } = await supabase
                .from(TABLES.EXPENSES)
                .update(expense)
                .eq("id", expense.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
        },
    });
};

export const useCreateExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (expense: Omit<Expense, "id" | "created_at" | "updated_at">) => {
            const { data, error } = await supabase
                .from(TABLES.EXPENSES)
                .insert([expense])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
        },
    });
};

export const useDeleteExpense = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from(TABLES.EXPENSES)
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
        },
    });
};
