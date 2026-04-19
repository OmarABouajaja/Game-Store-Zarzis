import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Package, Plus, Edit, Trash2, DollarSign, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { Product } from "@/types";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.preprocess((val) => Number(val), z.number().min(0, "Price must be >= 0")),
  stock_quantity: z.preprocess((val) => Number(val), z.number().min(0, "Stock cannot be negative")),
  category: z.string().optional(),
  cost_price: z.preprocess((val) => Number(val), z.number().min(0).default(0)),
  product_type: z.enum(['physical', 'consumable', 'digital']).default('physical'),
  subcategory: z.string().optional(),
  is_quick_sale: z.boolean().default(false),
  image_url: z.string().optional(),
  digital_content: z.string().optional(),
  is_digital_delivery: z.boolean().default(false)
});

type ProductFormValues = z.infer<typeof productSchema>;

const ProductsManagement = () => {
  const { isOwner } = useAuth();
  const { t } = useLanguage();
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const productType = form.watch("product_type");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_quantity: 0,
      category: "",
      cost_price: 0,
      product_type: "physical",
      subcategory: "",
      is_quick_sale: false,
      image_url: "",
      digital_content: "",
      is_digital_delivery: false
    }
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

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const productData = {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        price: data.price,
        stock_quantity: data.stock_quantity,
        category: data.category?.trim() || "Général",
        image_url: data.image_url?.trim() || undefined,
        product_type: data.product_type,
        subcategory: data.subcategory || undefined,
        is_quick_sale: data.is_quick_sale,
        digital_content: data.digital_content?.trim() || undefined,
        is_digital_delivery: data.is_digital_delivery,
        is_active: true,
        name_fr: data.name.trim(),
        name_ar: data.name.trim(),
        description_fr: data.description?.trim() || undefined,
        description_ar: data.description?.trim() || undefined,
        points_earned: Math.floor(data.price),
        cost_price: data.cost_price || 0
      };

      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          ...productData
        });
        toast({ title: "✅ Produit mis à jour", description: "Les modifications ont été enregistrées." });
      } else {
        await createProduct.mutateAsync({
          ...productData,
          created_at: new Date().toISOString()
        } as Omit<Product, "id">);
        toast({ title: "✅ Produit créé", description: "Le nouveau produit a été ajouté au catalogue." });
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      form.reset();
    } catch (error: unknown) {
      console.error("Error saving product:", error);
      const message = error instanceof Error ? error.message : "Impossible d'enregistrer le produit.";
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
                  form.reset({
                    name: "", description: "", price: 0, stock_quantity: 0, cost_price: 0, category: "", product_type: "physical", subcategory: "", is_quick_sale: false, image_url: "", digital_content: "", is_digital_delivery: false
                  });
                }}>
                  <Plus className="w-4 h-4 me-2" />
                  {t('products.add')}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? t('products.edit_title') : t('products.add_title')}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">{t('products.name')}</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder={t('products.name')}
                      required
                      className="text-base md:text-sm"
                    />
                    {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="description">{t('products.description')}</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
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
                        {...form.register("price")}
                        placeholder="0.000"
                        required
                        className="text-base md:text-sm"
                      />
                      {form.formState.errors.price && <p className="text-red-500 text-xs mt-1">{form.formState.errors.price.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="cost_price">{t('products.cost_price_label')}</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.001"
                      {...form.register("cost_price")}
                      placeholder="0.000"
                      className="text-base md:text-sm"
                    />
                    </div>
                    <div>
                      <Label htmlFor="stock">{t('products.stock_label')}</Label>
                      <Input
                        id="stock"
                        type="number"
                        {...form.register("stock_quantity")}
                        placeholder="0"
                        required
                        className="text-base md:text-sm"
                      />
                      {form.formState.errors.stock_quantity && <p className="text-red-500 text-xs mt-1">{form.formState.errors.stock_quantity.message}</p>}
                    </div>
                  </div>

                  {/* Product Type Selector */}
                  <div>
                    <Label htmlFor="product_type">{t('products.product_type')}</Label>
                    <Select
                      value={productType}
                      onValueChange={(value: 'physical' | 'consumable' | 'digital') => {
                        form.setValue("product_type", value);
                        if (value !== 'consumable') {
                          form.setValue("subcategory", "");
                          form.setValue("is_quick_sale", false);
                        }
                        if (value !== 'digital') {
                          form.setValue("digital_content", "");
                          form.setValue("is_digital_delivery", false);
                        }
                      }}
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
                      {productType === 'consumable'
                        ? t('products.type_desc_consumable')
                        : productType === 'digital'
                          ? t('products.type_desc_digital')
                          : t('products.type_desc_physical')}
                    </p>
                  </div>

                  {/* Digital Content - Only for digital products */}
                  <AnimatePresence>
                    {productType === 'digital' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div>
                        <Label htmlFor="digital_content">{t('products.digital_code_label')}</Label>
                        <Textarea
                          id="digital_content"
                          placeholder={t('products.digital_code_placeholder')}
                          {...form.register("digital_content")}
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="is_digital_delivery" className="cursor-pointer">{t('products.instant_delivery')}</Label>
                        </div>
                        <input
                          id="is_digital_delivery"
                          type="checkbox"
                          {...form.register("is_digital_delivery")}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>

                  {/* Subcategory - Only show for consumables */}
                  <AnimatePresence>
                    {productType === 'consumable' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <Label htmlFor="subcategory">{t('products.subcategory_label')}</Label>
                      <Select
                        value={form.watch("subcategory") || ""}
                        onValueChange={(value) => form.setValue("subcategory", value)}
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
                        {t('products.subcategory_hint')}
                      </p>
                    </motion.div>
                  )}
                  </AnimatePresence>

                  {/* Quick Sale Toggle - Only for consumables */}
                  <AnimatePresence>
                    {productType === 'consumable' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between p-3 border rounded-lg overflow-hidden"
                      >
                      <div>
                        <Label htmlFor="quick_sale" className="cursor-pointer">{t('products.quick_sale_toggle')}</Label>
                        <p className="text-xs text-muted-foreground">{t('products.quick_sale_desc')}</p>
                      </div>
                      <input
                        id="quick_sale"
                        type="checkbox"
                        {...form.register("is_quick_sale")}
                        className="w-5 h-5 cursor-pointer"
                      />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Main Category (optional) */}
                  <div>
                    <Label htmlFor="category">{t('products.category_optional')}</Label>
                    <Input
                      id="category"
                      {...form.register("category")}
                      placeholder="e.g., Consumables, Gaming Accessories"
                      className="text-base md:text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="image_url">{t('products.image_url')}</Label>
                    <Input
                      id="image_url"
                      {...form.register("image_url")}
                      placeholder="https://example.com/image.jpg"
                      className="text-base md:text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12 px-6 text-base" disabled={form.formState.isSubmitting}>
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" className="h-12 px-8 text-lg font-bold" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t('products.saving')}
                        </>
                      ) : (
                        editingProduct ? t('products.success_update') : t('products.success_create')
                      )}
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
                            {product.product_type === 'consumable' ? t('products.type_consumable_badge') : t('products.type_digital_badge')}
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
                            form.reset({
                              name: product.name,
                              description: product.description || "",
                              price: product.price,
                              stock_quantity: product.stock_quantity,
                              cost_price: product.cost_price || 0,
                              category: product.category || "",
                              product_type: (product.product_type as 'physical'|'consumable'|'digital') || "physical",
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
