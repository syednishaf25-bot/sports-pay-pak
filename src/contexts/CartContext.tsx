import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  category: string;
  variant_id?: string;
  size?: string;
  color?: string;
}

interface CartContextType {
  items: CartItem[];
  add: (product: CartItem) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  total: number;
  itemCount: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize cart from localStorage and sync with user session
  useEffect(() => {
    const initializeCart = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          // User is logged in, fetch cart from Supabase
          await syncCartFromDatabase(session.user.id);
        } else {
          // User not logged in, load from localStorage
          const saved = localStorage.getItem('ts_cart');
          setItems(saved ? JSON.parse(saved) : []);
        }
      } catch (error) {
        console.error('Error initializing cart:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('ts_cart');
        setItems(saved ? JSON.parse(saved) : []);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCart();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // User signed in, sync localStorage cart to database
        await syncCartToDatabase(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // User signed out, clear cart and fallback to localStorage
        setItems([]);
        const saved = localStorage.getItem('ts_cart');
        setItems(saved ? JSON.parse(saved) : []);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update localStorage when items change (for non-authenticated users)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('ts_cart', JSON.stringify(items));
    }
  }, [items, user]);

  const syncCartFromDatabase = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (name, price, images, category, sku),
          product_variants (size, color, price)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const cartItems: CartItem[] = data?.map(item => ({
        id: item.variant_id || item.product_id,
        name: item.products.name,
        price: item.product_variants?.price || item.products.price,
        qty: item.quantity,
        image: item.products.images?.[0] || '',
        category: item.products.category,
        variant_id: item.variant_id,
        size: item.product_variants?.size,
        color: item.product_variants?.color,
      })) || [];

      setItems(cartItems);
    } catch (error) {
      console.error('Error syncing cart from database:', error);
    }
  };

  const syncCartToDatabase = async (userId: string) => {
    try {
      // Get current localStorage cart
      const localCart = localStorage.getItem('ts_cart');
      const localItems: CartItem[] = localCart ? JSON.parse(localCart) : [];

      if (localItems.length > 0) {
        // Clear existing cart in database
        await supabase.from('cart_items').delete().eq('user_id', userId);

        // Insert local cart items
        const dbItems = localItems.map(item => ({
          user_id: userId,
          product_id: item.variant_id ? null : item.id,
          variant_id: item.variant_id || null,
          quantity: item.qty,
        }));

        const { error } = await supabase.from('cart_items').insert(dbItems);
        if (error) throw error;

        // Clear localStorage cart
        localStorage.removeItem('ts_cart');
      }

      // Fetch updated cart from database
      await syncCartFromDatabase(userId);
    } catch (error) {
      console.error('Error syncing cart to database:', error);
    }
  };

  const add = (product: CartItem) => {
    setItems(prev => {
      const found = prev.find(p => p.id === product.id);
      if (found) {
        toast({
          title: "Updated cart",
          description: `${product.name} quantity updated`,
        });
        return prev.map(p => 
          p.id === product.id 
            ? { ...p, qty: p.qty + product.qty } 
            : p
        );
      }
      
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
      
      return [...prev, product];
    });
  };

  const remove = (id: string) => {
    setItems(prev => {
      const item = prev.find(p => p.id === id);
      if (item) {
        toast({
          title: "Removed from cart",
          description: `${item.name} has been removed`,
        });
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      remove(id);
      return;
    }
    
    setItems(prev => 
      prev.map(p => p.id === id ? { ...p, qty } : p)
    );
  };

  const clear = () => {
    setItems([]);
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    });
  };

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider 
      value={{ items, add, remove, updateQty, clear, total, itemCount, isLoading }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};