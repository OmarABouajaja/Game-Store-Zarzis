import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { useClients, useClientByPhone, useCreateClient } from "@/hooks/useClients";
import { useTodaySales, useCreateSale } from "@/hooks/useSales";
import { useCreatePointsTransaction } from "@/hooks/usePointsTransactions";
import { ClientSearch } from "@/components/dashboard/ClientSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Package, Search, DollarSign, User, Star, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Product, Client } from "@/types";

const SalesManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Fetch actual products from database
  const { data: products, isLoading } = useProducts();
  const { data: todaySales } = useTodaySales();

  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedClientForSale, setSelectedClientForSale] = useState<Client | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "points" | "mixed">("cash");
  const [pointsToUse, setPointsToUse] = useState(0);
  const [staffConfirmed, setStaffConfirmed] = useState(false);
  const [clientConfirmed, setClientConfirmed] = useState(false);

  const createClient = useCreateClient();
  const createSale = useCreateSale();
  const createPointsTransaction = useCreatePointsTransaction();

  const calculateTotal = () => {
    if (!selectedProduct) return { total: 0, pointsUsed: 0, cashPaid: 0 };
    const subtotal = selectedProduct.price * quantity;
    if (paymentMethod === "points") {
      return { total: 0, pointsUsed: Math.min(subtotal * 1000, pointsToUse), cashPaid: 0 };
    } else if (paymentMethod === "mixed") {
      const pointsValue = Math.min(subtotal, pointsToUse / 1000);
      return { total: subtotal - pointsValue, pointsUsed: pointsValue * 1000, cashPaid: subtotal - pointsValue };
    }
    return { total: subtotal, pointsUsed: 0, cashPaid: subtotal };
  };

  const handleSell = async () => {
    if (!selectedProduct || !user) return;

    const { total, pointsUsed } = calculateTotal();

    // For points-based purchases, require confirmation
    if (paymentMethod !== "cash" && (!staffConfirmed || !clientConfirmed)) {
      setIsConfirmDialogOpen(true);
      return;
    }

    try {
      let clientId = selectedClientForSale?.id;

      // Create client if in creation mode
      if (isCreatingClient && newClientName && newClientPhone) {
        const newClient = await createClient.mutateAsync({
          phone: newClientPhone,
          name: newClientName,
        });
        clientId = newClient.id;
      }

      // Process the sale
      await createSale.mutateAsync({
        product_id: selectedProduct.id,
        quantity,
        unit_price: selectedProduct.price,
        total_amount: total,
        staff_id: user.id,
        client_id: clientId,
        payment_method: paymentMethod,
        points_used: pointsUsed,
        points_earned: selectedProduct.points_earned * quantity,
        notes: paymentMethod !== "cash" ? `Paid with ${paymentMethod} payment` : null,
      });

      // Process points earned
      if (clientId && selectedProduct.points_earned > 0) {
        await createPointsTransaction.mutateAsync({
          client_id: clientId,
          transaction_type: "earned",
          amount: selectedProduct.points_earned * quantity,
          description: `Earned from purchase: ${selectedProduct.name} x${quantity}`,
          reference_type: "sale",
          staff_id: user.id,
        });
      }

      // If points were used, create a transaction record
      if (pointsUsed > 0 && clientId) {
        await createPointsTransaction.mutateAsync({
          client_id: clientId,
          transaction_type: "spent",
          amount: -pointsUsed,
          description: `Used for purchase: ${selectedProduct.name} x${quantity}`,
          reference_type: "sale",
          staff_id: user.id,
        });
      }

      toast({
        title: "Sale completed!",
        description: `${selectedProduct.name} x${quantity} = ${total.toFixed(3)} DT${pointsUsed > 0 ? ` (${pointsUsed} points used)` : ''}`
      });

      // Reset form
      setIsSellDialogOpen(false);
      setIsConfirmDialogOpen(false);
      setSelectedProduct(null);
      setQuantity(1);
      setSelectedClientForSale(null);
      setIsCreatingClient(false);
      setNewClientName("");
      setNewClientPhone("");
      setPaymentMethod("cash");
      setPointsToUse(0);
      setStaffConfirmed(false);
      setClientConfirmed(false);
      setStaffConfirmed(false);
      setClientConfirmed(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sale failed";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const filteredProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name_fr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedProducts = filteredProducts?.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  const categoryLabels: Record<string, string> = {
    controller: "Controllers",
    phone: "Phones",
    cd: "CDs",
    console: "Consoles",
    accessory: "Accessories",
  };

  const todayTotal = todaySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">{t('sales.title')}</h1>
              <p className="text-muted-foreground">
                {t('sales.subtitle')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t('sales.today')}</p>
              <p className="font-display text-2xl font-bold text-primary">
                {todayTotal.toFixed(3)} DT
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('sales.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>

          {/* Products Grid */}
          {groupedProducts && Object.entries(groupedProducts).map(([category, items]) => (
            <div key={category}>
              <h2 className="font-display text-lg font-bold mb-3">
                {categoryLabels[category] || category}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items?.map((product) => (
                  <div
                    key={product.id}
                    className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsSellDialogOpen(true);
                    }}
                  >
                    <div className="aspect-square rounded-lg bg-muted/30 flex items-center justify-center mb-3">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name_fr}</h3>
                    <div className="flex items-center justify-between">
                      <p className="font-display font-bold text-primary">{product.price} DT</p>
                      <Badge variant="outline" className={product.stock_quantity > 0 ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}>
                        {product.stock_quantity} in stock
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Today's Sales History */}
          {todaySales && todaySales.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-bold mb-3">Today's Sales History</h2>
              <div className="space-y-2">
                {todaySales.map((sale) => (
                  <div key={sale.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{sale.product?.name_fr}</p>
                      <p className="text-sm text-muted-foreground">
                        x{sale.quantity} • {new Date(sale.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="font-display font-bold">{Number(sale.total_amount).toFixed(3)} DT</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sell Product Dialog */}
        <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>{t('sales.sell_product', 'Sell Product')}</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <div className="glass-card rounded-lg p-4">
                  <h3 className="font-semibold">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Price: {selectedProduct.price.toFixed(3)} DT • Stock: {selectedProduct.stock_quantity}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Points earned: {selectedProduct.points_earned} per unit
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('sales.quantity')}</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </Button>
                      <span className="font-display text-2xl font-bold w-12 text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.min(selectedProduct.stock_quantity, quantity + 1))}
                        disabled={quantity >= selectedProduct.stock_quantity}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>{t('sales.payment')}</Label>
                    <Select value={paymentMethod} onValueChange={(value: "cash" | "points" | "mixed") => setPaymentMethod(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{t('sales.cash')}</SelectItem>
                        <SelectItem value="points">{t('sales.points')}</SelectItem>
                        <SelectItem value="mixed">{t('sales.mixed')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <div>
                    <Label>Client (Optional)</Label>
                    {!isCreatingClient ? (
                      <ClientSearch
                        onSelect={(client) => setSelectedClientForSale(client)}
                        selectedClient={selectedClientForSale}
                        onCreateNew={() => setIsCreatingClient(true)}
                      />
                    ) : (
                      <div className="space-y-3 bg-muted/30 p-3 rounded-lg border mt-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold uppercase text-primary">New Client</Label>
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsCreatingClient(false)}>{t('common.cancel', 'Cancel')}</Button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <Input
                            placeholder="Client Name"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                          />
                          <Input
                            placeholder="Phone Number"
                            value={newClientPhone}
                            onChange={(e) => setNewClientPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Points Input for Points/Mixed Payment */}
                  {(paymentMethod === "points" || paymentMethod === "mixed") && selectedClientForSale && (
                    <div>
                      <Label>Points to Use</Label>
                      <Input
                        type="number"
                        value={pointsToUse}
                        onChange={(e) => setPointsToUse(Math.max(0, parseInt(e.target.value) || 0))}
                        max={selectedClientForSale?.points}
                        placeholder="Points to deduct"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Available: {selectedClientForSale?.points} points (1 DT = 1000 points)
                      </p>
                    </div>
                  )}

                  {/* Payment Summary */}
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Payment Summary</h4>
                      {(() => {
                        const { total, pointsUsed, cashPaid } = calculateTotal();
                        return (
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>{(selectedProduct.price * quantity).toFixed(3)} DT</span>
                            </div>
                            {pointsUsed > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Points discount:</span>
                                <span>-{(pointsUsed / 1000).toFixed(3)} DT</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold border-t pt-1">
                              <span>Total to pay:</span>
                              <span>{total.toFixed(3)} DT</span>
                            </div>
                            {pointsUsed > 0 && (
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Points used:</span>
                                <span>{pointsUsed}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Button
                    variant="hero"
                    className="w-full h-12 text-lg font-bold"
                    onClick={handleSell}
                    disabled={createSale.isPending || selectedProduct.stock_quantity < 1}
                  >
                    <ShoppingCart className="w-5 h-5 me-2" />
                    {paymentMethod === "cash" ? t('sales.complete') : t('sales.confirm')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Points Confirmation Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>{t('sales.confirm_points', 'Confirm Points Purchase')}</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <div className="glass-card rounded-lg p-4">
                  <h4 className="font-semibold">{selectedProduct.name} x{quantity}</h4>
                  <p className="text-sm text-muted-foreground">
                    Client: {selectedClientForSale?.name} ({selectedClientForSale?.phone})
                  </p>
                </div>

                {(() => {
                  const { total, pointsUsed, cashPaid } = calculateTotal();
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="staff-confirm"
                          checked={staffConfirmed}
                          onCheckedChange={(checked) => setStaffConfirmed(checked === true)}
                        />
                        <Label htmlFor="staff-confirm" className="text-sm">
                          Staff confirms points transaction is legitimate
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="client-confirm"
                          checked={clientConfirmed}
                          onCheckedChange={(checked) => setClientConfirmed(checked === true)}
                        />
                        <Label htmlFor="client-confirm" className="text-sm">
                          Client confirms and authorizes points usage
                        </Label>
                      </div>

                      <Card className="glass-card">
                        <CardContent className="p-3">
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Points to deduct:</span>
                              <span className="text-red-600">-{pointsUsed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cash payment:</span>
                              <span>{cashPaid.toFixed(3)} DT</span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-1">
                              <span>Client balance after:</span>
                              <span>{((selectedClientForSale?.points || 0) - pointsUsed)} pts</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Button
                        variant="hero"
                        className="w-full h-12 text-lg font-bold"
                        onClick={handleSell}
                        disabled={!staffConfirmed || !clientConfirmed}
                      >
                        <CheckCircle className="w-5 h-5 me-2" />
                        Confirm & Complete Sale
                      </Button>
                    </div>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default SalesManagement;
