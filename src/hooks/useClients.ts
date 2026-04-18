import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Client } from "@/types";

export const useClients = () => {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Client[];
    },
  });
};

export const useClient = (id: string | null) => {
  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Client;
    },
    enabled: !!id,
  });
};

export const useClientByPhone = (phone: string) => {
  return useQuery({
    queryKey: ["client-phone", phone],
    queryFn: async () => {
      if (!phone || phone.length < 8) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("phone", phone)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as Client | null;
    },
    enabled: phone.length >= 8,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: { name: string; phone: string; email?: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .insert(client)
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: Partial<Client> & { id: string }) => {
      const { error } = await supabase
        .from("clients")
        .update(client)
        .eq("id", client.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};