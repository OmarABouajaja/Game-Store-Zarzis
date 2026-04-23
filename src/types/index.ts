// Core data models for Game Store Zarzis - Final Version
// Updated to match the final database schema

export enum UserRole {
  OWNER = 'owner',
  WORKER = 'worker'
}

export enum SessionType {
  HOURLY = 'hourly',
  PER_GAME = 'per_game'
}

export enum ServiceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  WAITING_PARTS = 'waiting_parts',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ServiceCategory {
  PHONE_REPAIR = 'phone_repair',
  CONSOLE_REPAIR = 'console_repair',
  CONTROLLER_REPAIR = 'controller_repair',
  ACCOUNT = 'account',
  ADMIN = 'admin'
}

export enum PaymentType {
  CASH = 'cash',
  POINTS = 'points'
}

export enum TransactionType {
  EARNED = 'earned',
  SPENT = 'spent',
  REFUND = 'refund',
  BONUS = 'bonus',
  ADJUSTMENT = 'adjustment'
}

// Gaming Session system
export interface GameSession {
  id: string;
  console_id: string;
  client_id: string | null;
  pricing_id: string;
  session_type: string;
  start_time: string;
  end_time: string | null;
  games_played: number;
  extra_time_minutes: number;
  base_amount: number;
  extra_amount: number;
  total_amount: number;
  points_earned: number;
  is_free_game: boolean;
  payment_method: string;
  points_used: number;
  status: string;
  staff_id: string;
  notes: string | null;
  created_at?: string;
  pricing?: Pricing;
  console?: Console;
}

// Console system
export interface Console {
  id: string;
  name: string;
  console_type: string; // 'PS4', 'PS5'
  status: 'available' | 'in_use' | 'maintenance';
  station_number?: number;
  current_session_id?: string;
  shortcut_key?: string;
  default_pricing_id?: string;
  created_at: string;
  updated_at: string;
}

// Staff profiles (from Supabase Auth)
export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// User roles for staff
export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  help_tooltips_visible?: boolean;
  created_at: string;
}

export interface DailySchedule {
  isOpen: boolean;
  open: string;
  close: string;
  breakStart?: string;
  breakEnd?: string;
  hasBreak: boolean;
}

export interface WeeklySchedule {
  monday: DailySchedule;
  tuesday: DailySchedule;
  wednesday: DailySchedule;
  thursday: DailySchedule;
  friday: DailySchedule;
  saturday: DailySchedule;
  sunday: DailySchedule;
}

export interface OpeningHours {
  open: string;
  close: string;
}

export interface PricingConfig {
  hourly_rate: number;
  ps5_hourly_rate?: number;
  currency?: string;
}

export interface AuthConfig {
  enable_sms_verification: boolean;
  allow_guest_checkout?: boolean;
}

// Store Settings
export interface StoreSettings {
  id: string;
  store_name: string;
  sms_enabled: boolean;
  sms_phone?: string;
  sms_api_key?: string;
  free_games_enabled: boolean;
  free_game_threshold?: { games_required: number } | any;
  points_system_enabled: boolean;
  points_config?: any;
  help_tooltips_enabled: boolean;
  tariff_display_mode: 'cards' | 'table' | 'comparison' | string;
  data_limit_mb: number;
  opening_hours: OpeningHours;
  pricing_config: PricingConfig;
  auth_config: AuthConfig;
  weekly_schedule?: WeeklySchedule;
  special_hours?: unknown[];
  delivery_settings?: DeliverySettings;
  default_pricing_ps4?: string;
  default_pricing_ps5?: string;

  // New UI & Notification Settings
  daily_summary_time?: string;
  theme_primary?: string;
  theme_secondary?: string;
  theme_accent?: string;
  notify_new_order?: boolean;
  notify_low_stock?: boolean;
  notify_daily_summary?: boolean;
  enable_service_section?: boolean;
  enable_service_prices?: boolean;
  payment_methods_config?: {
    bank_transfer?: { enabled: boolean; details: string };
    d17?: { enabled: boolean; details: string };
    direct_card?: { enabled: boolean };
  };
  contact_info?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    address?: string;
    locationLink?: string;
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };

  updated_at: string;
}

// Client system
export interface Client {
  id: string;
  phone: string;
  name: string;
  email?: string;
  points: number;
  total_spent: number;
  total_games_played: number;
  games_since_free?: number;
  created_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Services catalog
export interface ServiceCatalog {
  id: string;
  name: string;
  name_fr: string;
  name_ar: string;
  description?: string;
  description_fr?: string;
  description_ar?: string;
  category: string; // 'phone_repair', 'console_repair', etc.
  price?: number;
  is_complex: boolean;
  estimated_duration?: string;
  image_url?: string; // NEW: Service images
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Product definition
export interface Product {
  id: string;
  name: string;
  name_fr?: string;
  name_ar?: string;
  description?: string;
  description_fr?: string;
  description_ar?: string;
  category: string;
  price: number;
  cost_price?: number;
  cost?: number; // Alternative cost field
  stock_quantity: number;
  stock?: number; // Alternative stock field
  points_earned: number;
  points_price?: number;
  image_url?: string;
  is_active: boolean;

