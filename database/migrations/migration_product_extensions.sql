-- ==============================================================================
-- Game Store Zarzis - SQL Migration
-- Description: Adds all new product management columns to the existing schema
-- ==============================================================================

-- 1. Ensure cost_price exists (it was defined in the base schema but possibly omitted live)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,3) DEFAULT 0;

-- 2. Add product type distinctions (Physical vs Consumable vs Digital)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'physical';

-- 3. Add subcategories for Cafe/Restaurant views
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- 4. Quick flags for operational UI
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_quick_sale BOOLEAN DEFAULT false;

-- 5. Digital products support
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS digital_content TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_digital_delivery BOOLEAN DEFAULT false;

-- 6. Enhanced stock alerts & statuses
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Optional: Update any legacy rows to ensure consistency
UPDATE public.products 
SET product_type = 'physical' 
WHERE product_type IS NULL;

UPDATE public.products 
SET is_quick_sale = false 
WHERE is_quick_sale IS NULL;

UPDATE public.products 
SET cost_price = 0 
WHERE cost_price IS NULL;
