import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Plus, Edit, Trash2, Crown, User, Mail, Shield,
  Clock, AlertTriangle, CheckCircle, Loader2, Phone,
  Zap, ShieldCheck, Send, RefreshCw
} from "lucide-react";
import { UserPlus, Key } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createStaffMember, deleteStaffMember } from "@/services/adminService";
import { useLanguage } from "@/contexts/LanguageContext";

interface StaffMember {
  id: string;
  email: string;
  role: "owner" | "worker";
  full_name?: string;
  phone?: string;
  created_at: string;
  last_sign_in?: string;
  last_active_at?: string; // 🟢 For online/offline status
  is_invited?: boolean;
  invitation_sent_at?: string;
}

const StaffManagement = () => {
  const { user, isOwner, session, refreshRole } = useAuth();
  const { t, language } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffMember | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "worker" as "owner" | "worker"
  });
  const [skipEmail, setSkipEmail] = useState(false);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Fetch staff members
  const fetchStaffMembers = async () => {
    try {
      setIsLoading(true);
      // Bulk fetch roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;
      if (!userRoles || userRoles.length === 0) {
        setStaffMembers([]);
        return;
      }

      // Bulk fetch profiles
      const userIds = userRoles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at, is_active, phone")
        .in("id", userIds);

      if (profilesError) console.error("Error fetching profiles:", profilesError);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const staffData: StaffMember[] = userRoles.map(role => {
        const profileData = profilesMap.get(role.user_id);

        // Priority logic for Email: Context User > Profile Table
        const userEmail = (role.user_id === user?.id ? user.email : profileData?.email) || "Email non disponible";

        // Priority logic for Name: Profile Table > Context User Metadata > Fallback
        const userFullName = profileData?.full_name ||
          (role.user_id === user?.id ? user.user_metadata?.full_name : null) ||
          "Nom non disponible";

        return {
          id: role.user_id,
          email: userEmail,
          role: role.role as "owner" | "worker",
          full_name: userFullName,
          phone: profileData?.phone,
          created_at: profileData?.created_at || role.created_at || new Date().toISOString(),
          is_invited: (!profileData || !profileData.full_name) && role.user_id !== user?.id
        };
      });

      setStaffMembers(staffData);
    } catch (error: unknown) {
      console.error("Error fetching staff:", error);
      const message = error instanceof Error ? error.message : "Impossible de charger la liste du personnel.";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  // Only owners can access this page
  if (!isOwner) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{t("accessDenied.title")}</h2>
              <p className="text-muted-foreground">{t("accessDenied.message")}</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: formData.role })
          .eq("user_id", editingUser.id);

        if (error) throw error;

        // Optimistically update local state so stats refresh instantly
        setStaffMembers(prev =>
          prev.map(m =>
            m.id === editingUser.id ? { ...m, role: formData.role } : m
          )
        );

        // If editing the current user's own role, refresh AuthContext immediately
        if (editingUser.id === user?.id) {
          await refreshRole();
        }

        toast({
          title: t("staff.role_updated"),
          description: t("staff.role_updated_desc", { email: editingUser.email })
        });

        // Refresh the list from DB to be safe
        await fetchStaffMembers();

      } else {
        const tempPassword = generatePassword();
        const rawUrl = import.meta.env.VITE_BACKEND_URL || 'https://bck.gamestorezarzis.com.tn';
        const API_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
        const { user_id, email_sent: apiEmailSent } = await createStaffMember({
          email: formData.email,
          password: tempPassword,
          role: formData.role,
          full_name: formData.full_name || "Staff Member",
          phone: formData.phone,
          skip_email: skipEmail,
          lang: language
        }, session?.access_token || "") as { user_id: string; email_sent: boolean };

        // Copy password to clipboard
        try {
          await navigator.clipboard.writeText(tempPassword);
        } catch (err) {
          console.warn("Failed to copy to clipboard:", err);
        }

        toast({
          title: apiEmailSent ? t("staff.invitation_sent") : t("staff.account_created"),
          description: (
            <div className="space-y-2">
              <p>
                {apiEmailSent
                  ? t("staff.invitation_sent") + ` à ${formData.email}.`
                  : t("staff.account_created") + `. Utilisez le mot de passe ci-dessous.`}
              </p>
              <div className="bg-black/20 p-3 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">{t("staff.temp_password_label")}</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-black/30 px-2 py-1 rounded flex-1">{tempPassword}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tempPassword);
                      toast({ title: t("staff.copied"), description: t("staff.temp_password_label") });
                    }}
                    className="px-2 py-1 text-xs bg-primary/20 hover:bg-primary/30 rounded"
                  >
                    {t("staff.copy_button")}
                  </button>
                </div>
              </div>
            </div>

          ),
          duration: 15000,
        });

        // Refresh the list
        await fetchStaffMembers();
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({ email: "", full_name: "", phone: "", role: "worker" });


    } catch (error: unknown) {
      console.error("Staff management error:", error);
      const message = error instanceof Error ? error.message : "Une erreur s'est produite lors de la création du compte.";
      toast({
        title: "❌ Erreur",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canDeleteMember = (member: StaffMember) => {
    const isNotSelf = member.id !== user?.id;
    const isNotLastOwner = !(member.role === 'owner' && staffMembers.filter(m => m.role === 'owner').length <= 1);
    return isNotSelf && isNotLastOwner;
  };

  const handleDelete = async (userId: string) => {
    const member = staffMembers.find(m => m.id === userId);
    if (!member) return;

    // Prevent deleting yourself
    if (userId === user?.id) {
      toast({
        title: t("dashboard.to_process"),
        description: t("staff.error_delete_self"),
        variant: "destructive"
      });
      return;
    }

    // Prevent deleting the last owner
    const ownerCount = staffMembers.filter(m => m.role === 'owner').length;
    if (member.role === 'owner' && ownerCount <= 1) {
      toast({
        title: t("dashboard.to_process"),
        description: t("staff.error_last_owner"),
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm(t("staff.delete_confirm", { email: member.email }))) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Call backend API to fully delete from Auth + DB
      await deleteStaffMember(userId, session?.access_token || '');

      toast({
        title: t("staff.delete_success"),
        description: t("staff.delete_success_desc", { email: member.email })
      });

      // Refresh the list
      await fetchStaffMembers();

    } catch (error: unknown) {
      console.error("Delete staff error:", error);
      const message = error instanceof Error ? error.message : "Impossible de supprimer le membre du personnel.";
      toast({
        title: "❌ Erreur",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">{t("staff.title")}</h1>
              <p className="text-muted-foreground">
                {t("staff.subtitle")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const rawUrl = import.meta.env.VITE_BACKEND_URL || 'https://bck.gamestorezarzis.com.tn';
                    const API_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
                    const token = session?.access_token;

                    const res = await fetch(`${API_URL}/api/admin/sync-profiles`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });

                    if (!res.ok) throw new Error("Sync failed");
                    const data = await res.json();

                    toast({
                      title: t("staff.sync_success"),
                      description: `${data.synced_count} profils mis à jour.`
                    });
                    await fetchStaffMembers();
                  } catch (e) {
                    toast({ title: t("staff.sync_error"), description: t("staff.sync_error"), variant: "destructive" });
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                <RefreshCw className={`w-4 h-4 me-2 ${isLoading ? 'animate-spin' : ''}`} />
                {t("staff.sync_data")}
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingUser(null);
                    setFormData({ email: "", full_name: "", phone: "", role: "worker" });
                  }}>
                    <Plus className="w-4 h-4 me-2" />
                    Inviter du Personnel
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-[500px] p-0 overflow-hidden border-none bg-transparent">
                  <div className="relative p-6 sm:p-8 glass-card border-white/20 dark:border-white/10 overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/20 blur-[100px] rounded-full pointer-events-none" />

                    <DialogHeader className="relative mb-6">
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        {editingUser ? t("common.edit") : t("staff.add_button")}
                      </DialogTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {editingUser ? t("staff.role_updated_desc", { email: editingUser.email }) : t("staff.subtitle")}
                      </p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="relative space-y-6">
                      {/* Basic Info Section */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("staff.email_label")}</Label>
                          <div className="relative group/field">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-primary transition-all duration-300" />
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="employe@exemple.com"
                              required
                              disabled={!!editingUser}
                              className="ps-10 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl placeholder:text-white/20 text-base md:text-sm"
                            />
                          </div>
                        </div>

                        {!editingUser && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="full_name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("staff.full_name_label")}</Label>
                              <div className="relative group/field">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-primary transition-all duration-300" />
                                <Input
                                  id="full_name"
                                  value={formData.full_name}
                                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                  placeholder="John Doe"
                                  className="ps-10 h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl placeholder:text-white/20 text-base md:text-sm"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("staff.phone_label")}</Label>
                              <div className="relative group/field">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/field:text-secondary transition-all duration-300" />
                                <Input
                                  id="phone"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  placeholder="23 456 789"
                                  className="ps-10 h-12 bg-white/5 border-white/10 focus:border-secondary/50 focus:ring-secondary/20 transition-all rounded-xl placeholder:text-white/20 text-base md:text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Role Selection Section */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("staff.role_selection")}</Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value: "owner" | "worker") =>
                              setFormData({ ...formData, role: value })
                            }
                          >
                            <SelectTrigger className="h-12 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900/95 border-white/10 backdrop-blur-xl">
                              <SelectItem value="worker" className="focus:bg-primary/20 focus:text-primary transition-colors cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 opacity-50" />
                                  <span>{t("staff.role_worker")}</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="owner" className="focus:bg-primary/20 focus:text-primary transition-colors cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Crown className="w-4 h-4 opacity-50" />
                                  <span>{t("staff.role_owner")}</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Permission Infographic */}
                        <div className="grid grid-cols-1 gap-3">
                          <div className={`p-4 rounded-xl border transition-all duration-500 overflow-hidden relative ${formData.role === 'worker'
                            ? 'bg-secondary/10 border-secondary/30 scale-100 shadow-[0_0_20px_rgba(var(--secondary),0.1)]'
                            : 'bg-white/5 border-white/5 scale-[0.98] opacity-40'
                            }`}>
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${formData.role === 'worker' ? 'bg-secondary/20' : 'bg-white/10'}`}>
                                <Zap className="w-4 h-4 text-secondary" />
                              </div>
                              <div>
                                <p className="font-bold text-sm mb-1">{t("staff.role_worker")}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {t("staff.role_worker_desc")}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className={`p-4 rounded-xl border transition-all duration-500 overflow-hidden relative ${formData.role === 'owner'
                            ? 'bg-primary/10 border-primary/30 scale-100 shadow-[0_0_20px_rgba(var(--primary),0.1)]'
                            : 'bg-white/5 border-white/5 scale-[0.98] opacity-40'
                            }`}>
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${formData.role === 'owner' ? 'bg-primary/20' : 'bg-white/10'}`}>
                                <ShieldCheck className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-bold text-sm mb-1">{t("staff.role_owner")}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {t("staff.role_owner_desc")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        {!editingUser && (
                          <div className="flex items-center space-x-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl my-4">
                            <input
                              type="checkbox"
                              id="skipEmail"
                              checked={skipEmail}
                              onChange={(e) => setSkipEmail(e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary bg-black/50"
                            />
                            <label htmlFor="skipEmail" className="text-xs text-yellow-500 cursor-pointer select-none">
                              {t("staff.skip_email")}
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-white/10">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isSubmitting}
                          className="hover:bg-white/10 rounded-xl px-6"
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className={`rounded-xl px-8 h-12 text-lg font-bold transition-all duration-300 shadow-lg ${formData.role === 'owner'
                            ? 'bg-primary hover:bg-primary/90 shadow-primary/20'
                            : 'bg-secondary hover:bg-secondary/90 shadow-secondary/20'
                            }`}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 me-2 animate-spin" />
                              <span>{t("password.updating")}</span>
                            </>
                          ) : (
                            <>
                              {editingUser ? (
                                <>
                                  <Edit className="w-4 h-4 me-2" />
                                  <span>{t("common.save")}</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 me-2" />
                                  <span>{t("staff.add_button")}</span>
                                </>
                              )}
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Staff Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {staffMembers.filter(s => s.role === 'owner').length}
                    </p>
                    <p className="text-sm text-muted-foreground">{t("staff.stats_owners")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-secondary" />
                  <div>
                    <p className="text-2xl font-bold text-secondary">
                      {staffMembers.filter(s => s.role === 'worker').length}
                    </p>
                    <p className="text-sm text-muted-foreground">{t("staff.stats_workers")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-accent" />
                  <div>
                    <p className="text-2xl font-bold text-accent">
                      {staffMembers.length}
                    </p>
                    <p className="text-sm text-muted-foreground">{t("staff.stats_total")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {staffMembers.filter(s => s.last_sign_in).length}
                    </p>
                    <p className="text-sm text-muted-foreground">{t("staff.stats_active")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Permissions Info */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {t("staff.permissions_title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Crown className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">{t("staff.role_owner")}</h4>
                      <p className="text-sm text-muted-foreground">{t("staff.perm_owner_full")}</p>
                    </div>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ms-13">
                    <li>• {t("staff.perm_owner_l1")}</li>
                    <li>• {t("staff.perm_owner_l2")}</li>
                    <li>• {t("staff.perm_owner_l3")}</li>
                    <li>• {t("staff.perm_owner_l4")}</li>
                    <li>• {t("staff.perm_owner_l5")}</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-secondary">{t("staff.role_worker")}</h4>
                      <p className="text-sm text-muted-foreground">{t("staff.perm_worker_daily")}</p>
                    </div>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ms-13">
                    <li>• {t("staff.perm_worker_l1")}</li>
                    <li>• {t("staff.perm_worker_l2")}</li>
                    <li>• {t("staff.perm_worker_l3")}</li>
                    <li>• {t("staff.perm_worker_l4")}</li>
                    <li>• {t("staff.perm_worker_l5")}</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">{t("staff.important_considerations")}</p>
                    <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                      <li>• {t("staff.consideration_1")}</li>
                      <li>• {t("staff.consideration_2")}</li>
                      <li>• {t("staff.consideration_3")}</li>
                      <li>• {t("staff.consideration_4")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff List */}
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t("staff.title")}
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Chargement des membres du personnel...</p>
                </div>
              </div>
            ) : staffMembers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary/50" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t("staff.no_staff")}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {t("staff.subtitle")}
                </p>
                <Button onClick={() => setIsDialogOpen(true)} size="lg">
                  <Plus className="w-5 h-5 me-2" />
                  {t("staff.add_button")}
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {staffMembers.map((member) => (
                  <Card key={member.id} className="glass-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            {member.role === 'owner' ? (
                              <Crown className="w-6 h-6 text-primary" />
                            ) : (
                              <User className="w-6 h-6 text-secondary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-base sm:text-lg tracking-tight">
                                {member.full_name && member.full_name !== "Nom non disponible"
                                  ? member.full_name
                                  : member.email}
                              </h3>
                              {member.id === user?.id && (
                                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                  <User className="w-3 h-3 me-1" />
                                  {t("staff.is_you")}
                                </Badge>
                              )}
                              {member.is_invited && (
                                <Badge variant="outline" className="text-xs">
                                  <Mail className="w-3 h-3 me-1" />
                                  {t("staff.invited")}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="flex items-center gap-1">
                                {member.role === 'owner' ? (
                                  <>
                                    <Crown className="w-3 h-3" />
                                    {t("staff.role_owner")}
                                  </>
                                ) : (
                                  <>
                                    <User className="w-3 h-3" />
                                    {t("staff.role_worker")}
                                  </>
                                )}
                              </Badge>
                              {/* 🟢 Online/Offline Badge - Disabled until schema update */}
                              <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
                                <div className="w-2 h-2 bg-gray-500 rounded-full" />
                                {t("staff.offline")}
                              </Badge>
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                {t("staff.joined")} {formatDate(member.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                              {(member.full_name && member.full_name !== "Nom non disponible") && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 opacity-60" />
                                  <span>{member.email}</span>
                                </div>
                              )}
                              {member.phone && (
                                <div className="flex items-center gap-1 border-white/10">
                                  <Phone className="w-3 h-3 opacity-60" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                              {(!member.full_name || member.full_name === "Nom non disponible") && (
                                <span>{t("staff.profiles_not_supported")}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ms-4 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingUser(member);
                              setFormData({
                                email: member.email,
                                full_name: member.full_name || "",
                                phone: member.phone || "",
                                role: member.role
                              });
                              setIsDialogOpen(true);
                            }}
                            disabled={isSubmitting}
                            className="hover:bg-blue-50 hover:border-blue-300 h-10 sm:h-9"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline ms-1">{t("common.edit")}</span>
                          </Button>

                          {/* Don't allow deleting yourself or the last owner */}
                          {canDeleteMember(member) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(member.id)}
                              disabled={isSubmitting}
                              className="hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700 h-10 sm:h-9"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline ms-1">{t("common.delete")}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default StaffManagement;
