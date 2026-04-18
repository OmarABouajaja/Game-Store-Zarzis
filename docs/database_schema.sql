-- Game Store Zarzis - Complete Database Schema & Seed Data
-- Last updated: 2026-01-20

-- ==========================================
-- 1. ENUMS
-- ==========================================
CREATE TYPE public.app_role AS ENUM ('owner', 'worker');

-- ==========================================
-- 2. TABLES
-- ==========================================

-- profiles: Stores additional user information
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- user_roles: Connects users to roles
CREATE TABLE public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- clients: Store customer information
CREATE TABLE public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    points INTEGER DEFAULT 0,
    total_spent DECIMAL(12,3) DEFAULT 0,
    total_games_played INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- consoles: Stations available for gaming
CREATE TABLE public.consoles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    station_number INTEGER NOT NULL,
    console_type TEXT NOT NULL, -- 'ps4' or 'ps5'
    status TEXT DEFAULT 'available', -- 'available', 'in_use', 'maintenance'
    current_session_id UUID,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- pricing: Price list for different sessions
CREATE TABLE public.pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_fr TEXT,
    name_ar TEXT,
    console_type TEXT NOT NULL,
    price_type TEXT NOT NULL, -- 'hourly', 'fixed'
    game_duration_minutes INTEGER,
    price DECIMAL(10,3) NOT NULL,
    extra_time_price DECIMAL(10,3),
    points_earned INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- products: Physical items or consumables for sale
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_fr TEXT,
    name_ar TEXT,
    description TEXT,
    description_fr TEXT,
    description_ar TEXT,
    category TEXT NOT NULL,
    price DECIMAL(10,3) NOT NULL,
    cost_price DECIMAL(10,3),
    stock_quantity INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    points_price INTEGER,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- gaming_sessions: Records of playing sessions
CREATE TABLE public.gaming_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    console_id UUID REFERENCES public.consoles NOT NULL,
    client_id UUID REFERENCES public.clients,
    pricing_id UUID REFERENCES public.pricing NOT NULL,
    staff_id UUID REFERENCES auth.users NOT NULL,
    session_type TEXT NOT NULL,
    start_time TIMESTAMPTZ DEFAULT now() NOT NULL,
    end_time TIMESTAMPTZ,
    games_played INTEGER DEFAULT 0,
    extra_time_minutes INTEGER DEFAULT 0,
    base_amount DECIMAL(10,3) DEFAULT 0,
    extra_amount DECIMAL(10,3) DEFAULT 0,
    total_amount DECIMAL(10,3) DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    payment_method TEXT,
    status TEXT DEFAULT 'active',
    is_free_game BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- sales: Specific product sale transactions
CREATE TABLE public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products NOT NULL,
    client_id UUID REFERENCES public.clients,
    staff_id UUID REFERENCES auth.users NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    unit_price DECIMAL(10,3) NOT NULL,
    total_amount DECIMAL(10,3) NOT NULL,
    payment_method TEXT,
    points_earned INTEGER DEFAULT 0,
    points_used INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- expenses: Store costs tracking
CREATE TABLE public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    amount DECIMAL(10,3) NOT NULL,
    category TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- services_catalog: Catalog of repair/technical services
CREATE TABLE public.services_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_fr TEXT,
    name_ar TEXT,
    description TEXT,
    description_fr TEXT,
    description_ar TEXT,
    category TEXT NOT NULL,
    price DECIMAL(10,3),
    is_complex BOOLEAN DEFAULT false,
    estimated_duration TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- service_requests: Active and completed service jobs
CREATE TABLE public.service_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID REFERENCES public.services_catalog NOT NULL,
    client_id UUID REFERENCES public.clients,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    staff_id UUID REFERENCES auth.users NOT NULL,
    assigned_to UUID REFERENCES auth.users,
    device_type TEXT,
    device_brand TEXT,
    device_model TEXT,
    issue_description TEXT NOT NULL,
    diagnosis TEXT,
    estimated_cost DECIMAL(10,3),
    final_cost DECIMAL(10,3),
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    is_complex BOOLEAN DEFAULT false,
    internal_notes TEXT,
    notes TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- points_transactions: Log of point changes
CREATE TABLE public.points_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients NOT NULL,
    transaction_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    reference_type TEXT,
    reference_id UUID,
    staff_id UUID REFERENCES auth.users,
    confirmed_by_staff BOOLEAN DEFAULT true,
    confirmed_by_client BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- staff_shifts: Attendance tracking
CREATE TABLE public.staff_shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES auth.users NOT NULL,
    check_in TIMESTAMPTZ DEFAULT now() NOT NULL,
    check_out TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- blog_posts: Store news and marketing
CREATE TABLE public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_fr TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    content TEXT NOT NULL,
    content_fr TEXT NOT NULL,
    content_ar TEXT NOT NULL,
    category TEXT,
    image_url TEXT,
    author_id UUID REFERENCES auth.users NOT NULL,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- store_settings: Global key-value configuration
