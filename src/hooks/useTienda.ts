import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Types
export interface Product {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  price: number;
  images: string[];
  category: string;
  specifications: {
    label: string;
    value: string;
  }[];
  inStock: boolean;
  stock: number;
}

export const useTienda = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from Supabase (only in stock products)
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tienda_productos')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts: Product[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        fullDescription: p.full_description || p.description,
        price: p.price,
        images: p.images || [],
        category: p.category,
        specifications: p.specifications || [],
        inStock: p.in_stock !== false,
        stock: p.stock || 0,
      }));

      setProducts(formattedProducts);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Error fetching products');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Real-time subscription for products
  useEffect(() => {
    const productsSubscription = supabase
      .channel('tienda-productos-public-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tienda_productos' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      productsSubscription.unsubscribe();
    };
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refreshProducts: fetchProducts,
  };
};

