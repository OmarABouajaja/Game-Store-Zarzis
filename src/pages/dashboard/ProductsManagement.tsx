import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Package, Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { Product } from "@/types";

const ProductsManagement = () => {
  const { isOwner } = useAuth();
  const { t } = useLanguage();
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    category: "",
    cost_price: "0",
    product_type: "physical" as 'physical' | 'consumable' | 'digital',
    subcategory: "",
    is_quick_sale: false,
    image_url: "",
    digital_content: "",
    is_digital_delivery: false
  });

  // Only owners can access this page
  if (!isOwner) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only owners can manage products.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate inputs
      const price = parseFloat(formData.price);
      if (isNaN(price)) throw new Error("Prix invalide");

      const stock = parseInt(formData.stock_quantity);
      if (isNaN(stock)) throw new Error("Quantité en stock invalide");

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: price,
        stock_quantity: stock,
        category: formData.category.trim() || "Général",
        image_url: formData.image_url.trim() || null,
        product_type: formData.product_type,
        subcategory: formData.subcategory || null,
        is_quick_sale: formData.is_quick_sale,
        digital_content: formData.digital_content.trim() || null,
        is_digital_delivery: formData.is_digital_delivery,
        is_active: true,
        // Required fields for multi-language support
        name_fr: formData.name.trim(),
        name_ar: formData.name.trim(),
        description_fr: formData.description.trim() || null,
        description_ar: formData.description.trim() || null,
        points_earned: Math.floor(price),
        cost_price: parseFloat(formData.cost_price) || 0
      };

      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          ...productData
        });
        toast({ title: "✅ Produit mis à jour", description: "Les modifications ont été enregistrées." });
      } else {
        await createProduct.mutateAsync(productData as Omit<Product, "id" | "created_at">);
        toast({ title: "✅ Produit créé", description: "Le nouveau produit a été ajouté au catalogue." });
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        stock_quantity: "",
        cost_price: "0",
        category: "",
        product_type: "physical",
        subcategory: "",
        is_quick_sale: false,
        image_url: "",
        digital_content: "",
        is_digital_delivery: false
      });
    } catch (error: unknown) {
      console.error("Error saving product:", error);
      const message = error instanceof Error ? error.message : "Impossible d'enregistrer le produit. Vérifiez les champs obligatoires.";
      toast({
        title: "❌ Erreur",
        description: message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

    try {
      await deleteProduct.mutateAsync(productId);
      toast({ title: "🗑️ Produit supprimé", description: "Le produit a été retiré du catalogue." });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ title: "❌ Erreur", description: "Impossible de supprimer le produit", variant: "destructive" });
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-bold mb-2">{t('products.title')}</h1>
                <HelpTooltip content={t('help.products')} />
              </div>
              <p className="text-muted-foreground">
                {t('products.subtitle')}
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingProduct(null);
                  setFormData({ name: "", description: "", price: "", stock_quantity: "", cost_price: "0", category: "", product_type: "physical", subcategory: "", is_quick_sale: false, image_url: "", digital_content: "", is_digital_delivery: false });
                }}>
                  <Plus className="w-4 h-4 me-2" />
                  {t('products.add')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? t('products.edit_title') : t('products.add_title')}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">{t('products.name')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('products.name')}
                      required
                      className="text-base md:text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">{t('products.description')}</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('products.description_placeholder')}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">{t('products.price_label')} (Sale)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.001"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.000"
                        required
                        className="text-base md:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost_price">Prix d'Achat (Cost)</Label>
                      <Input
                        id="cost_price"
                        type="number"
                        step="0.001"
                        value={formData.cost_price}
                        onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                        placeholder="0.000"
                        className="text-base md:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">{t('products.stock_label')}</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        placeholder="0"
                        required
                        className="text-base md:text-sm"
                      />
                    </div>
                  </div>

                  {/* Product Type Selector */}
                  <div>
                    <Label htmlFor="product_type">{t('products.product_type')}</Label>
                    <Select
                      value={formData.product_type}
                      onValueChange={(value: 'physical' | 'consumable' | 'digital') =>
                        setFormData({
                          ...formData,
                          product_type: value,
                          // Reset fields that don't apply to the new type
                          subcategory: value === 'consumable' ? formData.subcategory : "",
                          is_quick_sale: value === 'consumable' ? formData.is_quick_sale : false,
                          digital_content: value === 'digital' ? formData.digital_content : "",
                          is_digital_delivery: value === 'digital' ? formData.is_digital_delivery : false
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">{t('products.type_physical')}</SelectItem>
                        <SelectItem value="consumable">{t('products.type_consumable')}</SelectItem>
                        <SelectItem value="digital">{t('products.type_digital')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.product_type === 'consumable'
                        ? t('products.type_desc_consumable')
                        : formData.product_type === 'digital'
                          ? t('products.type_desc_digital')
                          : t('products.type_desc_physical')}
                    </p>
                  </div>

                  {/* Digital Content - Only for digital products */}
                  {formData.product_type === 'digital' && (
                    <div className="space-y-4 animate-in fade-in">
                      <div>
                        <Label htmlFor="digital_content">Digital Code / Key / Link</Label>
                        <Textarea
                          id="digital_content"
                          placeholder="Enter game keys, license codes, or download link..."
                          value={formData.digital_content}
                          onChange={(e) => setFormData({ ...formData, digital_content: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="is_digital_delivery" className="cursor-pointer">Instant Digital Delivery</Label>
                        </div>
                        <input
                          id="is_digital_delivery"
                          type="checkbox"
                          checked={formData.is_digital_delivery}
                          onChange={(e) => setFormData({ ...formData, is_digital_delivery: e.target.checked })}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Subcategory - Only show for consumables */}
                  {formData.product_type === 'consumable' && (
                    <div>
                      <Label htmlFor="subcategory">Subcategory (Café Menu)</Label>
                      <Select
                        value={formData.subcategory}
                        onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Drinks">🥤 Drinks (Sodas, Water, Energy)</SelectItem>
                          <SelectItem value="Café">☕ Café (Coffee, Tea)</SelectItem>
                          <SelectItem value="Snacks">🍿 Snacks (Chips, Chocolate)</SelectItem>
                          <SelectItem value="Meals">🍔 Meals (Sandwiches, Pizza)</SelectItem>
                          <SelectItem value="Desserts">🍰 Desserts (Ice Cream, Cake)</SelectItem>
                          <SelectItem value="Other">📦 Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        This determines which tab it appears under in Café Menu
                      </p>
                    </div>
                  )}

                  {/* Quick Sale Toggle - Only for consumables */}
                  {formData.product_type === 'consumable' && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label htmlFor="quick_sale" className="cursor-pointer">Show in Quick Sale Menu</Label>
                        <p className="text-xs text-muted-foreground">Display in Café Menu for fast access</p>
                      </div>
                      <input
                        id="quick_sale"
                        type="checkbox"
                        checked={formData.is_quick_sale}
                        onChange={(e) => setFormData({ ...formData, is_quick_sale: e.target.checked })}
                        className="w-5 h-5 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Main Category (optional) */}
                  <div>
                    <Label htmlFor="category">{t('products.category')} (Optional)</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Consumables, Gaming Accessories"
                      className="text-base md:text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="image_url">{t('products.image_url')}</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="text-base md:text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12 px-6 text-base">
                      Cancel
                    </Button>
                    <Button type="submit" className="h-12 px-8 text-lg font-bold">
                      {editingProduct ? t('products.success_update') : t('products.success_create')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                      <div className="flex gap-1">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : products?.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">{t('products.no_products')}</h3>
                <p className="text-muted-foreground mb-4">{t('products.add')} to get started</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 me-2" />
                  {t('products.add')}
                </Button>
              </div>
            ) : (
              products?.map((product) => (
                <Card key={product.id} className="glass-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {product.image_url && (
                          <div className="w-full h-32 mb-3 rounded-md overflow-hidden bg-muted">
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        {product.category && (
                          <Badge variant="secondary" className="mt-1 me-1">
                            {product.category}
                          </Badge>
                        )}
                        {product.product_type && product.product_type !== 'physical' && (
                          <Badge variant="outline" className="mt-1 me-1">
                            {product.product_type === 'consumable' ? '🍔 Consumable' : '💾 Digital'}
                          </Badge>
                        )}
                        {product.subcategory && (
                          <Badge variant="outline" className="mt-1">
                            {product.subcategory}
                          </Badge>
                        )}
                        {product.is_quick_sale && (
                          <Badge variant="secondary" className="mt-1 ms-1 bg-yellow-100 text-yellow-800 border-yellow-200">
                            ⚡ Quick Sale
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => {
                            setEditingProduct(product);
                            setFormData({
                              name: product.name,
                              description: product.description || "",
                              price: product.price.toString(),
                              stock_quantity: product.stock_quantity.toString(),
                              cost_price: (product.cost_price || 0).toString(),
                              category: product.category || "",
                              product_type: product.product_type || "physical",
                              subcategory: product.subcategory || "",
                              is_quick_sale: product.is_quick_sale || false,
                              image_url: product.image_url || "",
                              digital_content: product.digital_content || "",
                              is_digital_delivery: product.is_digital_delivery || false
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-9 w-9 text-destructive hover:text-destructive/80"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="font-medium">{product.price.toFixed(3)} DT</span>
                      </div>
                      <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                        {product.stock_quantity} {product.stock_quantity > 0 ? t('products.in_stock') : t('products.out_stock')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute >
  );
};

export default ProductsManagement;