CREATE TABLE public.store_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_by UUID REFERENCES auth.users
);

-- orders: Online and physical orders for products/services
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users, -- Optional for guest checkout
    client_name TEXT,
    client_phone TEXT,
    client_email TEXT,
    delivery_address TEXT,
    items JSONB NOT NULL, -- Array of items with qty, price, etc.
    subtotal DECIMAL(12,3),
    delivery_cost DECIMAL(12,3) DEFAULT 0,
    total_amount DECIMAL(12,3) NOT NULL,
    delivery_method TEXT NOT NULL, -- 'pickup', 'rapid_post', 'local_delivery'
    payment_method TEXT NOT NULL, -- 'cash', 'bank_transfer', 'd17', 'card'
    payment_reference TEXT,
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'processing', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- daily_stats: Cached stats for reporting
CREATE TABLE public.daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_revenue DECIMAL(12,3) DEFAULT 0,
    gaming_revenue DECIMAL(12,3) DEFAULT 0,
    sales_revenue DECIMAL(12,3) DEFAULT 0,
    service_revenue DECIMAL(12,3) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    total_services INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 3. FUNCTIONS
-- ==========================================

-- fn: has_role - Check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- fn: is_staff - Check if a user is a staff member (owner or worker)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- fn: decrement_stock - Atomic stock decrease
CREATE OR REPLACE FUNCTION public.decrement_stock(product_id UUID, qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - qty
  WHERE id = product_id AND stock_quantity >= qty;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. SEED DATA (CORE CONFIGURATION)
-- ==========================================

-- Default Consoles
INSERT INTO public.consoles (name, station_number, console_type, status) VALUES
('PS5 Station 1', 1, 'ps5', 'available'),
('PS5 Station 2', 2, 'ps5', 'available'),
('PS5 Station 3', 3, 'ps5', 'available'),
('PS5 Station 4', 4, 'ps5', 'available'),
('PS4 Station 5', 5, 'ps4', 'available'),
('PS4 Station 6', 6, 'ps4', 'available');

-- Default Pricing (Hourly)
INSERT INTO public.pricing (name, name_fr, name_ar, console_type, price_type, price, extra_time_price, points_earned, sort_order) VALUES
('Standard PS5', 'Standard PS5', 'بلايستيشن 5 عادي', 'ps5', 'hourly', 5.000, 1.250, 5, 1),
('VIP PS5', 'VIP PS5', 'بلايستيشن 5 خاص', 'ps5', 'hourly', 7.000, 1.750, 7, 2),
('Standard PS4', 'Standard PS4', 'بلايستيشن 4 عادي', 'ps4', 'hourly', 3.000, 0.750, 3, 3);

-- Default Pricing (Per Game)
INSERT INTO public.pricing (name, name_fr, name_ar, console_type, price_type, price, game_duration_minutes, points_earned, sort_order) VALUES
('PS5 Single Game', 'Match PS5', 'مقابلة بلايستيشن 5', 'ps5', 'fixed', 2.000, 15, 2, 4),
('PS4 Single Game', 'Match PS4', 'مقابلة بلايستيشن 4', 'ps4', 'fixed', 1.000, 15, 1, 5);

-- Default Store Settings
INSERT INTO public.store_settings (key, value) VALUES
('opening_hours', '{"open": "08:00", "close": "02:00"}'),
('free_game_threshold', '{"games_required": 10}'),
('points_config', '{"points_per_dt": 1, "dt_per_point": 1}'),
('auth_config', '{"enable_sms_verification": false}'),
('theme_primary', '"185 100% 50%"'),
('help_tooltips_enabled', 'true'),
('points_system_enabled', 'true'),
('free_games_enabled', 'true');

-- ==========================================
-- 5. ACCESS POLICIES
-- ==========================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consoles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaming_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Simple "everyone can read, staff can write" policies (Baseline)
CREATE POLICY "Public Read" ON public.consoles FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.pricing FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.services_catalog FOR SELECT USING (true);
CREATE POLICY "Public Read" ON public.blog_posts FOR SELECT USING (is_published = true);

-- Staff Write Access
CREATE POLICY "Staff Full Access" ON public.clients FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff Full Access" ON public.gaming_sessions FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff Full Access" ON public.sales FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff Full Access" ON public.service_requests FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff Full Access" ON public.orders FOR ALL USING (public.is_staff(auth.uid()));

-- Orders specific for clients: can read their own if user_id matches, anyone can place an order
CREATE POLICY "Enable insert for everyone" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Clients can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- Owner Exclusive
CREATE POLICY "Owner Full Access" ON public.expenses FOR ALL USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owner Full Access" ON public.store_settings FOR ALL USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owner Full Access" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'owner'));
