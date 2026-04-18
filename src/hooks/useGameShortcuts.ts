import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { GameShortcut } from "@/types";

export const useGameShortcuts = () => {
    return useQuery({
        queryKey: ["game-shortcuts"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("game_shortcuts")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) throw error;
            return data as GameShortcut[];
        },
    });
};

export const useCreateGameShortcut = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (shortcut: Omit<GameShortcut, "id" | "created_at" | "updated_at">) => {
            const { data, error } = await supabase
                .from("game_shortcuts")
                .insert(shortcut)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["game-shortcuts"] });
        },
    });
};

export const useUpdateGameShortcut = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<GameShortcut> & { id: string }) => {
            const { data, error } = await supabase
                .from("game_shortcuts")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["game-shortcuts"] });
        },
    });
};

export const useDeleteGameShortcut = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("game_shortcuts")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["game-shortcuts"] });
        },
    });
};
