import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types';
import { toast } from '@/hooks/use-toast';

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('game-store-cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
    }, []);

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('game-store-cart', JSON.stringify(items));
    }, [items]);

    const addItem = (product: Product) => {
        setItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            const stockLimit = product.stock_quantity ?? product.stock ?? 0;
            
            if (existing) {
                if (existing.quantity >= stockLimit) {
                    toast({ title: "Stock Limit Reached", description: `Only ${stockLimit} available in stock.`, variant: "destructive" });
                    return prev;
                }
                toast({ title: "Updated quantity", description: `${product.name} quantity increased.` });
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            if (stockLimit <= 0) {
                toast({ title: "Out of Stock", description: `${product.name} is currently out of stock.`, variant: "destructive" });
                return prev;
            }

            toast({ title: "Added to cart", description: `${product.name} added to your cart.` });
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeItem = (productId: string) => {
        setItems(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        setItems(prev => {
            const item = prev.find(i => i.id === productId);
            if (!item) return prev;
            
            const stockLimit = item.stock_quantity ?? item.stock ?? 0;
            if (quantity > stockLimit) {
                toast({ title: "Stock Limit Reached", description: `Only ${stockLimit} available in stock.`, variant: "destructive" });
                return prev.map(i => i.id === productId ? { ...i, quantity: stockLimit } : i);
            }

            return prev.map(i => i.id === productId ? { ...i, quantity } : i);
        });
    };

    const clearCart = () => {
        setItems([]);
        localStorage.removeItem('game-store-cart');
    };

    const cartTotal = items.reduce((total, item) => {
        const price = item.salePrice || item.price || 0;
        return total + (price * item.quantity);
    }, 0);

    const cartCount = items.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
