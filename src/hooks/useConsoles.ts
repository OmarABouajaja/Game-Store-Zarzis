import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { Console } from "@/types";

export const useConsoles = () => {
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("consoles-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "consoles",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["consoles"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["consoles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consoles")
        .select("*")
        .order("station_number");

      if (error) throw error;
      return data as Console[];
    },
  });
};

export const useUpdateConsole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (console: Partial<Console> & { id: string }) => {
      const { error } = await supabase
        .from("consoles")
        .update(console)
        .eq("id", console.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consoles"] });
    },
  });
};

export const useCreateConsole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (console: Omit<Console, 'id' | 'current_session_id'>) => {
      const { data, error } = await supabase
        .from("consoles")
        .insert([console])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consoles"] });
    },
  });
};

export const useDeleteConsole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("consoles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consoles"] });
    },
  });
};