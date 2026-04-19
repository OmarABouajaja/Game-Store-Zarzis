import { useData } from "@/contexts/DataContext";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, Zap, Loader2 } from "lucide-react";
import { memo } from "react";

const ProductsShowcase = () => {
  const { products, isLoading } = useData();
  const { addItem } = useCart();
  const { t } = useLanguage();

  // Get products on sale or first 6 products
  const showcaseProducts = products
    .filter(p => (p.product_type !== 'consumable') && (p.isOnSale || products.indexOf(p) < 6))
    .slice(0, 6);

  // Show loading state while products are loading
  if (isLoading) {
    return (
      <section id="products" className="py-8 sm:py-12 md:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
        <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">
          <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <span className="text-accent font-display text-[10px] sm:text-xs md:text-sm tracking-widest uppercase mb-2 sm:mb-3 block">
              {t("products.special")}
            </span>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">
              {t("products.featured")}
              <span className="text-gradient"> {t("products.title_suffix")}</span>
            </h2>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  // Don't render if no products
  if (showcaseProducts.length === 0) {
    return null;
  }

  return (
    <section id="products" className="py-8 sm:py-12 md:py-16 lg:py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />

      <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10">
        <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <span className="text-accent font-display text-[10px] sm:text-xs md:text-sm tracking-widest uppercase mb-2 sm:mb-3 block">
            {t("products.special")}
          </span>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">
            {t("products.featured")}
            <span
              className="text-gradient"
              style={{
                animation: 'rgb-shift 8s ease-in-out infinite'
              }}
            >
              {' '}{t("products.title_suffix")}
            </span>
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-2xl mx-auto px-4">
            {t('products.showcase_subtitle')}
          </p>
        </div>

        {/* Horizontal scroll container */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 sm:gap-6 min-w-max px-2">
            {showcaseProducts.map((product) => (
              <Card
                key={product.id}
                className="group glass-card rounded-lg sm:rounded-xl p-4 hover:border-accent/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_32px_hsl(var(--accent)/0.15)] min-w-[280px] sm:min-w-[320px]"
              >
                <CardContent className="p-0">
                  <div className="relative mb-4">
                    <div className="w-full h-32 sm:h-40 bg-muted/30 rounded-lg flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          width="300"
                          height="200"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-muted-foreground">
                          <ShoppingCart className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-xs">{t("products.no_image")}</p>
                        </div>
                      )}
                    </div>
                    {product.isOnSale && (
                      <Badge className="absolute top-2 end-2 bg-accent text-accent-foreground">
                        {t("products.sale")}
                      </Badge>
                    )}
                    {product.product_type === 'digital' && (
                      <Badge className="absolute top-2 start-2 bg-blue-500 text-white border-none flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-current" />
                        Instant Delivery
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-display text-sm sm:text-base font-bold mb-1 group-hover:text-accent transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.isOnSale && product.salePrice ? (
                          <>
                            <span className="font-display text-lg font-bold text-accent">
                              {product.salePrice} DT
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              {product.price} DT
                            </span>
                          </>
                        ) : (
                          <span className="font-display text-lg font-bold text-primary">
                            {product.price} DT
                          </span>
                        )}
                      </div>
                      {product.points_price && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3" />
                          {product.points_price} pts
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      size="sm"
                      onClick={() => addItem(product)}
                    >
                      {product.product_type === 'digital' ? (
                        <Zap className="w-4 h-4 me-2" />
                      ) : (
                        <ShoppingCart className="w-4 h-4 me-2" />
                      )}
                      {t("products.add_cart")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(ProductsShowcase);
