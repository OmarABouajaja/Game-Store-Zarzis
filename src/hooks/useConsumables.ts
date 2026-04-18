/**
 * Custom hook for fetching consumable products (in-store café/snacks)
 * 
 * @returns Query result with consumables grouped by subcategory
 * 
 * @example
 * const { data: consumables, isLoading } = useConsumables();
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

export const useConsumables = () => {
    return useQuery({
        queryKey: ['products', 'consumables'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('product_type', 'consumable')
                .eq('is_quick_sale', true)
                .order('subcategory')
                .order('name');

            if (error) throw error;
            return data as Product[];
        },
    });
};

/**
 * Get consumables grouped by subcategory
 */
export const useConsumablesByCategory = () => {
    const { data: consumables, ...rest } = useConsumables();

    const groupedData = consumables?.reduce((acc, product) => {
        const category = product.subcategory || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(product);
        return acc;
    }, {} as Record<string, Product[]>);

    return {
        data: groupedData,
        consumables,
        ...rest,
    };
};

/**
 * Get all subcategories for consumables
 */
export const useConsumableCategories = () => {
    const { data: consumables } = useConsumables();

    const categories = Array.from(
        new Set(consumables?.map(p => p.subcategory).filter(Boolean) as string[])
    ).sort();

    return categories;
};
