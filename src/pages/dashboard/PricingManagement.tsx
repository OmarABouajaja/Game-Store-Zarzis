import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { usePricing, useUpdatePricing, useCreatePricing, useDeletePricing, Pricing } from "@/hooks/usePricing";
import { useConsoles } from "@/hooks/useConsoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Clock, Gamepad2, Edit, Save, X, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PricingManagement = () => {
  const { isOwner } = useAuth();
  const { t } = useLanguage();
  const { data: pricing, isLoading } = usePricing();
  const updatePricing = useUpdatePricing();
  const createPricing = useCreatePricing();
  const deletePricing = useDeletePricing();
  const { data: consolesData } = useConsoles();

  const consoleTypes = useMemo(() => {
    const types = new Set<string>();
    if (consolesData) consolesData.forEach(c => types.add(c.console_type?.toLowerCase() || 'other'));
    if (pricing) pricing.forEach(p => types.add(p.console_type?.toLowerCase() || 'other'));
    const arr = Array.from(types).sort();
    return arr.length > 0 ? arr : ['ps5', 'ps4', 'other'];
  }, [consolesData, pricing]);

  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // New Pricing State
  const [isCallbacksOpen, setIsCallbacksOpen] = useState(false);
  const [newPricing, setNewPricing] = useState({
    name: "",
    console_type: "ps5",
    price_type: "hourly",
    price: 0,
    game_duration_minutes: 15,
    extra_time_price: 0,
    points_earned: 10,
    is_active: true,
    sort_order: 0
  });

  // Only owners can access this page
  if (!isOwner) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{t('products.access_denied')}</h2>
              <p className="text-muted-foreground">{t('products.owners_only')}</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const handleEditPrice = (price: Pricing) => {
    setEditingPricing({ ...price });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePricing = async () => {
    if (!editingPricing) return;
    try {
      if (!editingPricing.name) {
        toast({ title: t('expenses.validation_error'), description: t('pricing.name_required'), variant: "destructive" });
        return;
      }

      await updatePricing.mutateAsync({
        ...editingPricing,
      });

      toast({ title: "✅", description: t('pricing.updated_success') });
      setIsEditDialogOpen(false);
      setEditingPricing(null);
    } catch (error) {
      console.error("Error updating pricing:", error);
      toast({ title: t('products.error_toast'), description: t('pricing.update_failed'), variant: "destructive" });
    }
  };

  const handleCreatePricing = async () => {
    try {
      if (!newPricing.name) {
        toast({ title: t('expenses.validation_error'), description: t('pricing.name_required'), variant: "destructive" });
        return;
      }

      await createPricing.mutateAsync({
        ...newPricing
      });

      toast({ title: "✅", description: t('pricing.created_success') });
      setIsCallbacksOpen(false);
      setNewPricing({
        name: "",
        name_fr: "",
        name_ar: "",
        console_type: "ps5",
        price_type: "hourly",
        price: 0,
        game_duration_minutes: 15,
        extra_time_price: 0,
        points_earned: 10,
        is_active: true,
        sort_order: 0
      });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error creating pricing";
      toast({ title: t('common.error'), description: message, variant: "destructive" });
    }
  }

  const handleDeletePricing = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      await deletePricing.mutateAsync(id);
      toast({ title: "✅", description: t('pricing.deleted_success') });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error deleting pricing";
      toast({ title: t('common.error'), description: message, variant: "destructive" });
    }
  }
  const PricingCard = ({ price }: { price: Pricing }) => (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{price.name}</CardTitle>
            {price.price_type === 'per_game' && <Badge variant="outline" className="text-xs">Game</Badge>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={price.console_type === 'ps5' ? 'default' : 'secondary'}>
              {price.console_type?.toUpperCase()}
            </Badge>
            <Button size="sm" variant="destructive" className="h-6 w-6 p-0 shrink-0" onClick={() => handleDeletePricing(price.id, price.name)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">{price.price.toFixed(3)} DT</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditPrice(price)}
            >
              <Edit className="w-3 h-3" />
            </Button>
          </div>

          {price.game_duration_minutes && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {price.price_type === 'hourly' ? 'Extension' : 'Avg Match'}: {price.game_duration_minutes} mins
              </span>
            </div>
          )}

          {price.extra_time_price && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-bold text-primary">
                {price.price_type === 'hourly' ? t('pricing.extra') : "Prolongation"}: +{price.extra_time_price.toFixed(3)} DT
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t('pricing.points')}: {price.points_earned || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">{t('pricing.title')}</h1>
              <p className="text-muted-foreground">
                {t('pricing.subtitle')}
              </p>
            </div>

            <Dialog open={isCallbacksOpen} onOpenChange={setIsCallbacksOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 me-2" />
                  {t('pricing.add_new')}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
                <DialogHeader>
                  <DialogTitle>{t('pricing.add_new', 'Add New Pricing Configuration')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('pricing.name_label')}</Label>
                      <Input value={newPricing.name} onChange={e => setNewPricing({ ...newPricing, name: e.target.value })} placeholder="e.g., FIFA 25 Match" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('pricing.console_type_label')}</Label>
                      <Select value={newPricing.console_type} onValueChange={v => setNewPricing({ ...newPricing, console_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {consoleTypes.map(c => (
                            <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pricing Type</Label>
                      <Select value={newPricing.price_type} onValueChange={v => setNewPricing({ ...newPricing, price_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">{t('pricing.hourly_rate')}</SelectItem>
                          <SelectItem value="per_game">{t('pricing.per_game')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (DT)</Label>
                      <Input type="number" step="0.5" value={newPricing.price} onChange={e => setNewPricing({ ...newPricing, price: parseFloat(e.target.value) })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        {newPricing.price_type === 'hourly' ? "Extension Unit (Mins)" : "Avg Match Duration (Mins)"}
                      </Label>
                      <Input
                        type="number"
                        value={newPricing.game_duration_minutes}
                        onChange={e => setNewPricing({ ...newPricing, game_duration_minutes: parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">
                        {newPricing.price_type === 'hourly' ? "Time added per extension click" : "Standard time for one match"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {newPricing.price_type === 'hourly' ? "Extension Price (DT)" : "Prolongation Fee (DT)"}
                      </Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={newPricing.extra_time_price}
                        onChange={e => setNewPricing({ ...newPricing, extra_time_price: parseFloat(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">
                        {newPricing.price_type === 'hourly' ? "Price per extension unit" : "Fee for Extra Time/Penalties"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('pricing.points_earned_label')}</Label>
                    <Input type="number" value={newPricing.points_earned} onChange={e => setNewPricing({ ...newPricing, points_earned: parseInt(e.target.value) })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCallbacksOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                  <Button onClick={handleCreatePricing} disabled={!newPricing.name || newPricing.price <= 0}>{t('pricing.create_btn', 'Create Pricing')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Pricing Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
                <DialogHeader>
                  <DialogTitle>{t('pricing.edit_title', 'Edit Pricing Configuration')}</DialogTitle>
                </DialogHeader>
                {editingPricing && (
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={editingPricing.name} onChange={e => setEditingPricing({ ...editingPricing, name: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Console Type</Label>
                        <Select value={editingPricing.console_type} onValueChange={v => setEditingPricing({ ...editingPricing, console_type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {consoleTypes.map(c => (
                              <SelectItem key={c} value={c}>{c.toUpperCase()}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Pricing Type</Label>
                        <Select value={editingPricing.price_type} onValueChange={v => setEditingPricing({ ...editingPricing, price_type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">{t('pricing.hourly_rate')}</SelectItem>
                            <SelectItem value="per_game">{t('pricing.per_game')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price (DT)</Label>
                        <Input type="number" step="0.5" value={editingPricing.price} onChange={e => setEditingPricing({ ...editingPricing, price: parseFloat(e.target.value) })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          {editingPricing.price_type === 'hourly' ? "Extension Unit (Mins)" : "Avg Match Duration (Mins)"}
                        </Label>
                        <Input
                          type="number"
                          value={editingPricing.game_duration_minutes}
                          onChange={e => setEditingPricing({ ...editingPricing, game_duration_minutes: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {editingPricing.price_type === 'hourly' ? "Extension Price (DT)" : "Prolongation Fee (DT)"}
                        </Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={editingPricing.extra_time_price}
                          onChange={e => setEditingPricing({ ...editingPricing, extra_time_price: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('pricing.points_earned_label')}</Label>
                      <Input type="number" value={editingPricing.points_earned} onChange={e => setEditingPricing({ ...editingPricing, points_earned: parseInt(e.target.value) })} />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                  <Button onClick={handleUpdatePricing} disabled={!editingPricing?.name || editingPricing?.price < 0}>
                    {t('common.save', 'Save Changes')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Pricing Tabs */}
          <Tabs defaultValue={consoleTypes[0] || "ps5"} className="space-y-4">
            <TabsList className={`grid w-full grid-cols-${Math.max(1, consoleTypes.length)}`}>
              {consoleTypes.map(tab => (
                <TabsTrigger key={tab} value={tab}>{tab.toUpperCase()}</TabsTrigger>
              ))}
            </TabsList>

            {consoleTypes.map(tab => {
              const tabPricing = pricing?.filter(p => (p.console_type?.toLowerCase() || 'other') === tab) || [];
              return (
                <TabsContent key={tab} value={tab} className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Gamepad2 className="w-5 h-5 text-primary" />
                    <h2 className="font-display text-xl font-bold">{tab.toUpperCase()} Pricing</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? (
                      <div className="col-span-full flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : tabPricing.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">No pricing configured for {tab.toUpperCase()}</p>
                      </div>
                    ) : (
                      tabPricing.map((price) => (
                        <PricingCard key={price.id} price={price} />
                      ))
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default PricingManagement;
