import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Types for homepage data
export interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category: string;
  featured?: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  is_complex: boolean;
  estimated_duration?: string;
  starting_price?: number;
}

export interface StoreSettings {
  opening_hours: { open: string; close: string };
  free_game_threshold: { games_required: number };
  points_config: { points_per_dt: number; dt_per_point: number };
}

export interface ConsoleStatus {
  id: string;
  name: string;
  console_type: string;
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
  current_session_id?: string;
  station_number: number;
}

// Hook to fetch dynamic homepage data
export const useHomepageData = () => {
  // Fetch featured products
  const productsQuery = useQuery({
    queryKey: ["homepage-products"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("featured", true)
          .limit(6);

        if (error) {

          // Fallback demo data
          return [
            { id: '1', name: 'PS5 Controller', price: 150.000, stock_quantity: 5, category: 'controller', featured: true },
            { id: '2', name: 'Gaming Headset', price: 80.000, stock_quantity: 3, category: 'audio', featured: true },
            { id: '3', name: 'Gaming Mouse', price: 45.000, stock_quantity: 8, category: 'peripheral', featured: true },
          ] as Product[];
        }

        return data as Product[];
      } catch (error) {

        return [
          { id: '1', name: 'PS5 Controller', price: 150.000, stock_quantity: 5, category: 'controller', featured: true },
          { id: '2', name: 'Gaming Headset', price: 80.000, stock_quantity: 3, category: 'audio', featured: true },
          { id: '3', name: 'Gaming Mouse', price: 45.000, stock_quantity: 8, category: 'peripheral', featured: true },
        ] as Product[];
      }
    },
  });

  // Fetch services for homepage
  const servicesQuery = useQuery({
    queryKey: ["homepage-services"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("services_catalog")
          .select("*")
          .eq("is_complex", false)
          .limit(6);

        if (error) {

          // Fallback demo data
          return [
            { id: '1', name: 'Phone Screen Repair', category: 'phone_repair', is_complex: false, estimated_duration: '30 min', starting_price: 20.000 },
            { id: '2', name: 'Controller Cleaning', category: 'console_repair', is_complex: false, estimated_duration: '15 min', starting_price: 10.000 },
            { id: '3', name: 'Headset Repair', category: 'audio_repair', is_complex: false, estimated_duration: '45 min', starting_price: 15.000 },
          ] as Service[];
        }

        return data as Service[];
      } catch (error) {

        return [
          { id: '1', name: 'Phone Screen Repair', category: 'phone_repair', is_complex: false, estimated_duration: '30 min', starting_price: 20.000 },
          { id: '2', name: 'Controller Cleaning', category: 'console_repair', is_complex: false, estimated_duration: '15 min', starting_price: 10.000 },
          { id: '3', name: 'Headset Repair', category: 'audio_repair', is_complex: false, estimated_duration: '45 min', starting_price: 15.000 },
        ] as Service[];
      }
    },
  });

  // Fetch store settings
  const settingsQuery = useQuery({
    queryKey: ["homepage-settings"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("store_settings")
          .select("*");

        if (error) {

          // Fallback demo data
          return {
            opening_hours: { open: "08:00", close: "02:00" },
            free_game_threshold: { games_required: 5 },
            points_config: { points_per_dt: 1, dt_per_point: 1 }
          } as StoreSettings;
        }

        // Transform array of settings into object
        const settings: Partial<StoreSettings> = {};
        data?.forEach((row: { key: string; value: unknown }) => {
          settings[row.key as keyof StoreSettings] = row.value as any;
        });

        return settings as StoreSettings;
      } catch (error) {

        return {
          opening_hours: { open: "08:00", close: "02:00" },
          free_game_threshold: { games_required: 5 },
          points_config: { points_per_dt: 1, dt_per_point: 1 }
        } as StoreSettings;
      }
    },
  });

  // Fetch console availability
  const consolesQuery = useQuery({
    queryKey: ["homepage-consoles"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("consoles")
          .select("*")
          .order("station_number");

        if (error) {

          // Fallback demo data
          return [
            { id: '1', name: 'PS5 Station 1', console_type: 'ps5', status: 'available', station_number: 1 },
            { id: '2', name: 'PS5 Station 2', console_type: 'ps5', status: 'in_use', station_number: 2 },
            { id: '3', name: 'PS4 Station 4', console_type: 'ps4', status: 'available', station_number: 4 },
            { id: '4', name: 'PS4 Station 5', console_type: 'ps4', status: 'maintenance', station_number: 5 },
          ] as ConsoleStatus[];
        }

        return data as ConsoleStatus[];
      } catch (error) {

        return [
          { id: '1', name: 'PS5 Station 1', console_type: 'ps5', status: 'available', station_number: 1 },
          { id: '2', name: 'PS5 Station 2', console_type: 'ps5', status: 'in_use', station_number: 2 },
          { id: '3', name: 'PS4 Station 4', console_type: 'ps4', status: 'available', station_number: 4 },
          { id: '4', name: 'PS4 Station 5', console_type: 'ps4', status: 'maintenance', station_number: 5 },
        ] as ConsoleStatus[];
      }
    },
  });

  // Fetch basic pricing for display
  const pricingQuery = useQuery({
    queryKey: ["homepage-pricing"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("pricing")
          .select("name, price, console_type")
          .limit(4);

        if (error) {

          // Fallback demo data
          return [
            { name: 'PS5 (1 hour)', price: 10.000, console_type: 'ps5' },
            { name: 'PS4 (1 hour)', price: 6.000, console_type: 'ps4' },
            { name: 'PS5 (1 game)', price: 2.500, console_type: 'ps5' },
            { name: 'PS4 (1 game)', price: 1.000, console_type: 'ps4' },
          ];
        }

        return data;
      } catch (error) {

        return [
          { name: 'PS5 (1 hour)', price: 10.000, console_type: 'ps5' },
          { name: 'PS4 (1 hour)', price: 6.000, console_type: 'ps4' },
          { name: 'PS5 (1 game)', price: 2.500, console_type: 'ps5' },
          { name: 'PS4 (1 game)', price: 1.000, console_type: 'ps4' },
        ];
      }
    },
  });

  return {
    products: productsQuery.data || [],
    services: servicesQuery.data || [],
    settings: settingsQuery.data || {
      opening_hours: { open: "08:00", close: "02:00" },
      free_game_threshold: { games_required: 5 },
      points_config: { points_per_dt: 1, dt_per_point: 1 }
    },
    consoles: consolesQuery.data || [],
    pricing: pricingQuery.data || [],
    isLoading: productsQuery.isLoading || servicesQuery.isLoading || settingsQuery.isLoading || consolesQuery.isLoading || pricingQuery.isLoading
  };
};