  // NEW: Consumables support
  product_type?: 'physical' | 'consumable' | 'digital';
  subcategory?: string;
  is_quick_sale?: boolean;
  low_stock_threshold?: number;
  digital_content?: string;
  is_digital_delivery?: boolean;
  status?: 'active' | 'out_of_stock' | 'discontinued';

  // Optional/Derived properties for UI
  salePrice?: number; // legacy/mock support
  isOnSale?: boolean; // legacy/mock support

  created_at: string;
  updated_at?: string;
}

// Game Shortcuts (NEW)
export interface GameShortcut {
  id: string;
  name: string;
  console_type: string; // 'ps4', 'ps5'
  icon?: string;
  display_order: number;
  is_active: boolean;
  shortcut_key?: string;
  created_at: string;
  updated_at: string;
}

// Orders (NEW)
export interface Order {
  id: string;
  order_number: string;
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;

  // Order details
  items: OrderItem[];
  subtotal: number;

  // Delivery
  delivery_method: 'pickup' | 'rapid_post' | 'local_delivery';
  delivery_cost: number;
  delivery_address?: string;

  total_amount: number;

  // Payment
  payment_method: 'cash' | 'bank_transfer' | 'd17' | 'card';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_reference?: string;

  // Status
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

  notes?: string;
  staff_notes?: string;

  staff_id?: string;
  confirmed_at?: string;
  delivered_at?: string;

  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  product_type?: 'physical' | 'consumable' | 'digital';
  digital_content?: string;
}

// Delivery Settings (NEW)
export interface DeliverySettings {
  rapid_post_enabled: boolean;
  local_delivery_enabled: boolean;
  rapid_post_cost: number;
  local_delivery_cost: number;
  delivery_zones: string[];
}

// Expense category enum
export enum ExpenseCategory {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

// Expense definition
export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  expense_type: string;
  date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Business Analytics Summary
export interface AnalyticsSummary {
  revenue: {
    total: number;
    gaming: number;
    sales: number;
    services: number;
  };
  expenses: {
    total: number;
    daily: number;
    monthly: number;
    yearly: number;
  };
  profit: {
    gross: number;
    net: number;
    margin: number;
    categoryMargins?: {
      gaming: number;
      services: number;
      sales: number;
    };
  };
}

// Form data types
export interface ClientFormData {
  phone: string;
  name: string;
  points?: number;
}

export interface GameSessionFormData {
  console_id: string;
  client_id?: string;
  pricing_id: string;
  client_name?: string;
  game_name?: string;
}

export interface ServiceRequestFormData {
  service_id: string;
  client_name: string;
  client_phone: string;
  device_type?: string;
  device_brand?: string;
  device_model?: string;
  issue_description: string;
}

// Order Form Data (NEW)
export interface OrderFormData {
  client_name: string;
  client_phone: string;
  client_email?: string;
  subtotal: number;
  delivery_cost: number;
  total_amount: number;
  items: OrderItem[];
  delivery_method: 'pickup' | 'rapid_post' | 'local_delivery';
  delivery_address?: string;
  payment_method: 'cash' | 'bank_transfer' | 'd17' | 'card';
  payment_reference?: string;
  notes?: string;
}
// Service Requests
// ServiceStatus enum is defined at the top of the file

export interface ServiceRequest {
  id: string;
  service_id: string;
  client_id?: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  device_type?: string;
  device_brand?: string;
  device_model?: string;
  issue_description: string;
  status: ServiceStatus;
  estimated_cost?: number;
  quoted_price?: number;
  final_cost?: number;
  parts_cost?: number;
  notes?: string;
  staff_id?: string;
  assigned_to?: string;
  is_complex: boolean;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Blog Posts
export interface BlogPost {
  id: string;
  title: string;
  title_fr?: string;
  title_ar?: string;
  content: string;
  content_fr?: string;
  content_ar?: string;
  excerpt?: string;
  image_url?: string;
  category: string;
  author_id: string;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

// Points Transactions
export interface PointsTransaction {
  id: string;
  client_id: string;
  transaction_type: TransactionType;
  amount: number;
  balance_after: number;
  description?: string;
  reference_type?: string; // 'session', 'sale', 'bonus'
  reference_id?: string;
  staff_id?: string;
  confirmed_by_staff: boolean;
  confirmed_by_client: boolean;
  created_at: string;
}

// Sales
export interface Sale {
  id: string;
  client_id?: string;
  total_amount: number;
  payment_method: string;
  staff_id: string;
  created_at: string;
  items?: OrderItem[];
  sale_items?: {
    id: string;
    sale_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name?: string; // Joined or derived
    product?: Product;
  }[];
}

export interface Pricing {
  id: string;
  name: string;
  price: number;
  duration_minutes?: number;
  console_type: string;
  price_type: 'hourly' | 'per_game';
  extra_time_price?: number;
  game_duration_minutes?: number;
  is_active: boolean;
  points_earned?: number;
  created_at?: string;
}

export interface StaffShift {
  id: string;
  staff_id: string;
  check_in: string;
  check_out?: string;
  total_hours?: number;
  status: 'active' | 'completed';
  profile?: Profile;
  created_at: string;
}
