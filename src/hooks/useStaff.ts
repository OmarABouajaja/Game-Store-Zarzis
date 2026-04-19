import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface StaffMember {
  id: string;
  email: string;
  role: "owner" | "worker";
  full_name?: string;
  phone?: string;
  created_at: string;
  last_sign_in?: string;
  last_active_at?: string;
  is_invited?: boolean;
  invitation_sent_at?: string;
}

export function useStaffMembers() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["staff"],
    queryFn: async (): Promise<StaffMember[]> => {
      // Bulk fetch roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;
      if (!userRoles || userRoles.length === 0) return [];

      // Bulk fetch profiles
      const userIds = userRoles.map((r) => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at, is_active, phone")
        .in("id", userIds);

      if (profilesError) console.error("Error fetching profiles:", profilesError);
      
      const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return userRoles.map((role) => {
        const profileData = profilesMap.get(role.user_id);
        const userEmail = profileData?.email || (role.user_id === user?.id ? user.email : undefined) || "Email non disponible";
        const userFullName = profileData?.full_name || (role.user_id === user?.id ? user.user_metadata?.full_name : null) || "Nom non disponible";

        return {
          id: role.user_id,
          email: userEmail,
          role: role.role as "owner" | "worker",
          full_name: userFullName,
          phone: profileData?.phone || undefined,
          created_at: profileData?.created_at || role.created_at || new Date().toISOString(),
          is_invited: (!profileData || !profileData.full_name) && role.user_id !== user?.id,
        };
      });
    },
  });
}

export function useUpdateStaffRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}
