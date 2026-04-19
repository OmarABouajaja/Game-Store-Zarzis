import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useClients, useCreateClient, useClientByPhone } from "@/hooks/useClients";
import { usePointsTransactions, useCreatePointsTransaction, useRedeemPoints } from "@/hooks/usePointsTransactions";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Search, Star, Gamepad2, DollarSign, History, Gift, TrendingUp, TrendingDown } from "lucide-react";

const ClientsManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: clients, isLoading } = useClients();
  const { data: storeSettings } = useStoreSettings();
  const createClient = useCreateClient();

  // Check if points system is enabled
  const pointsSystemEnabled = storeSettings?.points_system_enabled !== false;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRedeemDialogOpen, setIsRedeemDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const [redeemDescription, setRedeemDescription] = useState("");
  const [historyFilter, setHistoryFilter] = useState<'all' | 'earned' | 'spent'>('all');

  // Points transactions for selected client
  const { data: transactions } = usePointsTransactions(selectedClient?.id);
  const createPointsTransaction = useCreatePointsTransaction();
  const redeemPoints = useRedeemPoints();

  const handleCreateClient = async () => {
    if (!name || !phone) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    try {
      await createClient.mutateAsync({ name, phone, email, notes });
      toast({ title: "Client created!" });
      setIsCreateDialogOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setNotes("");
    } catch (err: unknown) {
      if ((err as Error).message?.includes("duplicate")) {
        toast({ title: "Phone number already exists", variant: "destructive" });
      } else {
        const message = err instanceof Error ? err.message : "Error creating client";
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    }
  };

  const handleRedeemPoints = async () => {
    if (!selectedClient || !pointsToRedeem || !user) return;

    const points = parseInt(pointsToRedeem);
    if (points <= 0 || points > selectedClient.points) {
      toast({ title: "Invalid points amount", variant: "destructive" });
      return;
    }

    try {
      await redeemPoints.mutateAsync({
        client_id: selectedClient.id,
        points_to_redeem: points,
        description: redeemDescription || "Points redemption",
        staff_id: user.id,
      });

      toast({ title: "Points redeemed successfully!" });
      setIsRedeemDialogOpen(false);
      setSelectedClient(null);
      setPointsToRedeem("");
      setRedeemDescription("");
      setRedeemDescription("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error redeeming points";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const openHistoryDialog = (client: Client) => {
    setSelectedClient(client);
    setIsHistoryDialogOpen(true);
  };

  const openRedeemDialog = (client: Client) => {
    setSelectedClient(client);
    setIsRedeemDialogOpen(true);
  };

  const filteredClients = clients?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                  {t("sidebar.client_management")}
                </h1>
                <HelpTooltip content={t('help.clients')} />
              </div>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base lg:text-lg">
                {t("client.manage_desc")}
              </p>
            </div>
            <Button
              variant="hero"
              onClick={() => setIsCreateDialogOpen(true)}
              onMouseEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="w-full sm:w-auto neon-cyan-glow group"
            >
              <Plus className="w-5 h-5 me-2 group-hover:rotate-90 transition-transform" />
              {t("client.add")}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="glass-card rounded-2xl p-4 sm:p-6 text-center group hover:scale-[1.02] transition-all duration-300 border-primary/20">
              <div className="flex justify-center mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-16 mx-auto mb-1 bg-white/5" />
              ) : (
                <p className="text-3xl sm:text-4xl font-display font-bold text-primary mb-1">
                  {clients?.length || 0}
                </p>
              )}
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("client.total")}</p>
            </div>
            {pointsSystemEnabled && (
              <div className="glass-card rounded-2xl p-4 sm:p-6 text-center group hover:scale-[1.02] transition-all duration-300 border-secondary/20">
                <div className="flex justify-center mb-2 sm:mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                  </div>
                </div>
                {isLoading ? (
                  <Skeleton className="h-10 w-24 mx-auto mb-1 bg-white/5" />
                ) : (
                  <p className="text-3xl sm:text-4xl font-display font-bold text-secondary mb-1">
                    {clients?.reduce((sum, c) => sum + (c.points || 0), 0) || 0}
                  </p>
                )}
                <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("client.total_points")}</p>
              </div>
            )}
            <div className="glass-card rounded-2xl p-4 sm:p-6 text-center group hover:scale-[1.02] transition-all duration-300 border-accent/20">
              <div className="flex justify-center mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-20 mx-auto mb-1 bg-white/5" />
              ) : (
                <p className="text-3xl sm:text-4xl font-display font-bold text-accent mb-1">
                  {clients?.reduce((sum, c) => sum + (c.total_games_played || 0), 0) || 0}
                </p>
              )}
              <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("client.total_games")}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t("client.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-12 h-12 text-lg glass-card border-white/10"
            />
          </div>

          {/* Clients List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="glass-card border-white/5">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-32 bg-white/5" />
                        <Skeleton className="h-4 w-24 bg-white/5" />
                      </div>
                      <Skeleton className="h-10 w-16 rounded-full bg-white/5" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20 bg-white/5" />
                        <Skeleton className="h-4 w-20 bg-white/5" />
                      </div>
                      <Skeleton className="h-2 w-full bg-white/5" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 flex-1 bg-white/5" />
                      <Skeleton className="h-9 flex-1 bg-white/5" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredClients?.map((client) => (
              <Card key={client.id} className="glass-card group hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-xl font-bold group-hover:text-primary transition-colors">{client.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{client.phone}</p>
                    </div>
                    {pointsSystemEnabled && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-display font-bold text-yellow-500 text-lg">{client.points || 0}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6 select-none">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Gamepad2 className="w-4 h-4" />
                        <span>{client.total_games_played || 0} {t("client.games")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-mono">{Number(client.total_spent || 0).toFixed(3)} DT</span>
                      </div>
                    </div>
                    {pointsSystemEnabled && (
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min((client.points / 50) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {pointsSystemEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 glass-card hover:bg-white/5"
                        onClick={() => openHistoryDialog(client)}
                      >
                        <History className="w-4 h-4 me-2" />
                        {t("client.history")}
                      </Button>
                    )}
                    {pointsSystemEnabled && (
                      <Button
                        variant="hero"
                        size="sm"
                        className="flex-1 min-w-[100px]"
                        onClick={() => openRedeemDialog(client)}
                        disabled={(client.points || 0) <= 0}
                      >
                        <Gift className="w-4 h-4 me-2" />
                        {t("client.redeem")}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-4 italic">
                    {t("client.member_since")} {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!filteredClients || filteredClients.length === 0) && (
            <div className="text-center py-20 glass-card rounded-3xl border-dashed border-2 border-white/10">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl text-muted-foreground font-medium">{t("common.no_clients") || "No clients found"}</p>
            </div>
          )}

          {/* Create Client Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="glass-panel border-primary/30 max-w-[95vw] sm:max-w-md overflow-hidden p-0 !translate-x-[-50%] !translate-y-[-50%]">
              <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-primary to-purple-500" />
              <div className="p-6">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-display font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    {t("client.add")}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white/70">{t("client.full_name")}</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 z-10" />
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("client.placeholder.name")}
                        className="ps-10 h-10 sm:h-12 text-base font-medium relative z-0"
                        style={{
                          backgroundColor: '#18181b',
                          borderColor: '#52525b',
                          color: '#ffffff',
                          opacity: 1
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white/70">{t("client.phone_number")} *</Label>
                    <div className="relative">
                      <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 z-10" />
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t("client.placeholder.phone")}
                        className="ps-10 h-10 sm:h-12 text-base font-mono relative z-0"
                        style={{
                          backgroundColor: '#18181b',
                          borderColor: '#52525b',
                          color: '#ffffff',
                          opacity: 1
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white/70">{t("client.email_address")} ({t("common.optional") || "Optional"})</Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@email.com"
                      type="email"
                      className="h-10 sm:h-12 text-base relative z-0"
                      style={{
                        backgroundColor: '#18181b',
                        borderColor: '#52525b',
                        color: '#ffffff',
                        opacity: 1
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white/70">Notes ({t("common.optional") || "Optional"})</Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Favorite game: FIFA"
                      className="h-10 sm:h-12 text-base relative z-0"
                      style={{
                        backgroundColor: '#18181b',
                        borderColor: '#52525b',
                        color: '#ffffff',
                        opacity: 1
                      }}
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="hero"
                      className="w-full h-12 text-lg font-bold neon-cyan-glow"
                      onClick={handleCreateClient}
                      disabled={createClient.isPending}
                    >
                      {createClient.isPending ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t("common.processing") || "Processing..."}
                        </span>
                      ) : (
                        t("client.add")
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Redeem Points Dialog */}
        <Dialog open={isRedeemDialogOpen} onOpenChange={setIsRedeemDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>{t('client.redeem_points', 'Redeem Points')}</DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-4">
                <div className="glass-card rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">{t('client.client_label', 'Client')}</p>
                  <p className="font-semibold">{selectedClient.name}</p>
                  <p className="text-sm text-muted-foreground">{t('client.balance', 'Current Balance')}: {selectedClient.points || 0} pts</p>
                </div>

                <div>
                  <Label>{t('client.redeem_amount', 'Points to Redeem')}</Label>
                  <Input
                    type="number"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(e.target.value)}
                    placeholder="0"
                    max={selectedClient.points || 0}
                  />
                </div>

                <div>
                  <Label>{t('client.description', 'Description (optional)')}</Label>
                  <Input
                    value={redeemDescription}
                    onChange={(e) => setRedeemDescription(e.target.value)}
                    placeholder={t('client.redeem_desc_placeholder', 'e.g., Free game redemption')}
                  />
                </div>

                <Button
                  variant="hero"
                  className="w-full h-12 text-lg font-bold neon-cyan-glow"
                  onClick={handleRedeemPoints}
                  disabled={redeemPoints.isPending || !pointsToRedeem}
                >
                  <Gift className="w-4 h-4 me-2" />
                  {t('client.redeem_points', 'Redeem Points')}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Transaction History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>{t('client.transaction_history', 'Points Transaction History')}</DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-4">
                <div className="glass-card rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('client.client_label', 'Client')}</p>
                    <p className="font-semibold">{selectedClient.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t('client.current_balance', 'Current Balance')}</p>
                    {/* Find fresh client data from the list to show live balance */}
                    <p className="font-bold text-xl text-primary">
                      {(clients?.find(c => c.id === selectedClient.id)?.points ?? selectedClient.points) || 0} pts
                    </p>
                  </div>
                </div>

                {/* Points Switcher (Filter Tabs) */}
                <div className="flex p-1 bg-muted/20 rounded-lg">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${historyFilter === 'all'
                      ? 'bg-primary/20 text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {t('common.all', 'All')}
                  </button>
                  <button
                    onClick={() => setHistoryFilter('earned')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${historyFilter === 'earned'
                      ? 'bg-green-500/20 text-green-500 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {t('client.earned', 'Earned')}
                  </button>
                  <button
                    onClick={() => setHistoryFilter('spent')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${historyFilter === 'spent'
                      ? 'bg-red-500/20 text-red-500 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {t('client.redeemed_status', 'Redeemed')}
                  </button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pe-2">
                  {transactions
                    ?.filter(t => {
                      if (historyFilter === 'all') return true;
                      if (historyFilter === 'earned') return t.amount > 0;
                      if (historyFilter === 'spent') return t.amount < 0;
                      return true;
                    })
                    .map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          {transaction.transaction_type === 'earned' ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : transaction.transaction_type === 'spent' ? (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                          ) : (
                            <Star className="w-5 h-5 text-blue-500" />
                          )}
                          <div>
                            <p className="font-medium capitalize">{transaction.transaction_type}</p>
                            <p className="text-sm text-muted-foreground">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Balance: {transaction.balance_after}
                          </p>
                        </div>
                      </div>
                    ))}



                  {(!transactions || transactions.length === 0 ||
                    transactions.filter(t => {
                      if (historyFilter === 'all') return true;
                      if (historyFilter === 'earned') return t.amount > 0;
                      if (historyFilter === 'spent') return t.amount < 0;
                      return true;
                    }).length === 0
                  ) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{t('client.no_transactions', 'No transactions found')}</p>
                      </div>
                    )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default ClientsManagement;
