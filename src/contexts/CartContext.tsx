import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  category: string;
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
  const [isLoading, setIsLoading] = useState(true);

  // Initialize cart from localStorage
  useEffect(() => {
    const initializeCart = () => {
      try {
        const saved = localStorage.getItem('ts_cart');
        setItems(saved ? JSON.parse(saved) : []);
      } catch (error) {
        console.error('Error initializing cart:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCart();
  }, []);

  // Update localStorage when items change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('ts_cart', JSON.stringify(items));
    }
  }, [items, isLoading]);

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
    localStorage.removeItem('ts_cart');
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
